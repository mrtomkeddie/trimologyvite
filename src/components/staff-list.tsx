'use client';
import * as React from 'react';
import type { Staff } from '@/lib/types';
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
import { PlusCircle, Trash2, Edit, Loader2, Star } from 'lucide-react';

type StaffListProps = {
    initialStaff: Staff[];
};

export function StaffList({ initialStaff }: StaffListProps) {
    const [staff, setStaff] = React.useState(initialStaff);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingStaff, setEditingStaff] = React.useState<Staff | null>(null);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const { toast } = useToast();

    const handleFormSubmit = () => {
       // Revalidation from server action will handle UI updates
    };
    
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
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete staff member.', variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };
    
    React.useEffect(() => {
        setStaff(initialStaff);
    }, [initialStaff]);

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex justify-end mb-4">
                <Button onClick={handleAddClick}>
                    <PlusCircle className="mr-2" />
                    Add Staff
                </Button>
            </div>
            
            <StaffForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                staffMember={editingStaff}
                onSubmitted={handleFormSubmit}
            />

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.length > 0 ? (
                            staff.map(staffMember => (
                                <TableRow key={staffMember.id}>
                                    <TableCell className="font-medium">{staffMember.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Star className="h-4 w-4 text-muted-foreground" />
                                            {staffMember.specialization}
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
                                <TableCell colSpan={3} className="text-center h-24">
                                    No staff found. Add your first one!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
