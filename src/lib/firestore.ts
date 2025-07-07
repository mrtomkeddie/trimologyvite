
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query, Timestamp, where, getDoc, setDoc, limit } from 'firebase/firestore';
import type { Location, Service, Staff, Booking, NewBooking, AdminUser, ClientLoyalty } from './types';
import { revalidatePath } from 'next/cache';
import { addDays, startOfDay, endOfDay, subDays, format } from 'date-fns';

// --- DUMMY DATA SWITCH ---
// Change this to 'false' to use your live Firestore database.
const USE_DUMMY_DATA = false;

// --- DUMMY DATA DEFINITIONS ---

// Helper to create unambiguous UTC timestamp strings for dummy data
const createDummyTimestamp = (date: Date, hour: number, minute: number): string => {
    const d = new Date(date);
    d.setUTCHours(hour, minute, 0, 0); 
    return d.toISOString();
};


const dummyLocations: Location[] = [
    { id: 'downtown-1', name: 'Downtown Barbers', address: '123 Main St, Barberville', phone: '555-0101', email: 'contact@downtown.com' },
    { id: 'uptown-2', name: 'Uptown Cuts', address: '456 High St, Styletown', phone: '555-0102', email: 'hello@uptown.com' },
    { id: 'soho-3', name: 'Soho Salon', address: '10 Fashion Ave, London', phone: '555-0103', email: 'contact@sohosalon.com' },
];

const dummyServices: Service[] = [
    { id: 'svc-1', name: 'Classic Haircut', duration: 30, price: 25, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-2', name: 'Beard Trim', duration: 15, price: 15, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-3', name: 'Hot Towel Shave', duration: 45, price: 40, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-6', name: 'Modern Fade', duration: 45, price: 35, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-4', name: 'Kids Cut', duration: 30, price: 20, locationId: 'uptown-2', locationName: 'Uptown Cuts' },
    { id: 'svc-5', name: 'Color & Cut', duration: 120, price: 90, locationId: 'uptown-2', locationName: 'Uptown Cuts' },
    { id: 'svc-7', name: 'Luxury Manicure', duration: 60, price: 50, locationId: 'uptown-2', locationName: 'Uptown Cuts' },
    { id: 'svc-8', name: 'Creative Color', duration: 180, price: 150, locationId: 'soho-3', locationName: 'Soho Salon' },
    { id: 'svc-9', name: 'Signature Cut', duration: 60, price: 75, locationId: 'soho-3', locationName: 'Soho Salon' },
];

const defaultWorkingHours = {
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '17:00' },
    saturday: { start: '10:00', end: '16:00' },
    sunday: 'off' as const,
};

const dummyStaff: Staff[] = [
    { id: 'staff-uid-alex', name: 'Alex Smith', specialization: 'Master Barber', locationId: 'downtown-1', locationName: 'Downtown Barbers', email: 'alex@trimology.com', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: defaultWorkingHours },
    { id: 'staff-uid-maria', name: 'Maria Garcia', specialization: 'Senior Stylist', locationId: 'downtown-1', locationName: 'Downtown Barbers', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: { ...defaultWorkingHours, wednesday: 'off' } },
    { id: 'staff-uid-laura', name: 'Laura Palmer', specialization: 'Stylist', locationId: 'downtown-1', locationName: 'Downtown Barbers', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: defaultWorkingHours },
    { id: 'staff-uid-john', name: 'John Doe', specialization: '', locationId: 'uptown-2', locationName: 'Uptown Cuts', imageUrl: 'https://placehold.co/100x100.png', isBookable: false },
    { id: 'staff-uid-jane', name: 'Jane Roe', specialization: 'Color Specialist', locationId: 'uptown-2', locationName: 'Uptown Cuts', email: 'jane@trimology.com', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: { ...defaultWorkingHours, saturday: 'off', sunday: 'off' } },
    { id: 'staff-uid-casey', name: 'Casey Jones', specialization: 'Hair Artist', locationId: 'soho-3', locationName: 'Soho Salon', email: 'casey@trimology.com', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: defaultWorkingHours },
    { id: 'staff@trimology.com', name: 'Demo Staff', specialization: 'Stylist', locationId: 'downtown-1', locationName: 'Downtown Barbers', email: 'staff@trimology.com', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: defaultWorkingHours },
];


