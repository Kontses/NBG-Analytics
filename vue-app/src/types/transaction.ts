export interface Transaction {
    id: string;
    transactionNumber: string;
    date: Date;
    time: string;
    valeur: string;
    branch: string;
    transactionCategory: string;
    workType: string;
    amount: number;
    orderAmount: number;
    currency: string;
    type: 'debit' | 'credit';
    exchangeRate: string;
    description: string;
    accountBalance: number;
    accountHolderName: string;
    counterpartyName: string;
    counterpartyAccount: string;
    counterpartyBank: string;
    additionalInfo: string;
    referenceNumber: string;
    channel: string;
    agentName: string;
    commissionType: string;
    merchantCode: string;
    transactionPurpose: string;
    cardTransactionDate: string;
    cardTransactionTime: string;
    debitCard: string;
    customCategory?: string;
}

export interface CategoryMapping {
    keyword: string;
    category: string;
}

export const DEFAULT_CATEGORIES = [
    'Φαγητό & Ποτό',
    'Σούπερ Μάρκετ',
    'Μεταφορικά',
    'Ψυχαγωγία',
    'Υγεία & Φαρμακεία',
    'Ρούχα & Αξεσουάρ',
    'Λογαριασμοί',
    'Μισθοδοσία',
    'Μεταφορές',
    'Ανάληψη μετρητών',
    'Άλλο'
] as const;

export type DefaultCategory = typeof DEFAULT_CATEGORIES[number];
