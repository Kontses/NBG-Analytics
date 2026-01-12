<template>
  <div class="bg-background min-h-screen">
    <!-- Επικεφαλίδα -->
    <v-app-bar elevation="1" color="surface">
      <v-container class="d-flex align-center justify-space-between py-2">
        <div class="d-flex align-center ga-4">
          <div class="pa-3 rounded-lg bg-primary text-white elevation-2">
            <v-icon icon="mdi-wallet" size="28"></v-icon>
          </div>
          <div>
            <h1 class="text-h5 font-weight-bold mb-0" style="line-height: 1.2">NBG Analytics</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">Ανάλυση Τραπεζικών Κινήσεων</p>
          </div>
        </div>

        <div v-if="hasData" class="d-flex ga-3">
            <v-btn variant="outlined" size="small" class="text-none text-primary border-primary-lighten-4" @click="handleRefreshCategories">
                <v-icon start icon="mdi-refresh" size="small"></v-icon>
                Ανανέωση
            </v-btn>
            <v-btn variant="outlined" size="small" class="text-none text-error border-error-lighten-4" @click="handleClearAll">
                <v-icon start icon="mdi-delete" size="small"></v-icon>
                Καθαρισμός
            </v-btn>
        </div>
      </v-container>
    </v-app-bar>

    <!-- Κύριο Περιεχόμενο -->
    <v-main style="background-color: hsl(209, 40%, 96%); min-height: 100vh;">
      <v-container class="py-8">
        <div class="d-flex flex-column ga-4 mb-8">
          <FileUpload :on-upload="handleUpload" />
          
          <div v-if="!hasData" class="d-flex justify-center mt-4">
            <v-btn
              color="primary"
              size="x-large"
              prepend-icon="mdi-sparkles"
              elevation="4"
              @click="handleLoadDemoData"
            >
              Δοκιμή με Demo Δεδομένα
            </v-btn>
          </div>
        </div>

        <div v-if="hasData">
            <!-- Φίλτρα -->
            <div class="mb-6" ref="datePickerRef">
                <DateRangePicker
                    v-model:startDate="startDate"
                    v-model:endDate="endDate"
                    @clear="clearDateFilter"
                />
            </div>

            <!-- Πλέγμα Στατιστικών (Stats Grid) -->
            <v-row class="mb-6">
                <v-col cols="12" sm="6" lg="3">
                    <StatCard
                        title="Τρέχον Υπόλοιπο"
                        :value="formatCurrency(totalBalance)"
                        icon="mdi-wallet"
                    />
                </v-col>
                <v-col cols="12" sm="6" lg="3">
                    <StatCard
                        title="Σύνολο Εσόδων"
                        :value="formatCurrency(displayStats.income)"
                        icon="mdi-trending-up"
                        trend="up"
                    />
                </v-col>
                <v-col cols="12" sm="6" lg="3">
                    <StatCard
                        title="Σύνολο Εξόδων"
                        :value="formatCurrency(displayStats.expenses)"
                        icon="mdi-trending-down"
                        trend="down"
                    />
                </v-col>
                <v-col cols="12" sm="6" lg="3">
                    <StatCard
                        title="Συναλλαγές"
                        :value="filteredTransactions.length.toString()"
                        subtitle="Συνολικές κινήσεις"
                        icon="mdi-credit-card"
                    />
                </v-col>
            </v-row>

            <!-- Πλέγμα Γραφημάτων (Charts Grid) -->
            <v-row class="mb-6">
                <v-col cols="12" lg="8">
                    <MonthlyChart
                        :data="displayMonthlyStats"
                        @month-click="handleMonthClick"
                    />
                </v-col>
                <v-col cols="12" lg="4">
                    <CategoryChart
                        :data="displayCategoryStats"
                        :selected-category="selectedCategory"
                        @category-click="selectedCategory = $event"
                    />
                </v-col>
            </v-row>

            <!-- Τάση Υπολοίπου (Balance Trend) -->
            <div class="mb-8">
                <BalanceTrendChart :transactions="filteredTransactions" />
            </div>

            <!-- Λίστα Συναλλαγών -->
            <v-expansion-panels class="mb-8">
                <v-expansion-panel>
                    <v-expansion-panel-title>
                        <div class="d-flex align-center ga-2">
                             <div class="pa-1 rounded-circle bg-primary-lighten-5">
                                <v-icon icon="mdi-trending-up" color="primary" size="small"></v-icon>
                             </div>
                             <span class="font-weight-medium">Συναλλαγές</span>
                        </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <TransactionList
                            :transactions="filteredTransactions"
                            @update:category="updateTransactionCategory"
                            :category-filter="selectedCategory"
                            @filter-change="selectedCategory = $event"
                        />
                    </v-expansion-panel-text>
                </v-expansion-panel>
                
                <v-expansion-panel>
                    <v-expansion-panel-title>
                        <div class="d-flex align-center ga-2">
                             <div class="pa-1 rounded-circle bg-primary-lighten-5">
                                <v-icon icon="mdi-store" color="primary" size="small"></v-icon>
                             </div>
                             <span class="font-weight-medium">Επαναλαμβανόμενα Έξοδα ανά Merchant</span>
                        </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <MerchantAnalysis
                            :transactions="filteredTransactions"
                            :selected-category="selectedCategory"
                        />
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>

        </div>

        <!-- Κατάσταση Κενού Περιεχομένου (Empty State) -->
        <div v-if="!hasData" class="text-center py-12">
            <div class="d-inline-flex align-center justify-center pa-6 rounded-circle bg-primary-lighten-5 mb-4" style="width: 80px; height: 80px;">
                <v-icon icon="mdi-wallet" color="primary" size="40"></v-icon>
            </div>
            <h2 class="text-h5 font-weight-bold mb-2">Καλωσήρθατε στο NBG Analytics</h2>
            <p class="text-body-1 text-medium-emphasis mx-auto" style="max-width: 500px">
                Ανεβάστε το αρχείο Excel από την τράπεζά σας για να δείτε αναλυτικά στατιστικά των συναλλαγών σας.
            </p>
        </div>
      </v-container>
    </v-main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useTransactions } from '@/composables/useTransactions';
