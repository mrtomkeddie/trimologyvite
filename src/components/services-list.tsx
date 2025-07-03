
'use client';
import * as React from 'react';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ServiceForm } from './service-form';
import { deleteService } from '@/lib/firestore';
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
import { PlusCircle, Trash2, Edit, Loader2, Clock, DollarSign } from 'lucide-react';

type ServicesListProps = {
    initialServices: Service[];
};

export function ServicesList({ initialServices }: ServicesListProps) {
    const [services, setServices] = React.useState(initialServices);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingService, setEditingService] = React.useState<Service | null>(null);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const { toast } = useToast();

    const handleFormSubmit = () => {
       // Revalidation from server action will handle UI updates
    };
    
    const handleAddClick = () => {
        setEditingService(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (service: Service) => {
        setEditingService(service);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            await deleteService(id);
            toast({ title: 'Success', description: 'Service deleted successfully.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete service.', variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };
    
    React.useEffect(() => {
        setServices(initialServices);
    }, [initialServices]);

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex justify-end mb-4">
                <Button onClick={handleAddClick}>
                    <PlusCircle className="mr-2" />
                    Add Service
                </Button>
            </div>
            
            <ServiceForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                service={editingService}
                onSubmitted={handleFormSubmit}
            />

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.length > 0 ? (
                            services.map(service => (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            {service.duration} min
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            {service.price.toFixed(2)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(service)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            
                                            <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isDeleting === service.id}>
                                                        {isDeleting === service.id ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the service.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(service.id)}>
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
                                <TableCell colSpan={4} className="text-center h-24">
                                    No services found. Add your first one!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
