
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
import { Trash2, Loader2, MapPin, PoundSterling, User, Calendar, Clock, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

type BookingsListProps = {
    initialBookings: Booking[];
    locations: Location[];
    onDataChange: () => void;
};

export function BookingsList({ initialBookings, locations, onDataChange }: BookingsListProps) {
    const [bookings, setBookings] = React.useState(initialBookings);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = React.useState<string>('all');
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
    const { toast } = useToast();

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent the dialog from opening when deleting
        setIsDeleting(id);
        try {
            await deleteBooking(id);
            toast({ title: 'Success', description: 'Booking deleted successfully.' });
            onDataChange();
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
    
    const handleRowClick = (booking: Booking) => {
        if (window.innerWidth < 768) { // Only trigger pop-up on mobile
            setSelectedBooking(booking);
        }
    }

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
                            <TableHead className="min-w-[150px]">Date & Time</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead className="hidden sm:table-cell">Contact</TableHead>
                            <TableHead className="hidden md:table-cell">Price</TableHead>
                            <TableHead className="hidden lg:table-cell">Staff</TableHead>
                            <TableHead className="hidden xl:table-cell">Location</TableHead>
                            <TableHead className="text-right w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBookings.length > 0 ? (
                            filteredBookings.map(booking => (
                                <TableRow key={booking.id} onClick={() => handleRowClick(booking)} className="md:cursor-default cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        <div className="hidden sm:block whitespace-nowrap">{format(new Date(booking.bookingTimestamp), 'PP p')}</div>
                                        <div className="sm:hidden">
                                            <div>{format(new Date(booking.bookingTimestamp), 'PP')}</div>
                                            <div className="text-sm text-muted-foreground">{format(new Date(booking.bookingTimestamp), 'p')}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{booking.clientName}</TableCell>
                                    <TableCell>{booking.serviceName}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <div>{booking.clientPhone}</div>
                                        <div className="text-xs text-muted-foreground">{booking.clientEmail}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {booking.servicePrice != null && (
                                            <div className="flex items-center font-medium">
                                                <PoundSterling className="mr-1 h-3 w-3 text-muted-foreground" />
                                                {booking.servicePrice.toFixed(2)}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <div className="flex items-center gap-2">
                                            {booking.staffImageUrl ? (
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={booking.staffImageUrl} alt={booking.staffName} data-ai-hint="person portrait" />
                                                    <AvatarFallback>{booking.staffName?.charAt(0) ?? 'S'}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback>
                                                         <User className="h-4 w-4 text-muted-foreground" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            {booking.staffName}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden xl:table-cell">{booking.locationName}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isDeleting === booking.id} onClick={(e) => e.stopPropagation()}>
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
                                                        <AlertDialogAction onClick={(e) => handleDelete(e, booking.id)}>
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

             <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                <DialogContent className="sm:max-w-md">
                    {selectedBooking && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <DialogTitle className="text-2xl font-headline">{selectedBooking.clientName}</DialogTitle>
                                        <DialogDescription>
                                            {format(new Date(selectedBooking.bookingTimestamp), 'eeee, MMMM do, yyyy')}
                                        </DialogDescription>
                                    </div>
                                    <Badge variant="outline" className="text-lg">£{selectedBooking.servicePrice.toFixed(2)}</Badge>
                                </div>
                            </DialogHeader>
                            <div className="grid gap-4 pt-4">
                                 <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                                    <div className='flex items-center gap-3'>
                                        <Clock className="h-5 w-5 text-primary" />
                                        <span className="text-sm text-muted-foreground">Time</span>
                                    </div>
                                    <span className="font-semibold text-base">{format(new Date(selectedBooking.bookingTimestamp), 'p')}</span>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Scissors className="h-4 w-4 text-primary" />
                                        <span>{selectedBooking.serviceName} ({selectedBooking.serviceDuration} mins)</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <User className="h-4 w-4 text-primary" />
                                        <span>{selectedBooking.staffName}</span>
                                    </div>
                                     <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span>{selectedBooking.locationName}</span>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                     <h4 className="font-medium text-muted-foreground mb-2">Contact Information</h4>
                                     <div className="flex items-center gap-3">
                                        <span>{selectedBooking.clientPhone}</span>
                                     </div>
                                      {selectedBooking.clientEmail && (
                                         <div className="flex items-center gap-3">
                                            <span>{selectedBooking.clientEmail}</span>
                                         </div>
                                     )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
