import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, CategoryMapping } from '@/types/transaction';
import { categorizeTransaction } from '@/utils/excelParser';

const STORAGE_KEY = 'banktrack_transactions';
const MAPPINGS_KEY = 'banktrack_counterparty_mappings';

// Αποθηκεύει τις αντιστοιχίσεις counterpartyName -> category
type CounterpartyMappings = Record<string, string>;

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [counterpartyMappings, setCounterpartyMappings] = useState<CounterpartyMappings>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedMappings = localStorage.getItem(MAPPINGS_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTransactions(parsed.map((t: any) => ({
        ...t,
        date: new Date(t.date)
      })));
    }

    if (storedMappings) {
      setCounterpartyMappings(JSON.parse(storedMappings));
    }

    setIsLoading(false);
  }, []);

  const saveTransactions = useCallback((txns: Transaction[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
    setTransactions(txns);
  }, []);

  const saveMappings = useCallback((mappings: CounterpartyMappings) => {
    localStorage.setItem(MAPPINGS_KEY, JSON.stringify(mappings));
    setCounterpartyMappings(mappings);
  }, []);

  const addTransactions = useCallback((newTxns: Transaction[]) => {
    // Εφαρμογή αποθηκευμένων αντιστοιχίσεων στις νέες συναλλαγές
    // ΠΡΟΣΟΧΗ: Χρησιμοποιούμε functional update για να έχουμε πρόσβαση στα τελευταία counterpartyMappings
    let newCount = 0;

    setCounterpartyMappings(currentMappings => {
      const categorizedTxns = newTxns.map(txn => {
        const savedCategory = currentMappings[txn.counterpartyName];
        return {
          ...txn,
          customCategory: savedCategory || txn.customCategory || categorizeTransaction(txn.description, txn.counterpartyName)
        };
      });

      setTransactions(currentTransactions => {
        const existingIds = new Set(currentTransactions.map(t => t.referenceNumber));
        const uniqueNew = categorizedTxns.filter(t => !existingIds.has(t.referenceNumber));
        newCount = uniqueNew.length;

        const merged = [...currentTransactions, ...uniqueNew].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });

      return currentMappings;
    });

    return newCount;
  }, []);

  const updateTransactionCategory = useCallback((id: string, category: string, counterpartyName: string) => {
    setCounterpartyMappings(prevMappings => {
      const newMappings = { ...prevMappings, [counterpartyName]: category };
      localStorage.setItem(MAPPINGS_KEY, JSON.stringify(newMappings));
      return newMappings;
    });

    setTransactions(prevTransactions => {
      const updated = prevTransactions.map(t =>
        t.counterpartyName === counterpartyName ? { ...t, customCategory: category } : t
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshCategories = useCallback(() => {
    let hasChanges = false;
    setTransactions(currentTransactions => {
      setCounterpartyMappings(currentMappings => {
        const updated = currentTransactions.map(txn => {
          const savedCategory = currentMappings[txn.counterpartyName];
          const newCategory = savedCategory || categorizeTransaction(txn.description, txn.counterpartyName);

          if (newCategory !== txn.customCategory) {
            hasChanges = true;
            return { ...txn, customCategory: newCategory };
          }
          return txn;
        });

        if (hasChanges) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return currentMappings; // Mappings didn't change
        }

        return currentMappings;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return hasChanges ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').map((t: any) => ({ ...t, date: new Date(t.date) })) : currentTransactions;
    });

    return hasChanges;
  }, []);

  const clearAllTransactions = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTransactions([]);
  }, []);

  const getMonthlyStats = useCallback(() => {
    const stats: Record<string, { income: number; expenses: number; balance: number }> = {};

    transactions.forEach(txn => {
      const monthKey = `${txn.date.getFullYear()}-${String(txn.date.getMonth() + 1).padStart(2, '0')}`;

      if (!stats[monthKey]) {
        stats[monthKey] = { income: 0, expenses: 0, balance: 0 };
      }

      const amount = Math.abs(txn.amount);
      if (txn.type === 'credit') {
        stats[monthKey].income += amount;
      } else {
        stats[monthKey].expenses += amount;
      }
      stats[monthKey].balance = stats[monthKey].income - stats[monthKey].expenses;
    });

    return Object.entries(stats)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const getCategoryStats = useCallback(() => {
    const stats: Record<string, number> = {};

    transactions
      .filter(t => t.type === 'debit')
      .forEach(txn => {
        const category = txn.customCategory || 'Άλλο';
        if (category === 'Μισθοδοσία') return;
        stats[category] = (stats[category] || 0) + Math.abs(txn.amount);
      });

    return Object.entries(stats)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const getTotalBalance = useCallback(() => {
    if (transactions.length === 0) return 0;
    return transactions[0].accountBalance;
  }, [transactions]);

  const getTotalIncome = useCallback(() => {
    return transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  const getTotalExpenses = useCallback(() => {
    return transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  return {
    transactions,
    isLoading,
    addTransactions,
    updateTransactionCategory,
    refreshCategories,
    clearAllTransactions,
    getMonthlyStats,
    getCategoryStats,
    getTotalBalance,
    getTotalIncome,
    getTotalExpenses,
  };
}
