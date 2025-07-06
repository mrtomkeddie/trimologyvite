
'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateLocation } from '@/lib/firestore';
import { type Location } from '@/lib/types';
import { Loader2, UploadCloud, FileImage } from 'lucide-react';
import { uploadLocationQrCode } from '@/lib/storage';
import { Input } from './ui/input';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const QrUploadSchema = z.object({
  imageFile: z.any()
    .refine((files) => files?.length == 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

type QrUploadFormValues = z.infer<typeof QrUploadSchema>;

type QrCodeUploadDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    location: Location;
    onUploadComplete: () => void;
};

export function QrCodeUploadDialog({ isOpen, setIsOpen, location, onUploadComplete }: QrCodeUploadDialogProps) {
    const [isUploading, setIsUploading] = React.useState(false);
    const { toast } = useToast();
    
    const form = useForm<QrUploadFormValues>({
        resolver: zodResolver(QrUploadSchema),
    });

    const onSubmit = async (data: QrUploadFormValues) => {
        setIsUploading(true);
        try {
            const file = data.imageFile[0] as File;
            const downloadUrl = await uploadLocationQrCode(location.id, file);
            
            await updateLocation(location.id, { qrCodeUrl: downloadUrl });

            toast({ title: 'Success', description: 'QR Code uploaded successfully.' });
            onUploadComplete();
            form.reset();

        } catch (error) {
            toast({
                title: 'Upload Failed',
                description: 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload QR Code for {location.name}</DialogTitle>
                    <DialogDescription>
                        Select a QR code image (PNG, JPG) to associate with this location.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="imageFile"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>QR Code Image</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={(e) => field.onChange(e.target.files)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <DialogFooter>
                             <Button type="submit" disabled={isUploading} className="w-full">
                                {isUploading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                )}
                                {isUploading ? 'Uploading...' : 'Upload and Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
