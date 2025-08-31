import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2, Search, Phone, Calendar, Clock, User as UserIcon, PoundSterling, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { getBookingsByPhone } from '@/lib/firestore'

export default function MyVisitsPage() {
  const [phone, setPhone] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) {
      setError('Please enter a phone number.')
      return
    }
    setLoading(true)
    setSearched(true)
    setError(null)
    try {
      const result = await getBookingsByPhone(phone)
      setBookings(result)
    } catch (err) {
      setError('Could not fetch booking history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const { upcomingBookings, pastBookings } = React.useMemo(() => {
    const now = new Date()
    return bookings.reduce((acc, booking) => {
      if (new Date(booking.bookingTimestamp) >= now) {
        acc.upcomingBookings.push(booking)
      } else {
        acc.pastBookings.push(booking)
      }
      return acc
    }, { upcomingBookings: [] as Booking[], pastBookings: [] as Booking[] })
  }, [bookings])

  const hasSearchedAndHasResults = searched && !loading && bookings.length > 0
  const hasSearchedAndNoResults = searched && !loading && bookings.length === 0

  return (
    <div className="flex min-h-dvh w-full flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-2xl">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-center">My Visits</CardTitle>
            <CardDescription className="text-center">
              {searched ? `Showing results for ${phone}` : "Enter your phone number to see your appointment history."}
            </CardDescription>
          </CardHeader>
          
          {!hasSearchedAndHasResults ? (
            <form onSubmit={handleSearch}>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="tel" 
                    placeholder="Enter your phone number..." 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                
                {hasSearchedAndNoResults && (
                  <div className="text-center py-10">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Bookings Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">We couldn't find any bookings associated with that phone number.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  {loading ? 'Searching...' : 'Find My Bookings'}
                </Button>
                {searched && (
                  <Button variant="link" onClick={() => { setSearched(false); setPhone(''); setBookings([]); }} className="w-full mt-2">
                    Search with a different number
                  </Button>
                )}
              </CardFooter>
            </form>
          ) : (
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Upcoming Appointments</h3>
                  {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
                    </div>
                  ) : <p className="text-muted-foreground text-sm">You have no upcoming appointments.</p>}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Past Appointments</h3>
                  {pastBookings.length > 0 ? (
                    <div className="space-y-4">
                      {pastBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
                    </div>
                  ) : <p className="text-muted-foreground text-sm">You have no past appointments recorded.</p>}
                </div>
              </div>
              <Button variant="link" onClick={() => { setSearched(false); setPhone(''); setBookings([]); }} className="w-full mt-6">
                Search with a different number
              </Button>
            </CardContent>
          )}
          <CardFooter className="pt-4 border-t mt-4">
            <Button asChild variant="outline" className="w-full">
              <Link to="/"><ArrowLeft /> Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="flex items-center space-x-4 rounded-lg border p-4 bg-muted/50">
      <div className="flex flex-col items-center justify-center text-center p-2 rounded-md bg-primary/10 w-24">
        <span className="text-sm font-bold text-primary uppercase">{format(new Date(booking.bookingTimestamp), 'MMM')}</span>
        <span className="text-2xl font-bold text-primary">{format(new Date(booking.bookingTimestamp), 'dd')}</span>
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium leading-none">{booking.serviceName}</p>
            <p className="text-sm text-muted-foreground">{booking.locationName}</p>
          </div>
          {booking.servicePrice != null && (
            <div className="flex items-center text-sm font-medium text-primary">
              <PoundSterling className="mr-1 h-4 w-4" />
              {booking.servicePrice.toFixed(2)}
            </div>
          )}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" />
          {format(new Date(booking.bookingTimestamp), 'p')}
        </div>
        <div className="flex items-center pt-1 text-sm text-muted-foreground">
          <UserIcon className="mr-2 h-4 w-4" />
          {booking.staffName}
        </div>
      </div>
    </div>
  )
}