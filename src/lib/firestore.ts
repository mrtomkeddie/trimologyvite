
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query, Timestamp, where, getDoc, setDoc, limit } from 'firebase/firestore';
import type { Location, Service, Staff, Booking, NewBooking, AdminUser } from './types';
import { revalidatePath } from 'next/cache';
import { addDays } from 'date-fns';

// --- DUMMY DATA SWITCH ---
// Change this to 'false' to use your live Firestore database.
const USE_DUMMY_DATA = true;

// --- DUMMY DATA DEFINITIONS ---

const dummyLocations: Location[] = [
    { id: 'downtown-1', name: 'Downtown Barbers', address: '123 Main St, Barberville', phone: '555-0101', email: 'contact@downtown.com' },
    { id: 'uptown-2', name: 'Uptown Cuts', address: '456 High St, Styletown', phone: '555-0102', email: 'hello@uptown.com' },
];

const dummyServices: Service[] = [
    { id: 'svc-1', name: 'Classic Haircut', duration: 30, price: 25, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-2', name: 'Beard Trim', duration: 15, price: 15, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-3', name: 'Hot Towel Shave', duration: 45, price: 40, locationId: 'downtown-1', locationName: 'Downtown Barbers' },
    { id: 'svc-4', name: 'Kids Cut', duration: 30, price: 20, locationId: 'uptown-2', locationName: 'Uptown Cuts' },
    { id: 'svc-5', name: 'Color & Cut', duration: 120, price: 90, locationId: 'uptown-2', locationName: 'Uptown Cuts' },
];

const dummyStaff: Staff[] = [
    { id: 'staff-1', name: 'Alex Smith', specialization: 'Master Barber', locationId: 'downtown-1', locationName: 'Downtown Barbers', uid: 'staff-uid-alex', email: 'alex@trimology.com', imageUrl: 'https://placehold.co/100x100.png', isBookable: true },
    { id: 'staff-2', name: 'Maria Garcia', specialization: 'Senior Stylist', locationId: 'downtown-1', locationName: 'Downtown Barbers', imageUrl: 'https://placehold.co/100x100.png', isBookable: true },
    { id: 'staff-3', name: 'John Doe', specialization: 'Stylist', locationId: 'uptown-2', locationName: 'Uptown Cuts', imageUrl: 'https://placehold.co/100x100.png', isBookable: false },
    { id: 'staff-4', name: 'Jane Roe', specialization: 'Color Specialist', locationId: 'uptown-2', locationName: 'Uptown Cuts', uid: 'staff-uid-jane', email: 'jane@trimology.com', imageUrl: 'https://placehold.co/100x100.png', isBookable: true },
];

