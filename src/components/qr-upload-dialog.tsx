
'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateLocation } from '@/lib/firestore';
import { type Location } from '@/lib/types';
import { Loader2, UploadCloud } from 'lucide-react';
import { uploadLocationQrCode } from '@/lib/storage';
import { Input } from './ui/input';
import { Label } from './ui/label';

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
                                <FormLabel>QR Code Image File</FormLabel>
                                <FormControl>
                                    <Label 
                                        htmlFor="qr-file-upload"
                                        className="relative flex h-48 w-full flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                         {imagePreview ? (
                                            <Image
                                                src={imagePreview}
                                                alt="QR Code Preview"
                                                layout="fill"
                                                objectFit="contain"
                                                className="rounded-lg p-2"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center p-2 text-muted-foreground">
                                                <UploadCloud className="w-8 h-8 mb-2" />
                                                <p className="font-semibold text-primary">Click to upload or drag &amp; drop</p>
                                                <p className="text-xs mt-1">PNG, JPG, or WEBP (max 2MB)</p>
                                            </div>
                                        )}
                                        <Input 
                                            id="qr-file-upload"
                                            type="file" 
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={(e) => field.onChange(e.target.files)}
                                        />
                                    </Label>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <DialogFooter>
                             <Button type="submit" disabled={isUploading || !imageFile} className="w-full">
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
