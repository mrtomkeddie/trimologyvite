
'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addLocation, updateLocation } from '@/lib/dummy-service';
import { LocationFormSchema, type Location } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type LocationFormValues = z.infer<typeof LocationFormSchema>;

type LocationFormProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    location: Location | null;
    onSubmitted: () => void;
};

export function LocationForm({ isOpen, setIsOpen, location, onSubmitted }: LocationFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();
    
    const form = useForm<LocationFormValues>({
        resolver: zodResolver(LocationFormSchema),
        defaultValues: {
            name: '',
            address: '',
            phone: '',
            email: ''
        }
    });

    React.useEffect(() => {
        if (isOpen) {
            if (location) {
                form.reset({
                    name: location.name,
                    address: location.address,
                    phone: location.phone || '',
                    email: location.email || '',
                });
            } else {
                form.reset({
                    name: '',
                    address: '',
                    phone: '',
                    email: '',
                });
            }
        }
    }, [location, form, isOpen]);

    const onSubmit = async (data: LocationFormValues) => {
        setIsSubmitting(true);
        try {
            const submissionData = {
                ...data,
                phone: data.phone || undefined,
                email: data.email || undefined,
            };

            if (location) {
                await updateLocation(location.id, submissionData);
                toast({ title: 'Success', description: 'Location updated successfully.' });
            } else {
                await addLocation(submissionData);
                toast({ title: 'Success', description: 'Location added successfully.' });
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
                    <DialogTitle>{location ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                    <DialogDescription>
                        {location ? 'Update the details of your location.' : 'Fill in the details for your new location.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Downtown Barber Co." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 123 Main St, Barberville" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., (123) 456-7890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="e.g., contact@downtown.co" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4">
                             <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {location ? 'Save Changes' : 'Add Location'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
