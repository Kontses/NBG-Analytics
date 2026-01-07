<template>
  <v-card class="overflow-hidden h-100" elevation="0" border>
    <v-card-text class="pa-6">
      <div class="d-flex align-start justify-space-between">
        <div class="d-flex flex-column ga-1">
          <p class="text-caption font-weight-medium text-medium-emphasis mb-0">{{ title }}</p>
          <p class="text-h5 font-weight-bold text-high-emphasis mb-0">{{ value }}</p>
          <p v-if="subtitle" class="text-caption text-medium-emphasis mb-0">{{ subtitle }}</p>
          
          <div v-if="trend && trendValue" class="d-flex align-center ga-1 text-caption font-weight-medium mt-1"
            :class="trendColor">
            <span>{{ trendIcon }}</span>
            <span>{{ trendValue }}</span>
          </div>
        </div>
        
        <div class="pa-3 rounded-lg bg-primary-lighten-5">
          <v-icon :icon="icon" color="primary" size="24"></v-icon>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}>();

const trendColor = computed(() => {
  if (props.trend === 'up') return 'text-success';
  if (props.trend === 'down') return 'text-error';
  return 'text-medium-emphasis';
});

const trendIcon = computed(() => {
  if (props.trend === 'up') return '↑';
  if (props.trend === 'down') return '↓';
  return '→';
});
</script>

<style scoped>
.text-success {
  color: #16a34a !important; /* green-600 */
}
.text-error {
  color: #dc2626 !important; /* red-600 */
}
/* Στρογγυλεμένες γωνίες ώστε να ταιριάζουν με το shadcn/ui */
.v-card {
  border-radius: 0.5rem !important;
}
.bg-primary-lighten-5 {
  background-color: #f0f9ff !important; /* sky-50, παρόμοιο με το bg-primary/10 της React αν το primary είναι μπλε */
}
/* Αν το Primary είναι μπλε (hsl(221.2 83.2% 53.3%)) */
:deep(.v-icon.text-primary) {
  color: hsl(221.2 83.2% 53.3%) !important;
}
</style>
