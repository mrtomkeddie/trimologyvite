import React, { useEffect, useState, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAdmin } from '@/contexts/AdminContext'
import { getBookings, getLocations } from '@/lib/firestore'
import { BookingsList } from '@/components/bookings-list'
import { ArrowLeft, PlusCircle, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Booking, Location } from '@/lib/types'

export default function AdminBookingsPage() {
  const { adminUser } = useAdmin()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!adminUser) return

    setLoading(true)
    setError(null)
    try {
      const [fetchedBookings, fetchedLocations] = await Promise.all([
        getBookings(adminUser.locationId || undefined),
        getLocations(adminUser.locationId || undefined),
      ])
      setBookings(fetchedBookings)
      setLocations(fetchedLocations)
    } catch (e) {
      setError("Failed to fetch booking data. Please try refreshing the page.")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [adminUser])
      
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleBookingsChanged = () => {
    fetchData()
  }

  if (!adminUser) {
    return <Navigate to="/admin" replace />
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-center p-4">
        <div>
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="h-8 w-8">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Admin</span>
            </Link>
          </Button>
          <h1 className="font-headline text-xl font-semibold">View Bookings</h1>
        </div>
        <Button asChild>
          <Link to="/admin/bookings/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <BookingsList 
          bookings={bookings} 
          locations={locations}
          onBookingsChanged={handleBookingsChanged}
        />
      </main>
    </div>
  )
}