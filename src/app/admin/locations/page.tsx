
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import Link from "next/link";

export default function ManageLocationsPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                     <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <Database className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl">Location Management</CardTitle>
                    <CardDescription>
                       This feature is managed by the app provider.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">
                        To add, edit, or remove locations, please manage your data directly in the Firestore database.
                    </p>
                </CardContent>
                <CardContent className="p-6 pt-4">
                     <Button asChild className="w-full">
                        <Link href="/admin">Return to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
