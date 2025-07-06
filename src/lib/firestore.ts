
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query, Timestamp, where, getDoc, setDoc, limit } from 'firebase/firestore';
import type { Location, Service, Staff, Booking, NewBooking, AdminUser, ClientLoyalty } from './types';
import { revalidatePath } from 'next/cache';
import { addDays, startOfDay, endOfDay, subDays } from 'date-fns';

// --- DUMMY DATA SWITCH ---
// Change this to 'false' to use your live Firestore database.
const USE_DUMMY_DATA = true;

// --- DUMMY DATA DEFINITIONS ---

const dummyLocations: Location[] = [
    { id: 'downtown-1', name: 'Downtown Barbers', address: '123 Main St, Barberville', phone: '555-0101', email: 'contact@downtown.com' },
    { id: 'uptown-2', name: 'Uptown Cuts', address: '456 High St, Styletown', phone: '555-0102', email: 'hello@uptown.com' },
    { id: 'soho-3', name: 'Soho Salon', address: '10 Fashion Ave, London', phone: '555-0103', email: 'contact@sohosalon.com' },
];

const dummyServices: Service[] = [
    { id: 'svc-1', name: 'Classic Haircut', duration: 30, price: 25, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-2', name: 'Beard Trim', duration: 15, price: 15, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-3', name: 'Hot Towel Shave', duration: 45, price: 40, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-6', name: 'Modern Fade', duration: 45, price: 35, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-4', name: 'Kids Cut', duration: 30, price: 20, locationId: 'uptown-2', locationName: 'Uptown Cuts' },
    { id: 'svc-5', name: 'Color & Cut', duration: 120, price: 90, locationId: 'uptown-2', locationName: 'Uptown Cuts' },
    { id: 'svc-7', name: 'Luxury Manicure', duration: 60, price: 50, locationId: 'uptown-2', locationName: 'Uptown Cuts' },
    { id: 'svc-8', name: 'Creative Color', duration: 180, price: 150, locationId: 'soho-3', locationName: 'Soho Salon' },
    { id: 'svc-9', name: 'Signature Cut', duration: 60, price: 75, locationId: 'soho-3', locationName: 'Soho Salon' },
];

const defaultWorkingHours = {
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '17:00' },
    saturday: { start: '10:00', end: '16:00' },
    sunday: 'off' as const,
};

const dummyStaff: Staff[] = [
    { id: 'staff-1', name: 'Alex Smith', specialization: 'Master Barber', locationId: 'downtown-1', locationName: 'Downtown Barbers', uid: 'staff-uid-alex', email: 'alex@trimology.com', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: defaultWorkingHours },
    { id: 'staff-2', name: 'Maria Garcia', specialization: 'Senior Stylist', locationId: 'downtown-1', locationName: 'Downtown Barbers', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: { ...defaultWorkingHours, wednesday: 'off' } },
    { id: 'staff-6', name: 'Laura Palmer', specialization: 'Stylist', locationId: 'downtown-1', locationName: 'Downtown Barbers', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: defaultWorkingHours },
    { id: 'staff-3', name: 'John Doe', specialization: '', locationId: 'uptown-2', locationName: 'Uptown Cuts', imageUrl: 'https://placehold.co/100x100.png', isBookable: false },
    { id: 'staff-4', name: 'Jane Roe', specialization: 'Color Specialist', locationId: 'uptown-2', locationName: 'Uptown Cuts', uid: 'staff-uid-jane', email: 'jane@trimology.com', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: { ...defaultWorkingHours, saturday: 'off', sunday: 'off' } },
    { id: 'staff-5', name: 'Casey Jones', specialization: 'Hair Artist', locationId: 'soho-3', locationName: 'Soho Salon', uid: 'staff-uid-casey', email: 'casey@trimology.com', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: defaultWorkingHours },
    { id: 'staff-7', name: 'Demo Staff', specialization: 'Stylist', locationId: 'downtown-1', locationName: 'Downtown Barbers', uid: 'staff@trimology.com', email: 'staff@trimology.com', imageUrl: 'https://placehold.co/100x100.png', isBookable: true, workingHours: defaultWorkingHours },
];