let dummyBookings: Booking[] = [
    { id: 'book-1', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, serviceDuration: 30, staffId: 'staff-uid-alex', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(addDays(new Date(), 1), 10, 0), clientName: 'Bob Johnson', clientPhone: '555-1111', clientEmail: 'bob@example.com' },
    { id: 'book-2', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-2', serviceName: 'Beard Trim', servicePrice: 15, serviceDuration: 15, staffId: 'staff-uid-alex', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(addDays(new Date(), 2), 14, 30), clientName: 'Charlie Brown', clientPhone: '555-2222' },
    { id: 'book-3', locationId: 'uptown-2', locationName: 'Uptown Cuts', serviceId: 'svc-5', serviceName: 'Color & Cut', servicePrice: 90, serviceDuration: 120, staffId: 'staff-uid-jane', staffName: 'Jane Roe', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(addDays(new Date(), 3), 11, 0), clientName: 'Diana Prince', clientPhone: '555-3333', clientEmail: 'diana@example.com' },
    { id: 'book-4', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, serviceDuration: 30, staffId: 'staff-uid-maria', staffName: 'Maria Garcia', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(addDays(new Date(), 1), 11, 30), clientName: 'Peter Parker', clientPhone: '555-4444' },
    { id: 'book-5', locationId: 'soho-3', locationName: 'Soho Salon', serviceId: 'svc-9', serviceName: 'Signature Cut', servicePrice: 75, serviceDuration: 60, staffId: 'staff-uid-casey', staffName: 'Casey Jones', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(addDays(new Date(), 4), 15, 0), clientName: 'Bruce Wayne', clientPhone: '555-5555' },
    { id: 'book-6', locationId: 'uptown-2', locationName: 'Uptown Cuts', serviceId: 'svc-4', serviceName: 'Kids Cut', servicePrice: 20, serviceDuration: 30, staffId: 'staff-uid-jane', staffName: 'Jane Roe', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(addDays(new Date(), 1), 9, 0), clientName: 'Anakin Skywalker', clientPhone: '555-6666' },
    { id: 'book-7', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-3', serviceName: 'Hot Towel Shave', servicePrice: 40, serviceDuration: 45, staffId: 'staff-uid-alex', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(addDays(new Date(), 5), 16, 0), clientName: 'Tony Stark', clientPhone: '555-7777', clientEmail: 'tony@example.com' },
    { id: 'book-8', locationId: 'soho-3', locationName: 'Soho Salon', serviceId: 'svc-8', serviceName: 'Creative Color', servicePrice: 150, serviceDuration: 180, staffId: 'staff-uid-casey', staffName: 'Casey Jones', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(addDays(new Date(), 6), 10, 0), clientName: 'Natasha Romanoff', clientPhone: '555-8888' },
    { id: 'book-9', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, serviceDuration: 30, staffId: 'staff-uid-laura', staffName: 'Laura Palmer', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(addDays(new Date(), 2), 13, 0), clientName: 'Clark Kent', clientPhone: '555-9999' },
    { id: 'book-10', locationId: 'uptown-2', locationName: 'Uptown Cuts', serviceId: 'svc-7', serviceName: 'Luxury Manicure', servicePrice: 50, serviceDuration: 60, staffId: 'staff-uid-jane', staffName: 'Jane Roe', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(subDays(new Date(), 1), 12, 0), clientName: 'Lois Lane', clientPhone: '555-1010' },
    { id: 'book-11', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-6', serviceName: 'Modern Fade', servicePrice: 35, serviceDuration: 45, staffId: 'staff-uid-alex', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(subDays(new Date(), 2), 11, 0), clientName: 'Jimmy Olsen', clientPhone: '555-1212' },
    { id: 'book-12', locationId: 'soho-3', locationName: 'Soho Salon', serviceId: 'svc-9', serviceName: 'Signature Cut', servicePrice: 75, serviceDuration: 60, staffId: 'staff-uid-casey', staffName: 'Casey Jones', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(new Date(), 14, 0), clientName: 'Perry White', clientPhone: '555-1313' },
    // Add more bookings for loyalty data
    { id: 'book-13', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, serviceDuration: 30, staffId: 'staff-uid-alex', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(subDays(new Date(), 10), 10, 0), clientName: 'Bob Johnson', clientPhone: '555-1111', clientEmail: 'bob@example.com' },
    { id: 'book-14', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, serviceDuration: 30, staffId: 'staff-uid-maria', staffName: 'Maria Garcia', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(subDays(new Date(), 20), 10, 0), clientName: 'Bob Johnson', clientPhone: '555-1111', clientEmail: 'bob@example.com' },
    { id: 'book-15', locationId: 'uptown-2', locationName: 'Uptown Cuts', serviceId: 'svc-4', serviceName: 'Kids Cut', servicePrice: 20, serviceDuration: 30, staffId: 'staff-uid-jane', staffName: 'Jane Roe', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: createDummyTimestamp(subDays(new Date(), 5), 9, 0), clientName: 'Anakin Skywalker', clientPhone: '555-6666' },
];

const dummyAdmins: AdminUser[] = [
    { id: 'owner-uid', email: 'owner@trimology.com' },
    { id: 'super-admin-uid', email: 'superadmin@trimology.com' },
    { id: 'branch-admin-uid', email: 'branchadmin@trimology.com', locationId: 'downtown-1', locationName: 'Downtown Barbers' },
];


const locationsCollection = collection(db, 'locations');
const servicesCollection = collection(db, 'services');
const staffCollection = collection(db, 'staff');
const bookingsCollection = collection(db, 'bookings');
const adminsCollection = collection(db, 'admins');


// Admins
export async function getAdminUser(uid: string, email?: string): Promise<AdminUser | null> {
    if (USE_DUMMY_DATA) {
        const existingAdmin = dummyAdmins.find(a => a.email === email);
        if (existingAdmin) {
            return { ...existingAdmin, id: uid };
        }
        return null;
    }

    const adminDocRef = doc(db, 'admins', uid);
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
        return null;
    }
    
    const adminData = adminDoc.data();
    return {
        id: uid,
        email: adminData.email,
        locationId: adminData.locationId,
        locationName: adminData.locationName,
    } as AdminUser;
}

export async function getAdminsFromFirestore(locationId?: string): Promise<AdminUser[]> {
    if (USE_DUMMY_DATA) {
        if (locationId) return Promise.resolve(dummyAdmins.filter(a => a.locationId === locationId));
        return Promise.resolve(dummyAdmins);
    }
    
    const q = locationId 
        ? query(adminsCollection, where('locationId', '==', locationId))
        : query(adminsCollection, orderBy('email'));
        
    const snapshot = await getDocs(q);
    const admins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AdminUser));

    if (locationId) {
        admins.sort((a, b) => a.email.localeCompare(b.email));
    }

    return admins;
}

