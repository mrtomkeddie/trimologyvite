import React, { useState, useMemo, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAdmin } from '@/contexts/AdminContext'
import { getClientLoyaltyData, getLocations } from '@/lib/dummy-service'
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClientLoyalty, Location } from '@/lib/types'
import { ClientsList } from '@/components/clients-list-component'

export default function AdminClientsPage() {
  const { adminUser } = useAdmin()
  const [clients, setClients] = useState<ClientLoyalty[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    if (!adminUser) return
    setLoading(true)
    setError(null)
    try {
      const [fetchedClients, fetchedLocations] = await Promise.all([
        getClientLoyaltyData(adminUser.locationId || undefined),
        getLocations(adminUser.locationId || undefined),
      ])
      setClients(fetchedClients)
      setLocations(fetchedLocations)
    } catch (e) {
      setError("Failed to fetch client data. Please try refreshing the page.")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [adminUser])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

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
        <h1 className="font-headline text-xl font-semibold">Client Loyalty</h1>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <ClientsList initialClients={clients} locations={locations} />
      </main>
    </div>
  )
}