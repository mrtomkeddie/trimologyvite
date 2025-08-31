import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query, Timestamp, where, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { Location, Service, Staff, Booking, NewBooking, AdminUser, ClientLoyalty } from './types';
import { format, parse, addMinutes, getDay, isBefore, isAfter, startOfDay, startOfMonth, endOfMonth, isSameDay, addDays } from 'date-fns';
import { DUMMY_ADMIN_USERS, DUMMY_BOOKINGS, DUMMY_CLIENTS, DUMMY_LOCATIONS, DUMMY_SERVICES, DUMMY_STAFF } from './dummy-data';


// Admins
export async function getAdminUser(uid: string, email: string): Promise<AdminUser | null> {
    const adminDoc = await getDoc(doc(db, 'admins', uid));

    if (!adminDoc.exists()) {
        // Fallback for demo: if user email is in dummy data, but UID doesn't match, create a record
        const dummyUser = DUMMY_ADMIN_USERS.find(u => u.email === email);
        if (dummyUser) {
            const adminData = {
                email: dummyUser.email,
                locationId: dummyUser.locationId || null,
                locationName: dummyUser.locationName || 'All Locations',
            };
            await setDoc(doc(db, 'admins', uid), adminData);
             return { id: uid, ...adminData } as AdminUser;
        }
        return null;
    }
    
    const adminData = adminDoc.data();
    return {
        id: uid,
        email: adminData?.email,
        locationId: adminData?.locationId || null,
        locationName: adminData?.locationName,
    } as AdminUser;
}

export async function getAdmins(locationId?: string): Promise<AdminUser[]> {
    let q = query(collection(db, 'admins'));
    // Super-admins can see all other admins
    if (locationId) {
    // Branch admins can only see other admins at their location
        q = query(collection(db, 'admins'), where('locationId', '==', locationId));
    }
    
    const querySnapshot = await getDocs(q);
    const admins = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AdminUser));

    admins.sort((a, b) => {
        if (!a.locationId) return -1; // Super admin on top
        if (!b.locationId) return 1;
        return a.email.localeCompare(b.email);
    });

    return admins;
}

export async function setAdminRecord(uid: string, data: { email: string; locationId: string; locationName: string; }) {
    await setDoc(doc(db, 'admins', uid), data);
}

export async function updateAdmin(uid: string, data: Partial<Omit<AdminUser, 'id'>>) {
    await updateDoc(doc(db, 'admins', uid), data);
}

export async function deleteAdmin(uid: string) {
    await deleteDoc(doc(db, 'admins', uid));
}


