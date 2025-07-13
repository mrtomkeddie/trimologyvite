
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query, Timestamp, where, getDoc, setDoc, limit } from 'firebase/firestore';
import type { Location, Service, Staff, Booking, NewBooking, AdminUser, ClientLoyalty } from './types';
import { revalidatePath } from 'next/cache';
import { addDays, startOfDay, endOfDay, subDays, format, isSameDay } from 'date-fns';

const locationsCollection = collection(db, 'locations');
const servicesCollection = collection(db, 'services');
const staffCollection = collection(db, 'staff');
const bookingsCollection = collection(db, 'bookings');
const adminsCollection = collection(db, 'admins');


// Admins
export async function getAdminUser(uid: string, email?: string): Promise<AdminUser | null> {
    const adminDocRef = doc(db, 'admins', uid);
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
        return null;
    }
    
    const adminData = adminDoc.data();
    return {
        id: uid,
        email: adminData.email,
        locationId: adminData.locationId || null, // FIX: Properly handle missing locationId for superadmins
        locationName: adminData.locationName,
    } as AdminUser;
}

export async function getAdminsFromFirestore(locationId?: string): Promise<AdminUser[]> {
    const q = locationId 
        ? query(adminsCollection, where('locationId', '==', locationId))
        : query(adminsCollection);
        
    const snapshot = await getDocs(q);
    const admins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AdminUser));

    // Also get super admins if a locationId is specified, as they manage all locations
    if (locationId) {
        const superAdminQuery = query(adminsCollection, where('locationId', '==', null));
        const superAdminSnapshot = await getDocs(superAdminQuery);
        superAdminSnapshot.forEach(doc => {
            if (!admins.some(a => a.id === doc.id)) {
                admins.push({ id: doc.id, ...doc.data() } as AdminUser);
            }
        });
    }

    admins.sort((a, b) => a.email.localeCompare(b.email));

    return admins;
}

export async function setAdminRecord(uid: string, data: { email: string; locationId: string; locationName: string; }) {
    const adminDoc = doc(db, 'admins', uid);
    await setDoc(adminDoc, data);
    revalidatePath('/admin/admins');
}

export async function updateAdmin(uid: string, data: Partial<Omit<AdminUser, 'id'>>) {
    const adminDoc = doc(db, 'admins', uid);
    await updateDoc(adminDoc, data);
    revalidatePath('/admin/admins');
}

export async function deleteAdmin(uid: string) {
    const adminDoc = doc(db, 'admins', uid);
    await deleteDoc(adminDoc);
    revalidatePath('/admin/admins');
}


// Locations
export async function getLocationsFromFirestore(locationId?: string): Promise<Location[]> {
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
    await addDoc(locationsCollection, data);
    revalidatePath('/admin/locations');
}

export async function updateLocation(id: string, data: Partial<Omit<Location, 'id'>>) {
    const locDoc = doc(db, 'locations', id);
    await updateDoc(locDoc, data);
    revalidatePath('/admin/locations');
}

export async function deleteLocation(id: string) {
    const locDoc = doc(db, 'locations', id);
    await deleteDoc(locDoc);
    revalidatePath('/admin/locations');
}


// Services
export async function getServicesFromFirestore(locationId?: string): Promise<Service[]> {
    const q = locationId 
        ? query(servicesCollection, where('locationId', '==', locationId))
        : query(servicesCollection);

    const snapshot = await getDocs(q);
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
    
    services.sort((a, b) => a.name.localeCompare(b.name));
    
    return services;
}

