
'use server';

import { format, parse, addMinutes, getDay, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { getLocations, getServices, getStaff } from './data';
import type { NewBooking, Staff, Booking } from './types';
import { addBooking, getBookingsForStaffOnDate } from './firestore';

// Helper to map JS day index (Sun=0) to our string keys
const dayMap: (keyof Staff['workingHours'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// New non-AI helper function to get available times for a single staff member
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
    
    // --- Define the working day boundaries ---
    const workDayStart = parse(dayHours.start, 'HH:mm', preferredDate);
    const workDayEnd = parse(dayHours.end, 'HH:mm', preferredDate);

    // --- Get existing bookings and create "busy" blocks ---
    const existingBookings = await getBookingsForStaffOnDate(staffMember.id, preferredDate);
    const busyBlocks = existingBookings.map(b => {
        const start = new Date(b.bookingTimestamp);
        const end = addMinutes(start, b.serviceDuration);
        return { start, end };
    });

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
        
        // Rule 3: The slot must not overlap with any existing busy blocks.
        const hasConflict = busyBlocks.some(busyBlock => 
            (isBefore(potentialSlotStart, busyBlock.end) && isAfter(potentialSlotEnd, busyBlock.start))
        );

        if (!isPastSlot && !hasConflict) {
            availableSlots.push(format(potentialSlotStart, 'HH:mm'));
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
     
    const allLocations = await getLocations();
    const allServices = await getServices();
    const allStaff = await getStaff();

    const location = allLocations.find(l => l.id === bookingData.locationId);
    const service = allServices.find(s => s.id === bookingData.serviceId);
    
    if (!location || !service) {
        throw new Error("Invalid location or service selected.");
    }

    let staffMember: Staff | undefined | null = allStaff.find(s => s.id === bookingData.staffId);
    let assignedStaffId = bookingData.staffId;

    if (bookingData.staffId === 'any') {
        const bookingStart = new Date(bookingData.date);
        const [hours, minutes] = bookingData.time.split(':').map(Number);
        bookingStart.setHours(hours, minutes, 0, 0);
        const bookingEnd = addMinutes(bookingStart, service.duration);
        
        const bookableStaffAtLocation = allStaff.filter(s => s.locationId === bookingData.locationId && s.isBookable !== false && s.workingHours);
        
        let foundStaff = null;
        for (const potentialStaff of bookableStaffAtLocation) {
            const dayOfWeek = dayMap[getDay(bookingStart)];
            const dayHours = potentialStaff.workingHours?.[dayOfWeek];
            if (!dayHours || dayHours === 'off') continue;

            const dayStartTime = parse(dayHours.start, 'HH:mm', bookingStart);
            const dayEndTime = parse(dayHours.end, 'HH:mm', bookingStart);
            if (isBefore(bookingStart, dayStartTime) || isAfter(bookingEnd, dayEndTime)) continue;

            const existingBookings = await getBookingsForStaffOnDate(potentialStaff.id, bookingStart);
            const conflict = existingBookings.some(b => {
                const existingStart = new Date(b.bookingTimestamp);
                const existingEnd = addMinutes(existingStart, b.serviceDuration);
                return isBefore(bookingStart, existingEnd) && isAfter(bookingEnd, existingStart);
            });

            if (!conflict) {
                foundStaff = potentialStaff;
                break;
            }
        }

        if (foundStaff) {
            staffMember = foundStaff;
            assignedStaffId = foundStaff.id;
        } else {
            throw new Error("Sorry, that time slot was just taken. Please choose another slot.");
        }
    }


    const [hours, minutes] = bookingData.time.split(':').map(Number);
    const bookingTimestamp = new Date(bookingData.date);
    bookingTimestamp.setHours(hours, minutes);

    const newBooking: NewBooking = {
        locationId: bookingData.locationId,
        locationName: location.name,
        serviceId: bookingData.serviceId,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        staffId: assignedStaffId,
        staffName: staffMember?.name || 'Any Available',
        staffImageUrl: staffMember?.imageUrl || '',
        bookingTimestamp: bookingTimestamp.toISOString(),
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
