import { memo, forwardRef, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface MonthlyChartProps {
  data: MonthlyData[];
  onMonthClick: (month: string) => void;
  spendableAmount?: number | null;
}

const formatMonth = (month: string) => {
  const [year, m] = month.split('-');
  const months = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαϊ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
  return `${months[parseInt(m) - 1]} ${year.slice(2)}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const MonthlyChart = memo(function MonthlyChart({ data, onMonthClick, spendableAmount }: MonthlyChartProps) {
  const handleClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0 && onMonthClick) {
      onMonthClick(data.activePayload[0].payload.month);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const netResult = data.income - data.expenses;

      // Check for current month (label is YYYY-MM)
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const isCurrentMonth = label === currentMonthKey;

      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">{formatMonth(label)}</p>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-border">
            <p className={`text-sm font-bold ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Καθαρό: {netResult >= 0 ? '+' : ''}{formatCurrency(netResult)}
            </p>
          </div>

          {isCurrentMonth && spendableAmount !== undefined && spendableAmount !== null && (
            <div className="mt-2 pt-2 border-t border-border border-dashed">
              <p className={`text-sm font-bold ${spendableAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Διαθέσιμο: {formatCurrency(spendableAmount)}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">Κάντε κλικ για φιλτράρισμα</p>
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="col-span-full lg:col-span-2 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Μηνιαία Σύνοψη</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={handleClick}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                className="text-xs fill-muted-foreground"
              />
              <YAxis
                tickFormatter={(v) => {
                  if (v >= 1000) {
                    return `€${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
                  }
                  return `€${v}`;
                }}
                className="text-xs fill-muted-foreground"
              />
              <Tooltip content={<CustomTooltip spendableAmount={spendableAmount} />} />
              <Legend />
              <Bar
                dataKey="income"
                name="Έσοδα"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Έξοδα"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

    </Card>
  );
});
