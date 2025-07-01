import type { Service, Staff } from './types';

// In a real application, this data would be fetched from your Firestore database.
// For demonstration purposes, we're using a mock dataset.

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Haircut & Style', duration: 60, price: 75 },
  { id: '2', name: 'Manicure', duration: 45, price: 40 },
  { id: '3', name: 'Pedicure', duration: 50, price: 55 },
  { id: '4', name: 'Full Color & Treatment', duration: 150, price: 180 },
  { id: '5', name: 'Rejuvenating Facial', duration: 75, price: 95 },
  { id: '6', name: 'Swedish Massage', duration: 60, price: 100 },
];

const MOCK_STAFF: Staff[] = [
  { id: '1', name: 'Jessica', specialization: 'Hair Stylist' },
  { id: '2', name: 'Emily', specialization: 'Nail Technician' },
  { id: '3', name: 'Sarah', specialization: 'Esthetician & Stylist' },
  { id: '4', name: 'Maria', specialization: 'Massage Therapist' },
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
