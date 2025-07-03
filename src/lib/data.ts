
import type { Service, Staff, Location } from './types';
import { getLocationsFromFirestore, getServicesFromFirestore } from './firestore';

// In a real application, this data would be fetched from your Firestore database.
// For demonstration purposes, we're using a mock dataset for some parts.

const MOCK_STAFF: Staff[] = [
  { id: '1', name: 'Alex "The Razor" Johnson', specialization: 'Master Barber' },
  { id: '2', name: 'Ben Carter', specialization: 'Fades & Modern Styles' },
  { id: '3', name: 'Samantha "Sam" Reed', specialization: 'Classic Cuts & Shaves' },
  { id: '4', name: 'Mikey "The Detailer" Chen', specialization: 'Beard Specialist' },
];

export async function getLocations(): Promise<Location[]> {
  // Data is now fetched from Firestore
  return await getLocationsFromFirestore();
}

export async function getServices(): Promise<Service[]> {
  // Data is now fetched from Firestore
  return await getServicesFromFirestore();
}

export async function getStaff(): Promise<Staff[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 250));
  return MOCK_STAFF;
}
