import type { 
  Location, 
  Service, 
  Staff, 
  Booking, 
  AdminUser, 
  ClientLoyalty, 
  NewBooking 
} from './types';
import { 
  DUMMY_LOCATIONS, 
  DUMMY_SERVICES, 
  DUMMY_STAFF, 
  DUMMY_BOOKINGS, 
  DUMMY_ADMIN_USERS, 
  DUMMY_CLIENTS 
} from './dummy-data';

// Simulate async operations with delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique IDs
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// In-memory storage
let locations = [...DUMMY_LOCATIONS];
let services = [...DUMMY_SERVICES];
let staff = [...DUMMY_STAFF];
let bookings = [...DUMMY_BOOKINGS];
let adminUsers = [...DUMMY_ADMIN_USERS];
let clients = [...DUMMY_CLIENTS];

// Location functions
export async function getLocations(locationId?: string): Promise<Location[]> {
  await delay(300);
  if (locationId) {
    return locations.filter(l => l.id === locationId);
  }
  return [...locations];
}

export async function addLocation(data: Omit<Location, 'id'>): Promise<void> {
  await delay(500);
  const newLocation: Location = {
    ...data,
    id: generateId(),
  };
  locations.push(newLocation);
}

export async function updateLocation(id: string, data: Partial<Location>): Promise<void> {
  await delay(500);
  const index = locations.findIndex(l => l.id === id);
  if (index !== -1) {
    locations[index] = { ...locations[index], ...data };
  }
}

export async function deleteLocation(id: string): Promise<void> {
  await delay(500);
  locations = locations.filter(l => l.id !== id);
}

// Service functions
export async function getServices(locationId?: string): Promise<Service[]> {
  await delay(300);
  if (locationId) {
    return services.filter(s => s.locationId === locationId);
  }
  return [...services];
}

export async function addService(data: Omit<Service, 'id'>): Promise<void> {
  await delay(500);
  const newService: Service = {
    ...data,
    id: generateId(),
  };
  services.push(newService);
}

export async function updateService(id: string, data: Partial<Service>): Promise<void> {
  await delay(500);
  const index = services.findIndex(s => s.id === id);
  if (index !== -1) {
    services[index] = { ...services[index], ...data };
  }
}

export async function deleteService(id: string): Promise<void> {
  await delay(500);
  services = services.filter(s => s.id !== id);
}

// Staff functions
export async function getStaff(locationId?: string): Promise<Staff[]> {
  await delay(300);
  if (locationId) {
    return staff.filter(s => s.locationId === locationId);
  }
  return [...staff];
}

export async function getStaffByUserId(userId: string): Promise<Staff | null> {
  await delay(300);
  return staff.find(s => s.userId === userId) || null;
}

export async function addStaff(data: Staff): Promise<void> {
  await delay(500);
  staff.push(data);
}

export async function updateStaff(id: string, data: Partial<Staff>): Promise<void> {
  await delay(500);
  const index = staff.findIndex(s => s.id === id);
  if (index !== -1) {
    staff[index] = { ...staff[index], ...data };
  }
}

export async function deleteStaff(id: string): Promise<void> {
  await delay(500);
  staff = staff.filter(s => s.id !== id);
}

// Booking functions
export async function getBookings(locationId?: string): Promise<Booking[]> {
  await delay(300);
  if (locationId) {
    return bookings.filter(b => b.locationId === locationId);
  }
  return [...bookings].sort((a, b) => 
    new Date(a.bookingTimestamp).getTime() - new Date(b.bookingTimestamp).getTime()
  );
}

export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
  await delay(300);
  return bookings.filter(b => b.clientPhone === phone);
}

export async function getBookingsByStaffId(staffId: string): Promise<Booking[]> {
  await delay(300);
  return bookings.filter(b => b.staffId === staffId);
}

export async function createBooking(data: any): Promise<void> {
  await delay(500);
  
  const location = locations.find(l => l.id === data.locationId);
  const service = services.find(s => s.id === data.serviceId);
  let selectedStaff = staff.find(s => s.id === data.staffId);
  
  if (!location || !service) {
    throw new Error('Invalid location or service');
  }

  // If "any" staff selected, pick the first available one
  if (data.staffId === 'any' || !selectedStaff) {
    selectedStaff = staff.find(s => s.locationId === data.locationId) || staff[0];
  }

  if (!selectedStaff) {
    throw new Error('No staff available');
  }

  // Create booking timestamp
  const bookingDate = new Date(data.date);
  const [hours, minutes] = data.time.split(':');
  bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const newBooking: Booking = {
    id: generateId(),
    locationId: location.id,
    locationName: location.name,
    serviceId: service.id,
    serviceName: service.name,
    servicePrice: service.price,
    serviceDuration: service.duration,
    staffId: selectedStaff.id,
    staffName: selectedStaff.name,
    staffImageUrl: selectedStaff.imageUrl || '',
    bookingTimestamp: bookingDate.toISOString(),
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    clientEmail: data.clientEmail,
  };

  bookings.push(newBooking);
}

export async function deleteBooking(id: string): Promise<void> {
  await delay(500);
  bookings = bookings.filter(b => b.id !== id);
}

// Time availability functions
export async function getSuggestedTimes(
  duration: number,
  date: string,
  staffId: string,
  locationId: string
): Promise<{ success: boolean; times?: string[] }> {
  await delay(500);
  
  // Generate some dummy available times
  const times = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];
  
  return { success: true, times };
}

export async function getUnavailableDays(
  month: Date,
  serviceId: string,
  staffId: string,
  locationId: string
): Promise<{ success: boolean; unavailableDays?: string[] }> {
  await delay(300);
  
  // Return some dummy unavailable days (weekends for example)
  const unavailableDays: string[] = [];
  const year = month.getFullYear();
  const monthNum = month.getMonth();
  
  // Make Sundays unavailable as an example
  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, monthNum, day);
    if (date.getMonth() === monthNum && date.getDay() === 0) { // Sunday
      unavailableDays.push(date.toISOString().split('T')[0]);
    }
  }
  
  return { success: true, unavailableDays };
}

// Admin functions
export async function getAdminUser(userId: string, email: string): Promise<AdminUser | null> {
  await delay(300);
  return adminUsers.find(a => a.email === email) || null;
}

export async function getAdmins(locationId?: string): Promise<AdminUser[]> {
  await delay(300);
  if (locationId) {
    return adminUsers.filter(a => a.locationId === locationId);
  }
  return [...adminUsers];
}

export async function setAdminRecord(userId: string, data: Partial<AdminUser>): Promise<void> {
  await delay(500);
  const newAdmin: AdminUser = {
    id: userId,
    userId,
    email: data.email!,
    locationId: data.locationId,
    locationName: data.locationName,
  };
  adminUsers.push(newAdmin);
}

export async function updateAdmin(id: string, data: Partial<AdminUser>): Promise<void> {
  await delay(500);
  const index = adminUsers.findIndex(a => a.id === id);
  if (index !== -1) {
    adminUsers[index] = { ...adminUsers[index], ...data };
  }
}

export async function deleteAdmin(id: string): Promise<void> {
  await delay(500);
  adminUsers = adminUsers.filter(a => a.id !== id);
}

// Client loyalty functions
export async function getClientLoyaltyData(locationId?: string): Promise<ClientLoyalty[]> {
  await delay(300);
  if (locationId) {
    const location = locations.find(l => l.id === locationId);
    if (location) {
      return clients.filter(c => c.locations.includes(location.name));
    }
  }
  return [...clients];
}