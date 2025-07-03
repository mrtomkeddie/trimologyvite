'use client';
import * as React from 'react';
import type { Location } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LocationForm } from './location-form';
import { deleteLocation } from '@/lib/firestore';
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
import { PlusCircle, Trash2, Edit, Loader2 } from 'lucide-react';

type LocationsListProps = {
    initialLocations: Location[];
};

export function LocationsList({ initialLocations }: LocationsListProps) {
    const [locations, setLocations] = React.useState(initialLocations);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingLocation, setEditingLocation] = React.useState<Location | null>(null);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const { toast } = useToast();

    const handleFormSubmit = () => {
       // Let revalidation handle UI updates
    };
    
    const handleAddClick = () => {
        setEditingLocation(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (location: Location) => {
        setEditingLocation(location);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            await deleteLocation(id);
            // Revalidation from the server action will trigger a re-render with fresh data.
            // No need to manually update state here.
            toast({ title: 'Success', description: 'Location deleted successfully.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete location.', variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };
    
    React.useEffect(() => {
        setLocations(initialLocations);
    }, [initialLocations]);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-end mb-4">
                <Button onClick={handleAddClick}>
                    <PlusCircle className="mr-2" />
                    Add Location
                </Button>
            </div>
            
            <LocationForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                location={editingLocation}
                onSubmitted={handleFormSubmit}
            />

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {locations.length > 0 ? (
                            locations.map(location => (
                                <TableRow key={location.id}>
                                    <TableCell className="font-medium">{location.name}</TableCell>
                                    <TableCell>{location.address}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(location)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            
                                            <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isDeleting === location.id}>
                                                        {isDeleting === location.id ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the location.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(location.id)}>
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
                                    No locations found. Add your first one!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