export async function setAdminRecord(uid: string, data: { email: string; locationId: string; locationName: string; }) {
    if (USE_DUMMY_DATA) {
        const newAdmin = { ...data, id: uid };
        dummyAdmins.push(newAdmin);
        revalidatePath('/admin/admins');
        return;
    }
    const adminDoc = doc(db, 'admins', uid);
    await setDoc(adminDoc, data);
    revalidatePath('/admin/admins');
}

export async function updateAdmin(uid: string, data: Partial<Omit<AdminUser, 'id'>>) {
    if (USE_DUMMY_DATA) { 
        const adminIndex = dummyAdmins.findIndex(a => a.id === uid);
        if (adminIndex > -1) {
            dummyAdmins[adminIndex] = { ...dummyAdmins[adminIndex], ...data };
        }
        revalidatePath('/admin/admins'); 
        return; 
    }
    const adminDoc = doc(db, 'admins', uid);
    await updateDoc(adminDoc, data);
    revalidatePath('/admin/admins');
}

export async function deleteAdmin(uid: string) {
    if (USE_DUMMY_DATA) { 
        const index = dummyAdmins.findIndex(a => a.id === uid);
        if (index > -1) dummyAdmins.splice(index, 1);
        revalidatePath('/admin/admins'); 
        return; 
    }
    const adminDoc = doc(db, 'admins', uid);
    await deleteDoc(adminDoc);
    revalidatePath('/admin/admins');
}


