import { useMemo, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Transaction } from '@/types/transaction';

interface BalanceTrendChartProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = forwardRef<HTMLDivElement, any>(({ active, payload, label }, ref) => {
  if (active && payload && payload.length) {
    return (
      <div ref={ref} className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground mb-1">{label}</p>
        <p className="text-sm text-primary">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
});

export function BalanceTrendChart({ transactions }: BalanceTrendChartProps) {
  const { balanceData, monthStartIndices } = useMemo(() => {
    if (transactions.length === 0) return { balanceData: [], monthStartIndices: [] };

    // Ταξινόμηση συναλλαγών χρονολογικά με τις παλαιότερες πρώτα
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Δημιουργία δεδομένων με ημερήσιο υπόλοιπο
    const dailyBalances: { date: string; balance: number; displayDate: string }[] = [];
    const seenDates = new Set<string>();
    const monthStarts: { displayDate: string; monthLabel: string }[] = [];
    let lastMonth: number | null = null;

    sorted.forEach(txn => {
      const dateKey = new Date(txn.date).toISOString().split('T')[0];
      const txnDate = new Date(txn.date);
      const currentMonth = txnDate.getMonth();

      if (!seenDates.has(dateKey)) {
        seenDates.add(dateKey);
        const displayDate = txnDate.toLocaleDateString('el-GR', {
          day: '2-digit',
          month: 'short',
        });

        // Έλεγχος αν είναι η πρώτη ημέρα νέου μήνα
        if (lastMonth !== null && currentMonth !== lastMonth) {
          monthStarts.push({
            displayDate,
            monthLabel: txnDate.toLocaleDateString('el-GR', { month: 'short' }),
          });
        }
        lastMonth = currentMonth;

        dailyBalances.push({
          date: dateKey,
          balance: txn.accountBalance,
          displayDate,
        });
      } else {
        // Ενημέρωση με το τελευταίο υπόλοιπο της ημέρας
        const lastEntry = dailyBalances[dailyBalances.length - 1];
        if (lastEntry && lastEntry.date === dateKey) {
          lastEntry.balance = txn.accountBalance;
        }
      }
    });

    return { balanceData: dailyBalances, monthStartIndices: monthStarts };
  }, [transactions]);

  if (balanceData.length === 0) {
    return null;
  }

  const minBalance = Math.min(...balanceData.map(d => d.balance));
  const maxBalance = Math.max(...balanceData.map(d => d.balance));
  const yDomain = [
    Math.floor(minBalance * 0.95),
    Math.ceil(maxBalance * 1.05),
  ];

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <CardTitle className="text-lg">Εξέλιξη Υπολοίπου</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              {monthStartIndices.map((monthStart, idx) => (
                <ReferenceLine
                  key={idx}
                  x={monthStart.displayDate}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{
                    value: monthStart.monthLabel,
                    position: 'top',
                    fill: 'hsl(var(--primary))',
                    fontSize: 10,
                  }}
                />
              ))}
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
