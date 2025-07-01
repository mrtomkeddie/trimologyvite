import { z } from 'zod';

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number(), // in minutes
  price: z.number(),
});
export type Service = z.infer<typeof ServiceSchema>;

export const StaffSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialization: z.string(),
});
export type Staff = z.infer<typeof StaffSchema>;

export const BookingFormSchema = z.object({
    serviceId: z.string({ required_error: 'Please select a service.' }),
    staffId: z.string().optional(),
    date: z.date({ required_error: 'Please select a date.' }),
    time: z.string({ required_error: 'Please select a time.' }),
    clientName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    clientPhone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
    clientEmail: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  });

export type Booking = z.infer<typeof BookingFormSchema> & {
    id: string;
    status: 'Confirmed' | 'Attended' | 'No-Show';
};
