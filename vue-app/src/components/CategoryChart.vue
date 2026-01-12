<template>
  <v-card class="h-100 d-flex flex-column" elevation="0" border>
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
    
    <v-card-text class="d-flex flex-column flex-grow-1 pa-6 pt-4">
      <div class="d-flex flex-column flex-md-row align-center justify-center flex-grow-1" style="min-height: 250px; gap: 24px;">
        <!-- Πλαίσιο Γραφήματος -->
        <div style="height: 180px; width: 180px; position: relative;">
            <Doughnut :data="chartData" :options="chartOptions" />
        </div>

        <!-- Υπόμνημα -->
        <div class="d-flex flex-column gap-2" style="min-width: 180px;">
            <div 
                v-for="(item, index) in tableData" 
                :key="item.category"
                class="d-flex align-center cursor-pointer pa-1 rounded hover:bg-grey-lighten-4 transition-colors"
                @click="handleCategoryClick(item.category)"
                :style="{ opacity: selectedCategory && selectedCategory !== item.category ? 0.3 : 1 }"
            >
                <div 
                    class="rounded-sm mr-2" 
                    :style="{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length], width: '8px', height: '8px' }"
                ></div>
                <div class="text-caption font-weight-medium text-high-emphasis" style="font-size: 0.7rem !important;">
                    {{ item.category }} <span class="text-medium-emphasis">({{ item.percentage }}%)</span>
                </div>
            </div>
        </div>
      </div>

      <!-- Υποσέλιδο Συνολικών Εξόδων -->
      <div class="text-center mt-4">
        <p class="text-caption text-medium-emphasis mb-1">Σύνολο Εξόδων</p>
        <p class="text-h6 font-weight-bold text-high-emphasis">{{ formatCurrency(total) }}</p>
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

// Χρώματα που ταιριάζουν ακριβώς από το src/index.css (Δλδ Μπλε Παλέτα)
const CHART_COLORS = [
  'hsl(198, 93%, 59%)', // chart-1
  'hsl(213, 93%, 67%)', // chart-2
  'hsl(215, 20%, 65%)', // chart-3
  'hsl(215, 16%, 46%)', // chart-4
  'hsl(215, 19%, 34%)', // chart-5
  'hsl(198, 93%, 45%)', // Extra Blue 1
  'hsl(213, 93%, 55%)', // Extra Blue 2
  'hsl(215, 20%, 50%)', // Extra Blue 3
];

const total = computed(() => props.data.reduce((sum, item) => sum + item.amount, 0));

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
};

// Υπολογισμός δεδομένων για το υπόμνημα ώστε να περιλαμβάνουν ποσοστά
const tableData = computed(() => {
    return props.data.map(d => ({
        ...d,
        percentage: total.value > 0 ? ((d.amount / total.value) * 100).toFixed(0) : 0
    }));
});

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
  cutout: '60%', 
  onClick: (_: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const category = props.data[index].category;
      handleCategoryClick(category);
    }
  },
  plugins: {
    legend: {
      display: false // Απενεργοποίηση ενσωματωμένου υπομνήματος
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

const handleCategoryClick = (category: string) => {
    const newValue = props.selectedCategory === category ? null : category;
    emit('category-click', newValue);
};
</script>

<style scoped>
.v-card {
  border-radius: 0.5rem !important;
}
.gap-2 {
    gap: 8px;
}
.cursor-pointer {
    cursor: pointer;
}
/* Μεταβάσεις για αδιαφάνεια/hover */
.transition-colors {
    transition: background-color 0.2s ease, opacity 0.2s ease;
}
</style>
