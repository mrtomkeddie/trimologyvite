import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function BookingConfirmationPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center shadow-2xl">
                <CardHeader className="p-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                        <CheckCircle2 className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-3xl mt-6">Booking Confirmed!</CardTitle>
                    <CardDescription className="text-base">
                        Thank you for choosing SalonFlow. We look forward to seeing you!
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8">
                    <p className="text-muted-foreground text-sm">
                        You will receive a confirmation message shortly. If you have any questions, please feel free to contact us at (123) 456-7890.
                    </p>
                </CardContent>
                <CardFooter className="p-8 pt-4">
                     <Button asChild className="w-full" size="lg">
                        <Link href="/">Book Another Service</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
