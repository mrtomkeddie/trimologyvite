
'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addService, updateService } from '@/lib/dummy-service';
import { ServiceFormSchema, type Service, type Location } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type ServiceFormValues = z.infer<typeof ServiceFormSchema>;

type ServiceFormProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    service: Service | null;
    locations: Location[];
    onSubmitted: () => void;
};

export function ServiceForm({ isOpen, setIsOpen, service, locations, onSubmitted }: ServiceFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();
    
    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(ServiceFormSchema),
        defaultValues: {
            name: '',
            duration: 0,
            price: 0,
            locationId: '',
        }
    });

    React.useEffect(() => {
        if (isOpen) {
            if (service) {
                form.reset({
                    name: service.name,
                    duration: service.duration,
                    price: service.price,
                    locationId: service.locationId,
                });
            } else {
                form.reset({
                    name: '',
                    duration: 30,
                    price: 50,
                    locationId: '',
                });
            }
        }
    }, [service, form, isOpen]);

    const onSubmit = async (data: ServiceFormValues) => {
        setIsSubmitting(true);
        const location = locations.find(l => l.id === data.locationId);
        if (!location) {
            toast({ title: 'Error', description: 'Invalid location selected.', variant: 'destructive' });
            setIsSubmitting(false);
            return;
        }

        const submissionData = {
            ...data,
            locationName: location.name,
        };

        try {
            if (service) {
                await updateService(service.id, submissionData);
                toast({ title: 'Success', description: 'Service updated successfully.' });
            } else {
                await addService(submissionData);
                toast({ title: 'Success', description: 'Service added successfully.' });
            }
            onSubmitted();
            setIsOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{service ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                    <DialogDescription>
                        {service ? 'Update the details of your service.' : 'Fill in the details for your new service.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="locationId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Assign to a location..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {locations.map((location) => (
                                        <SelectItem key={location.id} value={location.id}>
                                            {location.name}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Classic Haircut" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration (minutes)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 45" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price (£)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 50" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4">
                             <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {service ? 'Save Changes' : 'Add Service'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