import { DEMO_TRANSACTIONS } from '@/data/demoTransactions';
import FileUpload from './FileUpload.vue';
import DateRangePicker from './DateRangePicker.vue';
import StatCard from './StatCard.vue';
import MonthlyChart from './MonthlyChart.vue';
import CategoryChart from './CategoryChart.vue';
import BalanceTrendChart from './BalanceTrendChart.vue';
import TransactionList from './TransactionList.vue';
import MerchantAnalysis from './MerchantAnalysis.vue';

const {
  transactions,
  addTransactions,
  updateTransactionCategory,
  refreshCategories,
  clearAllTransactions,
  getMonthlyStats,
  getCategoryStats,
  getTotalBalance,
  getTotalIncome,
  getTotalExpenses,
} = useTransactions();

const startDate = ref<Date | undefined>();
const endDate = ref<Date | undefined>();
const selectedCategory = ref<string | null>(null);
const datePickerRef = ref<HTMLElement | null>(null);

// Debounced ημερομηνίες
const debouncedStartDate = ref<Date | undefined>();
const debouncedEndDate = ref<Date | undefined>();

// Watchers για debouncing
let timeout: NodeJS.Timeout;
watch([startDate, endDate], ([newStart, newEnd]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        debouncedStartDate.value = newStart;
        debouncedEndDate.value = newEnd;
    }, 300);
});

const handleUpload = (data: any[]) => {
    const count = addTransactions(data);
    setTimeout(() => {
        datePickerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return count;
};

const handleLoadDemoData = () => {
    addTransactions(DEMO_TRANSACTIONS);
    setTimeout(() => {
        datePickerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
};

const handleRefreshCategories = () => {
    refreshCategories();
};

const handleClearAll = () => {
    clearAllTransactions();
    startDate.value = undefined;
    endDate.value = undefined;
    selectedCategory.value = null;
};

const filteredTransactions = computed(() => {
    if (!debouncedStartDate.value && !debouncedEndDate.value) return transactions.value;

    return transactions.value.filter(txn => {
        const txnDate = new Date(txn.date);
        if (debouncedStartDate.value && txnDate < debouncedStartDate.value) return false;
        if (debouncedEndDate.value) {
            const endOfDay = new Date(debouncedEndDate.value);
            endOfDay.setHours(23, 59, 59, 999);
            if (txnDate > endOfDay) return false;
        }
        return true;
    });
});

const filteredStats = computed(() => {
    const income = filteredTransactions.value
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenses = filteredTransactions.value
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses };
});

const filteredMonthlyStats = computed(() => {
    const monthlyMap = new Map<string, { income: number; expenses: number }>();

    filteredTransactions.value.forEach(txn => {
        const date = new Date(txn.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { income: 0, expenses: 0 });
        }

        const stats = monthlyMap.get(monthKey)!;
        if (txn.type === 'credit') {
            stats.income += Math.abs(txn.amount);
        } else {
            stats.expenses += Math.abs(txn.amount);
        }
    });

    return Array.from(monthlyMap.entries())
        .map(([month, stats]) => ({ month, ...stats }))
        .sort((a, b) => a.month.localeCompare(b.month));
});

const filteredCategoryStats = computed(() => {
    const categoryMap = new Map<string, number>();

    filteredTransactions.value
        .filter(t => t.type === 'debit')
        .forEach(txn => {
            const category = txn.customCategory || 'Άλλο';
            if (category === 'Μισθοδοσία') return;
            categoryMap.set(category, (categoryMap.get(category) || 0) + Math.abs(txn.amount));
        });

    return Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
});

const handleMonthClick = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    startDate.value = firstDay;
    endDate.value = lastDay;
};

const clearDateFilter = () => {
    startDate.value = undefined;
    endDate.value = undefined;
};

const hasData = computed(() => transactions.value.length > 0);

// Λογική για εμφάνιση στατιστικών (display stats)
const monthlyStats = computed(() => getMonthlyStats());
const categoryStats = computed(() => getCategoryStats());
const totalIncome = computed(() => getTotalIncome());
const totalExpenses = computed(() => getTotalExpenses());
const totalBalance = computed(() => getTotalBalance());

const hasDateFilter = computed(() => !!(startDate.value || endDate.value));

const displayMonthlyStats = computed(() => hasDateFilter.value ? filteredMonthlyStats.value : monthlyStats.value);
const displayCategoryStats = computed(() => hasDateFilter.value ? filteredCategoryStats.value : categoryStats.value);

const displayStats = computed(() => ({
    income: startDate.value || endDate.value ? filteredStats.value.income : totalIncome.value,
    expenses: startDate.value || endDate.value ? filteredStats.value.expenses : totalExpenses.value
}));

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('el-GR', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
};
</script>
