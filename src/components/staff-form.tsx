
'use client';
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDesc } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addStaffWithLogin, updateStaff } from '@/lib/firestore';
import { StaffFormSchema, type Staff, type Location, WorkingHoursSchema } from '@/lib/types';
import { Loader2, User, Info, UploadCloud } from 'lucide-react';
import { uploadStaffImage } from '@/lib/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

type StaffFormValues = z.infer<typeof StaffFormSchema>;

const defaultWorkingHours = WorkingHoursSchema.parse({
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '17:00' },
    saturday: 'off',
    sunday: 'off',
});

const daysOfWeek = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
] as const;


type StaffFormProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    staffMember: Staff | null;
    locations: Location[];
    onSubmitted: () => void;
};

function WorkingHoursFormPart({ control, form }: { control: any, form: any }) {
    const timeOptions = React.useMemo(() => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hour = h.toString().padStart(2, '0');
                const minute = m.toString().padStart(2, '0');
                options.push(`${hour}:${minute}`);
            }
        }
        return options;
    }, []);
    
    const workingHoursValues = useWatch({
        control,
        name: "workingHours",
    });

    return (
        <div className="space-y-4 rounded-md border p-4">
            <h4 className="font-medium text-base">Working Hours</h4>
            <p className="text-sm text-muted-foreground">Set the weekly availability for this staff member. If a day is off, clients cannot book them.</p>
            <div className="space-y-4">
                {daysOfWeek.map((day) => {
                    const fieldName = `workingHours.${day.id}`;
                    const isDayOff = workingHoursValues?.[day.id] === 'off';

                    return (
                        <div key={day.id} className="rounded-lg border bg-background/50 p-3 shadow-sm space-y-2">
                             <Label className="text-base font-semibold">{day.label}</Label>
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                                    <Switch
                                        id={`switch-${day.id}`}
                                        checked={!isDayOff}
                                        onCheckedChange={(checked) => {
                                            form.setValue(fieldName, checked ? { start: '09:00', end: '17:00' } : 'off');
                                        }}
                                    />
                                    <Label htmlFor={`switch-${day.id}`}>{isDayOff ? 'Day Off' : 'Working'}</Label>
                                </div>
                                {!isDayOff && (
                                    <div className="flex items-center gap-2">
                                        <FormField
                                            control={control}
                                            name={`${fieldName}.start`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger className="w-28"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>{timeOptions.map(t => <SelectItem key={`start-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <span className="text-muted-foreground">-</span>
                                        <FormField
                                            control={control}
                                            name={`${fieldName}.end`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger className="w-28"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>{timeOptions.map(t => <SelectItem key={`end-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

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
            workingHours: defaultWorkingHours,
        }
    });

    const imageFile = form.watch('imageFile');
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);

     React.useEffect(() => {
        if (imageFile && imageFile.length > 0 && imageFile[0] instanceof File) {
            const file = imageFile[0];
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);

            return () => {
                URL.revokeObjectURL(previewUrl);
            };
        }
    }, [imageFile]);


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
                    workingHours: staffMember.workingHours || defaultWorkingHours,
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
                    workingHours: defaultWorkingHours,
                });
            }
            setImagePreview(null);
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
                    workingHours: data.workingHours,
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
                    workingHours: data.workingHours,
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
            <DialogContent className="sm:max-w-2xl p-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-[90dvh]">
                         <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
                            <DialogTitle>{isCreating ? 'Add New Staff Member' : 'Edit Staff Member'}</DialogTitle>
                            <DialogDescription>
                                {isCreating ? 'Create a profile and login for a new staff member.' : 'Update the details of this staff member.'}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <ScrollArea className="flex-1 min-h-0">
                             <div className="px-6 py-6 space-y-6">
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
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-24 w-24">
                                                <AvatarImage src={imagePreview || currentImageUrl} alt={form.getValues('name')} />
                                                <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                                            </Avatar>
                                
                                            <FormControl>
                                                <Label 
                                                    htmlFor="imageFile"
                                                    className="flex-grow h-24 w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                                                >
                                                    <div className="flex flex-col items-center justify-center text-center p-2">
                                                        <UploadCloud className="w-6 h-6 mb-1 text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">
                                                            <span className="font-semibold text-primary">Click to upload</span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP</p>
                                                    </div>
                                                    <Input
                                                        id="imageFile"
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/png, image/jpeg, image/webp"
                                                        onChange={(e) => field.onChange(e.target.files)}
                                                    />
                                                </Label>
                                            </FormControl>
                                        </div>
                                        <FormDesc className="pl-28">
                                            Max file size: 5MB.
                                        </FormDesc>
                                        <FormMessage className="pl-28" />
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
                                
                                <WorkingHoursFormPart control={form.control} form={form} />

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
                            </div>
                        </ScrollArea>

                        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
                                <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isCreating ? 'Add Staff Member' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
