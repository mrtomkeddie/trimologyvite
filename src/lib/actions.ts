
'use server';

import { format, parse, addMinutes, getDay, isBefore, isAfter, startOfDay, startOfMonth, endOfMonth, isSameDay, addDays } from 'date-fns';
import { getLocations, getServices, getStaff } from './data';
import type { Booking, NewBooking, Staff } from './types';
import { addBooking, getBookingsForStaffOnDate, getBookingsForStaffInRange } from './firestore';

// Helper to map JS day index (Sun=0) to our string keys
const dayMap: (keyof Staff['workingHours'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// --- Reusable Conflict Check Helper Function ---
// This function assumes all date objects passed to it are in the same timezone (server's local time)
const checkForConflicts = async (staffId: string, start: Date, end: Date): Promise<boolean> => {
    // This now queries using UTC-based date objects.
    const existingBookings = await getBookingsForStaffOnDate(staffId, start);

    return existingBookings.some(b => {
        // Create Date objects from the UTC timestamp strings for comparison
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
    if (!staffMember.workingHours) return [];
    
    // Construct a date object from the preferred date string. It will be interpreted in the server's local timezone.
    const preferredDate = new Date(`${preferredDateStr}T00:00:00`);
    if (isNaN(preferredDate.getTime())) {
        return [];
    }

    const dayOfWeek = dayMap[getDay(preferredDate)];
    const dayHours = staffMember.workingHours[dayOfWeek];

    if (!dayHours || dayHours === 'off') return [];
    
    const workDayStart = parse(dayHours.start, 'HH:mm', preferredDate);
    const workDayEnd = parse(dayHours.end, 'HH:mm', preferredDate);

    const availableSlots: string[] = [];
    let potentialSlotStart = workDayStart;
    const now = new Date();

    while (isBefore(potentialSlotStart, workDayEnd)) {
        const potentialSlotEnd = addMinutes(potentialSlotStart, serviceDuration);

        if (isAfter(potentialSlotEnd, workDayEnd)) break;
        if (isBefore(potentialSlotStart, now)) {
            potentialSlotStart = addMinutes(potentialSlotStart, 15);
            continue;
        }
        
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
    if (staffId === 'any') {
        const allStaffAtLocation = (await getStaff()).filter(s => s.locationId === locationId);
        const allAvailableSlots = new Set<string>();

        const timePromises = allStaffAtLocation.map(staffMember => 
            getIndividualStaffTimes(serviceDuration, preferredDateStr, staffMember)
        );
        const results = await Promise.all(timePromises);

        results.forEach(staffSlots => staffSlots.forEach(slot => allAvailableSlots.add(slot)));

        const sortedSlots = Array.from(allAvailableSlots).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        return { success: true, times: sortedSlots };
    }

    const allStaff = await getStaff();
    const staffMember = allStaff.find(s => s.id === staffId);
    
    if (!staffMember) return { success: true, times: [] };

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
     
    const allLocations = await getLocations();
    const allServices = await getServices();
    const allStaff = await getStaff();

    const location = allLocations.find(l => l.id === bookingData.locationId);
    const service = allServices.find(s => s.id === bookingData.serviceId);
    
    if (!location || !service) throw new Error("Invalid location or service selected.");

    // Create an unambiguous UTC timestamp string. This is the core of the fix.
    const datePart = format(bookingData.date, 'yyyy-MM-dd');
    const timePart = bookingData.time;
    const bookingTimestampString = `${datePart}T${timePart}:00.000Z`;

    // Create a Date object from this UTC string for calculations.
    const bookingStart = new Date(bookingTimestampString);
    if (isNaN(bookingStart.getTime())) throw new Error("Invalid date or time for booking.");
    const bookingEnd = addMinutes(bookingStart, service.duration);
    
    let assignedStaff: Staff | undefined | null = null;

    if (bookingData.staffId === 'any') {
        const bookableStaffAtLocation = allStaff.filter(s => s.locationId === bookingData.locationId);
        
        for (const potentialStaff of bookableStaffAtLocation) {
            const dayOfWeek = dayMap[getDay(bookingStart)];
            const dayHours = potentialStaff.workingHours?.[dayOfWeek];
            if (!dayHours || dayHours === 'off') continue;

            // Use the user's selected date (bookingData.date) to parse working hours, avoiding server timezone shifts.
            const workDayStart = parse(dayHours.start, 'HH:mm', bookingData.date);
            const workDayEnd = parse(dayHours.end, 'HH:mm', bookingData.date);

            // Reconstruct bookingStart/End relative to the same day for accurate working hours check
            const bookingStartInDay = parse(timePart, 'HH:mm', bookingData.date);
            const bookingEndInDay = addMinutes(bookingStartInDay, service.duration);

            if (!isBefore(bookingStartInDay, workDayStart) && !isAfter(bookingEndInDay, workDayEnd)) {
                const hasConflict = await checkForConflicts(potentialStaff.id, bookingStart, bookingEnd);
                if (!hasConflict) {
                    assignedStaff = potentialStaff;
                    break;
                }
            }
        }

        if (!assignedStaff) throw new Error("No staff are available for the selected time. Please try another time or speak with our receptionist.");
    
    } else {
        assignedStaff = allStaff.find(s => s.id === bookingData.staffId);
        if (!assignedStaff) throw new Error("The selected staff member could not be found.");
        
        const hasConflict = await checkForConflicts(assignedStaff.id, bookingStart, bookingEnd);
        if (hasConflict) throw new Error("The selected staff member is unavailable for that time. Please choose another time or staff member.");
    }

    const newBooking: NewBooking = {
        locationId: bookingData.locationId,
        locationName: location.name,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        staffId: assignedStaff.id,
        staffName: assignedStaff.name,
        staffImageUrl: assignedStaff.imageUrl || '',
        bookingTimestamp: bookingTimestampString, // Store the unambiguous UTC string
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        clientEmail: bookingData.clientEmail || '',
    };

    await addBooking(newBooking);

    if (bookingData.clientEmail) {
        console.log(`Email confirmation would be sent to ${bookingData.clientEmail}`);
    }

    return { success: true };
}


// --- Monthly Availability Calculation ---

const hasConflictWithFetchedBookings = (bookings: Booking[], start: Date, end: Date): boolean => {
    return bookings.some(b => {
        const existingStart = new Date(b.bookingTimestamp);
        const existingEnd = addMinutes(existingStart, b.serviceDuration);
        return isBefore(start, existingEnd) && isAfter(end, existingStart);
    });
};

export async function getUnavailableDays(month: Date, serviceId: string, staffId: string, locationId: string) {
    try {
        const allServices = await getServices();
        const service = allServices.find(s => s.id === serviceId);
        if (!service) return { success: false, unavailableDays: [] };
        
        const serviceDuration = service.duration;
        const allStaff = await getStaff();
        const staffToCheck = staffId === 'any'
            ? allStaff.filter(s => s.locationId === locationId)
            : allStaff.filter(s => s.id === staffId);
    
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        if (staffToCheck.length === 0) {
            const allDays = [];
            let day = monthStart;
            while (day <= monthEnd) {
                allDays.push(format(day, 'yyyy-MM-dd'));
                day = addDays(day, 1);
            }
            return { success: true, unavailableDays: allDays };
        }

        const allBookingsForMonth = await getBookingsForStaffInRange(staffToCheck.map(s => s.id), monthStart, monthEnd);
        
        // OPTIMIZATION: Pre-group bookings by day and then by staff for O(1) lookup inside the loops.
        const bookingsByDayAndStaff: Record<string, Record<string, Booking[]>> = {};
        allBookingsForMonth.forEach(booking => {
            const dayStr = format(new Date(booking.bookingTimestamp), 'yyyy-MM-dd');
            if (!bookingsByDayAndStaff[dayStr]) {
                bookingsByDayAndStaff[dayStr] = {};
            }
            if (!bookingsByDayAndStaff[dayStr][booking.staffId]) {
                bookingsByDayAndStaff[dayStr][booking.staffId] = [];
            }
            bookingsByDayAndStaff[dayStr][booking.staffId].push(booking);
        });

        const unavailableDays: string[] = [];
        let currentDay = monthStart;
        const today = startOfDay(new Date());

        while (currentDay <= monthEnd) {
            let isDayAvailable = false;
            const currentDayStr = format(currentDay, 'yyyy-MM-dd');
            
            for (const staffMember of staffToCheck) {
                const dayOfWeek = dayMap[getDay(currentDay)];
                const dayHours = staffMember.workingHours?.[dayOfWeek];

                if (!dayHours || dayHours === 'off') continue;

                const workDayStart = parse(dayHours.start, 'HH:mm', currentDay);
                const workDayEnd = parse(dayHours.end, 'HH:mm', currentDay);
                
                // OPTIMIZATION: Direct lookup instead of filtering the whole month's bookings every time.
                const staffBookingsForDay = bookingsByDayAndStaff[currentDayStr]?.[staffMember.id] || [];
                
                let potentialSlotStart = workDayStart;
                const now = new Date();
                
                 if (isSameDay(currentDay, today)) {
                    potentialSlotStart = isBefore(potentialSlotStart, now) ? parse(format(addMinutes(now, 15 - now.getMinutes() % 15), 'HH:mm'), 'HH:mm', currentDay) : potentialSlotStart;
                }

                while (isBefore(potentialSlotStart, workDayEnd)) {
                    const potentialSlotEnd = addMinutes(potentialSlotStart, serviceDuration);
                    if (isAfter(potentialSlotEnd, workDayEnd)) break;

                    const hasConflict = hasConflictWithFetchedBookings(staffBookingsForDay, potentialSlotStart, potentialSlotEnd);

                    if (!hasConflict) {
                        isDayAvailable = true;
                        break;
                    }
                    potentialSlotStart = addMinutes(potentialSlotStart, 15);
                }
                if (isDayAvailable) break;
            }

            if (!isDayAvailable) {
                unavailableDays.push(format(currentDay, 'yyyy-MM-dd'));
            }

            currentDay = addDays(new Date(currentDay.valueOf()), 1);
        }

        return { success: true, unavailableDays };

    } catch (error) {
        console.error("Error fetching unavailable days:", error);
        return { success: false, unavailableDays: [] };
    }
}
