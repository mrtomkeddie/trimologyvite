'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, User, Phone, Mail, Search, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
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
import { BookingFormSchema, type Service, type Staff } from '@/lib/types';
import { getSuggestedTimes, createBooking } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type BookingFormValues = z.infer<typeof BookingFormSchema>;

type BookingFormProps = {
  services: Service[];
  staff: Staff[];
};

export function BookingForm({ services, staff }: BookingFormProps) {
  const { toast } = useToast();
  const [suggestedTimes, setSuggestedTimes] = React.useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      staffId: 'any',
    },
  });

  const serviceId = form.watch('serviceId');
  const selectedDate = form.watch('date');

  const selectedService = React.useMemo(() => {
    if (!serviceId) return null;
    return services.find((s) => s.id === serviceId) || null;
  }, [serviceId, services]);

  React.useEffect(() => {
    setSuggestedTimes([]);
    form.resetField('time', { defaultValue: undefined });
  }, [serviceId, selectedDate, form]);

  const handleSuggestTimes = async () => {
    if (!selectedService || !selectedDate) return;

    setIsLoadingTimes(true);
    setSuggestedTimes([]);
    try {
      const result = await getSuggestedTimes(selectedService.duration, format(selectedDate, 'yyyy-MM-dd'));
      if (result.success && result.times) {
        setSuggestedTimes(result.times);
        if(result.times.length === 0) {
            toast({
                title: "No Slots Available",
                description: "No available time slots for the selected date. Please try another day.",
                variant: 'destructive',
            });
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not fetch available times.",
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTimes(false);
    }
  };

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    try {
      await createBooking(data);
      // The redirect is handled by the server action
    } catch(e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
       setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full shadow-lg border-2 border-primary/10">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-center">Book an Appointment</CardTitle>
        <CardDescription className="text-center">Follow the steps below to secure your spot.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-headline text-xl">1. Select Your Service</h3>
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
                            {service.name} - ${service.price} ({service.duration} min)
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
                          <SelectValue placeholder="Any Staff Member" />
                        </Trigger>
                      </FormControl>
                      <SelectContent>
                         <SelectItem value="any">Any Staff Member</SelectItem>
                        {staff.map((staffMember) => (
                          <SelectItem key={staffMember.id} value={staffMember.id}>
                            {staffMember.name} ({staffMember.specialization})
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
                <h3 className="font-headline text-xl">2. Choose Date & Time</h3>
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
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
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
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Available Slots:</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-3 gap-2"
                          >
                            {suggestedTimes.map((time) => {
                              const timeId = `time-${time}`;
                              return (
                              <FormItem key={timeId} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={time} id={timeId} className="sr-only peer" />
                                </FormControl>
                                <FormLabel htmlFor={timeId} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary w-full cursor-pointer">
                                  <Clock className="mb-1 h-5 w-5"/>
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

            {form.watch("time") && (
                 <div className="space-y-4">
                 <h3 className="font-headline text-xl">3. Your Details</h3>
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
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="clientEmail" render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Email (Optional)" {...field} className="pl-9" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                 </div>
            )}
           
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={!form.formState.isValid || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
