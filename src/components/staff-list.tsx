'use client';
import * as React from 'react';
import type { Staff, Location } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StaffForm } from './staff-form';
import { deleteStaff } from '@/lib/firestore';
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
import { PlusCircle, Trash2, Edit, Loader2, Star, MapPin, KeyRound, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type StaffListProps = {
    initialStaff: Staff[];
    locations: Location[];
    onDataChange: () => void;
};

export function StaffList({ initialStaff, locations, onDataChange }: StaffListProps) {
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingStaff, setEditingStaff] = React.useState<Staff | null>(null);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = React.useState<string>('all');
    const { toast } = useToast();
    
    const handleAddClick = () => {
        setEditingStaff(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (staffMember: Staff) => {
        setEditingStaff(staffMember);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            await deleteStaff(id);
            toast({ title: 'Success', description: 'Staff member deleted successfully.' });
            onDataChange();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete staff member.', variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredStaff = React.useMemo(() => {
        if (selectedLocation === 'all') {
            return initialStaff;
        }
        return initialStaff.filter(s => s.locationId === selectedLocation);
    }, [initialStaff, selectedLocation]);

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
                <p className="text-center text-muted-foreground mb-4">You must add a location before you can add staff.</p>
            )}
            
            <StaffForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                staffMember={editingStaff}
                locations={locations}
                onSubmitted={onDataChange}
            />

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStaff.length > 0 ? (
                            filteredStaff.map(staffMember => (
                                <TableRow key={staffMember.id}>
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
                                     <TableCell>
                                        {staffMember.email ? (
                                            <div className='flex items-center gap-2'>
                                                {staffMember.uid && <KeyRound className="h-4 w-4 text-primary" title="Login Enabled" />}
                                                {staffMember.email}
                                            </div>
                                        ) : (
                                            <span className='text-muted-foreground'>N/A</span>
                                        )}
                                     </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Star className="h-4 w-4 text-muted-foreground" />
                                            {staffMember.specialization}
                                        </div>
                                    </TableCell>
                                     <TableCell>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            {staffMember.locationName}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(staffMember)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            
                                            <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isDeleting === staffMember.id}>
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
                                                        <AlertDialogAction onClick={() => handleDelete(staffMember.id)}>
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
                                     {selectedLocation === 'all' && initialStaff.length === 0 ? 'No staff found. Add your first one!' : 'No staff found for this location.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
