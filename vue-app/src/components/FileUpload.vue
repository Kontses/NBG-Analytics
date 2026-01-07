<template>
  <v-hover v-slot="{ isHovering, props }">
  <v-card
    v-bind="props"
    class="border-dashed transition-all cursor-pointer"
    :class="{ 
      'bg-primary-lighten-5 border-primary': isDragging || isHovering, 
      'border-medium-emphasis': !isDragging && !isHovering 
    }"
    elevation="0"
    variant="outlined"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
    style="border-style: dashed !important; border-width: 2px !important;"
  >
    <v-card-text class="pa-8 d-flex flex-column align-center justify-center ga-4">
      <div 
        class="pa-4 rounded-circle transition-all"
        :class="isDragging || isHovering ? 'bg-primary text-white' : 'bg-primary-lighten-5 text-primary'"
      >
        <v-progress-circular v-if="isProcessing" indeterminate color="currentColor" size="32"></v-progress-circular>
        <v-icon v-else icon="mdi-upload" size="32"></v-icon>
      </div>

      <div class="text-center">
        <p class="text-h6 font-weight-medium mb-1">
          {{ isProcessing ? 'Επεξεργασία...' : 'Σύρετε το αρχείο Excel εδώ' }}
        </p>
        <p class="text-caption text-medium-emphasis">
          ή κάντε κλικ για να επιλέξετε αρχείο
        </p>
      </div>

      <div class="d-flex align-center gap-2 text-caption text-medium-emphasis">
        <v-icon icon="mdi-file-excel" size="16"></v-icon>
        <span>Υποστηριζόμενα: .xlsx, .xls</span>
      </div>

      <input
        type="file"
        ref="fileInput"
        accept=".xlsx,.xls"
        class="d-none"
        @change="handleChange"
      />
    </v-card-text>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top">
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn variant="text" @click="snackbar.show = false">Κλείσιμο</v-btn>
        </template>
    </v-snackbar>
  </v-card>
  </v-hover>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Transaction } from '@/types/transaction';
import { parseExcelFile } from '@/utils/excelParser';

const props = defineProps<{
  onUpload: (transactions: Transaction[]) => number;
}>();

const isDragging = ref(false);
const isProcessing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const snackbar = ref({
    show: false,
    text: '',
    color: 'success'
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const processFile = async (file: File) => {
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    snackbar.value = { show: true, text: 'Μη έγκυρο αρχείο. Παρακαλώ ανεβάστε αρχείο Excel.', color: 'error' };
    return;
  }

  isProcessing.value = true;
  try {
    const transactions = await parseExcelFile(file);
    const count = props.onUpload(transactions);
    snackbar.value = { show: true, text: `Επιτυχής εισαγωγή! Προστέθηκαν ${count} συναλλαγές.`, color: 'success' };
  } catch (error) {
    console.error(error);
    snackbar.value = { show: true, text: 'Αποτυχία ανάγνωσης αρχείου.', color: 'error' };
  } finally {
    isProcessing.value = false;
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
};

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) processFile(file);
};
</script>
