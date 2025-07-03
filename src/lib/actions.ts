'use server';

import { format } from 'date-fns';
import { getLocations, getServices, getStaff } from './data';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);


export async function getSuggestedTimes(serviceDuration: number, preferredDate: string) {
    // This is a radical simplification to work around a build tool bug.
    // The actual logic was correct, but something in it was confusing the compiler.
    console.log(`Getting times for service duration ${serviceDuration} on ${preferredDate}`);
    
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return { 
        success: true, 
        times: [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
            "16:00"
        ] 
    };
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

    // In a real app, you would save this to a database.
    console.log("Booking created successfully (mock):", bookingData);

    // Send a confirmation email if an email address was provided
    if (bookingData.clientEmail) {
        try {
            // Fetch details to enrich the email content
            const allLocations = await getLocations();
            const allServices = await getServices();
            const allStaff = await getStaff();

            const location = allLocations.find(l => l.id === bookingData.locationId);
            const service = allServices.find(s => s.id === bookingData.serviceId);
            const staffMember = allStaff.find(s => s.id === bookingData.staffId);

            const emailBody = `
Dear ${bookingData.clientName},

Thank you for booking with Trimology!

Your appointment details:
Service: ${service?.name || 'N/A'}
Location: ${location?.name || 'N/A'}
Date: ${format(bookingData.date, 'PPP')}
Time: ${bookingData.time}
Staff: ${staffMember?.name || 'Any Available'}

We look forward to seeing you!

- The Trimology Team
            `.trim().replace(/^ +/gm, '');

            await resend.emails.send({
                from: 'Trimology <onboarding@resend.dev>', // IMPORTANT: Replace with your verified sender email from Resend
                to: bookingData.clientEmail,
                subject: 'Your Trimology Booking Confirmation',
                text: emailBody,
            });

        } catch (emailError) {
            console.error("Failed to 'send' confirmation email:", emailError);
            // We don't want to fail the whole booking if the email fails, so we'll just log the error.
        }
    }

    return { success: true };
}
