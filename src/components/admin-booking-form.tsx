
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, User, Phone, Mail, Search, Clock, MapPin, PlusCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminBookingFormSchema, type Service, type Staff, type Location, type AdminUser } from '@/lib/types';
import { getSuggestedTimes, createBooking } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type AdminBookingFormValues = z.infer<typeof AdminBookingFormSchema>;

type AdminBookingFormProps = {
  adminUser: AdminUser;
  locations: Location[];
  services: Service[];
  staff: Staff[];
};

export function AdminBookingForm({ adminUser, locations, services, staff }: AdminBookingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [suggestedTimes, setSuggestedTimes] = React.useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isBranchAdmin = !!adminUser.locationId;

  const form = useForm<AdminBookingFormValues>({
    resolver: zodResolver(AdminBookingFormSchema),
    defaultValues: {
      locationId: isBranchAdmin ? adminUser.locationId : undefined,
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      staffId: 'any',
    },
  });

  const locationId = form.watch('locationId');
  const serviceId = form.watch('serviceId');
  const staffId = form.watch('staffId');
  const selectedDate = form.watch('date');

  const selectedLocation = React.useMemo(() => {
    if (!locationId) return null;
    return locations.find((l) => l.id === locationId) || null;
  }, [locationId, locations]);

  const selectedService = React.useMemo(() => {
    if (!serviceId) return null;
    return services.find((s) => s.id === serviceId) || null;
  }, [serviceId, services]);
  
  const filteredServices = React.useMemo(() => {
    if (!locationId) return [];
    return services.filter((s) => s.locationId === locationId);
  }, [locationId, services]);

  const filteredStaff = React.useMemo(() => {
    if (!locationId) return [];
    return staff.filter((s) => s.locationId === locationId);
  }, [locationId, staff]);

  React.useEffect(() => {
    if (!isBranchAdmin) {
      form.resetField('serviceId', { defaultValue: undefined });
      form.resetField('staffId', { defaultValue: 'any' });
      form.resetField('date', { defaultValue: undefined });
      setSuggestedTimes([]);
      form.resetField('time', { defaultValue: undefined });
    }
  }, [locationId, form, isBranchAdmin]);

  React.useEffect(() => {
    setSuggestedTimes([]);
    form.resetField('time', { defaultValue: undefined });
  }, [serviceId, selectedDate, staffId, form]);

  const handleSuggestTimes = async () => {
    if (!selectedService || !selectedDate || !locationId || !staffId) return;
    setIsLoadingTimes(true);
    setSuggestedTimes([]);
    try {
      const result = await getSuggestedTimes(selectedService.duration, format(selectedDate, 'yyyy-MM-dd'), staffId, locationId);
      if (result.success && result.times) {
        setSuggestedTimes(result.times);
        if(result.times.length === 0) {
            toast({
                title: "No Slots Found",
                description: "There are no available slots for this combination of date, service, and staff. Please try another day or staff member.",
                variant: 'destructive',
            });
        }
      } else {
        toast({ title: "Error", description: "Could not fetch available times.", variant: 'destructive' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Error", description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoadingTimes(false);
    }
  };

  async function onSubmit(data: AdminBookingFormValues) {
    setIsSubmitting(true);
    try {
      await createBooking(data);
      toast({ title: "Success", description: "Booking created successfully."});
      router.push('/admin/bookings');
    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      toast({ title: "Booking Failed", description: errorMessage, variant: 'destructive' })
    } finally {
       setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-center">Enter Booking Details</CardTitle>
            <CardDescription className="text-center">Manually add a booking for a client.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isBranchAdmin}>
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                             {selectedLocation ? <span>{selectedLocation.name}</span> : <span className="text-muted-foreground">Choose a location...</span>}
                        </div>
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

            {locationId && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={filteredServices.length === 0}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={filteredServices.length === 0 ? "No services at this location" : "Choose a service..."} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredServices.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} ({service.duration} min)
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
                         <FormLabel>Staff Member</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Any Staff Member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="any">Any Staff Member</SelectItem>
                            {filteredStaff.map((staffMember) => (
                              <SelectItem key={staffMember.id} value={staffMember.id}>
                                {staffMember.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {serviceId && (
                  <div className="space-y-4">
                     <FormLabel>Date & Time</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground' )}
                                  >
                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" onClick={handleSuggestTimes} disabled={!selectedDate || isLoadingTimes} className="h-10">
                        {isLoadingTimes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        {isLoadingTimes ? 'Finding Times...' : 'Find Available Times'}
                      </Button>
                    </div>
                    {suggestedTimes.length > 0 && (
                      <FormField control={form.control} name="time" render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Available Slots:</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {suggestedTimes.map((time) => {
                                  const timeId = `time-${time.replace(':', '')}`;
                                  return (
                                    <FormItem key={timeId} className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value={time} id={timeId} className="sr-only peer" />
                                      </FormControl>
                                       <FormLabel htmlFor={timeId} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary w-full cursor-pointer">
                                        <Clock className="mb-1 h-5 w-5" />
                                        {time}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                })}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
                  <div className="space-y-4">
                    <FormLabel>Client Details</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="clientName" render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder="Client Full Name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="clientPhone" render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder="Client Phone Number" {...field} /></FormControl>
                           <FormDescription>
                             Required for loyalty tracking.
                           </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="clientEmail" render={({ field }) => (
                      <FormItem>
                        <FormControl><Input placeholder="Client Email" {...field} /></FormControl>
                        <FormDescription>
                          Optional. Used for sending the client a booking confirmation.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full font-bold" size="lg" disabled={!form.formState.isValid || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle />}
              {isSubmitting ? 'Creating Booking...' : 'Create Booking'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
