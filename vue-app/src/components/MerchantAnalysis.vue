<template>
    <div class="d-flex flex-column" style="gap: 16px;">
        <!-- Χειριστήρια Επικεφαλίδας -->
        <div class="d-flex align-center justify-space-between flex-shrink-0">
            <div>
                <p class="text-caption text-medium-emphasis mb-0">
                    Merchants με 2+ συναλλαγές
                </p>
            </div>

            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" variant="outlined" size="small" class="text-none px-3 border-opacity-50"
                        append-icon="mdi-chevron-down" density="comfortable">
                        <v-icon start icon="mdi-sort-variant" size="small" class="mr-1"></v-icon>
                        {{ sortOption === 'amount' ? 'Συνολικό Ποσό' : 'Πλήθος Συναλλαγών' }}
                    </v-btn>
                </template>
                <v-list density="compact" elevation="2" class="rounded-lg">
                    <v-list-item @click="sortOption = 'amount'" value="amount" active-color="primary">
                        <v-list-item-title class="text-body-2">Συνολικό Ποσό</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="sortOption = 'count'" value="count" active-color="primary">
                        <v-list-item-title class="text-body-2">Πλήθος Συναλλαγών</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>

        <div class="d-flex flex-column">
            <!-- Μπλοκ Μετρικών Σύνοψης -->
            <div
                class="d-flex align-center justify-space-between pa-4 rounded-lg border bg-grey-lighten-5 flex-shrink-0 mb-4">
                <div>
                    <p class="text-caption font-weight-medium text-medium-emphasis mb-1">Σύνολο</p>
                    <p class="text-h6 font-weight-bold text-high-emphasis mb-0" style="line-height: 1.2">{{
                        formatCurrency(totalRepeatedSpend) }}</p>
                </div>
                <div class="text-right">
                    <p class="text-caption font-weight-medium text-medium-emphasis mb-1">Συχνοί Merchants</p>
                    <p class="text-h6 font-weight-bold text-high-emphasis mb-0" style="line-height: 1.2">{{
                        frequentMerchantsCount }}</p>
                </div>
            </div>

            <!-- Λίστα Merchants -->
            <div class="border rounded-lg bg-surface" style="height: 400px; overflow-y: auto;">
                <div v-if="merchantStats.length === 0"
                    class="d-flex justify-center align-center h-100 text-medium-emphasis text-body-2">
                    Δεν βρέθηκαν δεδομένα
                </div>

                <div v-for="merchant in merchantStats" :key="merchant.name"
                    class="pa-4 border-b hover-state transition-colors"
                    style="border-color: rgba(0,0,0,0.06) !important;">
                    <div class="d-flex align-start justify-space-between gap-4 mb-2">
                        <div class="d-flex flex-column" style="min-width: 0;">
                            <div class="text-subtitle-2 font-weight-bold text-high-emphasis text-truncate mb-1">
                                {{ merchant.name }}
                            </div>
                            <div>
                                <v-chip size="x-small" variant="flat" color="blue-grey-lighten-4"
                                    class="text-blue-grey-darken-3 font-weight-medium px-2 rounded"
                                    style="height: 20px; font-size: 10px;">
                                    {{ merchant.category }}
                                </v-chip>
                            </div>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <div class="text-body-2 font-weight-bold text-high-emphasis">{{
                                formatCurrency(merchant.totalAmount)
                            }}</div>
                            <div class="text-caption text-medium-emphasis" style="font-size: 11px !important;">{{
                                merchant.count
                            }} κινήσεις</div>
                        </div>
                    </div>

                    <div class="mb-3 d-flex align-center ga-2">
                        <div class="text-caption text-medium-emphasis" style="font-size: 11px;">
                            Μ.Ο.: <span class="font-weight-medium text-high-emphasis">{{
                                formatCurrency(merchant.averageAmount)
                            }}</span>
                        </div>
                        <v-chip v-if="merchant.count >= 5" size="x-small" variant="tonal" color="error"
                            class="px-1 font-weight-medium rounded" style="height: 18px; font-size: 10px;">
                            <v-icon start icon="mdi-trending-up" size="x-small" class="mr-0"></v-icon>
                            Συχνός
                        </v-chip>
                    </div>

                    <div class="d-flex flex-column gap-1">
                        <div class="text-[10px] font-weight-bold text-medium-emphasis text-uppercase"
                            style="font-size: 10px; letter-spacing: 0.5px;">Ιστορικό</div>
                        <div class="d-flex overflow-x-auto pb-1 ga-2 hide-scrollbar">
                            <div v-for="[month, data] in Object.entries(merchant.monthlyHistory).sort((a, b) => b[0].localeCompare(a[0]))"
                                :key="month"
                                class="d-inline-flex align-center rounded border px-2 py-1 text-caption font-weight-medium bg-grey-lighten-4 text-grey-darken-3 border-transparent flex-shrink-0"
                                style="font-size: 10px !important; height: 24px;">
                                <span class="mr-1">{{ month }}:</span>
                                <span>{{ formatCurrency(data.amount) }}</span>
                                <span class="ml-1 text-medium-emphasis">({{ data.count }})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Transaction } from '@/types/transaction';