// Locations
export async function getLocations(locationId?: string): Promise<Location[]> {
    const locationsCollection = collection(db, 'locations');
    if (locationId) {
        const docRef = await getDoc(doc(db, 'locations', locationId));
        if (!docRef.exists()) {
            // For demo purposes, add dummy data if collection is empty
            const batch = writeBatch(db);
            DUMMY_LOCATIONS.forEach(loc => {
                const newDocRef = doc(locationsCollection, loc.id);
                batch.set(newDocRef, loc);
            });
            await batch.commit();
            const specificLoc = DUMMY_LOCATIONS.find(l => l.id === locationId);
            return specificLoc ? [specificLoc] : [];
        }
        return [{ id: docRef.id, ...docRef.data() } as Location];
    }
    const q = query(locationsCollection, orderBy('name'));
    let snapshot = await getDocs(q);

    // For demo purposes, add dummy data if collection is empty
    if (snapshot.empty) {
        const batch = writeBatch(db);
        DUMMY_LOCATIONS.forEach(loc => {
            const docRef = doc(locationsCollection, loc.id);
            batch.set(docRef, loc);
        });
        await batch.commit();
        snapshot = await getDocs(q);
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
}

export async function addLocation(data: Omit<Location, 'id'>) {
    await addDoc(collection(db, 'locations'), data);
}

export async function updateLocation(id: string, data: Partial<Omit<Location, 'id'>>) {
    await updateDoc(doc(db, 'locations', id), data);
}

export async function deleteLocation(id: string) {
    await deleteDoc(doc(db, 'locations', id));
}


// Services
export async function getServices(locationId?: string): Promise<Service[]> {
    const servicesCollection = collection(db, 'services');
    let q = query(servicesCollection, orderBy('name'));
    if (locationId) {
        q = query(servicesCollection, where('locationId', '==', locationId), orderBy('name'));
    }
    let snapshot = await getDocs(q);

    if (snapshot.empty && !locationId) {
        const batch = writeBatch(db);
        DUMMY_SERVICES.forEach(serv => {
            const docRef = doc(servicesCollection, serv.id);
            batch.set(docRef, serv);
        });
        await batch.commit();
        snapshot = await getDocs(q);
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
}

export async function addService(data: { name: string; duration: number; price: number; locationId: string; locationName: string; }) {
    await addDoc(collection(db, 'services'), data);
}

export async function updateService(id: string, data: { name: string; duration: number; price: number; locationId: string; locationName: string; }) {
    await updateDoc(doc(db, 'services', id), data);
}

export async function deleteService(id: string) {
    await deleteDoc(doc(db, 'services', id));
}

// Staff
export async function getStaff(locationId?: string): Promise<Staff[]> {
    const staffCollection = collection(db, 'staff');
    let q = query(staffCollection, orderBy('name'));
    if (locationId) {
        q = query(staffCollection, where('locationId', '==', locationId), orderBy('name'));
    }
    let snapshot = await getDocs(q);
    
    if (snapshot.empty && !locationId) {
        const batch = writeBatch(db);
        DUMMY_STAFF.forEach(s => {
            const docRef = doc(staffCollection, s.id);
            batch.set(docRef, s);
        });
        await batch.commit();
        snapshot = await getDocs(q);
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
}

export async function addStaff(data: Omit<Staff, 'id'>) {
    await setDoc(doc(db, 'staff', data.id), data);
}

export async function updateStaff(uid: string, data: Partial<Omit<Staff, 'id'>>) {
    await updateDoc(doc(db, 'staff', uid), data);
}

export async function deleteStaff(uid: string) {
    await deleteDoc(doc(db, 'staff', uid));
}

export async function getStaffByUserId(uid: string): Promise<Staff | null> {
    const staffDoc = await getDoc(doc(db, 'staff', uid));
    if (!staffDoc.exists()) {
        const staffMember = DUMMY_STAFF.find(s => s.id === uid);
        if (staffMember) {
            await setDoc(doc(db, 'staff', uid), staffMember);
            return staffMember;
        }
        return null;
    }
    return { id: staffDoc.id, ...staffDoc.data() } as Staff;
}

export async function setStaffRecord(uid: string, data: Omit<Staff, 'id'>) {
    await setDoc(doc(db, 'staff', uid), data);
}


// Bookings
export async function getBookings(locationId?: string): Promise<Booking[]> {
     const now = new Date().toISOString();
    const bookingsCollection = collection(db, 'bookings');
    let q;

    if (locationId) {
        q = query(bookingsCollection,
            where('locationId', '==', locationId),
            where('bookingTimestamp', '>=', now),
            orderBy('bookingTimestamp', 'asc'));
    } else {
        q = query(bookingsCollection,
            where('bookingTimestamp', '>=', now),
            orderBy('bookingTimestamp', 'asc'));
    }
    
    const snapshot = await getDocs(q);
    const serverData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    
    // For demo purposes, merge with dummy data
    const upcomingDummyBookings = DUMMY_BOOKINGS.filter(b => new Date(b.bookingTimestamp) >= new Date());
    
    const combined = [...serverData, ...upcomingDummyBookings];
    const uniqueBookings = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    if (locationId) {
        return uniqueBookings.filter(b => b.locationId === locationId);
    }
    
    return uniqueBookings.sort((a,b) => new Date(a.bookingTimestamp).getTime() - new Date(b.bookingTimestamp).getTime());
}

export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
    const q = query(collection(db, 'bookings'), where('clientPhone', '==', phone), orderBy('bookingTimestamp', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const { createdAt, ...rest } = data;
        return {
            id: doc.id,
            ...rest
        } as Booking;
    });
}

export async function getBookingsByStaffId(staffId: string): Promise<Booking[]> {
    const nowString = new Date().toISOString();
    
    const q = query(collection(db, 'bookings'),
        where('staffId', '==', staffId), 
        where('bookingTimestamp', '>=', nowString),
        orderBy('bookingTimestamp', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const { createdAt, ...data } = doc.data();
        return {
            id: doc.id,
            ...data
        } as Booking;
    });
}

export async function getBookingsForStaffOnDate(staffId: string, date: Date): Promise<Booking[]> {
    const dayStartStr = startOfDay(date).toISOString();
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const dayEndStr = dayEnd.toISOString();
    
    const q = query(collection(db, 'bookings'),
        where('staffId', '==', staffId),
        where('bookingTimestamp', '>=', dayStartStr),
        where('bookingTimestamp', '<=', dayEndStr));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const { createdAt, ...data } = doc.data();
        return {
            id: doc.id,
            ...data
        } as Booking;
    });
}

