
import { z } from 'zod';

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});
export type Location = z.infer<typeof LocationSchema>;

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.coerce.number(), // in minutes
  price: z.coerce.number(),
});
export type Service = z.infer<typeof ServiceSchema>;

export const StaffSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialization: z.string(),
});
export type Staff = z.infer<typeof StaffSchema>;

export const BookingFormSchema = z.object({
    locationId: z.string({ required_error: 'Please select a location.' }),
    serviceId: z.string({ required_error: 'Please select a service.' }),
    staffId: z.string().optional(),
    date: z.date({ required_error: 'Please select a date.' }),
    time: z.string({ required_error: 'Please select a time.' }),
    clientName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    clientPhone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
    clientEmail: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
});

export const LocationFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
});

export const ServiceFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  duration: z.coerce.number().positive('Duration must be a positive number.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
});
