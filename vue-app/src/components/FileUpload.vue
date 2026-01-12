<template>
  <v-hover v-slot="{ isHovering, props }">
  <v-card
    v-bind="props"
    class="rounded-xl transition-all cursor-pointer relative"
    :class="{ 
      'bg-primary-lighten-5 border-primary elevation-8': isDragging || isHovering, 
      'bg-grey-lighten-5 border-dashed': !isDragging && !isHovering 
    }"
    elevation="0"
    variant="outlined"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
    style="border-width: 2px !important; transition: all 0.5s ease;"
  >
    <v-card-text class="pa-12 d-flex flex-column align-center justify-center ga-6">
      <div 
        class="pa-6 rounded-xl transition-all duration-300"
        :class="isDragging || isHovering ? 'bg-primary text-white elevation-4 rotate-0' : 'bg-primary-lighten-4 text-primary'"
        style="transform: rotate(-3deg);"
      >
        <v-progress-circular v-if="isProcessing" indeterminate color="currentColor" size="40"></v-progress-circular>
        <v-icon v-else icon="mdi-cloud-upload-outline" size="48"></v-icon>
      </div>

      <div class="text-center">
        <h3 class="text-h5 font-weight-bold mb-2">
          {{ isProcessing ? 'Επεξεργασία αρχείου...' : 'Σύρετε το αρχείο Excel εδώ' }}
        </h3>
        <p class="text-body-1 text-medium-emphasis">
          ή κάντε κλικ για αναζήτηση στον υπολογιστή σας
        </p>
      </div>

      <div class="d-flex align-center px-4 py-2 bg-white rounded-pill elevation-1 ga-2">
        <v-icon icon="mdi-file-excel" color="primary" size="small"></v-icon>
        <span class="text-caption font-weight-medium text-medium-emphasis">Υποστηρίζονται αρχεία .xlsx & .xls</span>
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
