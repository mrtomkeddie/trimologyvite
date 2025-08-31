import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/contexts/AdminContext'
import { AdminDashboard } from '@/components/admin-dashboard'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { adminUser, loading: adminLoading } = useAdmin()

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !adminUser) {
    return <Navigate to="/admin" replace />
  }

  return <AdminDashboard user={user} adminUser={adminUser} />
}