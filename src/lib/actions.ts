
'use server';

import { format, parse, addMinutes, getDay, isBefore, isAfter } from 'date-fns';
import { getLocations, getServices, getStaff } from './data';
import type { NewBooking, Staff } from './types';
import { addBooking, getBookingsForStaffOnDate } from './firestore';

// Helper to map JS day index (Sun=0) to our string keys
const dayMap: (keyof Staff['workingHours'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// --- Reusable Conflict Check Helper Function ---
// This function assumes all date objects passed to it are in the same timezone (server's local time)
const checkForConflicts = async (staffId: string, start: Date, end: Date): Promise<boolean> => {
    // getBookingsForStaffOnDate now also uses timezone-unaware strings, so this will work consistently.
    const existingBookings = await getBookingsForStaffOnDate(staffId, start);

    return existingBookings.some(b => {
        // Create Date objects from the timezone-unaware strings for comparison
        const existingStart = new Date(b.bookingTimestamp);
        const existingEnd = addMinutes(existingStart, b.serviceDuration);
        
        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        return isBefore(start, existingEnd) && isAfter(end, existingStart);
    });
};

// Helper function to get available times for a single staff member
async function getIndividualStaffTimes(
    serviceDuration: number,
    preferredDateStr: string, // Expects 'yyyy-MM-dd'
    staffMember: Staff
): Promise<string[]> {
    if (!staffMember.workingHours || staffMember.isBookable === false) return [];

    // Create a date object for midnight on the preferred date, in the server's local timezone.
    const preferredDate = new Date(`${preferredDateStr}T00:00:00`);
    if (isNaN(preferredDate.getTime())) {
        return []; // Handle invalid date string
    }

    const dayOfWeek = dayMap[getDay(preferredDate)];
    const dayHours = staffMember.workingHours[dayOfWeek];

    if (!dayHours || dayHours === 'off') {
        return [];
    }
    
    // Create start and end of work day relative to the server's local timezone interpretation of the date.
    const workDayStart = parse(dayHours.start, 'HH:mm', preferredDate);
    const workDayEnd = parse(dayHours.end, 'HH:mm', preferredDate);

    const availableSlots: string[] = [];
    let potentialSlotStart = workDayStart;
    const now = new Date(); // Server's current time

    // Iterate through the workday in 15-minute intervals
    while (isBefore(potentialSlotStart, workDayEnd)) {
        const potentialSlotEnd = addMinutes(potentialSlotStart, serviceDuration);

        // Rule 1: Slot must end within the workday.
        if (isAfter(potentialSlotEnd, workDayEnd)) {
            break; 
        }

        // Rule 2: Slot cannot be in the past (compared to server's current time).
        if (isBefore(potentialSlotStart, now)) {
            potentialSlotStart = addMinutes(potentialSlotStart, 15);
            continue;
        }
        
        // Rule 3: Check for conflicts with existing bookings.
        const hasConflict = await checkForConflicts(staffMember.id, potentialSlotStart, potentialSlotEnd);
        if (!hasConflict) {
            availableSlots.push(format(potentialSlotStart, 'HH:mm'));
        }

        potentialSlotStart = addMinutes(potentialSlotStart, 15);
    }
    
    return availableSlots;
}

export async function getSuggestedTimes(
    serviceDuration: number,
    preferredDateStr: string, // 'yyyy-MM-dd' format
    staffId: string,
    locationId: string,
) {
    // --- Logic for 'any' staff ---
    if (staffId === 'any') {
        const allStaffAtLocation = (await getStaff()).filter(s => s.locationId === locationId && s.isBookable !== false);
        const allAvailableSlots = new Set<string>();

        // We use the date string directly, letting the helper handle date creation.
        const timePromises = allStaffAtLocation.map(staffMember => 
            getIndividualStaffTimes(serviceDuration, preferredDateStr, staffMember)
        );
        const results = await Promise.all(timePromises);

        results.forEach(staffSlots => {
            staffSlots.forEach(slot => allAvailableSlots.add(slot));
        });

        const sortedSlots = Array.from(allAvailableSlots).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        return { success: true, times: sortedSlots };
    }

    // --- Logic for a specific staff member ---
    const allStaff = await getStaff();
    const staffMember = allStaff.find(s => s.id === staffId);
    
    if (!staffMember) {
        return { success: true, times: [] };
    }

    const availableSlots = await getIndividualStaffTimes(serviceDuration, preferredDateStr, staffMember);
    
    return { success: true, times: availableSlots };
}


type BookingData = {
    locationId: string;
    serviceId: string;
    staffId: string;
    date: Date;
    time: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
};


export async function createBooking(bookingData: BookingData) {
    if (!bookingData.locationId || !bookingData.serviceId || !bookingData.date || !bookingData.time || !bookingData.clientName || !bookingData.clientPhone) {
        throw new Error("Missing required booking information.");
    }
     
    // --- Data Fetching ---
    const allLocations = await getLocations();
    const allServices = await getServices();
    const allStaff = await getStaff();

    const location = allLocations.find(l => l.id === bookingData.locationId);
    const service = allServices.find(s => s.id === bookingData.serviceId);
    
    if (!location || !service) {
        throw new Error("Invalid location or service selected.");
    }

    // --- Create a timezone-unaware timestamp string for the booking ---
    const datePart = format(bookingData.date, 'yyyy-MM-dd');
    const timePart = bookingData.time;
    const bookingTimestampString = `${datePart}T${timePart}:00`;

    // Create server-local Date objects from this string for calculations.
    // This ensures all comparisons happen in the same timezone context.
    const bookingStart = new Date(bookingTimestampString);
    if (isNaN(bookingStart.getTime())) {
        throw new Error("Invalid date or time provided for booking.");
    }
    const bookingEnd = addMinutes(bookingStart, service.duration);
    
    let assignedStaff: Staff | undefined | null = null;

    // --- Assign Staff and Perform Final, Definitive Conflict Check ---
    if (bookingData.staffId === 'any') {
        const bookableStaffAtLocation = allStaff.filter(s => s.locationId === bookingData.locationId && s.isBookable !== false);
        
        // Find the first staff member who is free at the requested time
        for (const potentialStaff of bookableStaffAtLocation) {
            const hasConflict = await checkForConflicts(potentialStaff.id, bookingStart, bookingEnd);
            if (!hasConflict) {
                // Check if the slot is within their working hours
                const dayOfWeek = dayMap[getDay(bookingStart)];
                const dayHours = potentialStaff.workingHours?.[dayOfWeek];
                if (dayHours && dayHours !== 'off') {
                    // Create date objects for comparison using the same base date as the booking
                    const workDayStart = parse(dayHours.start, 'HH:mm', bookingStart);
                    const workDayEnd = parse(dayHours.end, 'HH:mm', bookingStart);
                    if (!isBefore(bookingStart, workDayStart) && !isAfter(bookingEnd, workDayEnd)) {
                        assignedStaff = potentialStaff; // Found a free staff member
                        break;
                    }
                }
            }
        }

        if (!assignedStaff) {
            throw new Error("Sorry, no staff is available for that time slot. It may have just been taken.");
        }
    } else {
        // A specific staff member was chosen, find them.
        assignedStaff = allStaff.find(s => s.id === bookingData.staffId);
        if (!assignedStaff) {
            throw new Error("The selected staff member could not be found.");
        }
        
        // For the chosen staff, perform the definitive conflict check.
        const hasConflict = await checkForConflicts(assignedStaff.id, bookingStart, bookingEnd);
        if (hasConflict) {
            throw new Error("Sorry, that time slot is no longer available for the selected staff member. Please choose another time.");
        }
    }

    // --- Create the booking since all checks have passed ---
    const newBooking: NewBooking = {
        locationId: bookingData.locationId,
        locationName: location.name,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        staffId: assignedStaff.id, // Use the ID of the definitively assigned staff
        staffName: assignedStaff.name,
        staffImageUrl: assignedStaff.imageUrl || '',
        bookingTimestamp: bookingTimestampString, // Store the timezone-unaware string
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        clientEmail: bookingData.clientEmail || '',
    };

    await addBooking(newBooking);

    if (bookingData.clientEmail) {
        // In a real app, you would integrate a proper email service here.
        console.log(`Email confirmation would be sent to ${bookingData.clientEmail}`);
    }

    return { success: true };
}
