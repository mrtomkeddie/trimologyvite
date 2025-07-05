
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ManageLocationsPage() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
             <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href="/admin">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Admin</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-semibold">Location Management</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                 <Card className="w-full max-w-lg text-center shadow-lg">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                         <CardTitle className="font-headline text-2xl">Feature Locked</CardTitle>
                        <CardDescription>
                           For security and data integrity, location management is handled directly in the Firebase database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                           This feature is restricted. Please contact the primary application administrator to request changes to locations.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
