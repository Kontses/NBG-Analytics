<template>
  <v-card v-if="balanceData.length > 0" class="overflow-hidden" elevation="0" border>
    <v-card-title class="d-flex align-center ga-2 pa-6 pb-2">
      <v-icon icon="mdi-trending-up" color="primary" size="small"></v-icon>
      <span class="text-h6 font-weight-bold">Εξέλιξη Υπολοίπου</span>
    </v-card-title>
    <v-card-text class="pa-6 pt-2">
      <div style="height: 300px; position: relative;">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Transaction } from '@/types/transaction';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps<{
  transactions: Transaction[];
}>();

const processedData = computed(() => {
  if (props.transactions.length === 0) return { balanceData: [] };

  const sorted = [...props.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const dailyBalances: { date: string; balance: number; displayDate: string }[] = [];
  const seenDates = new Set<string>();

  sorted.forEach(txn => {
    const dateKey = new Date(txn.date).toISOString().split('T')[0];
    const txnDate = new Date(txn.date);
    
    if (!seenDates.has(dateKey)) {
      seenDates.add(dateKey);
      dailyBalances.push({
        date: dateKey,
        balance: txn.accountBalance,
        displayDate: txnDate.toLocaleDateString('el-GR', { day: '2-digit', month: 'short' }),
      });
    } else {
      const lastEntry = dailyBalances[dailyBalances.length - 1];
      if (lastEntry && lastEntry.date === dateKey) {
        lastEntry.balance = txn.accountBalance;
      }
    }
  });

  return { balanceData: dailyBalances };
});

const balanceData = computed(() => processedData.value.balanceData);

const chartData = computed(() => ({
  labels: balanceData.value.map(d => d.displayDate),
  datasets: [
    {
      label: 'Υπόλοιπο',
      borderColor: '#3b82f6', // blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.1)', // blue-500/10
      data: balanceData.value.map(d => d.balance),
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      borderWidth: 2,
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  scales: {
    y: {
      border: { display: false },
      grid: { color: '#f3f4f6' },
      ticks: {
        callback: (value: any) => `€${(value / 1000).toFixed(0)}k`,
        font: { size: 11, family: 'Inter' },
        color: '#6b7280'
      },
    },
    x: {
      grid: { display: false },
      ticks: {
        maxTicksLimit: 12,
        font: { size: 11, family: 'Inter' },
        color: '#6b7280'
      },
    }
  },
  plugins: {
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#000',
      bodyColor: '#666',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(context.parsed.y);
          }
          return label;
        }
      }
    },
    legend: {
      display: false
    }
  }
};
</script>

<style scoped>
.v-card {
  border-radius: 0.5rem !important;
}
</style>
