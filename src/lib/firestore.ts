
'use server';

import { db } from './firebase';
import { adminDb } from './firebase-admin';
import { collection, getDocs as getDocsClient, addDoc, doc, updateDoc, deleteDoc, orderBy, query, Timestamp, where, getDoc, setDoc, limit } from 'firebase/firestore';
import type { Location, Service, Staff, Booking, NewBooking, AdminUser, ClientLoyalty } from './types';
import { revalidatePath } from 'next/cache';
import { addDays, startOfDay, endOfDay, subDays, format, isSameDay } from 'date-fns';
import type { Query } from 'firebase-admin/firestore';


// Admins
export async function getAdminUser(uid: string, email: string): Promise<AdminUser | null> {
    const adminDocRef = adminDb.collection('admins').doc(uid);
    const adminDoc = await adminDocRef.get();

    if (!adminDoc.exists) {
        // Fallback for demo: if user email is in dummy data, but UID doesn't match, create a record
        const { DUMMY_ADMIN_USERS } = await import('@/lib/data');
        const dummyUser = DUMMY_ADMIN_USERS.find(u => u.email === email);
        if (dummyUser) {
            const adminData = {
                email: dummyUser.email,
                locationId: dummyUser.locationId || null,
                locationName: dummyUser.locationName || 'All Locations',
            };
            await adminDocRef.set(adminData);
             return { id: uid, ...adminData } as AdminUser;
        }
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
    // Super-admins can see all other admins
    if (!locationId) {
         querySnapshot = await adminDb.collection('admins').get();
    } else {
    // Branch admins can only see other admins at their location
        querySnapshot = await adminDb.collection('admins').where('locationId', '==', locationId).get();
    }
    
    const admins = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AdminUser));

    admins.sort((a, b) => {
        if (!a.locationId) return -1; // Super admin on top
        if (!b.locationId) return 1;
        return a.email.localeCompare(b.email);
    });

    return admins;
}

export async function setAdminRecord(uid: string, data: { email: string; locationId: string; locationName: string; }) {
    await adminDb.collection('admins').doc(uid).set(data);
    revalidatePath('/admin/admins');
}

export async function updateAdmin(uid: string, data: Partial<Omit<AdminUser, 'id'>>) {
    await adminDb.collection('admins').doc(uid).update(data);
    revalidatePath('/admin/admins');
}

export async function deleteAdmin(uid: string) {
    await adminDb.collection('admins').doc(uid).delete();
    revalidatePath('/admin/admins');
}


// Locations
export async function getLocationsFromFirestore(locationId?: string): Promise<Location[]> {
    const locationsCollection = adminDb.collection('locations');
    if (locationId) {
        const docRef = await locationsCollection.doc(locationId).get();
        return docRef.exists ? [{ id: docRef.id, ...docRef.data() } as Location] : [];
    }
    const q = locationsCollection.orderBy('name');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
}

export async function addLocation(data: Omit<Location, 'id'>) {
    await addDoc(collection(db, 'locations'), data);
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
    const servicesCollection = adminDb.collection('services');
    let q: Query = servicesCollection;
    if (locationId) {
        q = q.where('locationId', '==', locationId);
    }
    const snapshot = await q.orderBy('name').get();
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
    const staffCollection = adminDb.collection('staff');
    let q: Query = staffCollection;
    if (locationId) {
        q = q.where('locationId', '==', locationId);
    }
    const snapshot = await q.orderBy('name').get();
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
    const staffDoc = await adminDb.collection('staff').doc(uid).get();
    if (!staffDoc.exists) {
        const { DUMMY_STAFF } = await import('@/lib/data');
        const staffMember = DUMMY_STAFF.find(s => s.id === uid);
        if (staffMember) {
            await adminDb.collection('staff').doc(uid).set(staffMember);
            return staffMember;
        }
        return null;
    }
    return { id: staffDoc.id, ...staffDoc.data() } as Staff;
}


// Bookings
export async function getBookingsFromFirestore(locationId?: string): Promise<Booking[]> {
     const now = new Date().toISOString();
    const bookingsCollection = adminDb.collection('bookings');
    let q: Query;

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
    const serverData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    
    // For demo purposes, merge with dummy data
    const { DUMMY_BOOKINGS } = await import('@/lib/data');
    const upcomingDummyBookings = DUMMY_BOOKINGS.filter(b => new Date(b.bookingTimestamp) >= new Date());
    
    const combined = [...serverData, ...upcomingDummyBookings];
    const uniqueBookings = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    if (locationId) {
        return uniqueBookings.filter(b => b.locationId === locationId);
    }
    
    return uniqueBookings.sort((a,b) => new Date(a.bookingTimestamp).getTime() - new Date(b.bookingTimestamp).getTime());
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
    
    const q = adminDb.collection('bookings')
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
    
    const q = adminDb.collection('bookings')
        .where('staffId', 'in', staffIds)
        .where('bookingTimestamp', '>=', startDate.toISOString())
        .where('bookingTimestamp', '<=', endDate.toISOString());

    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
}


export async function addBooking(data: NewBooking) {
    await addDoc(collection(db, 'bookings'), { 
        ...data,
        createdAt: Timestamp.now(),
    });
    revalidatePath('/admin/bookings', 'layout');
    revalidatePath('/my-schedule');
}

export async function deleteBooking(id: string) {
    await deleteDoc(doc(db, 'bookings', id));
    revalidatePath('/admin/bookings', 'layout');
    revalidatePath('/my-schedule');
}

// Client Loyalty
export async function getClientLoyaltyData(locationId?: string): Promise<ClientLoyalty[]> {
    let q: Query = adminDb.collection('bookings');
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
     // For demo purposes, add dummy data
    const { DUMMY_CLIENTS } = await import('@/lib/data');
    DUMMY_CLIENTS.forEach(client => {
        const clientIdentifier = `${client.name.toLowerCase().trim()}-${client.phone.trim()}`;
        if (!clientsMap.has(clientIdentifier)) {
            clientsMap.set(clientIdentifier, client);
        }
    });


    const clientsArray = Array.from(clientsMap.values());
    clientsArray.sort((a, b) => b.totalVisits - a.totalVisits);

    return clientsArray;
}