export async function addService(data: { name: string; duration: number; price: number; locationId: string; locationName: string; }) {
    await addDoc(servicesCollection, data);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

export async function updateService(id: string, data: { name: string; duration: number; price: number; locationId: string; locationName: string; }) {
    const serviceDoc = doc(db, 'services', id);
    await updateDoc(serviceDoc, data);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

export async function deleteService(id: string) {
    const serviceDoc = doc(db, 'services', id);
    await deleteDoc(serviceDoc);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

// Staff
export async function getStaffFromFirestore(locationId?: string): Promise<Staff[]> {
    const q = locationId
        ? query(staffCollection, where('locationId', '==', locationId))
        : query(staffCollection);
    
    const snapshot = await getDocs(q);
    const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));

    staff.sort((a,b) => a.name.localeCompare(b.name));

    return staff;
}

export async function setStaffRecord(uid: string, data: Omit<Staff, 'id'>) {
    const staffDocRef = doc(db, 'staff', uid);
    await setDoc(staffDocRef, data);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function updateStaff(uid: string, data: Partial<Omit<Staff, 'id'>>) {
    const staffDoc = doc(db, 'staff', uid);
    await updateDoc(staffDoc, data);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function deleteStaff(uid: string) {
    const staffDoc = doc(db, 'staff', uid);
    await deleteDoc(staffDoc);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function getStaffByUid(uid: string): Promise<Staff | null> {
    const staffDocRef = doc(db, 'staff', uid);
    const staffDoc = await getDoc(staffDocRef);

    if (!staffDoc.exists()) {
        const q = query(staffCollection, where('email', '==', uid), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc_1 = snapshot.docs[0];
        return { id: doc_1.id, ...doc_1.data() } as Staff;
    }
    
    return { id: staffDoc.id, ...staffDoc.data() } as Staff;
}


// Bookings
export async function getBookingsFromFirestore(locationId?: string): Promise<Booking[]> {
     const now = new Date().toISOString();
    let q;

    if (locationId) {
        q = query(
            bookingsCollection,
            where('locationId', '==', locationId),
            where('bookingTimestamp', '>=', now),
            orderBy('bookingTimestamp', 'asc')
        );
    } else {
        q = query(
            bookingsCollection, 
            where('bookingTimestamp', '>=', now), 
            orderBy('bookingTimestamp', 'asc')
        );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Booking));
}

export async function getBookingsByPhoneFromFirestore(phone: string): Promise<Booking[]> {
    const q = query(bookingsCollection, where('clientPhone', '==', phone), orderBy('bookingTimestamp', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const { createdAt, ...rest } = data;
        return {
            id: doc.id,
            ...rest
        } as Booking;
    });
}

export async function getBookingsByStaffId(staffId: string): Promise<Booking[]> {
    const nowString = new Date().toISOString();
    
    const q = query(bookingsCollection, 
        where('staffId', '==', staffId), 
        where('bookingTimestamp', '>=', nowString),
        orderBy('bookingTimestamp', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const { createdAt, ...data } = doc.data();
        return {
            id: doc.id,
            ...data
        } as Booking;
    });
}

export async function getBookingsForStaffOnDate(staffId: string, date: Date): Promise<Booking[]> {
    const dayStartStr = startOfDay(date).toISOString();
    const dayEndStr = endOfDay(date).toISOString();
    
    const q = query(bookingsCollection, 
        where('staffId', '==', staffId),
        where('bookingTimestamp', '>=', dayStartStr),
        where('bookingTimestamp', '<=', dayEndStr)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const { createdAt, ...data } = doc.data();
        return {
            id: doc.id,
            ...data
        } as Booking;
    });
}

export async function getBookingsForStaffInRange(staffIds: string[], startDate: Date, endDate: Date): Promise<Booking[]> {
    if (staffIds.length === 0) return [];
    
    const q = query(bookingsCollection, 
        where('staffId', 'in', staffIds),
        where('bookingTimestamp', '>=', startDate.toISOString()),
        where('bookingTimestamp', '<=', endDate.toISOString())
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
}


export async function addBooking(data: NewBooking) {
    await addDoc(bookingsCollection, {
        ...data,
        createdAt: Timestamp.now(),
    });
    revalidatePath('/admin/bookings', 'layout');
    revalidatePath('/my-schedule');
}

export async function deleteBooking(id: string) {
    const bookingDoc = doc(db, 'bookings', id);
    await deleteDoc(bookingDoc);
    revalidatePath('/admin/bookings', 'layout');
    revalidatePath('/my-schedule');
}

// Client Loyalty
export async function getClientLoyaltyData(locationId?: string): Promise<ClientLoyalty[]> {
    const q = locationId 
        ? query(bookingsCollection, where('locationId', '==', locationId))
        : query(bookingsCollection);

    const snapshot = await getDocs(q);
    const allBookings = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Booking));
    
    const clientsMap = new Map<string, ClientLoyalty>();

    allBookings.forEach(booking => {
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

    const clientsArray = Array.from(clientsMap.values());
    clientsArray.sort((a, b) => b.totalVisits - a.totalVisits);

    return clientsArray;
}
