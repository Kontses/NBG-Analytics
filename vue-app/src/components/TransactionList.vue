<template>
  <div class="space-y-4">
    <!-- Επικεφαλίδα με Αναζήτηση και Φίλτρα -->
    <div class="d-flex flex-column ga-4 px-4 py-3 bg-surface border-b">
      <div class="d-flex ga-2">
        <v-text-field
          v-model="search"
          density="compact"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          placeholder="Αναζήτηση..."
          hide-details
          class="flex-grow-1"
          bg-color="background"
        ></v-text-field>

        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              :color="typeFilter !== 'all' ? 'primary' : ''"
              class="text-none"
              height="40"
            >
              <v-icon icon="mdi-filter-variant" class="mr-1"></v-icon>
              {{ typeFilter === 'all' ? 'Τύπος' : (typeFilter === 'credit' ? 'Έσοδα' : 'Έξοδα') }}
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="typeFilter = 'all'" :active="typeFilter === 'all'" link>Όλα</v-list-item>
            <v-list-item @click="typeFilter = 'credit'" :active="typeFilter === 'credit'" link>Έσοδα</v-list-item>
            <v-list-item @click="typeFilter = 'debit'" :active="typeFilter === 'debit'" link>Έξοδα</v-list-item>
          </v-list>
        </v-menu>
      </div>
      
      <!-- Chips Φίλτρων Κατηγορίας -->
      <div class="d-flex align-center ga-2 overflow-x-auto pb-1" v-if="categoryOptions.length > 1">
        <v-chip
          label
          size="small"
          :color="internalCategoryFilter === 'all' ? 'primary' : ''"
          @click="handleCategoryFilterChange('all')"
          link
        >
          Όλα
        </v-chip>
        <v-chip
          v-for="category in categoryOptions.filter(c => c !== 'all')"
          :key="category"
          label
          size="small"
          :color="internalCategoryFilter === category ? 'primary' : ''"
          @click="handleCategoryFilterChange(category)"
          link
        >
          {{ category }}
        </v-chip>
      </div>
    </div>

    <v-card variant="outlined" class="overflow-hidden">
      <v-virtual-scroll
        :items="filteredTransactions"
        height="400"
        item-height="80"
      >
        <template v-slot="{ item: txn }">
          <v-list-item class="px-4 py-3 border-b">
            <template v-slot:prepend>
              <div class="pa-2 rounded-circle mr-4" :class="txn.type === 'credit' ? 'bg-green-lighten-5' : 'bg-red-lighten-5'">
                <v-icon
                  :icon="txn.type === 'credit' ? 'mdi-arrow-down-circle' : 'mdi-arrow-up-circle'"
                  :color="txn.type === 'credit' ? 'green' : 'red'"
                ></v-icon>
              </div>
            </template>

            <v-list-item-title class="font-weight-medium mb-1">
              {{ txn.counterpartyName || txn.description || 'Άγνωστη συναλλαγή' }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption mb-1">
              {{ txn.description }}
            </v-list-item-subtitle>
            <v-list-item-subtitle class="text-caption">
              {{ formatDate(txn.date) }} • {{ txn.time }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="d-flex flex-column align-end gap-2">
                <span class="font-weight-bold" :class="txn.type === 'credit' ? 'text-green' : 'text-red'">
                  {{ txn.type === 'credit' ? '+' : '-' }}{{ formatCurrency(txn.amount) }}
                </span>
                
                <v-select
                  :model-value="(txn.customCategory as any) || 'Άλλο'"
                  :items="DEFAULT_CATEGORIES"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="width: 140px; transform: scale(0.9); transform-origin: right center;"
                  @update:model-value="(val) => onCategoryChange(txn.id, val as string, txn.counterpartyName)"
                ></v-select>
              </div>
            </template>
          </v-list-item>
        </template>
      </v-virtual-scroll>
      
      <div v-if="filteredTransactions.length === 0" class="pa-8 text-center text-medium-emphasis">
        <p>Δεν βρέθηκαν συναλλαγές</p>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Transaction, DEFAULT_CATEGORIES } from '@/types/transaction';

const props = defineProps<{
  transactions: Transaction[];
  categoryFilter?: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:category', id: string, category: string, counterpartyName: string): void;
  (e: 'filter-change', category: string | null): void;
}>();

const search = ref('');
const internalCategoryFilter = ref<string>('all');
const typeFilter = ref<string>('all');



const categoryOptions = computed(() => [
  'all',
  ...DEFAULT_CATEGORIES
]);

// Συγχρονισμός prop filter με το internal
watch(() => props.categoryFilter, (newVal) => {
  internalCategoryFilter.value = newVal || 'all';
});

const handleCategoryFilterChange = (value: string) => {
  emit('filter-change', value === 'all' ? null : value);
};

const onCategoryChange = (id: string, category: string, counterpartyName: string) => {
  emit('update:category', id, category, counterpartyName);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(value));
};

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('el-GR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

const filteredTransactions = computed(() => {
  return props.transactions.filter(txn => {
    const matchesSearch =
      txn.description.toLowerCase().includes(search.value.toLowerCase()) ||
      txn.counterpartyName.toLowerCase().includes(search.value.toLowerCase());
      
    const effectiveCategoryFilter = internalCategoryFilter.value === 'all' ? null : internalCategoryFilter.value;
    const matchesCategory = !effectiveCategoryFilter || txn.customCategory === effectiveCategoryFilter;
    
    const matchesType = typeFilter.value === 'all' || txn.type === typeFilter.value;
    
    return matchesSearch && matchesCategory && matchesType;
  });
});
</script>

<style scoped>
.text-green {
  color: #4CAF50 !important;
}
.text-red {
  color: #F44336 !important;
}
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