export async function getBookingsForStaffInRange(staffIds: string[], startDate: Date, endDate: Date): Promise<Booking[]> {
    if (staffIds.length === 0) return [];
    
    const q = query(collection(db, 'bookings'),
        where('staffId', 'in', staffIds),
        where('bookingTimestamp', '>=', startDate.toISOString()),
        where('bookingTimestamp', '<=', endDate.toISOString()));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
}


export async function addBooking(data: NewBooking) {
    await addDoc(collection(db, 'bookings'), { 
        ...data,
        createdAt: Timestamp.now(),
    });
}

export async function deleteBooking(id: string) {
    await deleteDoc(doc(db, 'bookings', id));
}

// Client Loyalty
export async function getClientLoyaltyData(locationId?: string): Promise<ClientLoyalty[]> {
    let q = query(collection(db, 'bookings'));
    let snapshot;

    if (locationId) {
        q = query(collection(db, 'bookings'), where('locationId', '==', locationId));
        snapshot = await getDocs(q);
    } else {
        snapshot = await getDocs(q);
    }

    const allBookings = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Booking));
    
    const clientsMap = new Map<string, ClientLoyalty>();

    allBookings.forEach(booking => {
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
     // For demo purposes, add dummy data
    DUMMY_CLIENTS.forEach(client => {
        const clientIdentifier = `${client.name.toLowerCase().trim()}-${client.phone.trim()}`;
        if (!clientsMap.has(clientIdentifier)) {
            clientsMap.set(clientIdentifier, client);
        }
    });


    const clientsArray = Array.from(clientsMap.values());
    clientsArray.sort((a, b) => b.totalVisits - a.totalVisits);

    return clientsArray;
}


// SERVER ACTIONS

// Helper to map JS day index (Sun=0) to our string keys
const dayMap: (keyof Staff['workingHours'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// --- Reusable Conflict Check Helper Function ---
// This function assumes all date objects passed to it are in the same timezone (server's local time)
const checkForConflicts = async (staffId: string, start: Date, end: Date): Promise<boolean> => {
    // This now queries using UTC-based date objects.
    const existingBookings = await getBookingsForStaffOnDate(staffId, start);

    return existingBookings.some(b => {
        // Create Date objects from the UTC timestamp strings for comparison
        const existingStart = new Date(b.bookingTimestamp);
        const existingEnd = addMinutes(existingStart, b.serviceDuration);
        
        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        return isBefore(start, existingEnd) && isAfter(end, existingStart);
    });
};

// Helper function to get available times for a single staff member
async function getIndividualStaffTimes(
    serviceDuration: number,
    preferredDateStr: string, // Expects 'yyyy-MM-dd'
    staffMember: Staff
): Promise<string[]> {
    if (!staffMember.workingHours) return [];
    
    // Construct a date object from the preferred date string. It will be interpreted in the server's local timezone.
    const preferredDate = new Date(`${preferredDateStr}T00:00:00`);
    if (isNaN(preferredDate.getTime())) {
        return [];
    }

    const dayOfWeek = dayMap[getDay(preferredDate)];
    const dayHours = staffMember.workingHours[dayOfWeek];

    if (!dayHours || dayHours === 'off') return [];
    
    const workDayStart = parse(dayHours.start, 'HH:mm', preferredDate);
    const workDayEnd = parse(dayHours.end, 'HH:mm', preferredDate);

    const availableSlots: string[] = [];
    let potentialSlotStart = workDayStart;
    const now = new Date();

    while (isBefore(potentialSlotStart, workDayEnd)) {
        const potentialSlotEnd = addMinutes(potentialSlotStart, serviceDuration);

        if (isAfter(potentialSlotEnd, workDayEnd)) break;
        if (isBefore(potentialSlotStart, now)) {
            potentialSlotStart = addMinutes(potentialSlotStart, 15);
            continue;
        }
        
        const hasConflict = await checkForConflicts(staffMember.id, potentialSlotStart, potentialSlotEnd);
        if (!hasConflict) {
            availableSlots.push(format(potentialSlotStart, 'HH:mm'));
        }

        potentialSlotStart = addMinutes(potentialSlotStart, 15);
    }
    
    return availableSlots;
}

export async function getSuggestedTimes(
    serviceDuration: number,
    preferredDateStr: string, // 'yyyy-MM-dd' format
    staffId: string,
    locationId: string,
) {
    if (staffId === 'any') {
        const allStaffAtLocation = (await getStaff()).filter(s => s.locationId === locationId);
        const allAvailableSlots = new Set<string>();

        const timePromises = allStaffAtLocation.map(staffMember => 
            getIndividualStaffTimes(serviceDuration, preferredDateStr, staffMember)
        );
        const results = await Promise.all(timePromises);

        results.forEach(staffSlots => staffSlots.forEach(slot => allAvailableSlots.add(slot)));

        const sortedSlots = Array.from(allAvailableSlots).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        return { success: true, times: sortedSlots };
    }

    const allStaff = await getStaff();
    const staffMember = allStaff.find(s => s.id === staffId);
    
    if (!staffMember) return { success: true, times: [] };

    const availableSlots = await getIndividualStaffTimes(serviceDuration, preferredDateStr, staffMember);
    return { success: true, times: availableSlots };
}


type BookingData = {
    locationId: string;
    serviceId: string;
    staffId: string;
    date: Date;
    time: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
};


export async function createBooking(bookingData: BookingData) {
    if (!bookingData.locationId || !bookingData.serviceId || !bookingData.date || !bookingData.time || !bookingData.clientName || !bookingData.clientPhone) {
        throw new Error("Missing required booking information.");
    }
     
    const allLocations = await getLocations();
    const allServices = await getServices();
    const allStaff = await getStaff();

    const location = allLocations.find(l => l.id === bookingData.locationId);
    const service = allServices.find(s => s.id === bookingData.serviceId);
    
    if (!location || !service) throw new Error("Invalid location or service selected.");

    // Create an unambiguous UTC timestamp string. This is the core of the fix.
    const datePart = format(bookingData.date, 'yyyy-MM-dd');
    const timePart = bookingData.time;
    const bookingTimestampString = `${datePart}T${timePart}:00`;

    // Create a Date object from this UTC string for calculations.
    const bookingStart = new Date(bookingTimestampString);
    if (isNaN(bookingStart.getTime())) throw new Error("Invalid date or time for booking.");
    const bookingEnd = addMinutes(bookingStart, service.duration);
    
    let assignedStaff: Staff | undefined | null = null;

    if (bookingData.staffId === 'any') {
        const bookableStaffAtLocation = allStaff.filter(s => s.locationId === bookingData.locationId);
        
        for (const potentialStaff of bookableStaffAtLocation) {
            const dayOfWeek = dayMap[getDay(bookingStart)];
            const dayHours = potentialStaff.workingHours?.[dayOfWeek];
            if (!dayHours || dayHours === 'off') continue;

            // Use the user's selected date (bookingData.date) to parse working hours, avoiding server timezone shifts.
            const workDayStart = parse(dayHours.start, 'HH:mm', bookingData.date);
            const workDayEnd = parse(dayHours.end, 'HH:mm', bookingData.date);

            // Reconstruct bookingStart/End relative to the same day for accurate working hours check
            const bookingStartInDay = parse(timePart, 'HH:mm', bookingData.date);
            const bookingEndInDay = addMinutes(bookingStartInDay, service.duration);

            if (!isBefore(bookingStartInDay, workDayStart) && !isAfter(bookingEndInDay, workDayEnd)) {
                const hasConflict = await checkForConflicts(potentialStaff.id, bookingStart, bookingEnd);
                if (!hasConflict) {
                    assignedStaff = potentialStaff;
                    break;
                }
            }
        }

        if (!assignedStaff) throw new Error("No staff are available for the selected time. Please try another time or speak with our receptionist.");
    
    } else {
        assignedStaff = allStaff.find(s => s.id === bookingData.staffId);
        if (!assignedStaff) throw new Error("The selected staff member could not be found.");
        
        const hasConflict = await checkForConflicts(assignedStaff.id, bookingStart, bookingEnd);
        if (hasConflict) throw new Error("The selected staff member is unavailable for that time. Please choose another time or staff member.");
    }

    const newBooking: NewBooking = {
        locationId: bookingData.locationId,
        locationName: location.name,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        staffId: assignedStaff.id,
        staffName: assignedStaff.name,
        staffImageUrl: assignedStaff.imageUrl || '',
        bookingTimestamp: bookingStart.toISOString(), // Store as full ISO string
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        clientEmail: bookingData.clientEmail || '',
    };

    await addBooking(newBooking);

    if (bookingData.clientEmail) {
        console.log(`Email confirmation would be sent to ${bookingData.clientEmail}`);
    }

    return { success: true };
}


// --- Monthly Availability Calculation ---

const hasConflictWithFetchedBookings = (bookings: Booking[], start: Date, end: Date): boolean => {
    return bookings.some(b => {
        const existingStart = new Date(b.bookingTimestamp);
        const existingEnd = addMinutes(existingStart, b.serviceDuration);
        return isBefore(start, existingEnd) && isAfter(end, existingStart);
    });
};

export async function getUnavailableDays(month: Date, serviceId: string, staffId: string, locationId: string) {
    try {
        const allServices = await getServices();
        const service = allServices.find(s => s.id === serviceId);
        if (!service) return { success: false, unavailableDays: [] };
        
        const serviceDuration = service.duration;
        const allStaff = await getStaff();
        const staffToCheck = staffId === 'any'
            ? allStaff.filter(s => s.locationId === locationId)
            : allStaff.filter(s => s.id === staffId);
    
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        if (staffToCheck.length === 0) {
            const allDays = [];
            let day = monthStart;
            while (day <= monthEnd) {
                allDays.push(format(day, 'yyyy-MM-dd'));
                day = addDays(day, 1);
            }
            return { success: true, unavailableDays: allDays };
        }

        const allBookingsForMonth = await getBookingsForStaffInRange(staffToCheck.map(s => s.id), monthStart, monthEnd);
        
        // OPTIMIZATION: Pre-group bookings by day and then by staff for O(1) lookup inside the loops.
        const bookingsByDayAndStaff: Record<string, Record<string, Booking[]>> = {};
        allBookingsForMonth.forEach(booking => {
            const dayStr = format(new Date(booking.bookingTimestamp), 'yyyy-MM-dd');
            if (!bookingsByDayAndStaff[dayStr]) {
                bookingsByDayAndStaff[dayStr] = {};
            }
            if (!bookingsByDayAndStaff[dayStr][booking.staffId]) {
                bookingsByDayAndStaff[dayStr][booking.staffId] = [];
            }
            bookingsByDayAndStaff[dayStr][booking.staffId].push(booking);
        });

        const unavailableDays: string[] = [];
        let currentDay = monthStart;
        const today = startOfDay(new Date());

        while (currentDay <= monthEnd) {
            let isDayAvailable = false;
            const currentDayStr = format(currentDay, 'yyyy-MM-dd');
            
            for (const staffMember of staffToCheck) {
                const dayOfWeek = dayMap[getDay(currentDay)];
                const dayHours = staffMember.workingHours?.[dayOfWeek];

                if (!dayHours || dayHours === 'off') continue;

                const workDayStart = parse(dayHours.start, 'HH:mm', currentDay);
                const workDayEnd = parse(dayHours.end, 'HH:mm', currentDay);
                
                // OPTIMIZATION: Direct lookup instead of filtering the whole month's bookings every time.
                const staffBookingsForDay = bookingsByDayAndStaff[currentDayStr]?.[staffMember.id] || [];
                
                let potentialSlotStart = workDayStart;
                const now = new Date();
                
                 if (isSameDay(currentDay, today)) {
                    potentialSlotStart = isBefore(potentialSlotStart, now) ? parse(format(addMinutes(now, 15 - now.getMinutes() % 15), 'HH:mm'), 'HH:mm', currentDay) : potentialSlotStart;
                }

                while (isBefore(potentialSlotStart, workDayEnd)) {
                    const potentialSlotEnd = addMinutes(potentialSlotStart, serviceDuration);
                    if (isAfter(potentialSlotEnd, workDayEnd)) break;

                    const hasConflict = hasConflictWithFetchedBookings(staffBookingsForDay, potentialSlotStart, potentialSlotEnd);

                    if (!hasConflict) {
                        isDayAvailable = true;
                        break;
                    }
                    potentialSlotStart = addMinutes(potentialSlotStart, 15);
                }
                if (isDayAvailable) break;
            }

            if (!isDayAvailable) {
                unavailableDays.push(format(currentDay, 'yyyy-MM-dd'));
            }

            currentDay = addDays(new Date(currentDay.valueOf()), 1);
        }

        return { success: true, unavailableDays };

    } catch (error) {
        console.error("Error fetching unavailable days:", error);
        return { success: false, unavailableDays: [] };
    }
}