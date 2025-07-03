'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import type { Location } from './types';
import { revalidatePath } from 'next/cache';

const locationsCollection = collection(db, 'locations');

export async function getLocationsFromFirestore(): Promise<Location[]> {
    const q = query(locationsCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        // If there are no locations in Firestore, you can return an empty array
        // or add the initial mock data to Firestore for the user.
        // For now, we'll return empty.
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
