
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Database, ArrowLeft } from "lucide-react";
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
                <h1 className="font-headline text-xl font-semibold">Location Management Guide</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center">
                 <Card className="w-full max-w-2xl shadow-lg">
                    <CardHeader>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <Database className="h-6 w-6 text-primary" />
                            </div>
                             <CardTitle className="font-headline text-2xl">Adding Locations in Firestore</CardTitle>
                        </div>
                        <CardDescription>
                           This feature is managed directly in your Firebase database to ensure security and data integrity. Follow the steps below to add a new location.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Step 1: Go to your Firebase Project</h3>
                            <p className="text-muted-foreground text-sm">
                                Open a new browser tab and navigate to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a>. Select your project from the list.
                            </p>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Step 2: Navigate to Firestore</h3>
                            <p className="text-muted-foreground text-sm">
                                In the left-hand navigation menu, click on **Build** &gt; **Firestore Database**.
                            </p>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Step 3: Add a New Location</h3>
                             <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-2">
                                <li>Make sure you have the `locations` collection selected.</li>
                                <li>Click the **+ Add document** button.</li>
                                <li>An ID field will appear. Click **Auto-ID** to let Firestore generate a unique ID for you.</li>
                                <li>Now, add the fields for your new location.</li>
                             </ol>
                        </div>

                         <div>
                            <h3 className="font-semibold mb-2">Step 4: Fill in the Location Details</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Add the following fields and their corresponding values. All fields should be of type `string`.
                            </p>
                            <div className="rounded-md border p-4 text-sm bg-muted/50 space-y-1">
                                <p><strong className="font-mono text-primary">name</strong> (string): The display name of the location (e.g., "Uptown Cuts").</p>
                                <p><strong className="font-mono text-primary">address</strong> (string): The full street address (e.g., "456 High St, Styletown, ST1 2YL").</p>
                                <p><strong className="font-mono text-primary">phone</strong> (string, optional): The contact phone number.</p>
                                <p><strong className="font-mono text-primary">email</strong> (string, optional): The contact email address.</p>
                            </div>
                        </div>

                         <div>
                            <h3 className="font-semibold mb-2">Example</h3>
                             <div className="rounded-md border p-4 bg-muted/50">
                                 <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                                    <code>
{`Document ID: (auto-generated)
  - name: (string) "Soho Salon"
  - address: (string) "10 Fashion Ave, London, W1F 7T"
  - phone: (string) "020 7946 0998"
  - email: (string) "contact@sohosalon.co.uk"`}
                                    </code>
                                 </pre>
                            </div>
                        </div>
                    </CardContent>
                     <CardFooter>
                        <p className="text-xs text-muted-foreground">
                            Once you save the document, the new location will appear in the app automatically. You may need to refresh the page.
                        </p>
                     </CardFooter>
                </Card>
            </main>
        </div>
    );
}
