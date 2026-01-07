<template>
  <v-card class="h-100" elevation="0" border>
    <v-card-title class="d-flex justify-space-between align-center pa-6 pb-2">
      <span class="text-h6 font-weight-bold">Κατηγορίες Εξόδων</span>
      <v-btn
        v-if="selectedCategory"
        variant="text"
        density="compact"
        color="primary"
        class="text-caption text-none pa-0 h-auto"
        @click="$emit('category-click', null)"
      >
        Καθαρισμός
      </v-btn>
    </v-card-title>
    <v-card-text class="pa-6 pt-2">
      <div style="height: 300px; position: relative;">
        <!-- Χρήση Doughnut αντί για Pie -->
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryData {
  category: string;
  amount: number;
}

const props = defineProps<{
  data: CategoryData[];
  selectedCategory?: string | null;
}>();

const emit = defineEmits(['category-click']);

// Hardcoded χρώματα αποχρώσεις του μπλε
const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#60a5fa', // blue-400
  '#93c5fd', // blue-300
  '#2563eb', // blue-600
  '#1d4ed8', // blue-700
  '#1e40af', // blue-800
  '#bfdbfe', // blue-200
  '#dbeafe', // blue-100
];

const total = computed(() => props.data.reduce((sum, item) => sum + item.amount, 0));

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
};

const chartData = computed(() => ({
  labels: props.data.map(d => d.category),
  datasets: [
    {
      backgroundColor: CHART_COLORS,
      data: props.data.map(d => d.amount),
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 4
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%', // Το κάνει Doughnut
  onClick: (event: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const category = props.data[index].category;
      const newValue = props.selectedCategory === category ? null : category;
      emit('category-click', newValue);
    }
  },
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        font: { size: 12, family: 'Inter' },
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#000',
      bodyColor: '#666',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      boxPadding: 4,
      callbacks: {
        label: (context: any) => {
          const value = context.parsed;
          const percentage = total.value > 0 ? ((value / total.value) * 100).toFixed(0) : 0;
          return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
        }
      }
    }
  }
}));
</script>

<style scoped>
.v-card {
  border-radius: 0.5rem !important;
}
</style>
