import * as XLSX from 'xlsx';
import { Transaction } from '@/types/transaction';

const COLUMN_MAPPING: Record<string, keyof Omit<Transaction, 'id' | 'customCategory'>> = {
  'Α/Α Συναλλαγής': 'transactionNumber',
  'Ημερομηνία': 'date',
  'Ώρα': 'time',
  'Valeur': 'valeur',
  'Κατάστημα': 'branch',
  'Κατηγορία συναλλαγής': 'transactionCategory',
  'Είδος εργασίας': 'workType',
  'Ποσό συναλλαγής': 'amount',
  'Ποσό εντολής': 'orderAmount',
  'Νόμισμα': 'currency',
  'Χρέωση / Πίστωση': 'type',
  'Ισοτιμία': 'exchangeRate',
  'Περιγραφή': 'description',
  'Λογιστικό Υπόλοιπο': 'accountBalance',
  'Ονοματεπώνυμο συμβαλλόμενου': 'accountHolderName',
  'Ονοματεπώνυμο αντισυμβαλλόμενου': 'counterpartyName',
  'Λογαριασμός αντισυμβαλλόμενου': 'counterpartyAccount',
  'Τράπεζα αντισυμβαλλόμενου': 'counterpartyBank',
  'Επιπρόσθετες πληροφορίες': 'additionalInfo',
  'Αριθμός αναφοράς': 'referenceNumber',
  'Κανάλι': 'channel',
  'Ονοματεπώνυμο αντιπροσώπου': 'agentName',
  'Είδος προμήθειας': 'commissionType',
  'Κωδικός εμπόρου/οργανισμού': 'merchantCode',
  'Σκοπός συναλλαγής': 'transactionPurpose',
  'Ημερομηνία Συναλλαγής με χρεωστική κάρτα': 'cardTransactionDate',
  'Ώρα Συναλλαγής με χρεωστική κάρτα': 'cardTransactionTime',
  'Χρεωστική Κάρτα': 'debitCard',
};

function parseGreekDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Δοκιμή μορφής DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }

  return new Date(dateStr);
}

export function parseExcelFile(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transactions: Transaction[] = jsonData.map((row: any, index) => {
          const transaction: Partial<Transaction> = {
            id: `txn-${Date.now()}-${index}`,
          };

          Object.entries(COLUMN_MAPPING).forEach(([greekKey, englishKey]) => {
            const value = row[greekKey];

            if (englishKey === 'date') {
              transaction.date = parseGreekDate(value);
            } else if (englishKey === 'type') {
              transaction.type = value === 'Χ' ? 'debit' : 'credit';
            } else if (englishKey === 'amount' || englishKey === 'orderAmount' || englishKey === 'accountBalance') {
              transaction[englishKey] = parseFloat(String(value).replace(',', '.')) || 0;
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (transaction as any)[englishKey] = value || '';
            }
          });

          return transaction as Transaction;
        });

        resolve(transactions);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function categorizeTransaction(description: string, counterpartyName: string): string {
  const text = `${description} ${counterpartyName}`.toUpperCase();

  const categoryRules: [string[], string][] = [
    [['FARMAKEIO', 'PHARMACY', 'ΦΑΡΜΑΚ'], 'Υγεία & Φαρμακεία'],
    [['AB SHOP', 'SUPERMARKET', 'ΣΟΥΠΕΡ', 'LIDL', 'SKLAVENITIS', 'BAZAAR', 'MASOUTIS'], 'Σούπερ Μάρκετ'],
    [['RESTAURANT', 'CAFE', 'COFFEE', 'STARBUCKS', 'EVEREST', 'GOODY', 'ILIOS', 'PIKAP', 'FOOD'], 'Φαγητό & Ποτό'],
    [['METRO', 'BUS', 'TAXI', 'FUEL', 'SHELL', 'BP', 'EKO', 'PARKING'], 'Μεταφορικά'],
    [['CINEMA', 'THEATRE', 'SPOTIFY', 'NETFLIX', 'ENTERTAINMENT'], 'Ψυχαγωγία'],
    [['ZARA', 'H&M', 'PULL', 'CLOTHES', 'SHOES'], 'Ρούχα & Αξεσουάρ'],
    [['DEI', 'OTE', 'COSMOTE', 'VODAFONE', 'WIND', 'EYDAP', 'BILL'], 'Λογαριασμοί'],
    [['SALARY', 'PAYROLL', 'ΜΙΣΘΟΣ', 'ΜΙΣΘΟΔΟΣΙΑ'], 'Μισθοδοσία'],
    [['ATM', 'ΑΝΑΛΗΨΗ', 'CASH', 'EURONET'], 'Ανάληψη μετρητών'],
  ];

  for (const [keywords, category] of categoryRules) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }

  return 'Άλλο';
}
