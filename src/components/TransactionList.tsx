import { useState, memo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Transaction, DEFAULT_CATEGORIES } from '@/types/transaction';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TransactionListProps {
  transactions: Transaction[];
  onCategoryChange: (id: string, category: string, counterpartyName: string) => void;
  categoryFilter?: string | null;
  onCategoryFilterChange?: (category: string | null) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(value));
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('el-GR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

export const TransactionList = memo(function TransactionList({
  transactions,
  onCategoryChange,
  categoryFilter: externalCategoryFilter,
  onCategoryFilterChange
}: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [internalCategoryFilter, setInternalCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Χρήση εξωτερικού φίλτρου αν υπάρχει
  const categoryFilter = externalCategoryFilter ?? (internalCategoryFilter === 'all' ? null : internalCategoryFilter);

  const handleCategoryFilterChange = (value: string) => {
    if (onCategoryFilterChange) {
      onCategoryFilterChange(value === 'all' ? null : value);
    } else {
      setInternalCategoryFilter(value);
    }
  };

  const filtered = transactions.filter(txn => {
    const matchesSearch =
      txn.description.toLowerCase().includes(search.toLowerCase()) ||
      txn.counterpartyName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || txn.customCategory === categoryFilter;
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Αναζήτηση..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-[200px]"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Τύπος" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλα</SelectItem>
              <SelectItem value="debit">Χρέωση</SelectItem>
              <SelectItem value="credit">Πίστωση</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter ?? 'all'} onValueChange={handleCategoryFilterChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Κατηγορία" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλες</SelectItem>
              {DEFAULT_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[400px] border rounded-md">
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Δεν βρέθηκαν συναλλαγές</p>
            </div>
          ) : (
            filtered.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
              >
                <div className={`p-2 rounded-full ${txn.type === 'credit'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
                  }`}>
                  {txn.type === 'credit'
                    ? <ArrowDownCircle className="w-5 h-5" />
                    : <ArrowUpCircle className="w-5 h-5" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {txn.counterpartyName || txn.description || 'Άγνωστη συναλλαγή'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {txn.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(txn.date)} • {txn.time}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </span>
                  <Select
                    value={txn.customCategory || 'Άλλο'}
                    onValueChange={(val) => onCategoryChange(txn.id, val, txn.counterpartyName)}
                  >
                    <SelectTrigger className="h-7 w-[120px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
