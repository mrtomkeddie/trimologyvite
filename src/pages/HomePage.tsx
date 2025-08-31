import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookingForm } from '@/components/booking-form'
import { getServices, getStaff, getLocations } from '@/lib/supabase-service'
import { Button } from '@/components/ui/button'
import { History, Loader2 } from 'lucide-react'
import type { Location, Service, Staff } from '@/lib/types'

export default function HomePage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationsData, servicesData, staffData] = await Promise.all([
          getLocations(),
          getServices(),
          getStaff(),
        ])
        setLocations(locationsData)
        setServices(servicesData)
        setStaff(staffData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-10">
        <Button asChild variant="outline">
          <Link to="/my-visits">
            <History className="mr-2 h-4 w-4" />
            My Visits
          </Link>
        </Button>
      </div>
      
      <div className="absolute top-0 left-0 w-full h-full bg-accent/20 blur-3xl -z-10" />
      <main className="w-full max-w-5xl flex flex-col items-center">
        <header className="w-full flex flex-col items-center text-center mb-8">
          <img 
            src="/trimology-logo.png" 
            alt="Trimology Logo" 
            className="w-48 h-auto sm:w-64 mb-4"
          />
        </header>
        <div className="w-full max-w-2xl">
          <BookingForm locations={locations} services={services} staff={staff} />
        </div>
        <footer className="w-full text-center mt-12 text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Trimology. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-4">
            <Link to="/admin" className="hover:text-primary transition-colors">
              Admin Login
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <Link to="/staff/login" className="hover:text-primary transition-colors">
              Staff Login
            </Link>
          </div>
        </footer>
      </main>
    </div>
  )
}