const dummyBookings: Booking[] = [
    { id: 'book-1', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, serviceDuration: 30, staffId: 'staff-1', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(addDays(startOfDay(new Date()), 1).setHours(10, 0)).toISOString(), clientName: 'Bob Johnson', clientPhone: '555-1111', clientEmail: 'bob@example.com' },
    { id: 'book-2', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-2', serviceName: 'Beard Trim', servicePrice: 15, serviceDuration: 15, staffId: 'staff-1', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(addDays(startOfDay(new Date()), 2).setHours(14, 30)).toISOString(), clientName: 'Charlie Brown', clientPhone: '555-2222' },
    { id: 'book-3', locationId: 'uptown-2', locationName: 'Uptown Cuts', serviceId: 'svc-5', serviceName: 'Color & Cut', servicePrice: 90, serviceDuration: 120, staffId: 'staff-4', staffName: 'Jane Roe', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(addDays(startOfDay(new Date()), 3).setHours(11, 0)).toISOString(), clientName: 'Diana Prince', clientPhone: '555-3333', clientEmail: 'diana@example.com' },
    { id: 'book-4', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, serviceDuration: 30, staffId: 'staff-2', staffName: 'Maria Garcia', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(addDays(startOfDay(new Date()), 1).setHours(11, 30)).toISOString(), clientName: 'Peter Parker', clientPhone: '555-4444' },
    { id: 'book-5', locationId: 'soho-3', locationName: 'Soho Salon', serviceId: 'svc-9', serviceName: 'Signature Cut', servicePrice: 75, serviceDuration: 60, staffId: 'staff-5', staffName: 'Casey Jones', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(addDays(startOfDay(new Date()), 4).setHours(15, 0)).toISOString(), clientName: 'Bruce Wayne', clientPhone: '555-5555' },
    { id: 'book-6', locationId: 'uptown-2', locationName: 'Uptown Cuts', serviceId: 'svc-4', serviceName: 'Kids Cut', servicePrice: 20, serviceDuration: 30, staffId: 'staff-4', staffName: 'Jane Roe', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(addDays(startOfDay(new Date()), 1).setHours(9, 0)).toISOString(), clientName: 'Anakin Skywalker', clientPhone: '555-6666' },
    { id: 'book-7', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-3', serviceName: 'Hot Towel Shave', servicePrice: 40, serviceDuration: 45, staffId: 'staff-1', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(addDays(startOfDay(new Date()), 5).setHours(16, 0)).toISOString(), clientName: 'Tony Stark', clientPhone: '555-7777', clientEmail: 'tony@example.com' },
    { id: 'book-8', locationId: 'soho-3', locationName: 'Soho Salon', serviceId: 'svc-8', serviceName: 'Creative Color', servicePrice: 150, serviceDuration: 180, staffId: 'staff-5', staffName: 'Casey Jones', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(addDays(startOfDay(new Date()), 6).setHours(10, 0)).toISOString(), clientName: 'Natasha Romanoff', clientPhone: '555-8888' },
    { id: 'book-9', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, serviceDuration: 30, staffId: 'staff-6', staffName: 'Laura Palmer', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(addDays(startOfDay(new Date()), 2).setHours(13, 0)).toISOString(), clientName: 'Clark Kent', clientPhone: '555-9999' },
    { id: 'book-10', locationId: 'uptown-2', locationName: 'Uptown Cuts', serviceId: 'svc-7', serviceName: 'Luxury Manicure', servicePrice: 50, serviceDuration: 60, staffId: 'staff-4', staffName: 'Jane Roe', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(subDays(startOfDay(new Date()), 1).setHours(12, 0)).toISOString(), clientName: 'Lois Lane', clientPhone: '555-1010' },
    { id: 'book-11', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-6', serviceName: 'Modern Fade', servicePrice: 35, serviceDuration: 45, staffId: 'staff-1', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(subDays(startOfDay(new Date()), 2).setHours(11, 0)).toISOString(), clientName: 'Jimmy Olsen', clientPhone: '555-1212' },
    { id: 'book-12', locationId: 'soho-3', locationName: 'Soho Salon', serviceId: 'svc-9', serviceName: 'Signature Cut', servicePrice: 75, serviceDuration: 60, staffId: 'staff-5', staffName: 'Casey Jones', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(startOfDay(new Date()).setHours(14, 0)).toISOString(), clientName: 'Perry White', clientPhone: '555-1313' },
    // Add more bookings for loyalty data
    { id: 'book-13', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, serviceDuration: 30, staffId: 'staff-1', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(subDays(startOfDay(new Date()), 10).setHours(10, 0)).toISOString(), clientName: 'Bob Johnson', clientPhone: '555-1111', clientEmail: 'bob@example.com' },
    { id: 'book-14', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, serviceDuration: 30, staffId: 'staff-2', staffName: 'Maria Garcia', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(subDays(startOfDay(new Date()), 20).setHours(10, 0)).toISOString(), clientName: 'Bob Johnson', clientPhone: '555-1111', clientEmail: 'bob@example.com' },
    { id: 'book-15', locationId: 'uptown-2', locationName: 'Uptown Cuts', serviceId: 'svc-4', serviceName: 'Kids Cut', servicePrice: 20, serviceDuration: 30, staffId: 'staff-4', staffName: 'Jane Roe', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: new Date(subDays(startOfDay(new Date()), 5).setHours(9, 0)).toISOString(), clientName: 'Anakin Skywalker', clientPhone: '555-6666' },
];

const dummyAdmins: AdminUser[] = [
    { uid: 'owner-uid', email: 'owner@trimology.com' },
    { uid: 'super-admin-uid', email: 'superadmin@trimology.com' },
    { uid: 'branch-admin-uid', email: 'branchadmin@trimology.com', locationId: 'downtown-1', locationName: 'Downtown Barbers' },
];


const locationsCollection = collection(db, 'locations');
const servicesCollection = collection(db, 'services');
const staffCollection = collection(db, 'staff');
const bookingsCollection = collection(db, 'bookings');
const adminsCollection = collection(db, 'admins');


async function createFirebaseUser(email: string, password_do_not_log: string): Promise<string> {
    // THIS IS A MOCK FUNCTION.
    // In a real app, this would be a Firebase Cloud Function using the Admin SDK.
    // It would be called securely from the server to create a user.
    console.log(`
    =====================================================================
    [SERVER-SIDE MOCK] Creating Firebase Auth user for: ${email}
    This would normally happen in a secure backend environment.
    A real UID would be returned from firebase.auth().createUser()
    =====================================================================
    `);
    // Return a predictable mock UID for dummy mode
    return `mock-uid-for-${email.split('@')[0]}`;
}


// Admins
export async function getAdminUser(uid: string, email?: string): Promise<AdminUser | null> {
    if (USE_DUMMY_DATA) {
        // In dummy mode, we can't trust the hardcoded UID. We find the admin by email.
        const existingAdmin = dummyAdmins.find(a => a.email === email);
        if (existingAdmin) {
            // Important: Return the dummy data but with the REAL uid from the auth session.
            // This makes the rest of the app work as expected.
            return { ...existingAdmin, uid: uid };
        }
        return null;
    }

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

export async function getAdminsFromFirestore(locationId?: string): Promise<AdminUser[]> {
    if (USE_DUMMY_DATA) {
        if (locationId) return Promise.resolve(dummyAdmins.filter(a => a.locationId === locationId));
        return Promise.resolve(dummyAdmins);
    }
    
    const q = locationId 
        ? query(adminsCollection, where('locationId', '==', locationId), orderBy('email')) 
        : query(adminsCollection, orderBy('email'));
        
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
    } as AdminUser));
}

export async function addAdminWithLogin(data: Omit<AdminUser, 'uid'> & { password?: string }) {
    if (!data.email || !data.password || !data.locationId || !data.locationName) {
        throw new Error("Missing data to create a new branch admin.");
    }
    if (USE_DUMMY_DATA) {
        console.log('DUMMY: addAdminWithLogin', data.email);
        const newUid = await createFirebaseUser(data.email, data.password);
        const newAdmin = { ...data, uid: newUid };
        delete (newAdmin as any).password;
        dummyAdmins.push(newAdmin);
        revalidatePath('/admin/admins');
        return;
    }
    
    // REAL IMPLEMENTATION NOTE: This needs a secure backend function.
    throw new Error("Admin user creation must be handled by a secure backend function.");
    // const newUid = await callCreateUserCloudFunction(data.email, data.password);
    // const adminDoc = doc(db, 'admins', newUid);
    // const { password, ...adminData } = data;
    // await setDoc(adminDoc, adminData);
    // revalidatePath('/admin/admins');
}

export async function updateAdmin(uid: string, data: Partial<Omit<AdminUser, 'uid'>>) {
    if (USE_DUMMY_DATA) { 
        console.log('DUMMY: updateAdmin', uid, data);
        const adminIndex = dummyAdmins.findIndex(a => a.uid === uid);
        if (adminIndex > -1) {
            dummyAdmins[adminIndex] = { ...dummyAdmins[adminIndex], ...data };
        }
        revalidatePath('/admin/admins'); 
        return; 
    }
    const adminDoc = doc(db, 'admins', uid);
    await updateDoc(adminDoc, data);
    revalidatePath('/admin/admins');
}

export async function deleteAdmin(uid: string) {
    if (USE_DUMMY_DATA) { 
        console.log('DUMMY: deleteAdmin', uid);
        const index = dummyAdmins.findIndex(a => a.uid === uid);
        if (index > -1) dummyAdmins.splice(index, 1);
        revalidatePath('/admin/admins'); 
        return; 
    }
    const adminDoc = doc(db, 'admins', uid);
    await deleteDoc(adminDoc);
    revalidatePath('/admin/admins');
}


// Locations
export async function getLocationsFromFirestore(locationId?: string): Promise<Location[]> {
    if (USE_DUMMY_DATA) {
        if (locationId) return Promise.resolve(dummyLocations.filter(l => l.id === locationId));
        return Promise.resolve(dummyLocations);
    }
    if (locationId) {
        const docRef = doc(db, "locations", locationId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? [{ id: docSnap.id, ...docSnap.data() } as Location] : [];
    }
    const q = query(locationsCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
}

export async function addLocation(data: Omit<Location, 'id'>) {
    if (USE_DUMMY_DATA) {
        console.log('DUMMY: addLocation', data);
        const newLocation = { ...data, id: `loc-${Date.now()}`};
        dummyLocations.push(newLocation);
        revalidatePath('/admin/locations');
        return;
    }
    await addDoc(locationsCollection, data);
    revalidatePath('/admin/locations');
}

export async function updateLocation(id: string, data: Partial<Omit<Location, 'id'>>) {
    if (USE_DUMMY_DATA) {
        console.log('DUMMY: updateLocation', id, data);
        const locIndex = dummyLocations.findIndex(l => l.id === id);
        if (locIndex > -1) {
            dummyLocations[locIndex] = { ...dummyLocations[locIndex], ...data };
        }
        revalidatePath('/admin/locations');
        return;
    }
    const locDoc = doc(db, 'locations', id);
    await updateDoc(locDoc, data);
    revalidatePath('/admin/locations');
}

export async function deleteLocation(id: string) {
    if (USE_DUMMY_DATA) {
        console.log('DUMMY: deleteLocation', id);
        const index = dummyLocations.findIndex(l => l.id === id);
        if (index > -1) dummyLocations.splice(index, 1);
        revalidatePath('/admin/locations');
        return;
    }
    const locDoc = doc(db, 'locations', id);
    await deleteDoc(locDoc);
    revalidatePath('/admin/locations');
}


// Services
export async function getServicesFromFirestore(locationId?: string): Promise<Service[]> {
    if (USE_DUMMY_DATA) {
        if (locationId) return Promise.resolve(dummyServices.filter(s => s.locationId === locationId));
        return Promise.resolve(dummyServices);
    }
    const q = locationId 
        ? query(servicesCollection, where('locationId', '==', locationId), orderBy('name'))
        : query(servicesCollection, orderBy('name'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
}

export async function addService(data: { name: string; duration: number; price: number; locationId: string; locationName: string; }) {
    if (USE_DUMMY_DATA) { console.log('DUMMY: addService', data); revalidatePath('/admin/services'); revalidatePath('/'); return; }
    await addDoc(servicesCollection, data);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

export async function updateService(id: string, data: { name: string; duration: number; price: number; locationId: string; locationName: string; }) {
    if (USE_DUMMY_DATA) { console.log('DUMMY: updateService', id, data); revalidatePath('/admin/services'); revalidatePath('/'); return; }
    const serviceDoc = doc(db, 'services', id);
    await updateDoc(serviceDoc, data);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

export async function deleteService(id: string) {
    if (USE_DUMMY_DATA) { console.log('DUMMY: deleteService', id); revalidatePath('/admin/services'); revalidatePath('/'); return; }
    const serviceDoc = doc(db, 'services', id);
    await deleteDoc(serviceDoc);
    revalidatePath('/admin/services');
    revalidatePath('/');
}

// Staff
export async function getStaffFromFirestore(locationId?: string): Promise<Staff[]> {
     if (USE_DUMMY_DATA) {
        if (locationId) return Promise.resolve(dummyStaff.filter(s => s.locationId === locationId));
        return Promise.resolve(dummyStaff);
    }
    const q = locationId
        ? query(staffCollection, where('locationId', '==', locationId), orderBy('name'))
        : query(staffCollection, orderBy('name'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
}


export async function addStaffWithLogin(data: Omit<Staff, 'id' | 'uid' | 'locationName'> & { password?: string }) {
    if (!data.email || !data.password) {
        throw new Error("Email and password are required to create a new staff member with a login.");
    }
    const locationQuery = USE_DUMMY_DATA 
        ? dummyLocations.find(l => l.id === data.locationId)
        : await getDoc(doc(db, 'locations', data.locationId)).then(d => d.data());

    if (!locationQuery) {
        throw new Error("Invalid location specified.");
    }

    const locationName = locationQuery.name;
    const newStaffId = `staff-${Date.now()}`;

    if (USE_DUMMY_DATA) {
        console.log("DUMMY: addStaffWithLogin", data.email);
        const newUid = await createFirebaseUser(data.email, data.password);
        const newStaffMember: Staff = {
            ...data,
            id: newStaffId,
            uid: newUid,
            locationName,
            isBookable: data.isBookable ?? true,
            workingHours: data.workingHours || defaultWorkingHours,
        };
        delete (newStaffMember as any).password;
        dummyStaff.push(newStaffMember);
        revalidatePath('/admin/staff');
        revalidatePath('/');
        return;
    }

    // REAL IMPLEMENTATION NOTE: This needs a secure backend function.
    throw new Error("User creation must be handled by a secure backend function.");
    // const newUid = await callCreateUserCloudFunction(data.email, data.password);
    // const staffDocRef = doc(db, 'staff', newStaffId);
    // const { password, ...staffData } = data;
    // await setDoc(staffDocRef, { 
    //     ...staffData,
    //     uid: newUid, 
    //     locationName, 
    //     isBookable: data.isBookable ?? true 
    // });
    // revalidatePath('/admin/staff');
    // revalidatePath('/');
}

export async function updateStaff(id: string, data: Partial<Omit<Staff, 'id'>>) {
    if (USE_DUMMY_DATA) {
        console.log('DUMMY: updateStaff', id, data);
        const staffIndex = dummyStaff.findIndex(s => s.id === id);
        if (staffIndex > -1) {
            dummyStaff[staffIndex] = { ...dummyStaff[staffIndex], ...data };
        }
        revalidatePath('/admin/staff'); revalidatePath('/'); return;
    }
    const staffDoc = doc(db, 'staff', id);
    await updateDoc(staffDoc, data);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function deleteStaff(id: string) {
    if (USE_DUMMY_DATA) { 
        console.log('DUMMY: deleteStaff', id);
        const index = dummyStaff.findIndex(s => s.id === id);
        if (index > -1) dummyStaff.splice(index, 1);
        revalidatePath('/admin/staff'); 
        revalidatePath('/'); 
        return; 
    }
    // In a real app, you would also want a Cloud Function to delete the corresponding Firebase Auth user.
    const staffDoc = doc(db, 'staff', id);
    await deleteDoc(staffDoc);
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function getStaffByUid(uid: string, email?: string): Promise<Staff | null> {
    if (USE_DUMMY_DATA) {
        // In dummy mode, the UID from auth won't match the hardcoded one. Find by email.
        const staffMember = dummyStaff.find(s => s.email === email);
        if (staffMember) {
            // Return the dummy data but with the REAL uid from the auth session.
            return { ...staffMember, uid: uid };
        }
        return null;
    }
    const q = query(staffCollection, where('uid', '==', uid), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Staff;
}


// Bookings
export async function getBookingsFromFirestore(locationId?: string): Promise<Booking[]> {
     if (USE_DUMMY_DATA) {
        const sorted = dummyBookings.sort((a,b) => new Date(b.bookingTimestamp).getTime() - new Date(a.bookingTimestamp).getTime());
        if (locationId) return Promise.resolve(sorted.filter(b => b.locationId === locationId));
        return Promise.resolve(sorted);
    }
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

export async function getBookingsByStaffId(staffId: string): Promise<Booking[]> {
    if (USE_DUMMY_DATA) {
        const upcoming = dummyBookings
            .filter(b => b.staffId === staffId && new Date(b.bookingTimestamp) >= new Date())
            .sort((a,b) => new Date(a.bookingTimestamp).getTime() - new Date(b.bookingTimestamp).getTime());
        return Promise.resolve(upcoming);
    }
    const q = query(
        bookingsCollection, 
        where('staffId', '==', staffId),
        where('bookingTimestamp', '>=', new Date().toISOString()),
        orderBy('bookingTimestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
}

export async function getBookingsForStaffOnDate(staffId: string, date: Date): Promise<Booking[]> {
    if (USE_DUMMY_DATA) {
        const checkDate = startOfDay(date);
        const dayBookings = dummyBookings.filter(b => {
            if (b.staffId !== staffId) return false;
            const bookingDate = startOfDay(new Date(b.bookingTimestamp));
            return bookingDate.getTime() === checkDate.getTime();
        });
        return Promise.resolve(dayBookings);
    }
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = endOfDay(date).toISOString();

    const q = query(
        bookingsCollection,
        where('staffId', '==', staffId),
        where('bookingTimestamp', '>=', dayStart),
        where('bookingTimestamp', '<=', dayEnd)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
}

export async function addBooking(data: NewBooking) {
    if (USE_DUMMY_DATA) { 
        console.log('DUMMY: addBooking', data);
        const newBooking = { ...data, id: `book-${Date.now()}`};
        dummyBookings.push(newBooking);
        revalidatePath('/admin/bookings'); 
        revalidatePath('/my-schedule');
        return; 
    }
    await addDoc(bookingsCollection, {
        ...data,
        createdAt: Timestamp.now(),
    });
    revalidatePath('/admin/bookings');
    revalidatePath('/my-schedule');
}

export async function deleteBooking(id: string) {
    if (USE_DUMMY_DATA) { 
        console.log('DUMMY: deleteBooking', id);
        const index = dummyBookings.findIndex(b => b.id === id);
        if (index > -1) dummyBookings.splice(index, 1);
        revalidatePath('/admin/bookings'); 
        revalidatePath('/my-schedule'); 
        return; 
    }
    const bookingDoc = doc(db, 'bookings', id);
    await deleteDoc(bookingDoc);
    revalidatePath('/admin/bookings');
    revalidatePath('/my-schedule');
}

// Client Loyalty
export async function getClientLoyaltyData(locationId?: string): Promise<ClientLoyalty[]> {
    // This function derives client data from the existing bookings.
    const allBookings = await getBookingsFromFirestore(locationId);
    
    const clientsMap = new Map<string, ClientLoyalty>();

    allBookings.forEach(booking => {
        // Only process bookings with a phone number for loyalty tracking
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

    // Convert map to array and sort by most visits
    const clientsArray = Array.from(clientsMap.values());
    clientsArray.sort((a, b) => b.totalVisits - a.totalVisits);

    return clientsArray;
}
    



    