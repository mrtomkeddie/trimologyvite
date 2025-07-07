

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

export const DayHoursSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});
export type DayHours = z.infer<typeof DayHoursSchema>;

export const WorkingHoursSchema = z.object({
  monday: DayHoursSchema.or(z.literal('off')).optional(),
  tuesday: DayHoursSchema.or(z.literal('off')).optional(),
  wednesday: DayHoursSchema.or(z.literal('off')).optional(),
  thursday: DayHoursSchema.or(z.literal('off')).optional(),
  friday: DayHoursSchema.or(z.literal('off')).optional(),
  saturday: DayHoursSchema.or(z.literal('off')).optional(),
  sunday: DayHoursSchema.or(z.literal('off')).optional(),
});
export type WorkingHours = z.infer<typeof WorkingHoursSchema>;

export const StaffSchema = z.object({
  id: z.string(), // This will be the UID from Firebase Auth
  name: z.string(),
  specialization: z.string().optional().or(z.literal('')),
  locationId: z.string(),
  locationName: z.string(),
  email: z.string().email().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isBookable: z.boolean().optional(),
  workingHours: WorkingHoursSchema.optional(),
});
export type Staff = z.infer<typeof StaffSchema>;

export const BookingSchema = z.object({
    id: z.string(),
    locationId: z.string(),
    locationName: z.string(),
    serviceId: z.string(),
    serviceName: z.string(),
    servicePrice: z.coerce.number(),
    serviceDuration: z.coerce.number(),
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
  id: z.string(), // This is the UID from Firebase Auth
  email: z.string().email(),
  locationId: z.string().optional(), // If not present, they are a super-admin
  locationName: z.string().optional(),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

export const ClientLoyaltySchema = z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    totalVisits: z.number(),
    lastVisit: z.string(), // ISO String
    locations: z.array(z.string()), // Array of location names
});
export type ClientLoyalty = z.infer<typeof ClientLoyaltySchema>;


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

export const AdminBookingFormSchema = BookingFormSchema.extend({
    clientPhone: z.string().optional(),
});

export const ServiceFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  duration: z.coerce.number().positive('Duration must be a positive number.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  locationId: z.string({ required_error: 'Please assign a location.' }),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const StaffWorkingHoursSchema = WorkingHoursSchema.superRefine((workingHours, ctx) => {
    if (!workingHours) return;
    Object.entries(workingHours).forEach(([day, hours]) => {
        if (typeof hours === 'object') {
            const start = parseInt(hours.start.replace(':', ''), 10);
            const end = parseInt(hours.end.replace(':', ''), 10);
            if (start >= end) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'End time must be after start time.',
                    path: [`workingHours.${day}.end`],
                });
            }
        }
    });
});

export const StaffFormSchema = z.object({
  id: z.string().optional(), // Used to hold the UID when editing or linking an admin
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  specialization: z.string().optional().or(z.literal('')),
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
  email: z.string().email('Please enter a valid email.').optional().or(z.literal('')),
  password: z.string().optional(),
  isBookable: z.boolean().optional(),
  workingHours: StaffWorkingHoursSchema.optional(),
}).superRefine((data, ctx) => {
    // When creating a brand new user (no pre-existing ID), email and password are required.
    if (!data.id) { 
        if (!data.email) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Email is required to create a new staff member.',
                path: ['email'],
            });
        }
        if (!data.password || data.password.length < 6) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'A password of at least 6 characters is required for new staff.',
                path: ['password'],
            });
        }
    }
});


export const AdminFormSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  locationId: z.string({ required_error: "Please assign a location." }),
  password: z.string().optional(),
}).superRefine((data, ctx) => {
    // When creating a new admin (no ID yet), password is required
    // This logic is tricky with superRefine because we don't have an ID field.
    // We handle the password requirement logic inside the form submission instead.
});


export const LocationFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    address: z.string().min(5, "Please enter a valid address"),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
});
    
