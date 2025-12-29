import { useState, useEffect, useCallback } from 'react';
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

  const saveTransactions = (txns: Transaction[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
    setTransactions(txns);
  };

  const saveMappings = (mappings: CounterpartyMappings) => {
    localStorage.setItem(MAPPINGS_KEY, JSON.stringify(mappings));
    setCounterpartyMappings(mappings);
  };

  const addTransactions = (newTxns: Transaction[]) => {
    // Εφαρμογή αποθηκευμένων αντιστοιχίσεων στις νέες συναλλαγές
    const categorizedTxns = newTxns.map(txn => {
      const savedCategory = counterpartyMappings[txn.counterpartyName];
      return {
        ...txn,
        customCategory: savedCategory || txn.customCategory || categorizeTransaction(txn.description, txn.counterpartyName)
      };
    });

    const existingIds = new Set(transactions.map(t => t.referenceNumber));
    const uniqueNew = categorizedTxns.filter(t => !existingIds.has(t.referenceNumber));
    const merged = [...transactions, ...uniqueNew].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    saveTransactions(merged);
    return uniqueNew.length;
  };

  const updateTransactionCategory = (id: string, category: string, counterpartyName: string) => {
    // Αποθήκευση της αντιστοίχισης
    const newMappings = { ...counterpartyMappings, [counterpartyName]: category };
    saveMappings(newMappings);

    // Ενημέρωση όλων των συναλλαγών με το ίδιο counterpartyName
    const updated = transactions.map(t =>
      t.counterpartyName === counterpartyName ? { ...t, customCategory: category } : t
    );
    saveTransactions(updated);
  };

  const refreshCategories = () => {
    const updated = transactions.map(txn => {
      // Κρατάμε το customCategory αν έχει οριστεί μέσω mapping, αλλιώς ξανατρέχουμε το categorizeTransaction
      const savedCategory = counterpartyMappings[txn.counterpartyName];
      const newCategory = savedCategory || categorizeTransaction(txn.description, txn.counterpartyName);

      // Αν η κατηγορία άλλαξε, την ενημερώνουμε
      if (newCategory !== txn.customCategory) {
        return { ...txn, customCategory: newCategory };
      }
      return txn;
    });

    if (JSON.stringify(updated) !== JSON.stringify(transactions)) {
      saveTransactions(updated);
      return true;
    }
    return false;
  };

  const clearAllTransactions = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTransactions([]);
  };

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
        if (category === 'Μισθοδοσία') return; // Εξαίρεση της μισθοδοσίας από τα έξοδα
        stats[category] = (stats[category] || 0) + Math.abs(txn.amount);
      });

    return Object.entries(stats)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const getTotalBalance = () => {
    if (transactions.length === 0) return 0;
    return transactions[0].accountBalance;
  };

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
