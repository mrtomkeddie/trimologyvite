import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/contexts/AdminContext'
import { AdminLoginForm } from '@/components/admin-login-form'
import { AdminDashboard } from '@/components/admin-dashboard'
import { Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { adminUser, loading: adminLoading } = useAdmin()

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }
  
  if (adminUser && user) {
    return <AdminDashboard user={user} adminUser={adminUser} />
  }

  return <AdminLoginForm />
}