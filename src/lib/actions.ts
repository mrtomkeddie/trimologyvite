
'use server';

import { format, parse, addMinutes, getDay, isBefore, isAfter } from 'date-fns';
import { getLocations, getServices, getStaff } from './data';
import type { NewBooking, Staff, Booking } from './types';
import { addBooking, getBookingsForStaffOnDate } from './firestore';

// Helper to map JS day index (Sun=0) to our string keys
const dayMap: (keyof Staff['workingHours'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export async function getSuggestedTimes(
    serviceDuration: number,
    preferredDate: string, // 'yyyy-MM-dd' format
    staffId: string,
    locationId: string,
) {
    console.log(`Getting times for staff ${staffId} on ${preferredDate} for a ${serviceDuration} min service.`);
    
    // Fallback for 'any' staff selection
    if (staffId === 'any') {
        console.log(`Any staff selected, returning generic times.`);
        return {
            success: true,
            times: [
                "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"
            ]
        };
    }

    const allStaff = await getStaff();
    const staffMember = allStaff.find(s => s.id === staffId);
    
    if (!staffMember || staffMember.isBookable === false || !staffMember.workingHours) {
        console.log("Staff not found, not bookable, or has no working hours.");
        return { success: true, times: [] };
    }

    const dateObj = parse(preferredDate, 'yyyy-MM-dd', new Date());
    const dayOfWeek = dayMap[getDay(dateObj)];
    const dayHours = staffMember.workingHours[dayOfWeek];

    if (!dayHours || dayHours === 'off') {
        console.log(`Staff is off on ${dayOfWeek}.`);
        return { success: true, times: [] };
    }

    // 1. Fetch existing bookings for the day
    const existingBookings = await getBookingsForStaffOnDate(staffId, dateObj);

    const { start: startTime, end: endTime } = dayHours;
    const availableSlots: string[] = [];
    
    // Use the selected date for time calculations to handle day changes correctly
    let currentSlotTime = parse(startTime, 'HH:mm', dateObj);
    const dayEndTimeObj = parse(endTime, 'HH:mm', dateObj);

    // Set a reasonable increment for checking slots (e.g., 15 minutes)
    const increment = 15; 
    
    // Loop until the end of a potential slot would be past the staff's end time
    while (isBefore(addMinutes(currentSlotTime, serviceDuration), dayEndTimeObj)) {
        const potentialSlotEnd = addMinutes(currentSlotTime, serviceDuration);

        // Check for conflicts with existing bookings
        const isSlotAvailable = !existingBookings.some(booking => {
            const bookingStart = new Date(booking.bookingTimestamp);
            const bookingEnd = addMinutes(bookingStart, booking.serviceDuration);
            
            // Overlap check: (StartA < EndB) and (EndA > StartB)
            return isBefore(currentSlotTime, bookingEnd) && isAfter(potentialSlotEnd, bookingStart);
        });
        
        // Also, ensure the slot doesn't start before now if the date is today
        const isToday = format(new Date(), 'yyyy-MM-dd') === preferredDate;
        if (isSlotAvailable && (!isToday || isAfter(currentSlotTime, new Date()))) {
            availableSlots.push(format(currentSlotTime, 'HH:mm'));
        }

        currentSlotTime = addMinutes(currentSlotTime, increment);
    }
    
    console.log(`Generated ${availableSlots.length} available slots for ${staffMember.name}`);
    
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
     
    // Fetch details to enrich the booking document
    const allLocations = await getLocations();
    const allServices = await getServices();
    const allStaff = await getStaff();

    const location = allLocations.find(l => l.id === bookingData.locationId);
    const service = allServices.find(s => s.id === bookingData.serviceId);
    const staffMember = allStaff.find(s => s.id === bookingData.staffId);
    
    if (!location || !service) {
        throw new Error("Invalid location or service selected.");
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
        staffId: bookingData.staffId || 'any',
        staffName: staffMember?.name || 'Any Available',
        staffImageUrl: staffMember?.imageUrl || '',
        bookingTimestamp: bookingTimestamp.toISOString(),
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        clientEmail: bookingData.clientEmail || '',
    };

    await addBooking(newBooking);

    // "Send" a confirmation email if an email address was provided
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
            // We don't want to fail the whole booking if the email fails, so we'll just log the error.
        }
    }

    return { success: true };
}
