import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { getAdminUser } from '@/lib/dummy-service'
import type { AdminUser } from '@/lib/types'

interface AdminContextType {
  adminUser: AdminUser | null
  loading: boolean
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdminUser = async () => {
      if (user?.email) {
        try {
          const admin = await getAdminUser(user.id, user.email)
          setAdminUser(admin)
        } catch (error) {
          console.error('Error fetching admin user:', error)
          setAdminUser(null)
        }
      } else {
        setAdminUser(null)
      }
      setLoading(false)
    }

    fetchAdminUser()
  }, [user])

  const value = {
    adminUser,
    loading,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}