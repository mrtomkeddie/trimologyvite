
'use client';
import * as React from 'react';
import type { AdminUser, Location } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminForm } from './admin-form';
import { deleteAdmin } from '@/lib/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Edit, Loader2, Shield, MapPin, Mail, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/firebase';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';

type AdminsListProps = {
    initialAdmins: AdminUser[];
    locations: Location[];
    currentUser: AdminUser | null;
    onDataChange: () => void;
};

export function AdminsList({ initialAdmins, locations, currentUser, onDataChange }: AdminsListProps) {
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingAdmin, setEditingAdmin] = React.useState<AdminUser | null>(null);
    const [selectedAdmin, setSelectedAdmin] = React.useState<AdminUser | null>(null);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const { toast } = useToast();
    const currentUserId = auth.currentUser?.uid;

    const handleFormSubmit = () => {
       onDataChange();
    };
    
    const handleAddClick = () => {
        setEditingAdmin(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, admin: AdminUser) => {
        e.stopPropagation();
        setEditingAdmin(admin);
        setIsFormOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (id === currentUserId) {
            toast({ title: 'Error', description: 'You cannot delete your own admin account.', variant: 'destructive' });
            return;
        }
        setIsDeleting(id);
        try {
            await deleteAdmin(id);
            toast({ title: 'Success', description: 'Admin permissions revoked successfully.' });
            onDataChange();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete admin.', variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };
    
    const handleRowClick = (admin: AdminUser) => {
        if (window.innerWidth < 768) { // Only trigger pop-up on mobile
            setSelectedAdmin(admin);
        }
    }

    if (!currentUser) return null;

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex justify-end mb-4">
                <Button onClick={handleAddClick}>
                    <PlusCircle className="mr-2" />
                    Add Admin
                </Button>
            </div>
            
            <AdminForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                admin={editingAdmin}
                locations={locations}
                onSubmitted={handleFormSubmit}
                currentUser={currentUser}
            />

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead className="hidden sm:table-cell">Role</TableHead>
                            <TableHead className="hidden md:table-cell">Assigned Location</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialAdmins.length > 0 ? (
                            initialAdmins.map(admin => (
                                <TableRow key={admin.uid} onClick={() => handleRowClick(admin)} className="md:cursor-default cursor-pointer">
                                    <TableCell className="font-medium">{admin.email}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        {admin.locationId ? (
                                            <Badge variant="secondary">Branch Admin</Badge>
                                        ) : (
                                            <Badge variant="default" className="flex items-center w-fit">
                                                <Shield className="mr-1 h-3 w-3" />
                                                Super Admin
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {admin.locationName ? (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                {admin.locationName}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">All Locations</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="ghost" size="icon" onClick={(e) => handleEditClick(e, admin)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            
                                            <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isDeleting === admin.uid || admin.uid === currentUserId} onClick={(e) => e.stopPropagation()}>
                                                        {isDeleting === admin.uid ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently revoke admin permissions for this user. It will not delete their login account.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={(e) => handleDelete(e, admin.uid)}>
                                                            Revoke Permissions
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No admins found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

             <Dialog open={!!selectedAdmin} onOpenChange={(open) => !open && setSelectedAdmin(null)}>
                <DialogContent className="sm:max-w-md">
                    {selectedAdmin && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback className="text-2xl"><User /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start">
                                        <DialogTitle className="text-2xl font-headline">{selectedAdmin.locationId ? 'Branch Admin' : 'Super Admin'}</DialogTitle>
                                        <DialogDescription>{selectedAdmin.email}</DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="grid gap-4 pt-4">
                                <Separator />
                                <div className="space-y-2 text-sm">
                                     <h4 className="font-medium text-muted-foreground mb-2">Permissions</h4>
                                     <div className="flex items-center gap-3">
                                        <Shield className="h-4 w-4 text-primary" />
                                        <span>{selectedAdmin.locationId ? 'Branch Admin' : 'Super Admin'}</span>
                                     </div>
                                      {selectedAdmin.locationName && (
                                         <div className="flex items-center gap-3">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <span>{selectedAdmin.locationName}</span>
                                         </div>
                                     )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