// Locations
export async function getLocationsFromFirestore(locationId?: string): Promise<Location[]> {
    if (USE_DUMMY_DATA) {
        if (locationId) return Promise.resolve(dummyLocations.filter(l => l.id === locationId));
        return Promise.resolve(dummyLocations);
    }
    if (locationId) {
        const docRef = doc(db, "locations", locationId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? [{ id: docSnap.id, ...docSnap.data() } as Location] : [];
    }
    const q = query(locationsCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
}

export async function addLocation(data: Omit<Location, 'id'>) {
    if (USE_DUMMY_DATA) {
        const newLocation = { ...data, id: `loc-${Date.now()}`};
        dummyLocations.push(newLocation as Location);
        revalidatePath('/admin/locations');
        return;
    }
    await addDoc(locationsCollection, data);
    revalidatePath('/admin/locations');
}

export async function updateLocation(id: string, data: Partial<Omit<Location, 'id'>>) {
    if (USE_DUMMY_DATA) {
        const locIndex = dummyLocations.findIndex(l => l.id === id);
        if (locIndex > -1) {
            dummyLocations[locIndex] = { ...dummyLocations[locIndex], ...data };
        }
        revalidatePath('/admin/locations');
        return;
    }
    const locDoc = doc(db, 'locations', id);
    await updateDoc(locDoc, data);
    revalidatePath('/admin/locations');
}

export async function deleteLocation(id: string) {
    if (USE_DUMMY_DATA) {
        const index = dummyLocations.findIndex(l => l.id === id);
        if (index > -1) dummyLocations.splice(index, 1);
        revalidatePath('/admin/locations');
        return;
    }
    const locDoc = doc(db, 'locations', id);
    await deleteDoc(locDoc);
    revalidatePath('/admin/locations');
}


// Services
export async function getServicesFromFirestore(locationId?: string): Promise<Service[]> {
    if (USE_DUMMY_DATA) {
        if (locationId) return Promise.resolve(dummyServices.filter(s => s.locationId === locationId));
        return Promise.resolve(dummyServices);
    }
    const q = locationId 
        ? query(servicesCollection, where('locationId', '==', locationId))
        : query(servicesCollection, orderBy('name'));

    const snapshot = await getDocs(q);
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
    
    if (locationId) {
        services.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return services;
}

export async function addService(data: { name: string; duration: number; price: number; locationId: string; locationName: string; }) {
    if (USE_DUMMY_DATA) { revalidatePath('/admin/services'); revalidatePath('/'); return; }
    await addDoc(servicesCollection, data);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

export async function updateService(id: string, data: { name: string; duration: number; price: number; locationId: string; locationName: string; }) {
    if (USE_DUMMY_DATA) { revalidatePath('/admin/services'); revalidatePath('/'); return; }
    const serviceDoc = doc(db, 'services', id);
    await updateDoc(serviceDoc, data);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

export async function deleteService(id: string) {
    if (USE_DUMMY_DATA) { revalidatePath('/admin/services'); revalidatePath('/'); return; }
    const serviceDoc = doc(db, 'services', id);
    await deleteDoc(serviceDoc);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

// Staff
export async function getStaffFromFirestore(locationId?: string): Promise<Staff[]> {
     if (USE_DUMMY_DATA) {
        if (locationId) return Promise.resolve(dummyStaff.filter(s => s.locationId === locationId));
        return Promise.resolve(dummyStaff);
    }
    const q = locationId
        ? query(staffCollection, where('locationId', '==', locationId))
        : query(staffCollection, orderBy('name'));
    
    const snapshot = await getDocs(q);
    const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));

    if (locationId) {
        staff.sort((a,b) => a.name.localeCompare(b.name));
    }

    return staff;
}

export async function setStaffRecord(uid: string, data: Omit<Staff, 'id'>) {
    if (USE_DUMMY_DATA) {
        const newStaff = { ...data, id: uid };
        dummyStaff.push(newStaff);
        revalidatePath('/admin/staff');
        revalidatePath('/');
        return;
    }
    
    const staffDocRef = doc(db, 'staff', uid);
    await setDoc(staffDocRef, data);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function updateStaff(uid: string, data: Partial<Omit<Staff, 'id'>>) {
    if (USE_DUMMY_DATA) {
        const staffIndex = dummyStaff.findIndex(s => s.id === uid);
        if (staffIndex > -1) {
            dummyStaff[staffIndex] = { ...dummyStaff[staffIndex], ...data };
        }
        revalidatePath('/admin/staff'); revalidatePath('/'); return;
    }
    const staffDoc = doc(db, 'staff', uid);
    await updateDoc(staffDoc, data);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function deleteStaff(uid: string) {
    if (USE_DUMMY_DATA) { 
        const index = dummyStaff.findIndex(s => s.id === uid);
        if (index > -1) dummyStaff.splice(index, 1);
        revalidatePath('/admin/staff'); 
        revalidatePath('/'); 
        return; 
    }
    // In a real app, you would also want a Cloud Function to delete the corresponding Firebase Auth user.
    const staffDoc = doc(db, 'staff', uid);
    await deleteDoc(staffDoc);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function getStaffByUid(uid: string): Promise<Staff | null> {
    if (USE_DUMMY_DATA) {
        const staffMember = dummyStaff.find(s => s.id === uid);
        return staffMember || null;
    }
    
    const staffDocRef = doc(db, 'staff', uid);
    const staffDoc = await getDoc(staffDocRef);

    if (!staffDoc.exists()) {
        const q = query(staffCollection, where('email', '==', uid), limit(1)); // Legacy lookup by email for demo
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc_1 = snapshot.docs[0];
        return { id: doc_1.id, ...doc_1.data() } as Staff;
    }
    
    return { id: staffDoc.id, ...staffDoc.data() } as Staff;
}


// Bookings
export async function getBookingsFromFirestore(locationId?: string): Promise<Booking[]> {
    if (USE_DUMMY_DATA) {
        const sorted = dummyBookings.sort((a,b) => b.bookingTimestamp.localeCompare(a.bookingTimestamp));
        if (locationId) return Promise.resolve(sorted.filter(b => b.locationId === locationId));
        return Promise.resolve(sorted);
    }

    let q;
    if (locationId) {
        // Query by location, but omit the ordering to avoid the composite index requirement.
        q = query(bookingsCollection, where('locationId', '==', locationId));
    } else {
        // Query all bookings, ordered by timestamp. This is a simple index and is allowed.
        q = query(bookingsCollection, orderBy('bookingTimestamp', 'desc'));
    }

    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            bookingTimestamp: data.bookingTimestamp,
        } as Booking;
    });

    // If we filtered by location, we now need to sort the results in our code.
    if (locationId) {
        bookings.sort((a, b) => b.bookingTimestamp.localeCompare(a.bookingTimestamp));
    }

    return bookings;
}

export async function getBookingsByPhoneFromFirestore(phone: string): Promise<Booking[]> {
    if (USE_DUMMY_DATA) {
        const filtered = dummyBookings.filter(b => b.clientPhone === phone);
        const sorted = filtered.sort((a, b) => b.bookingTimestamp.localeCompare(a.bookingTimestamp));
        return Promise.resolve(sorted);
    }

    const q = query(
        bookingsCollection,
        where('clientPhone', '==', phone)
    );

    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            bookingTimestamp: data.bookingTimestamp,
        } as Booking;
    });

    bookings.sort((a, b) => b.bookingTimestamp.localeCompare(a.bookingTimestamp));
    return bookings;
}

export async function getBookingsByStaffId(staffId: string): Promise<Booking[]> {
    const nowString = new Date().toISOString();
    
    if (USE_DUMMY_DATA) {
        const upcoming = dummyBookings
            .filter(b => b.staffId === staffId && b.bookingTimestamp >= nowString)
            .sort((a,b) => a.bookingTimestamp.localeCompare(b.bookingTimestamp));
        return Promise.resolve(upcoming);
    }

    // This query previously required a composite index.
    // By removing the orderBy and filtering/sorting in code, we avoid the index requirement.
    const q = query(bookingsCollection, where('staffId', '==', staffId));
    
    const snapshot = await getDocs(q);
    const allBookingsForStaff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));

    // Filter for upcoming bookings and sort them in the application code.
    const upcomingBookings = allBookingsForStaff
        .filter(b => b.bookingTimestamp >= nowString)
        .sort((a,b) => a.bookingTimestamp.localeCompare(b.bookingTimestamp));

    return upcomingBookings;
}

