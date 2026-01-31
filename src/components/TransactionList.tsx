import { useState, memo, useEffect, useRef } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Search, Filter, ChevronDown, ChevronUp, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Transaction, DEFAULT_CATEGORIES } from '@/types/transaction';
import { List as FixedSizeList } from 'react-window';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const List = FixedSizeList as any;

interface TransactionListProps {
  transactions: Transaction[];
  onCategoryChange: (id: string, category: string, counterpartyName: string) => void;
  categoryFilter?: string | null;
  onCategoryFilterChange?: (category: string | null) => void;
}

// Custom AutoSizer implementation to avoid 'default export' issues with the library
const AutoSizer = ({
  children
}: {
  children: (props: { width: number; height: number }) => React.ReactNode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {size.width > 0 && size.height > 0 && children(size)}
    </div>
  );
};

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
  const [sortOption, setSortOption] = useState<string>('date-desc');

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('banktrack_transactions_collapsed');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('banktrack_transactions_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

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
  }).sort((a, b) => {
    switch (sortOption) {
      case 'amount-asc': {
        const valA_asc = a.type === 'credit' ? a.amount : -a.amount;
        const valB_asc = b.type === 'credit' ? b.amount : -b.amount;
        return valA_asc - valB_asc;
      }
      case 'amount-desc': {
        const valA_desc = a.type === 'credit' ? a.amount : -a.amount;
        const valB_desc = b.type === 'credit' ? b.amount : -b.amount;
        return valB_desc - valA_desc;
      }
      case 'name-asc': {
        const nameA = a.counterpartyName || a.description || 'Άγνωστη συναλλαγή';
        const nameB = b.counterpartyName || b.description || 'Άγνωστη συναλλαγή';
        return nameA.localeCompare(nameB, 'el');
      }
      case 'date-desc':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const txn = filtered[index];
    if (!txn) return null;

    return (
      <div style={style}>
        <div
          className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors border-b border-border h-full"
        >
          <div className={`p-2 rounded-full flex-shrink-0 ${txn.type === 'credit'
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

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
              {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
            </span>
            <Select
              value={txn.customCategory || 'Άλλο'}
              onValueChange={(val) => onCategoryChange(txn.id, val, txn.counterpartyName)}
            >
              <SelectTrigger className="h-7 w-[150px] text-xs">
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
      </div>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader className={`flex flex-row items-center justify-between ${isCollapsed ? '' : 'pb-2'}`}>
        <div
          className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Συναλλαγές</CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:text-primary" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-4">
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
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Ταξινόμηση" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Πιο πρόσφατα</SelectItem>
                  <SelectItem value="amount-asc">Αύξουσα τιμή</SelectItem>
                  <SelectItem value="amount-desc">Φθίνουσα τιμή</SelectItem>
                  <SelectItem value="name-asc">A-Z</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="h-[400px] border rounded-md bg-card">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>Δεν βρέθηκαν συναλλαγές</p>
              </div>
            ) : (
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    style={{ width, height }}
                    rowCount={filtered.length}
                    rowHeight={100}
                    rowComponent={Row}
                    rowProps={{}}
                  />
                )}
              </AutoSizer>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
});
