import * as XLSX from 'xlsx';
import { Transaction } from '@/types/transaction';

const ENGLISH_TO_GREEK: Record<keyof Omit<Transaction, 'id' | 'customCategory' | 'hasNoBalance'>, string[]> = {
  transactionNumber: ['Α/Α Συναλλαγής', 'Α/Α'],
  date: ['Ημερομηνία/Ώρα Συναλλαγής', 'Ημερομηνία'],
  time: ['Ώρα'],
  valeur: ['Valeur'],
  branch: ['Κατάστημα'],
  transactionCategory: ['Κατηγορία συναλλαγής'],
  workType: ['Είδος εργασίας'],
  amount: ['Ποσό συναλλαγής', 'Ποσό'],
  orderAmount: ['Ποσό εντολής'],
  currency: ['Νόμισμα', 'Νόμισμα Λογαριασμού'],
  type: ['Χρέωση / Πίστωση', 'Χ/Π'],
  exchangeRate: ['Ισοτιμία', 'Ισοτιμία Συναλλαγής'],
  description: ['Περιγραφή', 'Περιγραφή Κίνησης'],
  accountBalance: ['Λογιστικό Υπόλοιπο'],
  accountHolderName: ['Ονοματεπώνυμο συμβαλλόμενου'],
  counterpartyName: ['Ονοματεπώνυμο αντισυμβαλλόμενου', 'Στοιχεία Εμπόρου'],
  counterpartyAccount: ['Λογαριασμός αντισυμβαλλόμενου', 'Λογαριασμός'],
  counterpartyBank: ['Τράπεζα αντισυμβαλλόμενου'],
  additionalInfo: ['Επιπρόσθετες πληροφορίες'],
  referenceNumber: ['Αριθμός αναφοράς'],
  channel: ['Κανάλι', 'Τερματικό'],
  agentName: ['Ονοματεπώνυμο αντιπροσώπου'],
  commissionType: ['Είδος προμήθειας'],
  merchantCode: ['Κωδικός εμπόρου/οργανισμού'],
  transactionPurpose: ['Σκοπός συναλλαγής'],
  cardTransactionDate: ['Ημερομηνία Συναλλαγής με χρεωστική κάρτα'],
  cardTransactionTime: ['Ώρα Συναλλαγής με χρεωστική κάρτα'],
  debitCard: ['Χρεωστική Κάρτα']
};

function parseGreekDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Αφαίρεση τυχόν ώρας από το νέο format (π.χ. "17/3/2026 10:47 πμ" -> "17/3/2026")
  const dateOnly = dateStr.split(' ')[0];

  // Δοκιμή μορφής DD/MM/YYYY
  const parts = dateOnly.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }

  return new Date(dateOnly);
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

          const getValue = (aliases: string[]) => {
              for (const alias of aliases) {
                  if (row[alias] !== undefined) {
                      return row[alias];
                  }
              }
              return undefined;
          };

          Object.entries(ENGLISH_TO_GREEK).forEach(([englishKey, aliases]) => {
            const value = getValue(aliases);

            if (englishKey === 'date') {
              transaction.date = value ? parseGreekDate(String(value)) : new Date();
            } else if (englishKey === 'type') {
              transaction.type = value === 'Χ' ? 'debit' : 'credit';
            } else if (englishKey === 'amount' || englishKey === 'orderAmount') {
              (transaction as any)[englishKey] = value ? parseFloat(String(value).replace(',', '.')) || 0 : 0;
            } else if (englishKey === 'accountBalance') {
              if (value === undefined || value === null || value === '') {
                 transaction.accountBalance = 0;
                 transaction.hasNoBalance = true; // Σημαία για να το υπολογίσουμε δυναμικά
              } else {
                 transaction.accountBalance = parseFloat(String(value).replace(',', '.')) || 0;
              }
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (transaction as any)[englishKey] = value || '';
            }
          });

          // Καθαρισμός του counterpartyName αν είναι απλά ένα Merchant ID (Νέο Format) ή κενό
          let cName = String(transaction.counterpartyName || '').trim();
          if (!cName || /^\d+$/.test(cName)) {
            let desc = String(transaction.description || '').trim();
            cName = desc.replace(/^(?:E-COMMERCE\s+)?ΑΓΟΡΑ\s*(?:\(ΕΞΟΥΣΙΟΔΟΤΗΣΗ\)\s*)?-\s*/i, '').trim();
          }
          transaction.counterpartyName = cName;

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