export async function getBookingsForStaffOnDate(staffId: string, date: Date): Promise<Booking[]> {
    const dayStartStr = format(date, 'yyyy-MM-dd') + 'T00:00:00.000Z';
    const dayEndStr = format(date, 'yyyy-MM-dd') + 'T23:59:59.999Z';
    
    if (USE_DUMMY_DATA) {
        const dayBookings = dummyBookings.filter(b => {
            return b.staffId === staffId && b.bookingTimestamp >= dayStartStr && b.bookingTimestamp <= dayEndStr;
        });
        return Promise.resolve(dayBookings);
    }
    
    const q = query(
        bookingsCollection,
        where('staffId', '==', staffId)
    );

    const snapshot = await getDocs(q);
    const allBookingsForStaff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));

    return allBookingsForStaff.filter(b => {
        return b.bookingTimestamp >= dayStartStr && b.bookingTimestamp <= dayEndStr;
    });
}

export async function addBooking(data: NewBooking) {
    if (USE_DUMMY_DATA) { 
        const newBooking = { ...data, id: `book-${Date.now()}`};
        dummyBookings.push(newBooking);
        revalidatePath('/admin/bookings'); 
        revalidatePath('/my-schedule');
        return; 
    }
    await addDoc(bookingsCollection, {
        ...data,
        createdAt: Timestamp.now(),
    });
    revalidatePath('/admin/bookings');
    revalidatePath('/my-schedule');
}

