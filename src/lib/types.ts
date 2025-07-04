
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
  locationId: z.string(),
  locationName: z.string(),
});
export type Service = z.infer<typeof ServiceSchema>;

export const StaffSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialization: z.string(),
  locationId: z.string(),
  locationName: z.string(),
  uid: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
});
export type Staff = z.infer<typeof StaffSchema>;

export const BookingSchema = z.object({
    id: z.string(),
    locationId: z.string(),
    locationName: z.string(),
    serviceId: z.string(),
    serviceName: z.string(),
    servicePrice: z.coerce.number(),
    staffId: z.string(),
    staffName: z.string(),
    staffImageUrl: z.string().url().optional().or(z.literal('')),
    bookingTimestamp: z.string(), // Stored as ISO string
    clientName: z.string(),
    clientPhone: z.string(),
    clientEmail: z.string().optional(),
});
export type Booking = z.infer<typeof BookingSchema>;
export type NewBooking = Omit<Booking, 'id'>;

export const AdminUserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  locationId: z.string().optional(), // If not present, they are a super-admin
  locationName: z.string().optional(),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;


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
  locationId: z.string({ required_error: 'Please assign a location.' }),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const StaffFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  specialization: z.string().min(3, 'Specialization must be at least 3 characters.'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  imageFile: z.any()
    .optional()
    .refine(
        (files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
        `Max file size is 5MB.`
    )
    .refine(
        (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
        "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
  locationId: z.string({ required_error: 'Please assign a location.' }),
  uid: z.string().optional(),
  email: z.string().email('Please enter a valid email.').optional().or(z.literal('')),
});

export const AdminFormSchema = z.object({
  uid: z.string().min(1, 'UID is required.'),
  email: z.string().email('Please enter a valid email.'),
  locationId: z.string().optional(), // 'super' for Super Admin, or a location ID
});
