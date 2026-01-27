import { memo, forwardRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryData {
  category: string;
  amount: number;
}

interface CategoryChartProps {
  data: CategoryData[];
  selectedCategory?: string | null;
  onCategoryClick?: (category: string | null) => void;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(198 93% 45%)',
  'hsl(213 93% 55%)',
  'hsl(215 20% 50%)',
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = forwardRef<HTMLDivElement, any>(({ active, payload }, ref) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div ref={ref} className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-primary">{formatCurrency(data.value)}</p>
      </div>
    );
  }
  return null;
});

export const CategoryChart = memo(function CategoryChart({ data, selectedCategory, onCategoryClick }: CategoryChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePieClick = (data: any) => {
    if (onCategoryClick) {
      const clickedCategory = data.category;
      // Toggle: αν είναι ήδη επιλεγμένη, αφαίρεσε το φίλτρο
      onCategoryClick(selectedCategory === clickedCategory ? null : clickedCategory);
    }
  };

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Κατηγορίες Εξόδων</CardTitle>
        {selectedCategory && (
          <button
            onClick={() => onCategoryClick?.(null)}
            className="text-xs text-primary hover:underline"
          >
            Καθαρισμός
          </button>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                onClick={handlePieClick}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry, index) => {
                  const isSelected = selectedCategory === entry.category;
                  const isOther = selectedCategory && !isSelected;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="stroke-background stroke-2 transition-all duration-300 ease-out"
                      opacity={isOther ? 0.3 : 1}
                      style={{
                        filter: isSelected ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'opacity 0.3s ease-out, filter 0.3s ease-out, transform 0.3s ease-out',
                      }}
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ fontSize: 12 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value, entry: any) => {
                  const percent = total > 0 ? ((entry.payload.amount / total) * 100).toFixed(0) : 0;
                  return (
                    <span className="text-xs text-foreground">
                      {value} ({percent}%)
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">Σύνολο Εξόδων</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(total)}</p>
        </div>
      </CardContent>
    </Card>
  );
});