export async function deleteBooking(id: string) {
    if (USE_DUMMY_DATA) { 
        const index = dummyBookings.findIndex(b => b.id === id);
        if (index > -1) dummyBookings.splice(index, 1);
        revalidatePath('/admin/bookings'); 
        revalidatePath('/my-schedule'); 
        return; 
    }
    const bookingDoc = doc(db, 'bookings', id);
    await deleteDoc(bookingDoc);
    revalidatePath('/admin/bookings');
    revalidatePath('/my-schedule');
}

// Client Loyalty
export async function getClientLoyaltyData(locationId?: string): Promise<ClientLoyalty[]> {
    // This function derives client data from the existing bookings.
    const allBookings = await getBookingsFromFirestore(locationId);
    
    const clientsMap = new Map<string, ClientLoyalty>();

    allBookings.forEach(booking => {
        // Only process bookings with a phone number for loyalty tracking
        if (!booking.clientPhone || booking.clientPhone.trim() === '') {
            return;
        }
        
        const clientIdentifier = `${booking.clientName.toLowerCase().trim()}-${booking.clientPhone.trim()}`;

        if (clientsMap.has(clientIdentifier)) {
            const existingClient = clientsMap.get(clientIdentifier)!;
            existingClient.totalVisits += 1;
            
            if (new Date(booking.bookingTimestamp) > new Date(existingClient.lastVisit)) {
                existingClient.lastVisit = booking.bookingTimestamp;
            }

            if (!existingClient.locations.includes(booking.locationName)) {
                existingClient.locations.push(booking.locationName);
            }

        } else {
             clientsMap.set(clientIdentifier, {
                id: clientIdentifier,
                name: booking.clientName,
                phone: booking.clientPhone,
                email: booking.clientEmail,
                totalVisits: 1,
                lastVisit: booking.bookingTimestamp,
                locations: [booking.locationName],
             });
        }
    });

    // Convert map to array and sort by most visits
    const clientsArray = Array.from(clientsMap.values());
    clientsArray.sort((a, b) => b.totalVisits - a.totalVisits);

    return clientsArray;
}
