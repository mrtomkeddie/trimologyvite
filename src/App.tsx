import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { AdminProvider } from '@/contexts/AdminContext'

// Pages
import HomePage from '@/pages/HomePage'
import MyVisitsPage from '@/pages/MyVisitsPage'
import BookingConfirmationPage from '@/pages/BookingConfirmationPage'
import CheckInPage from '@/pages/CheckInPage'
import StaffLoginPage from '@/pages/StaffLoginPage'
import MySchedulePage from '@/pages/MySchedulePage'
import AdminLoginPage from '@/pages/AdminLoginPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import AdminBookingsPage from '@/pages/AdminBookingsPage'
import NewBookingPage from '@/pages/NewBookingPage'
import AdminServicesPage from '@/pages/AdminServicesPage'
import AdminStaffPage from '@/pages/AdminStaffPage'
import AdminAdminsPage from '@/pages/AdminAdminsPage'
import AdminLocationsPage from '@/pages/AdminLocationsPage'
import AdminSettingsPage from '@/pages/AdminSettingsPage'

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/my-visits" element={<MyVisitsPage />} />
          <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
          <Route path="/check-in/:locationId" element={<CheckInPage />} />
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/my-schedule" element={<MySchedulePage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/bookings/new" element={<NewBookingPage />} />
          <Route path="/admin/services" element={<AdminServicesPage />} />
          <Route path="/admin/staff" element={<AdminStaffPage />} />
          <Route path="/admin/admins" element={<AdminAdminsPage />} />
          <Route path="/admin/locations" element={<AdminLocationsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Routes>
        <Toaster />
      </AdminProvider>
    </AuthProvider>
  )
}

export default App