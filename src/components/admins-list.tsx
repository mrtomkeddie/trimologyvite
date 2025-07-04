
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
import { PlusCircle, Trash2, Edit, Loader2, Shield, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/firebase';

type AdminsListProps = {
    initialAdmins: AdminUser[];
    locations: Location[];
};

export function AdminsList({ initialAdmins, locations }: AdminsListProps) {
    const [admins, setAdmins] = React.useState(initialAdmins);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingAdmin, setEditingAdmin] = React.useState<AdminUser | null>(null);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const { toast } = useToast();
    const currentUserId = auth.currentUser?.uid;

    const handleFormSubmit = () => {
       // Let revalidation handle UI updates
    };
    
    const handleAddClick = () => {
        setEditingAdmin(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (admin: AdminUser) => {
        setEditingAdmin(admin);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (id === currentUserId) {
            toast({ title: 'Error', description: 'You cannot delete your own admin account.', variant: 'destructive' });
            return;
        }
        setIsDeleting(id);
        try {
            await deleteAdmin(id);
            toast({ title: 'Success', description: 'Admin permissions revoked successfully.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete admin.', variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };
    
    React.useEffect(() => {
        setAdmins(initialAdmins);
    }, [initialAdmins]);

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
            />

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Assigned Location</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admins.length > 0 ? (
                            admins.map(admin => (
                                <TableRow key={admin.uid}>
                                    <TableCell className="font-medium">{admin.email}</TableCell>
                                    <TableCell>
                                        {admin.locationId ? (
                                            <Badge variant="secondary">Branch Admin</Badge>
                                        ) : (
                                            <Badge variant="default" className="flex items-center w-fit">
                                                <Shield className="mr-1 h-3 w-3" />
                                                Super Admin
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
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
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(admin)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            
                                            <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isDeleting === admin.uid || admin.uid === currentUserId}>
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
                                                        <AlertDialogAction onClick={() => handleDelete(admin.uid)}>
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
        </div>
    );
}
