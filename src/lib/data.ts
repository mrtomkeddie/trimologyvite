import type { Service, Staff } from './types';

// In a real application, this data would be fetched from your Firestore database.
// For demonstration purposes, we're using a mock dataset.

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Classic Haircut', duration: 45, price: 50 },
  { id: '2', name: 'Beard Trim & Shape-up', duration: 30, price: 35 },
  { id: '3', name: 'Hot Towel Shave', duration: 45, price: 45 },
  { id: '4', name: 'Fade & Taper', duration: 60, price: 60 },
  { id: '5', name: 'Hair Color/Gray Blending', duration: 90, price: 100 },
  { id: '6', name: 'The Full Service (Cut & Shave)', duration: 90, price: 90 },
];

const MOCK_STAFF: Staff[] = [
  { id: '1', name: 'Alex "The Razor" Johnson', specialization: 'Master Barber' },
  { id: '2', name: 'Ben Carter', specialization: 'Fades & Modern Styles' },
  { id: '3', name: 'Samantha "Sam" Reed', specialization: 'Classic Cuts & Shaves' },
  { id: '4', name: 'Mikey "The Detailer" Chen', specialization: 'Beard Specialist' },
];

export async function getServices(): Promise<Service[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_SERVICES;
}

export async function getStaff(): Promise<Staff[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_STAFF;
}
