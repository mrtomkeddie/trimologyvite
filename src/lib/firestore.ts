
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import type { Location, Service, Staff } from './types';
import { revalidatePath } from 'next/cache';

const locationsCollection = collection(db, 'locations');
const servicesCollection = collection(db, 'services');
const staffCollection = collection(db, 'staff');

// Locations
export async function getLocationsFromFirestore(): Promise<Location[]> {
    const q = query(locationsCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
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
export async function getServicesFromFirestore(): Promise<Service[]> {
    const q = query(servicesCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
}

export async function addService(data: { name: string; duration: number; price: number; }) {
    await addDoc(servicesCollection, data);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

export async function updateService(id: string, data: { name: string; duration: number; price: number; }) {
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
export async function getStaffFromFirestore(): Promise<Staff[]> {
    const q = query(staffCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
}

export async function addStaff(data: { name: string; specialization: string; }) {
    await addDoc(staffCollection, data);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function updateStaff(id: string, data: { name: string; specialization: string; }) {
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
