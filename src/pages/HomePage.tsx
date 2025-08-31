'use client';
import * as React from 'react';
import type { Service, Location } from '@/lib/types';
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
import { PlusCircle, Trash2, Edit, Loader2, Clock, PoundSterling, MapPin, Scissors, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type ServicesListProps = {
    services: Service[];
    locations: Location[];
    onServicesChanged: () => void;
};

export function ServicesList({ services, locations, onServicesChanged }: ServicesListProps) {
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingService, setEditingService] = React.useState<Service | null>(null);
    const [selectedService, setSelectedService] = React.useState<Service | null>(null);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = React.useState<string>('all');
    const { toast } = useToast();

    const handleFormSubmit = () => {
       onServicesChanged();
    };
    
    const handleAddClick = () => {
        setEditingService(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, service: Service) => {
        e.stopPropagation();
        setEditingService(service);
        setIsFormOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setIsDeleting(id);
        try {
            await deleteService(id);
            toast({ title: 'Success', description: 'Service deleted successfully.' });
            onServicesChanged();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete service.', variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };
    
    const handleRowClick = (service: Service) => {
        if (window.innerWidth < 768) { // Only trigger pop-up on mobile
            setSelectedService(service);
        }
    }

    const filteredServices = React.useMemo(() => {
        if (selectedLocation === 'all') {
            return services;
        }
        return services.filter(s => s.locationId === selectedLocation);
    }, [services, selectedLocation]);

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                 <div className="w-full sm:w-auto max-w-xs">
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
                    Add Service
                </Button>
            </div>
             {locations.length === 0 && (
                 <Alert variant="default" className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Locations Found</AlertTitle>
                    <AlertDescription>
                        You must add a location in the 'Manage Locations' section before you can create a service.
                    </AlertDescription>
                </Alert>
            )}
            
            <ServiceForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                service={editingService}
                locations={locations}
                onSubmitted={handleFormSubmit}
            />

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden sm:table-cell">Location</TableHead>
                            <TableHead className="hidden md:table-cell">Duration</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                                <TableRow key={service.id} onClick={() => handleRowClick(service)} className="md:cursor-default cursor-pointer">
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                         <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            {service.locationName}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            {service.duration} min
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <PoundSterling className="h-4 w-4 text-muted-foreground" />
                                            {service.price.toFixed(2)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="ghost" size="icon" onClick={(e) => handleEditClick(e, service)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            
                                            <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isDeleting === service.id} onClick={(e) => e.stopPropagation()}>
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
                                                        <AlertDialogAction onClick={(e) => handleDelete(e, service.id)}>
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
                                    {selectedLocation === 'all' && services.length === 0 ? 'No services found. Add your first one!' : 'No services found for this location.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
                <DialogContent className="sm:max-w-md">
                    {selectedService && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <DialogTitle className="text-2xl font-headline">{selectedService.name}</DialogTitle>
                                        <DialogDescription>
                                           Service Details
                                        </DialogDescription>
                                    </div>
                                    <Badge variant="outline" className="text-lg">£{selectedService.price.toFixed(2)}</Badge>
                                </div>
                            </DialogHeader>
                            <div className="grid gap-4 pt-4">
                                 <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span>{selectedService.locationName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span>{selectedService.duration} minutes</span>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}