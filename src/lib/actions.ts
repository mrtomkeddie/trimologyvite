'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

import { BookingFormSchema } from './types';

export async function getSuggestedTimes(serviceDuration: number, preferredDate: string) {
    try {
        // In a real app, staff availability would be fetched from your database
        // based on the selected staff member (or all staff if 'any' is selected).
        const staffAvailability = [
          { start: '09:00', end: '12:00' },
          { start: '13:00', end: '17:30' },
        ];
        // In a real app, you would also check for existing bookings on the preferredDate.

        const parseTime = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const formatTime = (totalMinutes: number): string => {
            const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
            const minutes = (totalMinutes % 60).toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        };

        const availableTimeSlots: string[] = [];
        const slotInterval = 15; // Propose a new slot every 15 minutes

        staffAvailability.forEach(availabilityWindow => {
            let currentMin = parseTime(availabilityWindow.start);
            const endMin = parseTime(availabilityWindow.end);

            while (currentMin + serviceDuration <= endMin) {
                availableTimeSlots.push(formatTime(currentMin));
                currentMin += slotInterval;
            }
        });

        // Simulate a slight delay to mimic a real API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { success: true, times: availableTimeSlots };

    } catch (error) {
        console.error('Error getting times:', error);
        return { success: false, error: 'Failed to find available times. Please try again.' };
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
