
'use server';

import { db } from './firebase';
import { adminDb } from './firebase-admin';
import { collection, getDocs as getDocsClient, addDoc, doc, updateDoc, deleteDoc, orderBy, query, Timestamp, where, getDoc, setDoc, limit } from 'firebase/firestore';
import type { Location, Service, Staff, Booking, NewBooking, AdminUser, ClientLoyalty } from './types';
import { revalidatePath } from 'next/cache';
import { addDays, startOfDay, endOfDay, subDays, format, isSameDay } from 'date-fns';

const locationsCollection = collection(adminDb, 'locations');
const servicesCollection = collection(adminDb, 'services');
const staffCollection = collection(adminDb, 'staff');
const bookingsCollection = collection(adminDb, 'bookings');
const adminsCollection = collection(adminDb, 'admins');

// Admins
export async function getAdminUser(uid: string, email?: string): Promise<AdminUser | null> {
    const adminDocRef = adminDb.collection('admins').doc(uid);
    const adminDoc = await adminDocRef.get();

    if (!adminDoc.exists) {
        return null;
    }
    
    const adminData = adminDoc.data();
    return {
        id: uid,
        email: adminData?.email,
        locationId: adminData?.locationId || null,
        locationName: adminData?.locationName,
    } as AdminUser;
}

export async function getAdminsFromFirestore(locationId?: string): Promise<AdminUser[]> {
    let querySnapshot;
    if (locationId) {
        const superAdminQuery = adminsCollection.where('locationId', '==', null);
        const branchAdminQuery = adminsCollection.where('locationId', '==', locationId);
        const [superAdmins, branchAdmins] = await Promise.all([superAdminQuery.get(), branchAdminQuery.get()]);
        querySnapshot = { docs: [...superAdmins.docs, ...branchAdmins.docs] };
    } else {
        querySnapshot = await adminsCollection.get();
    }
    
    const admins = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AdminUser));

    admins.sort((a, b) => a.email.localeCompare(b.email));

    return admins;
}

export async function setAdminRecord(uid: string, data: { email: string; locationId: string; locationName: string; }) {
    await adminsCollection.doc(uid).set(data);
    revalidatePath('/admin/admins');
}

export async function updateAdmin(uid: string, data: Partial<Omit<AdminUser, 'id'>>) {
    await adminsCollection.doc(uid).update(data);
    revalidatePath('/admin/admins');
}

export async function deleteAdmin(uid: string) {
    await adminsCollection.doc(uid).delete();
    revalidatePath('/admin/admins');
}


// Locations
export async function getLocationsFromFirestore(locationId?: string): Promise<Location[]> {
    if (locationId) {
        const docRef = await locationsCollection.doc(locationId).get();
        return docRef.exists ? [{ id: docRef.id, ...docRef.data() } as Location] : [];
    }
    const q = locationsCollection.orderBy('name');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
}

export async function addLocation(data: Omit<Location, 'id'>) {
    await addDoc(collection(db, 'locations'), data); // Use client SDK for user-initiated writes
    revalidatePath('/admin/locations');
}

export async function updateLocation(id: string, data: Partial<Omit<Location, 'id'>>) {
    await updateDoc(doc(db, 'locations', id), data);
    revalidatePath('/admin/locations');
}

export async function deleteLocation(id: string) {
    await deleteDoc(doc(db, 'locations', id));
    revalidatePath('/admin/locations');
}


// Services
export async function getServicesFromFirestore(locationId?: string): Promise<Service[]> {
    let q = servicesCollection.orderBy('name');
    if (locationId) {
        q = q.where('locationId', '==', locationId);
    }
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
}

export async function addService(data: { name: string; duration: number; price: number; locationId: string; locationName: string; }) {
    await addDoc(collection(db, 'services'), data);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

export async function updateService(id: string, data: { name: string; duration: number; price: number; locationId: string; locationName: string; }) {
    await updateDoc(doc(db, 'services', id), data);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

export async function deleteService(id: string) {
    await deleteDoc(doc(db, 'services', id));
    revalidatePath('/admin/services');
    revalidatePath('/');
}

// Staff
export async function getStaffFromFirestore(locationId?: string): Promise<Staff[]> {
    let q = staffCollection.orderBy('name');
    if (locationId) {
        q = q.where('locationId', '==', locationId);
    }
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
}

export async function setStaffRecord(uid: string, data: Omit<Staff, 'id'>) {
    await setDoc(doc(db, 'staff', uid), data);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function updateStaff(uid: string, data: Partial<Omit<Staff, 'id'>>) {
    await updateDoc(doc(db, 'staff', uid), data);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function deleteStaff(uid: string) {
    await deleteDoc(doc(db, 'staff', uid));
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function getStaffByUid(uid: string): Promise<Staff | null> {
    const staffDoc = await staffCollection.doc(uid).get();
    if (!staffDoc.exists) {
        return null;
    }
    return { id: staffDoc.id, ...staffDoc.data() } as Staff;
}


// Bookings
export async function getBookingsFromFirestore(locationId?: string): Promise<Booking[]> {
     const now = new Date().toISOString();
    let q: admin.firestore.Query<admin.firestore.DocumentData>;

    if (locationId) {
        q = bookingsCollection
            .where('locationId', '==', locationId)
            .where('bookingTimestamp', '>=', now)
            .orderBy('bookingTimestamp', 'asc');
    } else {
        q = bookingsCollection
            .where('bookingTimestamp', '>=', now)
            .orderBy('bookingTimestamp', 'asc');
    }
    
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Booking));
}

export async function getBookingsByPhoneFromFirestore(phone: string): Promise<Booking[]> {
    const q = query(collection(db, 'bookings'), where('clientPhone', '==', phone), orderBy('bookingTimestamp', 'desc'));

    const snapshot = await getDocsClient(q);
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
    
    const q = query(collection(db, 'bookings'), 
        where('staffId', '==', staffId), 
        where('bookingTimestamp', '>=', nowString),
        orderBy('bookingTimestamp', 'asc')
    );
    
    const snapshot = await getDocsClient(q);
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
    
    const q = bookingsCollection
        .where('staffId', '==', staffId)
        .where('bookingTimestamp', '>=', dayStartStr)
        .where('bookingTimestamp', '<=', dayEndStr);

    const snapshot = await q.get();
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
    
    const q = bookingsCollection
        .where('staffId', 'in', staffIds)
        .where('bookingTimestamp', '>=', startDate.toISOString())
        .where('bookingTimestamp', '<=', endDate.toISOString());

    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
}


export async function addBooking(data: NewBooking) {
    await addDoc(collection(db, 'bookings'), { // Use client SDK for this public action
        ...data,
        createdAt: Timestamp.now(),
    });
    revalidatePath('/admin/bookings', 'layout');
    revalidatePath('/my-schedule');
}

export async function deleteBooking(id: string) {
    await deleteDoc(doc(db, 'bookings', id)); // Use client SDK for admin-initiated action
    revalidatePath('/admin/bookings', 'layout');
    revalidatePath('/my-schedule');
}

// Client Loyalty
export async function getClientLoyaltyData(locationId?: string): Promise<ClientLoyalty[]> {
    let q = bookingsCollection;
    let snapshot;

    if (locationId) {
        snapshot = await q.where('locationId', '==', locationId).get();
    } else {
        snapshot = await q.get();
    }

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
