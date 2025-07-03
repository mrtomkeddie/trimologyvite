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
import { addStaff, updateStaff } from '@/lib/firestore';
import { StaffFormSchema, type Staff } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type StaffFormValues = z.infer<typeof StaffFormSchema>;

type StaffFormProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    staffMember: Staff | null;
    onSubmitted: () => void;
};

export function StaffForm({ isOpen, setIsOpen, staffMember, onSubmitted }: StaffFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();
    
    const form = useForm<StaffFormValues>({
        resolver: zodResolver(StaffFormSchema),
        defaultValues: {
            name: '',
            specialization: '',
        }
    });

    React.useEffect(() => {
        if (isOpen) {
            if (staffMember) {
                form.reset({
                    name: staffMember.name,
                    specialization: staffMember.specialization,
                });
            } else {
                form.reset({
                    name: '',
                    specialization: '',
                });
            }
        }
    }, [staffMember, form, isOpen]);

    const onSubmit = async (data: StaffFormValues) => {
        setIsSubmitting(true);
        try {
            if (staffMember) {
                await updateStaff(staffMember.id, data);
                toast({ title: 'Success', description: 'Staff member updated successfully.' });
            } else {
                await addStaff(data);
                toast({ title: 'Success', description: 'Staff member added successfully.' });
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{staffMember ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
                    <DialogDescription>
                        {staffMember ? 'Update the details of this staff member.' : 'Fill in the details for a new staff member.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Alex Johnson" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="specialization"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Specialization</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Master Barber" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4">
                             <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {staffMember ? 'Save Changes' : 'Add Staff Member'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
