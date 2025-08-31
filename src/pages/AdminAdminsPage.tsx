import React, { useEffect, useState, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAdmin } from '@/contexts/AdminContext'
import { getAdmins, getLocations, getStaff } from '@/lib/dummy-service'
import { AdminsList } from '@/components/admins-list'
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AdminUser, Location, Staff } from '@/lib/types'

export default function AdminAdminsPage() {
  const { adminUser } = useAdmin()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!adminUser) return
    setLoading(true)
    setError(null)
    try {
      const [fetchedAdmins, fetchedLocations, fetchedStaff] = await Promise.all([
        getAdmins(adminUser.locationId || undefined),
        getLocations(adminUser.locationId || undefined),
        getStaff(adminUser.locationId || undefined)
      ])
      setAdmins(fetchedAdmins)
      setLocations(fetchedLocations)
      setStaff(fetchedStaff)
    } catch (e) {
      setError("Failed to fetch admin data. Please try refreshing the page.")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [adminUser])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDataChange = () => {
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
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Button asChild variant="outline" size="icon" className="h-8 w-8">
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Admin</span>
          </Link>
        </Button>
        <h1 className="font-headline text-xl font-semibold">Manage Admins</h1>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <AdminsList 
          initialAdmins={admins} 
          locations={locations} 
          staff={staff}
          currentUser={adminUser}
          onAdminsChanged={handleDataChange}
        />
      </main>
    </div>
  )
}