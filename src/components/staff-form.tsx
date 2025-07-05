
'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDesc } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addStaffWithLogin, updateStaff } from '@/lib/firestore';
import { StaffFormSchema, type Staff, type Location } from '@/lib/types';
import { Loader2, User } from 'lucide-react';
import { uploadStaffImage } from '@/lib/storage';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Switch } from './ui/switch';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info } from 'lucide-react';


type StaffFormValues = z.infer<typeof StaffFormSchema>;

type StaffFormProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    staffMember: Staff | null;
    locations: Location[];
    onSubmitted: () => void;
};

export function StaffForm({ isOpen, setIsOpen, staffMember, locations, onSubmitted }: StaffFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();
    
    const form = useForm<StaffFormValues>({
        resolver: zodResolver(StaffFormSchema),
        defaultValues: {
            id: undefined,
            name: '',
            specialization: '',
            locationId: '',
            email: '',
            password: '',
            imageUrl: '',
            imageFile: undefined,
            isBookable: true,
        }
    });

    React.useEffect(() => {
        if (isOpen) {
            if (staffMember) {
                form.reset({
                    id: staffMember.id,
                    name: staffMember.name,
                    specialization: staffMember.specialization,
                    locationId: staffMember.locationId,
                    email: staffMember.email || '',
                    password: '', // Never show existing password
                    imageUrl: staffMember.imageUrl || '',
                    imageFile: undefined,
                    isBookable: staffMember.isBookable !== false, // default to true if undefined
                });
            } else {
                form.reset({
                    id: undefined,
                    name: '',
                    specialization: '',
                    locationId: '',
                    email: '',
                    password: '',
                    imageUrl: '',
                    imageFile: undefined,
                    isBookable: true,
                });
            }
        }
    }, [staffMember, form, isOpen]);

    const onSubmit = async (data: StaffFormValues) => {
        setIsSubmitting(true);
        const location = locations.find(l => l.id === data.locationId);
        if (!location) {
            toast({ title: 'Error', description: 'Invalid location selected.', variant: 'destructive' });
            setIsSubmitting(false);
            return;
        }

        try {
            const imageFile = data.imageFile?.[0] as File | undefined;
            
            if (staffMember) { // --- UPDATE PATH ---
                let finalImageUrl = staffMember.imageUrl || '';
                if (imageFile) {
                    finalImageUrl = await uploadStaffImage(staffMember.id, imageFile);
                }

                const submissionData: Partial<Staff> = {
                    name: data.name,
                    specialization: data.specialization,
                    locationId: data.locationId,
                    locationName: location.name,
                    imageUrl: finalImageUrl,
                    isBookable: data.isBookable,
                };
                
                await updateStaff(staffMember.id, submissionData);
                toast({ title: 'Success', description: 'Staff member updated successfully.' });

            } else { // --- CREATE PATH ---
                 let imageUrl = '';
                 const tempId = `staff-${Date.now()}`;
                 if (imageFile) {
                    imageUrl = await uploadStaffImage(tempId, imageFile);
                 }
                
                 await addStaffWithLogin({
                    name: data.name,
                    specialization: data.specialization,
                    locationId: data.locationId,
                    email: data.email,
                    password: data.password,
                    imageUrl: imageUrl,
                    isBookable: data.isBookable,
                 });
                 toast({ title: 'Success', description: 'Staff member added successfully.'});
            }
            
            onSubmitted();
            setIsOpen(false);
        } catch (error) {
            console.error("Form submission error:", error);
            const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please check the console for details.';
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentImageUrl = form.watch('imageUrl');
    const isCreating = !staffMember;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{isCreating ? 'Add New Staff Member' : 'Edit Staff Member'}</DialogTitle>
                    <DialogDescription>
                        {isCreating ? 'Create a profile and login for a new staff member.' : 'Update the details of this staff member.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-6 pl-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pl-4">
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
                             <FormField
                                control={form.control}
                                name="imageFile"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Staff Photo</FormLabel>
                                    {currentImageUrl && !field.value?.[0] && (
                                    <div className="mt-2">
                                        <Avatar className="h-24 w-24">
                                        <AvatarImage src={currentImageUrl} alt={form.getValues('name')} />
                                        <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                                        </Avatar>
                                    </div>
                                    )}
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={(e) => field.onChange(e.target.files)}
                                            className="pt-2 text-sm file:text-primary file:font-semibold"
                                        />
                                    </FormControl>
                                    <FormDesc>
                                        {currentImageUrl ? 'Upload a new file to replace the current photo.' : 'Max file size: 5MB.'}
                                    </FormDesc>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
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
                                name="isBookable"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Available for Client Booking</FormLabel>
                                        <FormDesc>
                                            If enabled, clients can book appointments with this staff member.
                                        </FormDesc>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                            
                           <div className='space-y-4 rounded-md border border-input p-4 bg-muted/50'>
                                <h4 className="text-sm font-medium">{isCreating ? 'Create Staff Login' : 'Staff Login Details'}</h4>
                                {isCreating && (
                                    <Alert variant="default" className="bg-background">
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Action Required</AlertTitle>
                                        <AlertDescription>
                                            You must provide an email and a temporary password to create a login for this new staff member.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Login Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="staff.member@example.com" {...field} disabled={!isCreating} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {isCreating && (
                                     <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Temporary Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Min. 6 characters" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                {!isCreating && (
                                    <FormDesc className="text-xs">
                                        To change a password, the staff member must use the "Forgot Password" link on the Staff Login page.
                                    </FormDesc>
                                )}
                           </div>

                            <div className="flex justify-end pt-4 pb-4">
                                 <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isCreating ? 'Add Staff Member' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
