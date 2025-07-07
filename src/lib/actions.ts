
'use server';

import { format, parse, addMinutes, getDay, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { getLocations, getServices, getStaff } from './data';
import type { NewBooking, Staff, Booking } from './types';
import { addBooking, getBookingsForStaffOnDate } from './firestore';

// Helper to map JS day index (Sun=0) to our string keys
const dayMap: (keyof Staff['workingHours'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// --- Reusable Conflict Check Helper Function ---
const checkForConflicts = async (staffId: string, start: Date, end: Date): Promise<boolean> => {
    const existingBookings = await getBookingsForStaffOnDate(staffId, start);
    return existingBookings.some(b => {
        const existingStart = new Date(b.bookingTimestamp);
        const existingEnd = addMinutes(existingStart, b.serviceDuration);
        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        return isBefore(start, existingEnd) && isAfter(end, existingStart);
    });
};

// Helper function to get available times for a single staff member
async function getIndividualStaffTimes(
    serviceDuration: number,
    preferredDate: Date,
    staffMember: Staff
): Promise<string[]> {
    if (!staffMember.workingHours || staffMember.isBookable === false) return [];

    const dayOfWeek = dayMap[getDay(preferredDate)];
    const dayHours = staffMember.workingHours[dayOfWeek];

    if (!dayHours || dayHours === 'off') {
        return [];
    }
    
    const workDayStart = parse(dayHours.start, 'HH:mm', preferredDate);
    const workDayEnd = parse(dayHours.end, 'HH:mm', preferredDate);

    const availableSlots: string[] = [];
    let potentialSlotStart = workDayStart;
    const now = new Date();

    // Iterate through the workday in 15-minute intervals to find available slots
    while (isBefore(potentialSlotStart, workDayEnd)) {
        const potentialSlotEnd = addMinutes(potentialSlotStart, serviceDuration);

        // Rule 1: The appointment must end on or before the workday ends.
        if (isAfter(potentialSlotEnd, workDayEnd)) {
            break; // No more possible slots will fit.
        }

        // Rule 2: If it's for today, the slot can't be in the past.
        const isPastSlot = isBefore(potentialSlotStart, now);
        
        // Rule 3: The slot must not have a conflict.
        if (!isPastSlot) {
            const hasConflict = await checkForConflicts(staffMember.id, potentialSlotStart, potentialSlotEnd);
            if (!hasConflict) {
                availableSlots.push(format(potentialSlotStart, 'HH:mm'));
            }
        }

        // Move to the next potential 15-minute interval.
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
    const preferredDate = parse(preferredDateStr, 'yyyy-MM-dd', new Date());
    
    // --- Logic for 'any' staff ---
    if (staffId === 'any') {
        const allStaffAtLocation = (await getStaff()).filter(s => s.locationId === locationId && s.isBookable !== false);
        const allAvailableSlots = new Set<string>();

        const timePromises = allStaffAtLocation.map(staffMember => 
            getIndividualStaffTimes(serviceDuration, preferredDate, staffMember)
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

    const availableSlots = await getIndividualStaffTimes(serviceDuration, preferredDate, staffMember);
    
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

    // --- Determine Booking Time Window ---
    const bookingStart = new Date(bookingData.date);
    const [hours, minutes] = bookingData.time.split(':').map(Number);
    bookingStart.setHours(hours, minutes, 0, 0);
    const bookingEnd = addMinutes(bookingStart, service.duration);

    let assignedStaff: Staff | undefined | null = null;

    // --- Assign Staff and Perform Final, Definitive Conflict Check ---
    if (bookingData.staffId === 'any') {
        const bookableStaffAtLocation = allStaff.filter(s => s.locationId === bookingData.locationId && s.isBookable !== false && s.workingHours);
        
        // Find the first staff member who is free at the requested time
        for (const potentialStaff of bookableStaffAtLocation) {
            const dayOfWeek = dayMap[getDay(bookingStart)];
            const dayHours = potentialStaff.workingHours?.[dayOfWeek];
            if (!dayHours || dayHours === 'off') continue;

            const dayStartTime = parse(dayHours.start, 'HH:mm', bookingStart);
            const dayEndTime = parse(dayHours.end, 'HH:mm', bookingStart);
            if (isBefore(bookingStart, dayStartTime) || isAfter(bookingEnd, dayEndTime)) continue;

            const hasConflict = await checkForConflicts(potentialStaff.id, bookingStart, bookingEnd);

            if (!hasConflict) {
                assignedStaff = potentialStaff; // Tentatively assign
                break;
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
        bookingTimestamp: bookingStart.toISOString(),
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        clientEmail: bookingData.clientEmail || '',
    };

    await addBooking(newBooking);

    if (bookingData.clientEmail) {
        // In a real app, you would integrate a proper email service here.
        // For this demo, we'll just log the intent to send an email.
        console.log(`Email confirmation would be sent to ${bookingData.clientEmail}`);
    }

    return { success: true };
}
