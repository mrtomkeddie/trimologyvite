
'use client';
import * as React from 'react';
import type { Booking, Location } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { deleteBooking } from '@/lib/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2, MapPin, PoundSterling } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type BookingsListProps = {
    initialBookings: Booking[];
    locations: Location[];
};

export function BookingsList({ initialBookings, locations }: BookingsListProps) {
    const [bookings, setBookings] = React.useState(initialBookings);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = React.useState<string>('all');
    const { toast } = useToast();

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            await deleteBooking(id);
            // Revalidation from the server action will trigger a re-render with fresh data.
            toast({ title: 'Success', description: 'Booking deleted successfully.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete booking.', variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };
    
    React.useEffect(() => {
        setBookings(initialBookings);
    }, [initialBookings]);

    const filteredBookings = React.useMemo(() => {
        if (selectedLocation === 'all') {
            return bookings;
        }
        return bookings.filter(b => b.locationId === selectedLocation);
    }, [bookings, selectedLocation]);

    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="flex justify-end mb-4">
                <div className="w-full max-w-xs">
                    <Select onValueChange={setSelectedLocation} value={selectedLocation}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Filter by location..." />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map(location => (
                                <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Staff</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBookings.length > 0 ? (
                            filteredBookings.map(booking => (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-medium">{format(new Date(booking.bookingTimestamp), 'PPP p')}</TableCell>
                                    <TableCell>{booking.clientName}</TableCell>
                                    <TableCell>
                                        <div>{booking.clientPhone}</div>
                                        <div className="text-xs text-muted-foreground">{booking.clientEmail}</div>
                                    </TableCell>
                                    <TableCell>{booking.serviceName}</TableCell>
                                    <TableCell>
                                        {booking.servicePrice != null && (
                                            <div className="flex items-center font-medium">
                                                <PoundSterling className="mr-1 h-3 w-3 text-muted-foreground" />
                                                {booking.servicePrice.toFixed(2)}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>{booking.staffName}</TableCell>
                                    <TableCell>{booking.locationName}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isDeleting === booking.id}>
                                                        {isDeleting === booking.id ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete this booking. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(booking.id)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">
                                    No bookings found for this location.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
