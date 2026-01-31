import { useMemo, useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Store, TrendingUp, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MerchantStats {
    name: string;
    count: number;
    totalAmount: number;
    averageAmount: number;
    category: string;
    monthlyHistory: Record<string, { count: number; amount: number }>;
}

interface MerchantAnalysisProps {
    transactions: Transaction[];
    selectedCategory?: string | null;
}

type SortOption = 'amount' | 'count';

export function MerchantAnalysis({ transactions, selectedCategory }: MerchantAnalysisProps) {
    const [sortOption, setSortOption] = useState<SortOption>('amount');

    const merchantStats = useMemo(() => {
        const stats = new Map<string, MerchantStats>();

        transactions
            .filter(t => t.type === 'debit') // Μόνο έξοδα
            .filter(t => t.customCategory !== 'Μισθοδοσία') // Εξαίρεση μισθοδοσίας/εσόδων
            .filter(t => !selectedCategory || (t.customCategory || 'Άλλο') === selectedCategory) // Φίλτρο κατηγορίας
            .forEach(t => {
                // Κανονικοποίηση ονόματος: Αφαίρεση κοινών προθεμάτων αν χρειάζεται ή χρήση counterparty
                // Λογική: Χρήση του counterpartyName αν υπάρχει, αλλιώς καθαρισμός της περιγραφής
                const rawName = t.counterpartyName || t.description;
                const name = rawName.toUpperCase().trim();

                if (!stats.has(name)) {
                    stats.set(name, {
                        name,
                        count: 0,
                        totalAmount: 0,
                        averageAmount: 0,
                        category: t.customCategory || 'Άλλο',
                        monthlyHistory: {}
                    });
                }

                const merchant = stats.get(name)!;
                const amount = Math.abs(t.amount);

                merchant.count += 1;
                merchant.totalAmount += amount;

                // Κλειδί Μήνα YYYY-MM
                const monthKey = `${t.date.getFullYear()} -${String(t.date.getMonth() + 1).padStart(2, '0')} `;
                if (!merchant.monthlyHistory[monthKey]) {
                    merchant.monthlyHistory[monthKey] = { count: 0, amount: 0 };
                }
                merchant.monthlyHistory[monthKey].count += 1;
                merchant.monthlyHistory[monthKey].amount += amount;
            });

        // Υπολογισμός μέσων όρων και φιλτράρισμα για >= 2 συναλλαγές
        return Array.from(stats.values())
            .filter(m => m.count >= 2)
            .map(m => ({
                ...m,
                averageAmount: m.totalAmount / m.count
            }))
            .sort((a, b) => {
                if (sortOption === 'amount') {
                    return b.totalAmount - a.totalAmount;
                }
                return b.count - a.count;
            }); // Ταξινόμηση βάσει συνολικών εξόδων
    }, [transactions, sortOption, selectedCategory]);

    const frequentMerchantsCount = merchantStats.filter(m => m.count >= 5).length;
    const totalRepeatedSpend = merchantStats.reduce((sum, m) => sum + m.totalAmount, 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('el-GR', {
            style: 'currency',
            currency: 'EUR',
        }).format(value);
    };

    if (merchantStats.length === 0) return null;

    const [isCollapsed, setIsCollapsed] = useState(() => {
        const stored = localStorage.getItem('banktrack_merchant_analysis_collapsed');
        return stored ? JSON.parse(stored) : false;
    });

    useEffect(() => {
        localStorage.setItem('banktrack_merchant_analysis_collapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    return (
        <Card className={`shadow-md ${isCollapsed ? '' : 'h-[600px] flex flex-col'}`}>
            <CardHeader className={`flex flex-row items-center justify-between ${isCollapsed ? '' : 'pb-2'}`}>
                <div
                    className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <Store className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Επαναλαμβανόμενα Έξοδα ανά Merchant</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:text-primary" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
            </CardHeader>
            {!isCollapsed && (
                <CardContent className="flex-1 min-h-0 flex flex-col pt-0">
                    <div className="flex flex-col space-y-4 h-full">
                        <div className="flex items-center justify-between shrink-0">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Merchants με 2+ συναλλαγές
                                </p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="ml-auto">
                                        <ArrowUpDown className="mr-2 h-4 w-4" />
                                        {sortOption === 'amount' ? 'Συνολικό Ποσό' : 'Πλήθος Συναλλαγών'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setSortOption('amount')}>
                                        Συνολικό Ποσό
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortOption('count')}>
                                        Πλήθος Συναλλαγών
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="space-y-6 overflow-hidden flex flex-col flex-1">
                            {/* Μπλοκ Μετρικών Σύνοψης */}
                            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border shrink-0">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Σύνολο</p>
                                    <p className="text-xl font-bold">{formatCurrency(totalRepeatedSpend)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-muted-foreground">Συχνοί Merchants</p>
                                    <p className="text-xl font-bold">{frequentMerchantsCount}</p>
                                </div>
                            </div>



                            {/* Λίστα Merchants */}
                            <div className="border rounded-lg overflow-hidden flex-1 min-h-0">
                                <div className="h-full overflow-y-auto divide-y">
                                    {merchantStats.map((merchant) => (
                                        <div key={merchant.name} className="p-4 transition-colors hover:bg-slate-50/50">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">
                                                        {merchant.name}
                                                    </h3>
                                                    <Badge variant="secondary" className="font-normal text-xs px-2 py-0">
                                                        {merchant.category}
                                                    </Badge>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-base font-bold">{formatCurrency(merchant.totalAmount)}</div>
                                                    <div className="text-xs text-muted-foreground">{merchant.count} κινήσεις</div>
                                                </div>
                                            </div>

                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="text-xs text-slate-500">
                                                    Μ.Ο.: <span className="font-medium text-slate-700">{formatCurrency(merchant.averageAmount)}</span>
                                                </div>
                                                {merchant.count >= 5 && (
                                                    <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 bg-red-50 h-5 px-1.5 gap-0.5">
                                                        <TrendingUp className="w-3 h-3" />
                                                        Συχνός
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ιστορικο</div>
                                                <ScrollArea className="w-full whitespace-nowrap pb-2">
                                                    <div className="flex w-max space-x-2">
                                                        {Object.entries(merchant.monthlyHistory)
                                                            .sort((a, b) => b[0].localeCompare(a[0]))
                                                            .map(([month, data]) => (
                                                                <div key={month} className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium bg-secondary/30 text-secondary-foreground border-transparent">
                                                                    {month}: {formatCurrency(data.amount)}
                                                                    <span className="ml-1 opacity-60">({data.count})</span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