const dummyBookings: Booking[] = [
    { id: 'book-1', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, staffId: 'staff-1', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: addDays(new Date(), 1).toISOString(), clientName: 'Bob Johnson', clientPhone: '555-1111', clientEmail: 'bob@example.com' },
    { id: 'book-2', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-2', serviceName: 'Beard Trim', servicePrice: 15, staffId: 'staff-1', staffName: 'Alex Smith', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: addDays(new Date(), 2).toISOString(), clientName: 'Charlie Brown', clientPhone: '555-2222' },
    { id: 'book-3', locationId: 'uptown-2', locationName: 'Uptown Cuts', serviceId: 'svc-5', serviceName: 'Color & Cut', servicePrice: 90, staffId: 'staff-4', staffName: 'Jane Roe', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: addDays(new Date(), 3).toISOString(), clientName: 'Diana Prince', clientPhone: '555-3333', clientEmail: 'diana@example.com' },
    { id: 'book-4', locationId: 'downtown-1', locationName: 'Downtown Barbers', serviceId: 'svc-1', serviceName: 'Classic Haircut', servicePrice: 25, staffId: 'staff-2', staffName: 'Maria Garcia', staffImageUrl: 'https://placehold.co/100x100.png', bookingTimestamp: addDays(new Date(), 1).toISOString(), clientName: 'Peter Parker', clientPhone: '555-4444' },
];

const dummyAdmins: AdminUser[] = [
    { uid: 'super-admin-uid', email: 'owner@trimology.com' },
    { uid: 'branch-admin-uid', email: 'manager@trimology.com', locationId: 'downtown-1', locationName: 'Downtown Barbers' },
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
export async function getAdminUser(uid: string): Promise<AdminUser | null> {
    if (USE_DUMMY_DATA) {
        // In dummy mode, any logged-in user is treated as a Super Admin for easy testing.
        return {
            uid: uid,
            email: 'dummy.super.admin@example.com',
        };
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

export async function addAdmin(data: { email: string; password?: string, locationId?: string; locationName?: string; }) {
    if (!data.email || !data.password) {
        throw new Error("Email and password are required to create a new admin.");
    }
    if (USE_DUMMY_DATA) {
        console.log('DUMMY: addAdmin with login creation', data);
        const newUid = await createFirebaseUser(data.email, data.password);
        const newAdmin = { uid: newUid, email: data.email, locationId: data.locationId, locationName: data.locationName };
        dummyAdmins.push(newAdmin);
        delete (data as any).password;
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

export async function updateAdmin(uid: string, data: { email: string; locationId?: string; locationName?: string; }) {
    if (USE_DUMMY_DATA) { console.log('DUMMY: updateAdmin', uid, data); revalidatePath('/admin/admins'); return; }
    const adminDoc = doc(db, 'admins', uid);
    await updateDoc(adminDoc, data);
    revalidatePath('/admin/admins');
}

export async function deleteAdmin(uid: string) {
    if (USE_DUMMY_DATA) { console.log('DUMMY: deleteAdmin', uid); revalidatePath('/admin/admins'); return; }
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

export async function addLocation(data: { name: string; address: string; phone?: string; email?: string; }) {
    if (USE_DUMMY_DATA) { console.log('DUMMY: addLocation', data); revalidatePath('/admin/locations'); revalidatePath('/'); return; }
    await addDoc(locationsCollection, data);
    revalidatePath('/admin/locations');
    revalidatePath('/');
}

export async function updateLocation(id: string, data: { name: string; address: string; phone?: string; email?: string; }) {
    if (USE_DUMMY_DATA) { console.log('DUMMY: updateLocation', id, data); revalidatePath('/admin/locations'); revalidatePath('/'); return; }
    const locationDoc = doc(db, 'locations', id);
    await updateDoc(locationDoc, data);
    revalidatePath('/admin/locations');
    revalidatePath('/');
}

export async function deleteLocation(id: string) {
    if (USE_DUMMY_DATA) { console.log('DUMMY: deleteLocation', id); revalidatePath('/admin/locations'); revalidatePath('/'); return; }
    const locationDoc = doc(db, 'locations', id);
    await deleteDoc(locationDoc);
    revalidatePath('/admin/locations');
    revalidatePath('/');
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

export async function addStaff(id: string, data: Partial<Omit<Staff, 'id' | 'uid'>> & { email?: string, password?: string }) {
    if (data.password && data.email) {
        if (USE_DUMMY_DATA) {
            console.log("DUMMY: addStaff with login creation", data);
            const newUid = await createFirebaseUser(data.email, data.password);
            const newStaffMember = { ...data, id, uid: newUid, isBookable: data.isBookable ?? true };
            delete newStaffMember.password;
            dummyStaff.push(newStaffMember as Staff);
            revalidatePath('/admin/staff');
            revalidatePath('/');
            return;
        }

        // REAL IMPLEMENTATION NOTE:
        // You would call a Cloud Function here to create the user with the Admin SDK.
        // The Cloud Function would return the new user's UID.
        // For now, this will throw an error because the client can't create users.
        throw new Error("User creation must be handled by a secure backend function.");
        // const newUid = await callCreateUserCloudFunction(data.email, data.password);
        // const staffDoc = doc(db, 'staff', id);
        // await setDoc(staffDoc, { ...data, uid: newUid, isBookable: data.isBookable ?? true });

    } else {
         if (USE_DUMMY_DATA) {
            console.log('DUMMY: addStaff (no login)', data);
            const newStaffMember = { ...data, id, isBookable: data.isBookable ?? true };
            delete newStaffMember.password;
            dummyStaff.push(newStaffMember as Staff);
            revalidatePath('/admin/staff'); revalidatePath('/'); return;
        }
        const staffDoc = doc(db, 'staff', id);
        await setDoc(staffDoc, { ...data, isBookable: data.isBookable ?? true });
    }
    revalidatePath('/admin/staff');
    revalidatePath('/');
}

export async function updateStaff(id: string, data: Partial<Omit<Staff, 'id' | 'uid'>> & { email?: string, password?: string }) {
    if (data.password && data.email) {
        // This logic path is for adding a login to an existing staff member.
        if (USE_DUMMY_DATA) {
            console.log("DUMMY: updateStaff with login creation", data);
            const newUid = await createFirebaseUser(data.email, data.password);
            const staffIndex = dummyStaff.findIndex(s => s.id === id);
            if (staffIndex > -1) {
                dummyStaff[staffIndex] = { ...dummyStaff[staffIndex], ...data, uid: newUid };
                 delete (dummyStaff[staffIndex] as any).password;
            }
            revalidatePath('/admin/staff');
            revalidatePath('/');
            return;
        }
         // REAL IMPLEMENTATION NOTE (same as above)
        throw new Error("User creation must be handled by a secure backend function.");
    } else {
        if (USE_DUMMY_DATA) {
            console.log('DUMMY: updateStaff (no login)', id, data);
            const staffIndex = dummyStaff.findIndex(s => s.id === id);
            if (staffIndex > -1) {
                dummyStaff[staffIndex] = { ...dummyStaff[staffIndex], ...data };
            }
            revalidatePath('/admin/staff'); revalidatePath('/'); return;
        }
        const staffDoc = doc(db, 'staff', id);
        await updateDoc(staffDoc, data);
    }
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

export async function getStaffByUid(uid: string): Promise<Staff | null> {
    if (USE_DUMMY_DATA) {
        // Find staff member by UID in dummy data
        return dummyStaff.find(s => s.uid === uid) || null;
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


export async function addBooking(data: NewBooking) {
    if (USE_DUMMY_DATA) { console.log('DUMMY: addBooking', data); revalidatePath('/admin/bookings'); return; }
    await addDoc(bookingsCollection, {
        ...data,
        createdAt: Timestamp.now(),
    });
    revalidatePath('/admin/bookings');
}

export async function deleteBooking(id: string) {
    if (USE_DUMMY_DATA) { console.log('DUMMY: deleteBooking', id); revalidatePath('/admin/bookings'); revalidatePath('/my-schedule'); return; }
    const bookingDoc = doc(db, 'bookings', id);
    await deleteDoc(bookingDoc);
    revalidatePath('/admin/bookings');
    revalidatePath('/my-schedule');
}
