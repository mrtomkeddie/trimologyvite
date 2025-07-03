import type { Service, Staff, Location } from './types';

// In a real application, this data would be fetched from your Firestore database.
// For demonstration purposes, we're using a mock dataset.

const MOCK_LOCATIONS: Location[] = [
    { id: '1', name: 'Downtown Barber Co.', address: '123 Main St, Barberville' },
    { id: '2', name: 'Uptown Clips', address: '456 Oak Ave, Barberville' },
    { id: '3', name: 'Eastside Fades', address: '789 Pine Ln, Barberville' },
    { id: '4', name: 'West End Shaves', address: '101 Maple Dr, Barberville' },
    { id: '5', name: 'The Northern Trim', address: '212 Birch Rd, Barberville' },
    { id: '6', name: 'Southern Style Cuts', address: '333 Elm St, Barberville' },
    { id: '7', name: 'Riverfront Razors', address: '444 River Walk, Barberville' },
    { id: '8', name: 'Hilltop Hair', address: '555 Hilltop Circle, Barberville' },
    { id: '9', name: 'The Valley Trimshop', address: '666 Valley View, Barberville' },
    { id: '10', name: 'Ocean Breeze Barbers', address: '777 Coastline Hwy, Barberville' },
    { id: '11', name: 'Metro Grooming', address: '888 Metro Plaza, Barberville' },
    { id: '12', name: 'Suburban Shears', address: '999 Suburbia Ct, Barberville' },
    { id: '13', name: 'Airport Barber', address: '1 Terminal Rd, Barberville' },
];

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

export async function getLocations(): Promise<Location[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 250));
  return MOCK_LOCATIONS;
}

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
