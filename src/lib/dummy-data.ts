
import type { Service, Staff, Location, AdminUser, Booking, ClientLoyalty } from './types';

// --- DUMMY DATA DEFINITIONS ---

export const DUMMY_LOCATIONS: Location[] = [
  { id: 'loc_1', name: 'Downtown Barbers', address: '123 Main St, Anytown, USA', phone: '555-1234', email: 'contact@downtown.co' },
  { id: 'loc_2', name: 'Uptown Cuts', address: '456 Oak Ave, Anytown, USA', phone: '555-5678', email: 'contact@uptown.co' },
];

export const DUMMY_SERVICES: Service[] = [
  { id: 'serv_1', name: 'Classic Haircut', duration: 45, price: 30, locationId: 'loc_1', locationName: 'Downtown Barbers' },
  { id: 'serv_2', name: 'Beard Trim', duration: 20, price: 15, locationId: 'loc_1', locationName: 'Downtown Barbers' },
  { id: 'serv_3', name: 'Hot Towel Shave', duration: 30, price: 25, locationId: 'loc_1', locationName: 'Downtown Barbers' },
  { id: 'serv_4', name: 'Modern Fade', duration: 60, price: 40, locationId: 'loc_2', locationName: 'Uptown Cuts' },
  { id: 'serv_5', name: 'Coloring', duration: 90, price: 75, locationId: 'loc_2', locationName: 'Uptown Cuts' },
];

export const DUMMY_STAFF: Staff[] = [
  {
    id: 'staff_1', name: 'Alice', specialization: 'Master Barber', locationId: 'loc_1', locationName: 'Downtown Barbers', email: 'staff@example.com',
    imageUrl: `https://placehold.co/100x100.png`,
    workingHours: { monday: { start: '09:00', end: '17:00' }, tuesday: { start: '09:00', end: '17:00' }, wednesday: 'off', thursday: { start: '10:00', end: '18:00' }, friday: { start: '09:00', end: '17:00' }, saturday: 'off', sunday: 'off' },
  },
  {
    id: 'staff_2', name: 'Bob', specialization: 'Stylist', locationId: 'loc_2', locationName: 'Uptown Cuts', email: 'bob@example.com',
    imageUrl: `https://placehold.co/100x100.png`,
    workingHours: { monday: 'off', tuesday: { start: '09:00', end: '17:00' }, wednesday: { start: '09:00', end: '17:00' }, thursday: { start: '11:00', end: '19:00' }, friday: { start: '09:00', end: '17:00' }, saturday: { start: '10:00', end: '14:00' }, sunday: 'off' },
  },
   {
    id: 'branch_admin_user', name: 'Charlie', specialization: 'Senior Stylist', locationId: 'loc_2', locationName: 'Uptown Cuts', email: 'branchadmin@example.com',
    imageUrl: `https://placehold.co/100x100.png`,
    workingHours: { monday: { start: '09:00', end: '17:00' }, tuesday: { start: '09:00', end: '17:00' }, wednesday: { start: '09:00', end: '17:00' }, thursday: { start: '09:00', end: '17:00' }, friday: { start: '09:00', end: '17:00' }, saturday: 'off', sunday: 'off' },
  },
  {
    id: 'super_admin_user', name: 'Samantha (Owner)', specialization: 'Super Admin', locationId: 'superadmin', locationName: 'All Locations', email: 'superadmin@example.com',
    imageUrl: `https://placehold.co/100x100.png`,
    workingHours: { monday: { start: '09:00', end: '17:00' }, tuesday: { start: '09:00', end: '17:00' }, wednesday: { start: '09:00', end: '17:00' }, thursday: { start: '09:00', end: '17:00' }, friday: { start: '09:00', end: '17:00' }, saturday: 'off', sunday: 'off' },
  }
];

export const DUMMY_ADMIN_USERS: AdminUser[] = [
    { id: 'super_admin_user', email: 'superadmin@example.com' }, // Super admin has no locationId
    { id: 'branch_admin_user', email: 'branchadmin@example.com', locationId: 'loc_2', locationName: 'Uptown Cuts' },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

const dayAfter = new Date();
dayAfter.setDate(dayAfter.getDate() + 2);
dayAfter.setHours(14, 30, 0, 0);

export const DUMMY_BOOKINGS: Booking[] = [
  { 
    id: 'booking_1', locationId: 'loc_1', locationName: 'Downtown Barbers', serviceId: 'serv_1', serviceName: 'Classic Haircut', servicePrice: 30, serviceDuration: 45, 
    staffId: 'staff_1', staffName: 'Alice', staffImageUrl: `https://placehold.co/100x100.png`,
    bookingTimestamp: tomorrow.toISOString(),
    clientName: 'John Doe', clientPhone: '111-222-3333', clientEmail: 'john@doe.com',
  },
  { 
    id: 'booking_2', locationId: 'loc_2', locationName: 'Uptown Cuts', serviceId: 'serv_4', serviceName: 'Modern Fade', servicePrice: 40, serviceDuration: 60,
    staffId: 'staff_2', staffName: 'Bob', staffImageUrl: `https://placehold.co/100x100.png`,
    bookingTimestamp: dayAfter.toISOString(),
    clientName: 'Jane Smith', clientPhone: '444-555-6666', clientEmail: 'jane@smith.com',
  }
];

export const DUMMY_CLIENTS: ClientLoyalty[] = [
    { id: 'client_1', name: 'John Doe', phone: '111-222-3333', email: 'john@doe.com', totalVisits: 5, lastVisit: new Date().toISOString(), locations: ['Downtown Barbers'] },
    { id: 'client_2', name: 'Jane Smith', phone: '444-555-6666', email: 'jane@smith.com', totalVisits: 3, lastVisit: new Date().toISOString(), locations: ['Uptown Cuts'] },
    { id: 'client_3', name: 'Peter Jones', phone: '777-888-9999', email: 'peter@jones.com', totalVisits: 1, lastVisit: new Date().toISOString(), locations: ['Downtown Barbers'] },
];
