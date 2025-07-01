"use server";

import { z } from 'zod';
import { redirect } from 'next/navigation';

import { BookingFormSchema } from './types';
import { suggestAvailableTimes } from '@/ai/flows/suggest-available-times';

export async function getSuggestedTimes(serviceDuration: number, preferredDate: string) {
    // In a real app, staff availability would be fetched from your database
    // based on the selected staff member (or all staff if 'any' is selected).
    const staffAvailability = JSON.stringify([
      { start: '09:00', end: '12:00' },
      { start: '13:00', end: '17:30' },
    ]);

    try {
        const result = await suggestAvailableTimes({
            serviceDuration,
            staffAvailability,
            preferredDate,
        });
        return { success: true, times: result.availableTimeSlots };
    } catch (error) {
        console.error('Error suggesting times:', error);
        return { success: false, error: 'Failed to suggest available times. Please try again.' };
    }
}

export async function createBooking(formData: z.infer<typeof BookingFormSchema>) {
    const parsedData = BookingFormSchema.safeParse(formData);

    if (!parsedData.success) {
        console.error('Invalid booking data:', parsedData.error.flatten());
        // This should ideally not happen with client-side validation, but as a fallback:
        throw new Error("Invalid booking data provided.");
    }

    // Here you would typically save the booking to your Firestore database.
    // e.g., await db.collection('bookings').add(parsedData.data);
    
    // And update/create a client record
    // e.g., await updateClientRecord(parsedData.data);

    console.log("Booking created successfully (mock):", parsedData.data);

    // Redirect to a confirmation page after successful booking.
    redirect('/booking-confirmation');
}