interface Props {
    transactions: Transaction[];
    selectedCategory?: string | null;
}

const props = defineProps<Props>();

type SortOption = 'amount' | 'count';
const sortOption = ref<SortOption>('amount');

interface MerchantStats {
    name: string;
    count: number;
    totalAmount: number;
    averageAmount: number;
    category: string;
    monthlyHistory: Record<string, { count: number; amount: number }>;
}

const merchantStats = computed(() => {
    const stats = new Map<string, MerchantStats>();

    props.transactions
        .filter(t => t.type === 'debit') // Μόνο έξοδα
        .filter(t => t.customCategory !== 'Μισθοδοσία') // Εξαίρεση μισθοδοσίας/εσόδων
        .filter(t => !props.selectedCategory || (t.customCategory || 'Άλλο') === props.selectedCategory) // Φίλτρο κατηγορίας
        .forEach(t => {
            // Κανονικοποίηση ονόματος: Αφαίρεση κοινών προθεμάτων αν χρειάζεται ή χρήση counterparty
            // Λογική: Χρήση του counterpartyName αν υπάρχει, αλλιώς καθαρισμός της περιγραφής
            const rawName = t.counterpartyName || t.description;
            const name = rawName.toUpperCase().trim();

            if (!stats.has(name)) {
                stats.set(name, {
                    name,
                    count: 0,
                    totalAmount: 0,
                    averageAmount: 0,
                    category: t.customCategory || 'Άλλο',
                    monthlyHistory: {}
                });
            }

            const merchant = stats.get(name)!;
            const amount = Math.abs(t.amount);

            merchant.count += 1;
            merchant.totalAmount += amount;

            // Μήνας YYYY-MM
            const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
            if (!merchant.monthlyHistory[monthKey]) {
                merchant.monthlyHistory[monthKey] = { count: 0, amount: 0 };
            }
            merchant.monthlyHistory[monthKey].count += 1;
            merchant.monthlyHistory[monthKey].amount += amount;
        });

    // Υπολογισμός μέσων όρων και φιλτράρισμα για >= 2 συναλλαγές
    return Array.from(stats.values())
        .filter(m => m.count >= 2)
        .map(m => ({
            ...m,
            averageAmount: m.totalAmount / m.count
        }))
        .sort((a, b) => {
            if (sortOption.value === 'amount') {
                return b.totalAmount - a.totalAmount;
            }
            return b.count - a.count;
        }); // Ταξινόμηση βάσει συνολικών εξόδων
});

const frequentMerchantsCount = computed(() => merchantStats.value.filter(m => m.count >= 5).length);
const totalRepeatedSpend = computed(() => merchantStats.value.reduce((sum, m) => sum + m.totalAmount, 0));

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('el-GR', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
};
</script>

<style scoped>
.hover-state:hover {
    background-color: #FAFAFA !important;
    /* grey-lighten-5 */
}

/* Hide scrollbar for Chrome, Safari and Opera */
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.hide-scrollbar {
    -ms-overflow-style: none;
    /* IE and Edge */
    scrollbar-width: none;
    /* Firefox */
}
</style>
