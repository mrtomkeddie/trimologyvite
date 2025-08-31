import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getLocations, getServices, getStaff } from '@/lib/firestore'
import { WalkinForm } from '@/components/walk-in-form'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Location, Service, Staff } from '@/lib/types'

export default function CheckinPage() {
  const { locationId } = useParams<{ locationId: string }>()
  const [location, setLocation] = useState<Location | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!locationId) {
        setError('Invalid location ID')
        setLoading(false)
        return
      }

      try {
        const [allLocations, allServices, allStaff] = await Promise.all([
          getLocations(),
          getServices(),
          getStaff(),
        ])

        const foundLocation = allLocations.find(l => l.id === locationId)
        
        if (!foundLocation) {
          setError('Location not found')
          setLoading(false)
          return
        }

        setLocation(foundLocation)
        setServices(allServices.filter(s => s.locationId === locationId))
        setStaff(allStaff.filter(s => s.locationId === locationId))
      } catch (err) {
        setError('Failed to load location data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [locationId])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !location) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location Not Found</AlertTitle>
          <AlertDescription>
            The check-in link is invalid. Please scan the QR code at the location again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute top-0 left-0 w-full h-full bg-accent/20 blur-3xl -z-10" />
      <main className="w-full max-w-5xl flex flex-col items-center">
        <header className="w-full flex flex-col items-center text-center mb-8">
          <img 
            src="/trimology-logo.png" 
            alt="Trimology Logo" 
            className="w-48 h-auto sm:w-64 mb-4"
          />
          <h1 className="text-2xl font-headline sm:text-3xl font-bold">Walk-in Check-in</h1>
          <p className="text-lg text-muted-foreground mt-1">for {location.name}</p>
        </header>
        <div className="w-full max-w-2xl">
          {services.length > 0 ? (
            <WalkinForm location={location} services={services} staff={staff} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Services Available</AlertTitle>
              <AlertDescription>
                There are currently no services available for online check-in at this location. Please speak to a member of staff.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  )
}