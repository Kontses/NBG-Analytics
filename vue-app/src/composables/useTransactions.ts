import { ref, onMounted } from 'vue';
import { Transaction } from '@/types/transaction';
import { categorizeTransaction } from '@/utils/excelParser';

const STORAGE_KEY = 'banktrack_transactions';
const MAPPINGS_KEY = 'banktrack_counterparty_mappings';

type CounterpartyMappings = Record<string, string>;

export function useTransactions() {
    const transactions = ref<Transaction[]>([]);
    const counterpartyMappings = ref<CounterpartyMappings>({});
    const isLoading = ref(true);

    const saveTransactions = (txns: Transaction[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
        transactions.value = txns;
    };

    const saveMappings = (mappings: CounterpartyMappings) => {
        localStorage.setItem(MAPPINGS_KEY, JSON.stringify(mappings));
        counterpartyMappings.value = mappings;
    };

    onMounted(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const storedMappings = localStorage.getItem(MAPPINGS_KEY);

        if (stored) {
            const parsed = JSON.parse(stored);
            transactions.value = parsed.map((t: any) => ({
                ...t,
                date: new Date(t.date)
            }));
        }

        if (storedMappings) {
            counterpartyMappings.value = JSON.parse(storedMappings);
        }

        isLoading.value = false;
    });

    const addTransactions = (newTxns: Transaction[]) => {
        const categorizedTxns = newTxns.map(txn => {
            const savedCategory = counterpartyMappings.value[txn.counterpartyName];
            return {
                ...txn,
                customCategory: savedCategory || txn.customCategory || categorizeTransaction(txn.description, txn.counterpartyName)
            };
        });

        const existingIds = new Set(transactions.value.map(t => t.referenceNumber));
        const uniqueNew = categorizedTxns.filter(t => !existingIds.has(t.referenceNumber));
        const merged = [...transactions.value, ...uniqueNew].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        saveTransactions(merged);
        return uniqueNew.length;
    };

    const updateTransactionCategory = (id: string, category: string, counterpartyName: string) => {
        const newMappings = { ...counterpartyMappings.value, [counterpartyName]: category };
        saveMappings(newMappings);

        const updated = transactions.value.map(t =>
            t.counterpartyName === counterpartyName ? { ...t, customCategory: category } : t
        );
        saveTransactions(updated);
    };

    const refreshCategories = () => {
        const updated = transactions.value.map(txn => {
            const savedCategory = counterpartyMappings.value[txn.counterpartyName];
            const newCategory = savedCategory || categorizeTransaction(txn.description, txn.counterpartyName);

            if (newCategory !== txn.customCategory) {
                return { ...txn, customCategory: newCategory };
            }
            return txn;
        });

        if (JSON.stringify(updated) !== JSON.stringify(transactions.value)) {
            saveTransactions(updated);
            return true;
        }
        return false;
    };

    const clearAllTransactions = () => {
        localStorage.removeItem(STORAGE_KEY);
        transactions.value = [];
    };

    const getMonthlyStats = () => {
        const stats: Record<string, { income: number; expenses: number; balance: number }> = {};

        transactions.value.forEach(txn => {
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
    };

    const getCategoryStats = () => {
        const stats: Record<string, number> = {};

        transactions.value
            .filter(t => t.type === 'debit')
            .forEach(txn => {
                const category = txn.customCategory || 'Άλλο';
                if (category === 'Μισθοδοσία') return;
                stats[category] = (stats[category] || 0) + Math.abs(txn.amount);
            });

        return Object.entries(stats)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    };

    const getTotalBalance = () => {
        if (transactions.value.length === 0) return 0;
        return transactions.value[0].accountBalance;
    };

    const getTotalIncome = () => {
        return transactions.value
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    };

    const getTotalExpenses = () => {
        return transactions.value
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    };

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
