import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/contexts/AdminContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function AdminSettingsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { updatePassword, signOut } = useAuth()
  const { adminUser, loading: adminLoading } = useAdmin()
  const [newPassword, setNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' })
      return
    }
    setIsChangingPassword(true)
    try {
      await updatePassword(newPassword)
      await signOut()
      toast({ title: 'Success', description: 'Password updated. Please log in again with your new password.' })
      navigate('/admin')
    } catch (error) {
      toast({ title: 'Error', description: 'Could not change password. You may need to sign out and sign back in to continue.', variant: 'destructive' })
      setIsChangingPassword(false)
    }
  }

  if (!adminUser) {
    return <Navigate to="/admin" replace />
  }
  
  if (adminLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
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
        <h1 className="font-headline text-xl font-semibold">Account Settings</h1>
      </header>
      <main className="flex flex-1 items-start justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Change Your Password</CardTitle>
            <CardDescription>
              Enter a new password below. You will be signed out after updating it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Must be at least 6 characters"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleChangePassword} disabled={isChangingPassword} className="w-full">
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password and Sign Out
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}