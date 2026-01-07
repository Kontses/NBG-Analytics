<template>
  <div class="d-flex flex-wrap align-center ga-2">
    <div class="d-flex align-center ga-2">
      <span class="text-caption text-medium-emphasis">Από:</span>
      <v-menu v-model="menuStart" :close-on-content-click="false" location="bottom start">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            density="default"
            class="text-none justify-start px-3 border-opacity-100"
            :class="!startDate ? 'text-medium-emphasis' : 'text-high-emphasis'"
            style="width: 200px; border-color: rgba(0,0,0,0.12);"
            prepend-icon="mdi-calendar"
            flat
          >
             {{ startDate ? formatDate(startDate) : 'Επιλέξτε' }}
          </v-btn>
        </template>
        <v-card min-width="auto">
          <v-date-picker
            v-model="internalStartDate"
            @update:model-value="onStartDateSelected"
            color="primary"
            hide-header
          ></v-date-picker>
        </v-card>
      </v-menu>
    </div>

    <div class="d-flex align-center ga-2">
      <span class="text-caption text-medium-emphasis">Έως:</span>
      <v-menu v-model="menuEnd" :close-on-content-click="false" location="bottom start">
        <template v-slot:activator="{ props }">
           <v-btn
            v-bind="props"
            variant="outlined"
            density="default"
            class="text-none justify-start px-3 border-opacity-100"
            :class="!endDate ? 'text-medium-emphasis' : 'text-high-emphasis'"
            style="width: 200px; border-color: rgba(0,0,0,0.12);"
            prepend-icon="mdi-calendar"
            flat
          >
             {{ endDate ? formatDate(endDate) : 'Επιλέξτε' }}
          </v-btn>
        </template>
        <v-card min-width="auto">
          <v-date-picker
            v-model="internalEndDate"
            @update:model-value="onEndDateSelected"
            color="primary"
            hide-header
          ></v-date-picker>
        </v-card>
      </v-menu>
    </div>

    <v-btn
      v-if="startDate || endDate"
      variant="text"
      density="compact"
      class="text-none px-2 text-caption"
      @click="clear"
    >
      Καθαρισμός
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  startDate?: Date;
  endDate?: Date;
}>();

const emit = defineEmits<{
  (e: 'update:startDate', date?: Date): void;
  (e: 'update:endDate', date?: Date): void;
  (e: 'clear'): void;
}>();

const menuStart = ref(false);
const menuEnd = ref(false);
const internalStartDate = ref<Date | undefined>();
const internalEndDate = ref<Date | undefined>();

// Συγχρονισμός props με το internal state
watch(() => props.startDate, (newVal) => {
  if (newVal) internalStartDate.value = newVal;
}, { immediate: true });

watch(() => props.endDate, (newVal) => {
  if (newVal) internalEndDate.value = newVal;
}, { immediate: true });

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('el-GR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const onStartDateSelected = (date: any) => {
  // Το Vuetify v-date-picker μπορεί να επιστρέψει μόνο το μέρος της ημερομηνίας ή timestamp ανάλογα με την έκδοση
  // Υποθέτουμε ενημέρωση με standard Date object
  if (date) {
    emit('update:startDate', date);
    menuStart.value = false;
  }
};

const onEndDateSelected = (date: any) => {
  if (date) {
    emit('update:endDate', date);
    menuEnd.value = false;
  }
};

const clear = () => {
    internalStartDate.value = undefined;
    internalEndDate.value = undefined;
    emit('clear');
};
</script>

<style scoped>
/* Προσαρμογές στυλ κουμπιών Vuetify για να ταιριάζουν με το shadcn/ui */
.v-btn--variant-outlined {
    border-color: #e2e8f0 !important; /* slate-200 */
    background-color: white;
}
.v-btn--variant-outlined:hover {
    background-color: #f8fafc; /* slate-50 */
}
</style>
