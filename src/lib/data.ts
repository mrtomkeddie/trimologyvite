
import type { Service, Staff, Location } from './types';
import { getLocationsFromFirestore, getServicesFromFirestore, getStaffFromFirestore } from './firestore';

// In a real application, this data would be fetched from your Firestore database.
// For demonstration purposes, we're using a mock dataset for some parts.

export async function getLocations(): Promise<Location[]> {
  // Data is now fetched from Firestore
  return await getLocationsFromFirestore();
}

export async function getServices(): Promise<Service[]> {
  // Data is now fetched from Firestore
  return await getServicesFromFirestore();
}

export async function getStaff(): Promise<Staff[]> {
  // Data is now fetched from Firestore
  return await getStaffFromFirestore();
}
