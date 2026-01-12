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

      <main className="container pb-6 pt-0 space-y-6">
        {!hasData && (
          <div className="text-center pt-8 pb-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="text-2xl font-black text-foreground mb-2 tracking-tight">
              Καλωσήρθατε στο <span className="text-primary">NBG Analytics</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Ο πιο απλός τρόπος για να αποκτήσετε πλήρη εικόνα των οικονομικών σας.
              Ανεβάστε το αρχείο Excel της Εθνικής Τράπεζας και δείτε τις δαπάνες σας να ζωντανεύουν.
            </p>
          </div>
        )}
        <div className="space-y-4">
          {!hasData && (
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-md mb-6 transition-all hover:shadow-lg">
              <div className="bg-primary/5 px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Ξεκινήστε τώρα σε 3 απλά βήματα</h3>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Step 1 */}
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Βήμα 1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Σύνδεση</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">Στο <a href="https://ebanking.nbg.gr/web/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">Digital Banking</a> της Εθνικής Τράπεζας.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Βήμα 2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Λήψη Excel</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 italic">Λογαριασμοί &gt; Λήψη Excel</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Βήμα 3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Ανέβασμα</h4>
                    <p className="text-sm text-muted-foreground">Σύρετε το αρχείο στο πλαίσιο παρακάτω.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <FileUpload onUpload={handleUpload} />
          {!hasData && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 text-muted-foreground animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <span className="text-sm italic">Δεν θέλετε να ανεβάσετε δικό σας προσωπικό αρχείο;</span>
              <Button
                onClick={handleLoadDemoData}
                variant="secondary"
                className="group relative overflow-hidden bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 hover:border-primary/40 transition-all duration-300 px-6"
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                <span className="relative z-10">Δοκιμή με Demo Δεδομένα</span>
                <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
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
      </main>
    </div>
  );
}
