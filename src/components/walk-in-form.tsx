
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Loader2, User, Phone, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Service, Location, Staff } from '@/lib/types';
import { createBooking } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

const WalkinFormSchema = z.object({
    serviceId: z.string({ required_error: 'Please select a service.' }),
    staffId: z.string().optional(),
    clientName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    clientPhone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
    clientEmail: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
});

type WalkinFormValues = z.infer<typeof WalkinFormSchema>;

type WalkinFormProps = {
  location: Location;
  services: Service[];
  staff: Staff[];
};

export function WalkinForm({ location, services, staff }: WalkinFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<WalkinFormValues>({
    resolver: zodResolver(WalkinFormSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      staffId: 'any',
    },
  });

  async function onSubmit(data: WalkinFormValues) {
    setIsSubmitting(true);
    try {
      const now = new Date();

      const bookingData = {
        locationId: location.id,
        serviceId: data.serviceId,
        staffId: data.staffId || 'any',
        date: now,
        time: format(now, 'HH:mm'),
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail || undefined,
      };

      await createBooking(bookingData);
      router.push('/booking-confirmation');
    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : "Something went wrong. Please try again or see a staff member.";
      toast({
        title: "Check-in Failed",
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
       setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="w-full shadow-lg border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-center">Check-in Details</CardTitle>
            <CardDescription className="text-center">Select your service and enter your details to join the queue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
                 <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                        <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a service..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                {service.name} - £{service.price.toFixed(2)} ({service.duration} min)
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
                    name="staffId"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Any Available Staff" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="any">Any Available Staff</SelectItem>
                            {staff.map((staffMember) => (
                              <SelectItem key={staffMember.id} value={staffMember.id}>
                                {staffMember.name} {staffMember.specialization && `(${staffMember.specialization})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="clientName" render={({ field }) => (
                <FormItem>
                    <FormControl>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Full Name" {...field} className="pl-9" />
                    </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="clientPhone" render={({ field }) => (
                <FormItem>
                    <FormControl>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Phone Number" {...field} className="pl-9" />
                    </div>
                    </FormControl>
                    <FormDescription>
                        Required for loyalty points tracking.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )} />
            </div>
            <FormField control={form.control} name="clientEmail" render={({ field }) => (
                <FormItem>
                <FormControl>
                    <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Email (for confirmation)" {...field} className="pl-9" />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )} />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full font-bold" size="lg" disabled={!form.formState.isValid || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Checking In...' : 'Confirm and Join Queue'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
