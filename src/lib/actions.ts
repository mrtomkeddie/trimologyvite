
'use server';

import { format, parse, addMinutes, getDay, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { getLocations, getServices, getStaff } from './data';
import type { NewBooking, Staff, Booking } from './types';
import { addBooking, getBookingsForStaffOnDate } from './firestore';
import { suggestTimes }from '@/ai/flows/suggest-times-flow';

// Helper to map JS day index (Sun=0) to our string keys
const dayMap: (keyof Staff['workingHours'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Helper function to get available times for a single, specific staff member using AI
async function getIndividualStaffTimes(
    serviceDuration: number,
    preferredDate: string, // 'yyyy-MM-dd' format
    staffMember: Staff
): Promise<string[]> {
    if (!staffMember.workingHours || staffMember.isBookable === false) return [];

    const dateObj = parse(preferredDate, 'yyyy-MM-dd', new Date());
    const dayOfWeek = dayMap[getDay(dateObj)];
    const dayHours = staffMember.workingHours[dayOfWeek];

    if (!dayHours || dayHours === 'off') {
        return [];
    }

    const existingBookings = await getBookingsForStaffOnDate(staffMember.id, dateObj);
    
    // Map existing bookings to a simpler format for the AI prompt
    const simpleBookings = existingBookings.map(b => ({
      time: format(new Date(b.bookingTimestamp), 'HH:mm'),
      existingDuration: b.serviceDuration,
    }));

    try {
        const suggestedTimesResult = await suggestTimes({
            duration: serviceDuration,
            date: preferredDate,
            workingHours: dayHours,
            existingBookings: simpleBookings,
        });
        return suggestedTimesResult.times;
    } catch (error) {
        console.error("AI suggestion failed, falling back to empty array:", error);
        // In a real-world scenario, you might want a non-AI fallback here.
        return [];
    }
}

export async function getSuggestedTimes(
    serviceDuration: number,
    preferredDate: string, // 'yyyy-MM-dd' format
    staffId: string,
    locationId: string,
) {
    console.log(`Getting times for staff ${staffId} on ${preferredDate} for a ${serviceDuration} min service.`);
    
    // --- Logic for 'any' staff ---
    if (staffId === 'any') {
        const allStaffAtLocation = (await getStaff()).filter(s => s.locationId === locationId && s.isBookable !== false);
        const allAvailableSlots = new Set<string>();

        // We can run these in parallel to speed things up
        const timePromises = allStaffAtLocation.map(staffMember => 
            getIndividualStaffTimes(serviceDuration, preferredDate, staffMember)
        );
        const results = await Promise.all(timePromises);

        results.forEach(staffSlots => {
            staffSlots.forEach(slot => allAvailableSlots.add(slot));
        });

        const sortedSlots = Array.from(allAvailableSlots).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        console.log(`Found ${sortedSlots.length} total available slots for 'any' staff.`);
        return { success: true, times: sortedSlots };
    }

    // --- Logic for a specific staff member ---
    const allStaff = await getStaff();
    const staffMember = allStaff.find(s => s.id === staffId);
    
    if (!staffMember) {
        console.log("Staff not found.");
        return { success: true, times: [] };
    }

    const availableSlots = await getIndividualStaffTimes(serviceDuration, preferredDate, staffMember);
    console.log(`Generated ${availableSlots.length} available slots for ${staffMember.name} using AI.`);
    
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
        try {
            const emailBody = `
Dear ${bookingData.clientName},

Thank you for booking with Trimology!

Your appointment details:
Service: ${service?.name || 'N/A'} (£${service.price.toFixed(2)})
Location: ${location?.name || 'N/A'}
Date: ${format(bookingData.date, 'PPP')}
Time: ${bookingData.time}
Staff: ${staffMember?.name || 'Any Available'}

We look forward to seeing you!

- The Trimology Team
            `.trim().replace(/^ +/gm, '');

            console.log("--- Sending Confirmation Email ---");
            console.log(`To: ${bookingData.clientEmail}`);
            console.log(`Subject: Your Trimology Booking Confirmation`);
            console.log(emailBody);
            console.log("---------------------------------");

        } catch (error) {
            console.error("Failed to prepare confirmation email content:", error);
        }
    }

    return { success: true };
}
