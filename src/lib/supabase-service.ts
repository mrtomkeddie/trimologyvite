import { supabase } from './supabase'
import type { Location, Service, Staff, Booking, NewBooking, AdminUser, ClientLoyalty } from './types'
import { format, parse, addMinutes, getDay, isBefore, isAfter, startOfDay, startOfMonth, endOfMonth, isSameDay, addDays } from 'date-fns'

// Helper to map JS day index (Sun=0) to our string keys
const dayMap: (keyof Staff['workingHours'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// Locations
export async function getLocations(locationId?: string): Promise<Location[]> {
  let query = supabase.from('locations').select('*').order('name')
  
  if (locationId) {
    query = query.eq('id', locationId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  return data.map(row => ({
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone || undefined,
    email: row.email || undefined,
  }))
}

export async function addLocation(data: Omit<Location, 'id'>) {
  const { error } = await supabase.from('locations').insert({
    name: data.name,
    address: data.address,
    phone: data.phone || null,
    email: data.email || null,
  })
  
  if (error) throw error
}

export async function updateLocation(id: string, data: Partial<Omit<Location, 'id'>>) {
  const { error } = await supabase.from('locations').update({
    name: data.name,
    address: data.address,
    phone: data.phone || null,
    email: data.email || null,
  }).eq('id', id)
  
  if (error) throw error
}

export async function deleteLocation(id: string) {
  const { error } = await supabase.from('locations').delete().eq('id', id)
  if (error) throw error
}

// Services
export async function getServices(locationId?: string): Promise<Service[]> {
  let query = supabase.from('services').select('*').order('name')
  
  if (locationId) {
    query = query.eq('location_id', locationId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  return data.map(row => ({
    id: row.id,
    name: row.name,
    duration: row.duration,
    price: row.price,
    locationId: row.location_id,
    locationName: row.location_name,
  }))
}

export async function addService(data: { name: string; duration: number; price: number; locationId: string; locationName: string }) {
  const { error } = await supabase.from('services').insert({
    name: data.name,
    duration: data.duration,
    price: data.price,
    location_id: data.locationId,
    location_name: data.locationName,
  })
  
  if (error) throw error
}

export async function updateService(id: string, data: { name: string; duration: number; price: number; locationId: string; locationName: string }) {
  const { error } = await supabase.from('services').update({
    name: data.name,
    duration: data.duration,
    price: data.price,
    location_id: data.locationId,
    location_name: data.locationName,
  }).eq('id', id)
  
  if (error) throw error
}

export async function deleteService(id: string) {
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) throw error
}

// Staff
export async function getStaff(locationId?: string): Promise<Staff[]> {
  let query = supabase.from('staff').select('*').order('name')
  
  if (locationId) {
    query = query.eq('location_id', locationId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  return data.map(row => ({
    id: row.id,
    name: row.name,
    specialization: row.specialization || undefined,
    locationId: row.location_id,
    locationName: row.location_name,
    email: row.email || undefined,
    imageUrl: row.image_url || undefined,
    workingHours: row.working_hours as any,
    userId: row.user_id || undefined,
  }))
}

export async function addStaff(data: Omit<Staff, 'id'>) {
  const { error } = await supabase.from('staff').insert({
    name: data.name,
    specialization: data.specialization || null,
    location_id: data.locationId,
    location_name: data.locationName,
    email: data.email || null,
    image_url: data.imageUrl || null,
    working_hours: data.workingHours || null,
    user_id: data.userId || null,
  })
  
  if (error) throw error
}

export async function updateStaff(id: string, data: Partial<Omit<Staff, 'id'>>) {
  const updateData: any = {}
  
  if (data.name !== undefined) updateData.name = data.name
  if (data.specialization !== undefined) updateData.specialization = data.specialization || null
  if (data.locationId !== undefined) updateData.location_id = data.locationId
  if (data.locationName !== undefined) updateData.location_name = data.locationName
  if (data.email !== undefined) updateData.email = data.email || null
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl || null
  if (data.workingHours !== undefined) updateData.working_hours = data.workingHours || null
  if (data.userId !== undefined) updateData.user_id = data.userId || null
  
  const { error } = await supabase.from('staff').update(updateData).eq('id', id)
  
  if (error) throw error
}

export async function deleteStaff(id: string) {
  const { error } = await supabase.from('staff').delete().eq('id', id)
  if (error) throw error
}

export async function getStaffByUserId(userId: string): Promise<Staff | null> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // No rows found
    throw error
  }
  
  return {
    id: data.id,
    name: data.name,
    specialization: data.specialization || undefined,
    locationId: data.location_id,
    locationName: data.location_name,
    email: data.email || undefined,
    imageUrl: data.image_url || undefined,
    workingHours: data.working_hours as any,
    userId: data.user_id || undefined,
  }
}

// Bookings
export async function getBookings(locationId?: string): Promise<Booking[]> {
  const now = new Date().toISOString()
  let query = supabase
    .from('bookings')
    .select('*')
    .gte('booking_timestamp', now)
    .order('booking_timestamp', { ascending: true })
  
  if (locationId) {
    query = query.eq('location_id', locationId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  return data.map(row => ({
    id: row.id,
    locationId: row.location_id,
    locationName: row.location_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    servicePrice: row.service_price,
    serviceDuration: row.service_duration,
    staffId: row.staff_id,
    staffName: row.staff_name,
    staffImageUrl: row.staff_image_url || undefined,
    bookingTimestamp: row.booking_timestamp,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientEmail: row.client_email || undefined,
  }))
}

export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('client_phone', phone)
    .order('booking_timestamp', { ascending: false })
  
  if (error) throw error
  
  return data.map(row => ({
    id: row.id,
    locationId: row.location_id,
    locationName: row.location_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    servicePrice: row.service_price,
    serviceDuration: row.service_duration,
    staffId: row.staff_id,
    staffName: row.staff_name,
    staffImageUrl: row.staff_image_url || undefined,
    bookingTimestamp: row.booking_timestamp,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientEmail: row.client_email || undefined,
  }))
}

export async function getBookingsByStaffId(staffId: string): Promise<Booking[]> {
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('staff_id', staffId)
    .gte('booking_timestamp', now)
    .order('booking_timestamp', { ascending: true })
  
  if (error) throw error
  
  return data.map(row => ({
    id: row.id,
    locationId: row.location_id,
    locationName: row.location_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    servicePrice: row.service_price,
    serviceDuration: row.service_duration,
    staffId: row.staff_id,
    staffName: row.staff_name,
    staffImageUrl: row.staff_image_url || undefined,
    bookingTimestamp: row.booking_timestamp,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientEmail: row.client_email || undefined,
  }))
}

export async function addBooking(data: NewBooking) {
  const { error } = await supabase.from('bookings').insert({
    location_id: data.locationId,
    location_name: data.locationName,
    service_id: data.serviceId,
    service_name: data.serviceName,
    service_price: data.servicePrice,
    service_duration: data.serviceDuration,
    staff_id: data.staffId,
    staff_name: data.staffName,
    staff_image_url: data.staffImageUrl || null,
    booking_timestamp: data.bookingTimestamp,
    client_name: data.clientName,
    client_phone: data.clientPhone,
    client_email: data.clientEmail || null,
  })
  
  if (error) throw error
}

export async function deleteBooking(id: string) {
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw error
}

// Admins
export async function getAdminUser(userId: string, email: string): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // No rows found
    throw error
  }
  
  return {
    id: data.id,
    userId: data.user_id,
    email: data.email,
    locationId: data.location_id,
    locationName: data.location_name || undefined,
  }
}

export async function getAdmins(locationId?: string): Promise<AdminUser[]> {
  let query = supabase.from('admins').select('*')
  
  if (locationId) {
    query = query.eq('location_id', locationId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    email: row.email,
    locationId: row.location_id,
    locationName: row.location_name || undefined,
  })).sort((a, b) => {
    if (!a.locationId) return -1 // Super admin on top
    if (!b.locationId) return 1
    return a.email.localeCompare(b.email)
  })
}

export async function setAdminRecord(userId: string, data: { email: string; locationId?: string; locationName?: string }) {
  const { error } = await supabase.from('admins').insert({
    user_id: userId,
    email: data.email,
    location_id: data.locationId || null,
    location_name: data.locationName || null,
  })
  
  if (error) throw error
}

export async function updateAdmin(id: string, data: Partial<Omit<AdminUser, 'id' | 'userId'>>) {
  const updateData: any = {}
  
  if (data.email !== undefined) updateData.email = data.email
  if (data.locationId !== undefined) updateData.location_id = data.locationId
  if (data.locationName !== undefined) updateData.location_name = data.locationName
  
  const { error } = await supabase.from('admins').update(updateData).eq('id', id)
  
  if (error) throw error
}

export async function deleteAdmin(id: string) {
  const { error } = await supabase.from('admins').delete().eq('id', id)
  if (error) throw error
}

// Client Loyalty
export async function getClientLoyaltyData(locationId?: string): Promise<ClientLoyalty[]> {
  let query = supabase.from('bookings').select('*')
  
  if (locationId) {
    query = query.eq('location_id', locationId)
  }
  
  const { data: allBookings, error } = await query
  
  if (error) throw error
  
  const clientsMap = new Map<string, ClientLoyalty>()

  allBookings.forEach(booking => {
    if (!booking.client_phone || booking.client_phone.trim() === '') {
      return
    }
    
    const clientIdentifier = `${booking.client_name.toLowerCase().trim()}-${booking.client_phone.trim()}`

    if (clientsMap.has(clientIdentifier)) {
      const existingClient = clientsMap.get(clientIdentifier)!
      existingClient.totalVisits += 1
      
      if (new Date(booking.booking_timestamp) > new Date(existingClient.lastVisit)) {
        existingClient.lastVisit = booking.booking_timestamp
      }

      if (!existingClient.locations.includes(booking.location_name)) {
        existingClient.locations.push(booking.location_name)
      }
    } else {
      clientsMap.set(clientIdentifier, {
        id: clientIdentifier,
        name: booking.client_name,
        phone: booking.client_phone,
        email: booking.client_email,
        totalVisits: 1,
        lastVisit: booking.booking_timestamp,
        locations: [booking.location_name],
      })
    }
  })

  const clientsArray = Array.from(clientsMap.values())
  clientsArray.sort((a, b) => b.totalVisits - a.totalVisits)

  return clientsArray
}

// Booking availability and scheduling
async function getBookingsForStaffOnDate(staffId: string, date: Date): Promise<Booking[]> {
  const dayStart = startOfDay(date).toISOString()
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  const dayEndStr = dayEnd.toISOString()
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('staff_id', staffId)
    .gte('booking_timestamp', dayStart)
    .lte('booking_timestamp', dayEndStr)
  
  if (error) throw error
  
  return data.map(row => ({
    id: row.id,
    locationId: row.location_id,
    locationName: row.location_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    servicePrice: row.service_price,
    serviceDuration: row.service_duration,
    staffId: row.staff_id,
    staffName: row.staff_name,
    staffImageUrl: row.staff_image_url || undefined,
    bookingTimestamp: row.booking_timestamp,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientEmail: row.client_email || undefined,
  }))
}

async function getBookingsForStaffInRange(staffIds: string[], startDate: Date, endDate: Date): Promise<Booking[]> {
  if (staffIds.length === 0) return []
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .in('staff_id', staffIds)
    .gte('booking_timestamp', startDate.toISOString())
    .lte('booking_timestamp', endDate.toISOString())
  
  if (error) throw error
  
  return data.map(row => ({
    id: row.id,
    locationId: row.location_id,
    locationName: row.location_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    servicePrice: row.service_price,
    serviceDuration: row.service_duration,
    staffId: row.staff_id,
    staffName: row.staff_name,
    staffImageUrl: row.staff_image_url || undefined,
    bookingTimestamp: row.booking_timestamp,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientEmail: row.client_email || undefined,
  }))
}

const checkForConflicts = async (staffId: string, start: Date, end: Date): Promise<boolean> => {
  const existingBookings = await getBookingsForStaffOnDate(staffId, start)

  return existingBookings.some(b => {
    const existingStart = new Date(b.bookingTimestamp)
    const existingEnd = addMinutes(existingStart, b.serviceDuration)
    
    return isBefore(start, existingEnd) && isAfter(end, existingStart)
  })
}

async function getIndividualStaffTimes(
  serviceDuration: number,
  preferredDateStr: string,
  staffMember: Staff
): Promise<string[]> {
  if (!staffMember.workingHours) return []
  
  const preferredDate = new Date(`${preferredDateStr}T00:00:00`)
  if (isNaN(preferredDate.getTime())) {
    return []
  }

  const dayOfWeek = dayMap[getDay(preferredDate)]
  const dayHours = staffMember.workingHours[dayOfWeek]

  if (!dayHours || dayHours === 'off') return []
  
  const workDayStart = parse(dayHours.start, 'HH:mm', preferredDate)
  const workDayEnd = parse(dayHours.end, 'HH:mm', preferredDate)

  const availableSlots: string[] = []
  let potentialSlotStart = workDayStart
  const now = new Date()

  while (isBefore(potentialSlotStart, workDayEnd)) {
    const potentialSlotEnd = addMinutes(potentialSlotStart, serviceDuration)

    if (isAfter(potentialSlotEnd, workDayEnd)) break
    if (isBefore(potentialSlotStart, now)) {
      potentialSlotStart = addMinutes(potentialSlotStart, 15)
      continue
    }
    
    const hasConflict = await checkForConflicts(staffMember.id, potentialSlotStart, potentialSlotEnd)
    if (!hasConflict) {
      availableSlots.push(format(potentialSlotStart, 'HH:mm'))
    }

    potentialSlotStart = addMinutes(potentialSlotStart, 15)
  }
  
  return availableSlots
}

export async function getSuggestedTimes(
  serviceDuration: number,
  preferredDateStr: string,
  staffId: string,
  locationId: string,
) {
  if (staffId === 'any') {
    const allStaffAtLocation = (await getStaff()).filter(s => s.locationId === locationId)
    const allAvailableSlots = new Set<string>()

    const timePromises = allStaffAtLocation.map(staffMember => 
      getIndividualStaffTimes(serviceDuration, preferredDateStr, staffMember)
    )
    const results = await Promise.all(timePromises)

    results.forEach(staffSlots => staffSlots.forEach(slot => allAvailableSlots.add(slot)))

    const sortedSlots = Array.from(allAvailableSlots).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    return { success: true, times: sortedSlots }
  }

  const allStaff = await getStaff()
  const staffMember = allStaff.find(s => s.id === staffId)
  
  if (!staffMember) return { success: true, times: [] }

  const availableSlots = await getIndividualStaffTimes(serviceDuration, preferredDateStr, staffMember)
  return { success: true, times: availableSlots }
}

export async function getUnavailableDays(month: Date, serviceId: string, staffId: string, locationId: string) {
  try {
    const allServices = await getServices()
    const service = allServices.find(s => s.id === serviceId)
    if (!service) return { success: false, unavailableDays: [] }
    
    const serviceDuration = service.duration
    const allStaff = await getStaff()
    const staffToCheck = staffId === 'any'
      ? allStaff.filter(s => s.locationId === locationId)
      : allStaff.filter(s => s.id === staffId)

    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    
    if (staffToCheck.length === 0) {
      const allDays = []
      let day = monthStart
      while (day <= monthEnd) {
        allDays.push(format(day, 'yyyy-MM-dd'))
        day = addDays(day, 1)
      }
      return { success: true, unavailableDays: allDays }
    }

    const allBookingsForMonth = await getBookingsForStaffInRange(staffToCheck.map(s => s.id), monthStart, monthEnd)
    
    const bookingsByDayAndStaff: Record<string, Record<string, Booking[]>> = {}
    allBookingsForMonth.forEach(booking => {
      const dayStr = format(new Date(booking.bookingTimestamp), 'yyyy-MM-dd')
      if (!bookingsByDayAndStaff[dayStr]) {
        bookingsByDayAndStaff[dayStr] = {}
      }
      if (!bookingsByDayAndStaff[dayStr][booking.staffId]) {
        bookingsByDayAndStaff[dayStr][booking.staffId] = []
      }
      bookingsByDayAndStaff[dayStr][booking.staffId].push(booking)
    })

    const unavailableDays: string[] = []
    let currentDay = monthStart
    const today = startOfDay(new Date())

    while (currentDay <= monthEnd) {
      let isDayAvailable = false
      const currentDayStr = format(currentDay, 'yyyy-MM-dd')
      
      for (const staffMember of staffToCheck) {
        const dayOfWeek = dayMap[getDay(currentDay)]
        const dayHours = staffMember.workingHours?.[dayOfWeek]

        if (!dayHours || dayHours === 'off') continue

        const workDayStart = parse(dayHours.start, 'HH:mm', currentDay)
        const workDayEnd = parse(dayHours.end, 'HH:mm', currentDay)
        
        const staffBookingsForDay = bookingsByDayAndStaff[currentDayStr]?.[staffMember.id] || []
        
        let potentialSlotStart = workDayStart
        const now = new Date()
        
        if (isSameDay(currentDay, today)) {
          potentialSlotStart = isBefore(potentialSlotStart, now) ? parse(format(addMinutes(now, 15 - now.getMinutes() % 15), 'HH:mm'), 'HH:mm', currentDay) : potentialSlotStart
        }

        while (isBefore(potentialSlotStart, workDayEnd)) {
          const potentialSlotEnd = addMinutes(potentialSlotStart, serviceDuration)
          if (isAfter(potentialSlotEnd, workDayEnd)) break

          const hasConflict = staffBookingsForDay.some(b => {
            const existingStart = new Date(b.bookingTimestamp)
            const existingEnd = addMinutes(existingStart, b.serviceDuration)
            return isBefore(potentialSlotStart, existingEnd) && isAfter(potentialSlotEnd, existingStart)
          })

          if (!hasConflict) {
            isDayAvailable = true
            break
          }
          potentialSlotStart = addMinutes(potentialSlotStart, 15)
        }
        if (isDayAvailable) break
      }

      if (!isDayAvailable) {
        unavailableDays.push(format(currentDay, 'yyyy-MM-dd'))
      }

      currentDay = addDays(new Date(currentDay.valueOf()), 1)
    }

    return { success: true, unavailableDays }
  } catch (error) {
    console.error("Error fetching unavailable days:", error)
    return { success: false, unavailableDays: [] }
  }
}

type BookingData = {
  locationId: string
  serviceId: string
  staffId: string
  date: Date
  time: string
  clientName: string
  clientPhone: string
  clientEmail?: string
}

export async function createBooking(bookingData: BookingData) {
  if (!bookingData.locationId || !bookingData.serviceId || !bookingData.date || !bookingData.time || !bookingData.clientName || !bookingData.clientPhone) {
    throw new Error("Missing required booking information.")
  }
   
  const allLocations = await getLocations()
  const allServices = await getServices()
  const allStaff = await getStaff()

  const location = allLocations.find(l => l.id === bookingData.locationId)
  const service = allServices.find(s => s.id === bookingData.serviceId)
  
  if (!location || !service) throw new Error("Invalid location or service selected.")

  const datePart = format(bookingData.date, 'yyyy-MM-dd')
  const timePart = bookingData.time
  const bookingTimestampString = `${datePart}T${timePart}:00`

  const bookingStart = new Date(bookingTimestampString)
  if (isNaN(bookingStart.getTime())) throw new Error("Invalid date or time for booking.")
  const bookingEnd = addMinutes(bookingStart, service.duration)
  
  let assignedStaff: Staff | undefined | null = null

  if (bookingData.staffId === 'any') {
    const bookableStaffAtLocation = allStaff.filter(s => s.locationId === bookingData.locationId)
    
    for (const potentialStaff of bookableStaffAtLocation) {
      const dayOfWeek = dayMap[getDay(bookingStart)]
      const dayHours = potentialStaff.workingHours?.[dayOfWeek]
      if (!dayHours || dayHours === 'off') continue

      const workDayStart = parse(dayHours.start, 'HH:mm', bookingData.date)
      const workDayEnd = parse(dayHours.end, 'HH:mm', bookingData.date)

      const bookingStartInDay = parse(timePart, 'HH:mm', bookingData.date)
      const bookingEndInDay = addMinutes(bookingStartInDay, service.duration)

      if (!isBefore(bookingStartInDay, workDayStart) && !isAfter(bookingEndInDay, workDayEnd)) {
        const hasConflict = await checkForConflicts(potentialStaff.id, bookingStart, bookingEnd)
        if (!hasConflict) {
          assignedStaff = potentialStaff
          break
        }
      }
    }

    if (!assignedStaff) throw new Error("No staff are available for the selected time. Please try another time or speak with our receptionist.")

  } else {
    assignedStaff = allStaff.find(s => s.id === bookingData.staffId)
    if (!assignedStaff) throw new Error("The selected staff member could not be found.")
    
    const hasConflict = await checkForConflicts(assignedStaff.id, bookingStart, bookingEnd)
    if (hasConflict) throw new Error("The selected staff member is unavailable for that time. Please choose another time or staff member.")
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
    bookingTimestamp: bookingStart.toISOString(),
    clientName: bookingData.clientName,
    clientPhone: bookingData.clientPhone,
    clientEmail: bookingData.clientEmail || '',
  }

  await addBooking(newBooking)

  if (bookingData.clientEmail) {
    console.log(`Email confirmation would be sent to ${bookingData.clientEmail}`)
  }

  return { success: true }
}