import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Calculator, Calendar, Target, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

interface SavingsGoalCalculatorProps {
    currentBalance: number;
}

const STORAGE_KEY = 'banktrack_savings_goal';

interface SavingsGoalState {
    targetAmount: number;
    useCurrentBalance: boolean;
    manualCurrentAmount: number;
    targetDate: string; // ISO date string YYYY-MM
}

export function SavingsGoalCalculator({ currentBalance }: SavingsGoalCalculatorProps) {
    const [state, setState] = useState<SavingsGoalState>({
        targetAmount: 10000,
        useCurrentBalance: true,
        manualCurrentAmount: 0,
        targetDate: ''
    });

    // Load from local storage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setState({
                    ...parsed,
                    // Ensure compatibility if we add fields later
                });
            } catch (e) {
                console.error("Failed to parse savings goal", e);
            }
        }
    }, []);

    // Save to local storage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const currentAmount = state.useCurrentBalance ? currentBalance : state.manualCurrentAmount;
    const remainingAmount = Math.max(0, state.targetAmount - currentAmount);
    const progress = Math.min(100, Math.max(0, (currentAmount / state.targetAmount) * 100));

    const calculations = useMemo(() => {
        if (!state.targetDate) return null;

        const today = new Date();
        const target = new Date(state.targetDate);

        // Calculate months difference
        const yearsDiff = target.getFullYear() - today.getFullYear();
        const monthsDiff = target.getMonth() - today.getMonth();
        const totalMonths = (yearsDiff * 12) + monthsDiff;

        // We count the current month as a partial month, so let's aim for at least 1 month if it's the same month
        // better logic: difference in milliseconds converted to months roughly, or just simple month diff
        // Assume we want to achieve it by the END of the target month.

        const validMonths = Math.max(0.5, totalMonths); // Avoid division by zero

        const monthlySavings = remainingAmount / validMonths;

        return {
            monthlySavings,
            monthsRemaining: totalMonths
        };
    }, [state.targetDate, remainingAmount]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    return (
        <Card className="bg-gradient-to-br from-card to-secondary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Στόχος Αποταμίευσης
                </CardTitle>
                <PiggyBank className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-6 pt-4">

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Input Section */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="targetAmount">Στόχος (€)</Label>
                            <div className="relative">
                                <Input
                                    id="targetAmount"
                                    type="number"
                                    value={state.targetAmount || ''}
                                    onChange={(e) => setState(s => ({ ...s, targetAmount: parseFloat(e.target.value) || 0 }))}
                                    className="pl-8"
                                />
                                <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="currentAmount">Τρέχον Ποσό</Label>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="use-balance"
                                        checked={state.useCurrentBalance}
                                        onCheckedChange={(checked) => setState(s => ({ ...s, useCurrentBalance: checked }))}
                                    />
                                    <Label htmlFor="use-balance" className="text-xs text-muted-foreground cursor-pointer">
                                        Χρήση Υπολοίπου
                                    </Label>
                                </div>
                            </div>

                            <div className="relative">
                                <Input
                                    id="currentAmount"
                                    type="number"
                                    value={state.useCurrentBalance ? currentBalance.toFixed(2) : (state.manualCurrentAmount || '')}
                                    disabled={state.useCurrentBalance}
                                    onChange={(e) => setState(s => ({ ...s, manualCurrentAmount: parseFloat(e.target.value) || 0 }))}
                                    className="pl-8"
                                />
                                <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="targetDate">Ημερομηνία Στόχου</Label>
                            <div className="relative">
                                <Input
                                    id="targetDate"
                                    type="month"
                                    value={state.targetDate}
                                    onChange={(e) => setState(s => ({ ...s, targetDate: e.target.value }))}
                                    className="pl-10"
                                    min={new Date().toISOString().slice(0, 7)}
                                />
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="flex flex-col justify-center space-y-6 bg-card/50 p-4 rounded-lg border border-border/50">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Πρόοδος</span>
                                <span className="font-bold">{progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>{formatCurrency(currentAmount)}</span>
                                <span>{formatCurrency(state.targetAmount)}</span>
                            </div>
                        </div>

                        {calculations ? (
                            calculations.monthsRemaining > 0 ? (
                                <div className="text-center space-y-2">
                                    <p className="text-sm text-muted-foreground">Για να πετύχετε τον στόχο σας σε {calculations.monthsRemaining} μήνες:</p>
                                    <div className="text-3xl font-bold text-primary">
                                        {formatCurrency(calculations.monthlySavings)} <span className="text-sm font-normal text-muted-foreground">/ μήνα</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-green-600 font-bold">
                                    Η ημερομηνία έχει παρέλθει ή είναι τώρα!
                                </div>
                            )
                        ) : (
                            <div className="text-center text-muted-foreground text-sm italic">
                                Επιλέξτε ημερομηνία για υπολογισμό
                            </div>
                        )}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
