
'use client';
import * as React from 'react';
import type { Staff, Location, AdminUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StaffForm } from './staff-form';
import { deleteStaff } from '@/lib/supabase-service';
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
import { PlusCircle, Trash2, Edit, Loader2, Star, MapPin, KeyRound, User, Calendar, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type StaffListProps = {
    staff: Staff[];
    locations: Location[];
    admins: AdminUser[];
    onStaffChanged: () => void;
};

const daysOfWeek = [ 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' ] as const;

export function StaffList({ staff, locations, admins, onStaffChanged }: StaffListProps) {
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingStaff, setEditingStaff] = React.useState<Staff | null>(null);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = React.useState<string>('all');
    const [selectedStaff, setSelectedStaff] = React.useState<Staff | null>(null);
    const { toast } = useToast();
    
    const handleAddClick = () => {
        setEditingStaff(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, staffMember: Staff) => {
        e.stopPropagation();
        setEditingStaff(staffMember);
        setIsFormOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setIsDeleting(id);
        try {
            await deleteStaff(id);
            toast({ title: 'Success', description: 'Staff member deleted successfully.' });
            onStaffChanged();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete staff member.', variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredStaff = React.useMemo(() => {
        if (selectedLocation === 'all') {
            return staff;
        }
        return staff.filter(s => s.locationId === selectedLocation);
    }, [staff, selectedLocation]);

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-4">
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
                <Button onClick={handleAddClick} disabled={locations.length === 0}>
                    <PlusCircle className="mr-2" />
                    Add Staff
                </Button>
            </div>
             {locations.length === 0 && (
                 <Alert variant="default" className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Locations Found</AlertTitle>
                    <AlertDescription>
                        You must add a location in the 'Manage Locations' section before you can create a staff member.
                    </AlertDescription>
                </Alert>
            )}
            
            <StaffForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                staffMember={editingStaff}
                locations={locations}
                admins={admins}
                allStaff={staff}
                onSubmitted={onStaffChanged}
            />

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden sm:table-cell">Email</TableHead>
                            <TableHead className="hidden md:table-cell">Specialization</TableHead>
                            <TableHead className="hidden lg:table-cell">Location</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStaff.length > 0 ? (
                            filteredStaff.map(staffMember => (
                                <TableRow key={staffMember.id} onClick={() => setSelectedStaff(staffMember)} className="cursor-pointer">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={staffMember.imageUrl} alt={staffMember.name} data-ai-hint="person portrait" />
                                                <AvatarFallback>
                                                     <User className="h-5 w-5 text-muted-foreground" />
                                                </AvatarFallback>
                                            </Avatar>
                                            {staffMember.name}
                                        </div>
                                    </TableCell>
                                     <TableCell className="hidden sm:table-cell">
                                        {staffMember.email ? (
                                            <div className='flex items-center gap-2'>
                                                <KeyRound className="h-4 w-4 text-primary" title="Login Enabled" />
                                                {staffMember.email}
                                            </div>
                                        ) : (
                                            <span className='text-muted-foreground'>N/A</span>
                                        )}
                                     </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {staffMember.specialization ? (
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4 text-muted-foreground" />
                                                {staffMember.specialization}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">Not specified</span>
                                        )}
                                    </TableCell>
                                     <TableCell className="hidden lg:table-cell">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            {staffMember.locationName}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="ghost" size="icon" onClick={(e) => handleEditClick(e, staffMember)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            
                                            <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isDeleting === staffMember.id} onClick={(e) => e.stopPropagation()}>
                                                        {isDeleting === staffMember.id ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete this staff member.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={(e) => handleDelete(e, staffMember.id)}>
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
                                <TableCell colSpan={5} className="text-center h-24">
                                     {selectedLocation === 'all' && staff.length === 0 ? 'No staff found. Add your first one!' : 'No staff found for this location.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <Dialog open={!!selectedStaff} onOpenChange={(open) => !open && setSelectedStaff(null)}>
                <DialogContent className="sm:max-w-md">
                    {selectedStaff && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={selectedStaff.imageUrl} alt={selectedStaff.name} data-ai-hint="person portrait" />
                                        <AvatarFallback><User className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <DialogTitle className="text-2xl font-headline">{selectedStaff.name}</DialogTitle>
                                        <DialogDescription>
                                            {selectedStaff.specialization || "Staff Member"} at {selectedStaff.locationName}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="grid gap-4 pt-4">
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Weekly Schedule
                                    </h4>
                                    <div className="space-y-1 text-sm pl-2">
                                        {selectedStaff.workingHours ? daysOfWeek.map(day => {
                                            const hours = selectedStaff.workingHours?.[day];
                                            const isOff = !hours || hours === 'off';
                                            return (
                                                <div key={day} className="flex justify-between">
                                                    <span className="capitalize">{day}</span>
                                                    {isOff ? (
                                                        <span className="text-muted-foreground">Off</span>
                                                    ) : (
                                                        <span className="font-mono text-primary">{hours.start} - {hours.end}</span>
                                                    )}
                                                </div>
                                            )
                                        }) : <p className="text-muted-foreground">No schedule set.</p>}
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                     <h4 className="font-medium text-muted-foreground mb-2">Contact Information</h4>
                                      {selectedStaff.email ? (
                                         <div className="flex items-center gap-3">
                                            <span>{selectedStaff.email}</span>
                                         </div>
                                     ) : (
                                        <p className="text-muted-foreground">No email on file.</p>
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
