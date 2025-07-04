
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query, Timestamp, where, getDoc } from 'firebase/firestore';
import type { Location, Service, Staff, Booking, NewBooking, AdminUser } from './types';
import { revalidatePath } from 'next/cache';

const locationsCollection = collection(db, 'locations');
const servicesCollection = collection(db, 'services');
const staffCollection = collection(db, 'staff');
const bookingsCollection = collection(db, 'bookings');
const adminsCollection = collection(db, 'admins');

// Admins
export async function getAdminUser(uid: string): Promise<AdminUser | null> {
    const adminDocRef = doc(db, 'admins', uid);
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
        return null;
    }
    
    const adminData = adminDoc.data();
    return {
        uid,
        email: adminData.email,
        locationId: adminData.locationId,
        locationName: adminData.locationName,
    } as AdminUser;
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

export async function addLocation(data: { name: string; address: string; phone?: string; email?: string; }) {
    await addDoc(locationsCollection, data);
    revalidatePath('/admin/locations');
    revalidatePath('/');
}

export async function updateLocation(id: string, data: { name: string; address: string; phone?: string; email?: string; }) {
    const locationDoc = doc(db, 'locations', id);
    await updateDoc(locationDoc, data);
    revalidatePath('/admin/locations');
    revalidatePath('/');
}

export async function deleteLocation(id: string) {
    const locationDoc = doc(db, 'locations', id);
    await deleteDoc(locationDoc);
    revalidatePath('/admin/locations');
    revalidatePath('/');
}

// Services
export async function getServicesFromFirestore(locationId?: string): Promise<Service[]> {
    const q = locationId 
        ? query(servicesCollection, where('locationId', '==', locationId), orderBy('name'))
        : query(servicesCollection, orderBy('name'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
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
        ? query(staffCollection, where('locationId', '==', locationId), orderBy('name'))
        : query(staffCollection, orderBy('name'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
}

export async function addStaff(data: { name: string; specialization: string; locationId: string; locationName: string; }) {
    await addDoc(staffCollection, data);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function updateStaff(id: string, data: { name: string; specialization: string; locationId: string; locationName: string; }) {
    const staffDoc = doc(db, 'staff', id);
    await updateDoc(staffDoc, data);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function deleteStaff(id: string) {
    const staffDoc = doc(db, 'staff', id);
    await deleteDoc(staffDoc);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

// Bookings
export async function getBookingsFromFirestore(locationId?: string): Promise<Booking[]> {
     const q = locationId
        ? query(bookingsCollection, where('locationId', '==', locationId), orderBy('bookingTimestamp', 'desc'))
        : query(bookingsCollection, orderBy('bookingTimestamp', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            bookingTimestamp: data.bookingTimestamp,
        } as Booking;
    });
}

export async function addBooking(data: NewBooking) {
    await addDoc(bookingsCollection, {
        ...data,
        createdAt: Timestamp.now(),
    });
    revalidatePath('/admin/bookings');
}

export async function deleteBooking(id: string) {
    const bookingDoc = doc(db, 'bookings', id);
    await deleteDoc(bookingDoc);
    revalidatePath('/admin/bookings');
}
