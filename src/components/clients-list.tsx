
'use client';
import * as React from 'react';
import type { ClientLoyalty, Location } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { MapPin, User, Phone, Mail, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

type ClientsListProps = {
    initialClients: ClientLoyalty[];
    locations: Location[];
};

export function ClientsList({ initialClients, locations }: ClientsListProps) {
    const [clients, setClients] = React.useState(initialClients);
    const [selectedLocation, setSelectedLocation] = React.useState<string>('all');
    
    React.useEffect(() => {
        setClients(initialClients);
    }, [initialClients]);

    const filteredClients = React.useMemo(() => {
        if (selectedLocation === 'all') {
            return clients;
        }
        return clients.filter(c => c.locations.some(locName => {
            const location = locations.find(l => l.name === locName);
            return location?.id === selectedLocation;
        }));
    }, [clients, selectedLocation, locations]);

    const getTier = (visits: number) => {
        if (visits >= 5) return { name: 'Gold', className: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90', icon: <Award className="h-3 w-3" /> };
        if (visits >= 3) return { name: 'Silver', className: 'bg-slate-300 text-slate-900 hover:bg-slate-300/90', icon: <Award className="h-3 w-3" /> };
        if (visits >= 2) return { name: 'Bronze', className: 'bg-amber-600 text-amber-100 hover:bg-amber-600/90', icon: <Award className="h-3 w-3" /> };
        return null;
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
             {locations.length > 1 && (
                <div className="flex justify-end mb-4">
                    <div className="w-full max-w-xs">
                        <Select onValueChange={setSelectedLocation} value={selectedLocation}>
                            <SelectTrigger>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Filter by location..." />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {locations.map(location => (
                                    <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
            
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Client</TableHead>
                            <TableHead>Total Visits</TableHead>
                            <TableHead>Loyalty Tier</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead className="hidden sm:table-cell">Contact</TableHead>
                            <TableHead className="hidden md:table-cell">Locations Visited</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.length > 0 ? (
                            filteredClients.map(client => {
                                const tier = getTier(client.totalVisits);
                                return (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {client.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-lg text-primary">{client.totalVisits}</TableCell>
                                        <TableCell>
                                            {tier ? (
                                                 <Badge className={`${tier.className} gap-1`}>
                                                    {tier.icon} {tier.name}
                                                 </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">New</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatDistanceToNow(new Date(client.lastVisit), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-sm">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                {client.phone}
                                            </div>
                                            {client.email && (
                                                 <div className="flex items-center gap-2 mt-1">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {client.email}
                                                 </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {client.locations.map(loc => <Badge key={loc} variant="secondary">{loc}</Badge>)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No client data found. Bookings will generate data here.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
