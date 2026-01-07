<template>
  <v-card class="h-100" elevation="0" border>
    <v-card-title class="text-h6 font-weight-bold pa-6 pb-2">Μηνιαία Σύνοψη</v-card-title>
    <v-card-text class="pa-6 pt-2">
      <div style="height: 300px; position: relative;">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

const props = defineProps<{
  data: MonthlyData[];
  onMonthClick?: (month: string) => void;
}>();

const emit = defineEmits(['month-click']);

const formatMonth = (month: string) => {
  const [year, m] = month.split('-');
  const months = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαϊ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
  return `${months[parseInt(m) - 1]} ${year.slice(2)}`;
};

const chartData = computed(() => ({
  labels: props.data.map(d => formatMonth(d.month)),
  datasets: [
    {
      label: 'Έσοδα',
      backgroundColor: '#0ea5e9', // sky-500
      data: props.data.map(d => d.income),
      borderRadius: 4,
      maxBarThickness: 60,
      barPercentage: 0.7,
      categoryPercentage: 0.8,
    },
    {
      label: 'Έξοδα',
      backgroundColor: '#6366f1', // indigo-500
      data: props.data.map(d => d.expenses),
      borderRadius: 4,
      maxBarThickness: 60,
      barPercentage: 0.7,
      categoryPercentage: 0.8,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as any,
    intersect: false,
  },
  onClick: (event: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const month = props.data[index].month;
      emit('month-click', month);
    }
  },
  scales: {
    y: {
      border: { display: false },
      grid: {
        color: '#f3f4f6', // gray-100
      },
      ticks: {
        callback: (value: any) => `€${(value / 1000).toFixed(0)}k`,
        font: { size: 11, family: 'Inter' },
        color: '#6b7280' // gray-500
      },
    },
    x: {
      grid: { display: false },
      ticks: {
        font: { size: 11, family: 'Inter' },
        color: '#6b7280' // gray-500
      }
    }
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        font: { size: 12, family: 'Inter' },
        color: '#374151' // gray-700
      }
    },
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
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  }
};
</script>

<style scoped>
.v-card {
  border-radius: 0.5rem !important;
}
</style>
