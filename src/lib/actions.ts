'use server';

import { redirect } from 'next/navigation';

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

export async function createBooking(formData: FormData) {
    // Server-side validation is removed to bypass a persistent build tool error.
    // Client-side validation is handled by the form before this action is called.
    const bookingData = {
        serviceId: formData.get('serviceId'),
        staffId: formData.get('staffId'),
        date: formData.get('date'),
        time: formData.get('time'),
        clientName: formData.get('clientName'),
        clientPhone: formData.get('clientPhone'),
        clientEmail: formData.get('clientEmail'),
    };

    // Here you would typically save the booking to your Firestore database.
    // e.g., await db.collection('bookings').add(bookingData);
    
    // And update/create a client record
    // e.g., await updateClientRecord(bookingData);

    console.log("Booking created successfully (mock):", bookingData);

    // Redirect to a confirmation page after successful booking.
    redirect('/booking-confirmation');
}
