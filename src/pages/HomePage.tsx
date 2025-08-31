import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLocations, getServices, getStaff } from '@/lib/dummy-service'
import { BookingForm } from '@/components/booking-form'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar, Users } from 'lucide-react'
import type { Location, Service, Staff } from '@/lib/types'

export default function HomePage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedLocations, fetchedServices, fetchedStaff] = await Promise.all([
          getLocations(),
          getServices(),
          getStaff(),
        ])
        setLocations(fetchedLocations)
        setServices(fetchedServices)
        setStaff(fetchedStaff)
      } catch (e) {
        setError('Failed to load booking data')
        console.error(e)
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-center p-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center bg-background">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-accent/5 -z-10" />
      
      <header className="w-full flex items-center justify-between p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <img 
            src="/trimology-logo.png" 
            alt="Trimology Logo" 
            className="w-32 h-auto sm:w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/my-visits">
              <Calendar className="mr-2 h-4 w-4" />
              My Visits
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-8">
        <div className="w-full max-w-2xl">
          <BookingForm 
            locations={locations}
            services={services}
            staff={staff}
          />
        </div>
      </main>

      <footer className="w-full border-t bg-muted/50 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>© 2025 Trimology. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/staff/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Staff Login
            </Link>
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}