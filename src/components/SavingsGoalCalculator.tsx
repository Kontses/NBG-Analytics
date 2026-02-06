import { useState, useEffect, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Target, PiggyBank, Plus, Trash2, Calendar, TrendingUp, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SavingsGoalCalculatorProps {
    currentBalance: number;
    onMonthlyRequiredChange?: (amount: number) => void;
}

const STORAGE_KEY = 'banktrack_savings_wishlist';

interface WishlistItem {
    id: string;
    name: string;
    amount: number;
    targetDate: string; // YYYY-MM
}

interface SavingsState {
    items: WishlistItem[];
    useCurrentBalance: boolean;

    manualCurrentAmount: number;
    isCollapsed?: boolean;
}

export function SavingsGoalCalculator({ currentBalance, onMonthlyRequiredChange }: SavingsGoalCalculatorProps) {
    const [state, setState] = useState<SavingsState>({
        items: [],
        useCurrentBalance: true,

        manualCurrentAmount: 0,
        isCollapsed: false,
    });

    const [newItem, setNewItem] = useState<{ name: string; amount: string; targetDate: string }>({
        name: '',
        amount: '',
        targetDate: ''
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingAmount, setEditingAmount] = useState("");
    const [editingDate, setEditingDate] = useState("");

    // Load from local storage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.items) {
                    setState({ ...parsed });
                } else if (parsed.targetAmount) {
                    setState({
                        items: [{
                            id: crypto.randomUUID(),
                            name: 'Γενικός Στόχος',
                            amount: parsed.targetAmount,
                            targetDate: parsed.targetDate
                        }],
                        useCurrentBalance: parsed.useCurrentBalance ?? true,
                        manualCurrentAmount: parsed.manualCurrentAmount ?? 0
                    });
                }
            } catch (e) {
                console.error("Failed to parse savings goal", e);
            }
        }
    }, []);

    // Save to local storage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const handleAddItem = () => {
        if (!newItem.name || !newItem.amount || !newItem.targetDate) return;

        const item: WishlistItem = {
            id: crypto.randomUUID(),
            name: newItem.name,
            amount: parseFloat(newItem.amount),
            targetDate: newItem.targetDate
        };

        setState(prev => ({ ...prev, items: [...prev.items, item] }));
        setNewItem({ name: '', amount: '', targetDate: '' });
    };

    const handleDeleteItem = (id: string) => {
        setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    };

    const handleStartEdit = (item: WishlistItem) => {
        setEditingId(item.id);
        setEditingName(item.name);
        setEditingAmount(item.amount.toString());
        setEditingDate(item.targetDate);
    };

    const handleSaveEdit = () => {
        if (!editingId || !editingName.trim() || !editingAmount || !editingDate) return;

        setState(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === editingId ? {
                    ...item,
                    name: editingName,
                    amount: parseFloat(editingAmount),
                    targetDate: editingDate
                } : item
            )
        }));
        setEditingId(null);
        setEditingName("");
        setEditingAmount("");
        setEditingDate("");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName("");
        setEditingAmount("");
        setEditingDate("");
    };

    const currentTotalSavings = state.useCurrentBalance ? currentBalance : state.manualCurrentAmount;

    const calculations = useMemo(() => {
        // --- Existing Savings Logic ---
        let totalTarget = 0;
        let totalMonthlyRequired = 0;
        const today = new Date();

        totalTarget = state.items.reduce((sum, item) => sum + item.amount, 0);

        // Sort by date (earliest first) to apply savings to most urgent goals
        // We use String comparison for YYYY-MM-DD which is safe and fast
        const sortedItems = [...state.items].sort((a, b) => a.targetDate.localeCompare(b.targetDate));

        // Waterfall deduction
        let remainingSavings = currentTotalSavings;

        sortedItems.forEach(item => {
            let needed = item.amount;

            // Deduct available savings from this specific item
            if (remainingSavings >= needed) {
                remainingSavings -= needed;
                needed = 0;
            } else {
                needed -= remainingSavings;
                remainingSavings = 0;
            }

            // If we still need money for this item, calculate monthly rate
            if (needed > 0) {
                const target = new Date(item.targetDate);
                // Difference in months. 
                // We use Math.max(1, ...) to avoid division by zero or panic values for current month.
                // If it is this month (diff=0), divide by 1 (pay full amount now).
                const monthsDiff = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
                const validMonths = Math.max(1, monthsDiff);
                totalMonthlyRequired += (needed / validMonths);
            }
        });

        const progress = totalTarget > 0 ? Math.min(100, Math.max(0, (currentTotalSavings / totalTarget) * 100)) : 0;

        return { totalTarget, totalMonthlyRequired, progress };
    }, [state.items, currentTotalSavings]);

    // Notify parent of monthly required amount changes
    useEffect(() => {
        if (onMonthlyRequiredChange) {
            onMonthlyRequiredChange(calculations.totalMonthlyRequired);
        }
    }, [calculations.totalMonthlyRequired, onMonthlyRequiredChange]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    return (
        <Card className="shadow-md">
            <CardHeader className={`flex flex-row items-center justify-between ${state.isCollapsed ? '' : 'pb-2'}`}>
                <div
                    className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setState(s => ({ ...s, isCollapsed: !s.isCollapsed }))}
                >
                    <Target className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl font-bold">Στόχοι Αποταμίευσης</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:text-primary" onClick={() => setState(s => ({ ...s, isCollapsed: !s.isCollapsed }))}>
                    {state.isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
            </CardHeader>

            <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${state.isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                <div className="overflow-hidden">
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* LEFT COLUMN: Wishlist Manager (Inputs + List) */}
                            <div className="space-y-6">

                                {/* Add New Item Form */}
                                <div className="space-y-4 p-4 bg-card rounded-lg border border-border shadow-sm">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 mb-2">
                                        <Plus className="w-4 h-4" /> Προσθήκη Στόχου
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            placeholder="Περιγραφή (π.χ. Διακοπές)"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem(s => ({ ...s, name: e.target.value }))}
                                            className="h-9"
                                        />
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    type="number"
                                                    placeholder="Ποσό"
                                                    value={newItem.amount}
                                                    onChange={(e) => setNewItem(s => ({ ...s, amount: e.target.value }))}
                                                    className="h-9 pl-7"
                                                />
                                                <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">€</span>
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type="date"
                                                    value={newItem.targetDate}
                                                    onChange={(e) => setNewItem(s => ({ ...s, targetDate: e.target.value }))}
                                                    className="h-9 w-[160px] text-xs pl-8"
                                                    min={new Date().toISOString().slice(0, 10)}
                                                />
                                                <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={handleAddItem} disabled={!newItem.name || !newItem.amount || !newItem.targetDate} className="w-full">
                                            Προσθήκη στη Λίστα
                                        </Button>
                                    </div>
                                </div>

                                {/* List of Items */}
                                <ScrollArea className="h-[200px] -mr-4 pr-4">
                                    <div className="space-y-2">
                                        {state.items.length === 0 ? (
                                            <div className="text-center py-6 text-muted-foreground text-sm italic">
                                                Η λίστα σας είναι κενή.
                                            </div>
                                        ) : (
                                            [...state.items]
                                                .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
                                                .map(item => {
                                                    const targetDate = new Date(item.targetDate);
                                                    const isEditing = editingId === item.id;

                                                    return (
                                                        <div key={item.id} className="group flex items-center justify-between p-2.5 rounded-md border bg-card hover:bg-accent/5 transition-all text-sm">
                                                            <div className="flex-1 mr-2">
                                                                {isEditing ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        <Input
                                                                            value={editingName}
                                                                            onChange={(e) => setEditingName(e.target.value)}
                                                                            className="h-7 text-sm"
                                                                            placeholder="Όνομα"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex gap-2 w-full">
                                                                            <Input
                                                                                type="number"
                                                                                value={editingAmount}
                                                                                onChange={(e) => setEditingAmount(e.target.value)}
                                                                                className="h-7 text-sm w-24 shrink-0"
                                                                                placeholder="Ποσό"
                                                                            />
                                                                            <Input
                                                                                type="date"
                                                                                value={editingDate}
                                                                                onChange={(e) => setEditingDate(e.target.value)}
                                                                                className="h-7 text-sm flex-1 min-w-0"
                                                                            />
                                                                            <div className="flex items-center gap-1 ml-auto">
                                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={handleSaveEdit}>
                                                                                    <Check className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={handleCancelEdit}>
                                                                                    <X className="w-4 h-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className="font-medium">{item.name}</div>
                                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {format(targetDate, 'MMM yyyy', { locale: el })}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {!isEditing && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold whitespace-nowrap">{formatCurrency(item.amount)}</span>
                                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                                            onClick={() => handleStartEdit(item)}
                                                                        >
                                                                            <Pencil className="w-3 h-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                                            onClick={() => handleDeleteItem(item.id)}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* RIGHT COLUMN: Summary Results */}
                            <div className="flex flex-col justify-center space-y-6 bg-card p-6 rounded-xl border border-border shadow-sm">

                                {/* Current Balance Settings */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-muted-foreground">Τρέχον Διαθέσιμο Ποσό</Label>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="use-balance-switch" className="text-xs text-muted-foreground cursor-pointer">Αυτόματο</Label>
                                            <Switch
                                                id="use-balance-switch"
                                                checked={state.useCurrentBalance}
                                                onCheckedChange={(checked) => setState(s => ({ ...s, useCurrentBalance: checked }))}
                                                className="scale-75 origin-right"
                                            />
                                        </div>
                                    </div>
                                    <Input
                                        type="number"
                                        value={state.useCurrentBalance ? currentBalance.toFixed(2) : (state.manualCurrentAmount || '')}
                                        disabled={state.useCurrentBalance}
                                        onChange={(e) => setState(s => ({ ...s, manualCurrentAmount: parseFloat(e.target.value) || 0 }))}
                                        className="text-lg font-bold bg-background/50 border-transparent shadow-none"
                                    />
                                </div>

                                <Separator className="bg-border/50" />

                                {/* Progress Stats */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-medium">Πρόοδος</span>
                                        <span className="text-xl font-bold">{calculations.progress.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={calculations.progress} className="h-3" />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{formatCurrency(currentTotalSavings)}</span>
                                        <span>Στόχος: {formatCurrency(calculations.totalTarget)}</span>
                                    </div>
                                </div>

                                {/* Monthly Requirement */}
                                <div className="mt-4 pt-4 text-center">
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Για να πετύχετε <u>όλους</u> τους στόχους:
                                    </p>
                                    <div className="text-4xl font-extrabold text-primary tracking-tight">
                                        {formatCurrency(calculations.totalMonthlyRequired)}
                                        <span className="text-lg font-normal text-muted-foreground ml-1">/ μήνα</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </CardContent>
                </div>
            </div>
        </Card >
    );
}
