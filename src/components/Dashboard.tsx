import { useState, useMemo, useRef, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Trash2, RefreshCw, Store, Sparkles } from 'lucide-react';
import { StatCard } from './StatCard';
import { MonthlyChart } from './MonthlyChart';
import { CategoryChart } from './CategoryChart';
import { BalanceTrendChart } from './BalanceTrendChart';
import { MerchantAnalysis } from './MerchantAnalysis';
import { TransactionList } from './TransactionList';
import { FileUpload } from './FileUpload';
import { DateRangePicker } from './DateRangePicker';
import { CollapsibleCard } from './ui/CollapsibleCard';

import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { DEMO_TRANSACTIONS } from '@/data/demoTransactions';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

export function Dashboard() {
  const {
    transactions,
    addTransactions,
    updateTransactionCategory,
    refreshCategories,
    clearAllTransactions,
    getMonthlyStats,
    getCategoryStats,
    getTotalBalance,
    getTotalIncome,
    getTotalExpenses,
  } = useTransactions();

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Debounced καταστάσεις (states) για βαριούς υπολογισμούς
  const [debouncedStartDate, setDebouncedStartDate] = useState<Date | undefined>();
  const [debouncedEndDate, setDebouncedEndDate] = useState<Date | undefined>();

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStartDate(startDate);
      setDebouncedEndDate(endDate);
    }, 300);

    return () => clearTimeout(timer);
  }, [startDate, endDate]);

  const datePickerRef = useRef<HTMLDivElement>(null);

  const handleUpload = (data: any[]) => {
    const count = addTransactions(data);
    setTimeout(() => {
      datePickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return count;
  };

  const handleLoadDemoData = () => {
    addTransactions(DEMO_TRANSACTIONS);
    setTimeout(() => {
      datePickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const filteredTransactions = useMemo(() => {
    if (!debouncedStartDate && !debouncedEndDate) return transactions;

    return transactions.filter(txn => {
      const txnDate = new Date(txn.date);
      if (debouncedStartDate && txnDate < debouncedStartDate) return false;
      if (debouncedEndDate) {
        const endOfDay = new Date(debouncedEndDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (txnDate > endOfDay) return false;
      }
      return true;
    });
  }, [transactions, debouncedStartDate, debouncedEndDate]);

  const filteredStats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenses = filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses };
  }, [filteredTransactions]);

  // Υπολογισμός φιλτραρισμένων μηνιαίων στατιστικών
  const filteredMonthlyStats = useMemo(() => {
    const monthlyMap = new Map<string, { income: number; expenses: number }>();

    filteredTransactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expenses: 0 });
      }

      const stats = monthlyMap.get(monthKey)!;
      if (txn.type === 'credit') {
        stats.income += Math.abs(txn.amount);
      } else {
        stats.expenses += Math.abs(txn.amount);
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  // Υπολογισμός φιλτραρισμένων κατηγοριών
  const filteredCategoryStats = useMemo(() => {
    const categoryMap = new Map<string, number>();

    filteredTransactions
      .filter(t => t.type === 'debit')
      .forEach(txn => {
        const category = txn.customCategory || 'Άλλο';
        if (category === 'Μισθοδοσία') return; // Εξαίρεση της μισθοδοσίας από τα έξοδα
        categoryMap.set(category, (categoryMap.get(category) || 0) + Math.abs(txn.amount));
      });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const handleMonthClick = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasData = transactions.length > 0;

  const monthlyStats = useMemo(() => getMonthlyStats(), [getMonthlyStats]);
  const categoryStats = useMemo(() => getCategoryStats(), [getCategoryStats]);
  const totalIncome = useMemo(() => getTotalIncome(), [getTotalIncome]);
  const totalExpenses = useMemo(() => getTotalExpenses(), [getTotalExpenses]);
  const totalBalance = useMemo(() => getTotalBalance(), [getTotalBalance]);

  // Χρήση φιλτραρισμένων δεδομένων όταν υπάρχει φίλτρο
  const hasDateFilter = startDate || endDate;
  const displayMonthlyStats = hasDateFilter ? filteredMonthlyStats : monthlyStats;
  const displayCategoryStats = hasDateFilter ? filteredCategoryStats : categoryStats;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">NBG Analytics</h1>
              <p className="text-xs text-muted-foreground">Ανάλυση Τραπεζικών Κινήσεων</p>
            </div>
          </div>
          {hasData && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCategories}
                className="text-primary hover:text-primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Ανανέωση
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllTransactions}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Καθαρισμός
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <div className="space-y-4">
          {!hasData && (
            <div className="bg-primary/5 rounded-lg border border-primary/20 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Πώς να ξεκινήσετε:</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-background shadow-sm border border-border">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <p className="text-foreground pt-1">Σύνδεση στο Digital Banking της <span className="font-bold text-primary">Εθνικής Τράπεζας Ελλάδος</span></p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-background shadow-sm border border-border">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <p className="text-foreground pt-1">Μεταβείτε στους <span className="font-bold">Λογαριασμούς</span> και επιλέξτε τον λογαριασμό που θέλετε</p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-background shadow-sm border border-border">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <p className="text-foreground pt-1">Πατήστε <span className="font-bold">"Λήψη Excel"</span> από το ιστορικό κινήσεων</p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-background shadow-sm border border-border">
                    <span className="text-primary font-bold">4</span>
                  </div>
                  <p className="text-foreground pt-1">Σύρετε το αρχείο (Drag & Drop) στο πλαίσιο παρακάτω</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dashed border-primary/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>
                    Δεν έχετε πρόχειρο αρχείο; Μπορείτε να δοκιμάσετε την εφαρμογή αμέσως πατώντας{' '}
                    <span className="font-bold text-primary">"Δοκιμή με Demo Δεδομένα"</span> παρακάτω.
                  </span>
                </div>
              </div>
            </div>
          )}
          <FileUpload onUpload={handleUpload} />
          {!hasData && (
            <div className="flex justify-center">
              <Button
                onClick={handleLoadDemoData}
                className="gap-2 bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 shadow-lg px-8 py-6 text-lg transition-all hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                Δοκιμή με Demo Δεδομένα
              </Button>
            </div>
          )}
        </div>

        {hasData && (
          <>
            <div ref={datePickerRef} className="scroll-mt-24">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onClear={clearDateFilter}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Τρέχον Υπόλοιπο"
                value={formatCurrency(totalBalance)}
                icon={Wallet}
              />
              <StatCard
                title="Σύνολο Εσόδων"
                value={formatCurrency(startDate || endDate ? filteredStats.income : totalIncome)}
                icon={TrendingUp}
                trend="up"
              />
              <StatCard
                title="Σύνολο Εξόδων"
                value={formatCurrency(startDate || endDate ? filteredStats.expenses : totalExpenses)}
                icon={TrendingDown}
                trend="down"
              />
              <StatCard
                title="Συναλλαγές"
                value={filteredTransactions.length.toString()}
                subtitle="Συνολικές κινήσεις"
                icon={CreditCard}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MonthlyChart data={displayMonthlyStats} onMonthClick={handleMonthClick} />
              <CategoryChart
                data={displayCategoryStats}
                selectedCategory={selectedCategory}
                onCategoryClick={setSelectedCategory}
              />
            </div>

            {/* Τάση Υπολοίπου - Πάντα ορατή */}
            <div className="mb-8">
              <BalanceTrendChart transactions={filteredTransactions} />
            </div>

            {/* Συναλλαγές - Σε σύμπτυξη */}
            <CollapsibleCard
              title="Συναλλαγές"
              icon={<div className="bg-primary/10 p-1 rounded-full"><TrendingUp className="w-4 h-4 text-primary" /></div>} // Using raw icon here as Search is internal
              defaultOpen={false} // Default κλειστό tab για καλύτερο performance load
              className="mb-8"
            >
              <TransactionList
                transactions={filteredTransactions}
                onCategoryChange={updateTransactionCategory}
                categoryFilter={selectedCategory}
                onCategoryFilterChange={setSelectedCategory}
              />
            </CollapsibleCard>

            {/* Ανάλυση Εμπόρων - Σε σύμπτυξη */}
            <CollapsibleCard
              title="Επαναλαμβανόμενα Έξοδα ανά Merchant"
              icon={<Store className="w-5 h-5 text-primary" />}
              defaultOpen={false}
            >
              <MerchantAnalysis
                transactions={filteredTransactions}
                selectedCategory={selectedCategory}
              />
            </CollapsibleCard>
          </>
        )}

        {!hasData && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Καλωσήρθατε στο NBG Analytics
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ανεβάστε το αρχείο Excel από την τράπεζά σας για να δείτε αναλυτικά
              στατιστικά των συναλλαγών σας.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
