import { Transaction } from "@/types/transaction";

const generateTransactions = (): Transaction[] => {
    const transactions: Transaction[] = [];
    const categories = [
        { name: 'Σούπερ Μάρκετ', type: 'debit', merchants: ['ΣΚΛΑΒΕΝΙΤΗΣ', 'ΑΒ ΒΑΣΙΛΟΠΟΥΛΟΣ', 'MY MARKET', 'LIDL', 'BAZAAR'] },
        { name: 'Φαγητό & Ποτό', type: 'debit', merchants: ['EFOOD', 'WOLT', 'BOX', 'COFFEE ISLAND', 'GREGORYS', 'EVEREST', 'MCDONALDS', 'PIZZA FAN'] },
        { name: 'Μεταφορικά', type: 'debit', merchants: ['AEGEAN OIL', 'SHELL', 'EKO', 'AVIN', 'ΟΑΣΑ', 'TAXIPLINE', 'FREE NOW'] },
        { name: 'Λογαριασμοί', type: 'debit', merchants: ['ΔΕΗ', 'COSMOTE', 'VODAFONE', 'ΕΥΔΑΠ', 'NOVA', 'ZENITH'] },
        { name: 'Ψυχαγωγία', type: 'debit', merchants: ['NETFLIX', 'SPOTIFY', 'VILLAGE CINEMAS', 'PUBLIC', 'STEAM', 'PLAYSTATION'] },
        { name: 'Ένδυση', type: 'debit', merchants: ['ZARA', 'H&M', 'PULL&BEAR', 'INTERSPORT', 'ADIDAS', 'NIKE'] },
        { name: 'Υγεία', type: 'debit', merchants: ['ΦΑΡΜΑΚΕΙΟ', 'HEALTHCARE', 'BIOIATRIKI'] },
        { name: 'Σπίτι', type: 'debit', merchants: ['IKEA', 'LEROY MERLIN', 'PRAKTIKER'] },
    ];

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    startDate.setDate(1);

    const endDate = new Date();
    const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    let idCounter = 1;
    let currentBalance = 4500.00; // Ρεαλιστικό αρχικό υπόλοιπο

    const createTransaction = (
        id: string,
        date: Date,
        time: string,
        description: string,
        amount: number,
        type: 'debit' | 'credit',
        customCategory: string,
        counterpartyName: string
    ): Transaction => ({
        id,
        date: new Date(date),
        time,
        description,
        amount,
        type,
        customCategory,
        counterpartyName,
        transactionNumber: `TXN-${id}`,
        valeur: date.toISOString().split('T')[0],
        branch: '001',
        transactionCategory: type === 'credit' ? 'INCOMING TRANSFER' : 'POS PURCHASE',
        workType: type === 'credit' ? 'TRANS' : 'POS',
        orderAmount: Math.abs(amount),
        currency: 'EUR',
        exchangeRate: '1.00',
        accountBalance: 0,
        accountHolderName: 'DEMO USER',
        counterpartyAccount: '',
        counterpartyBank: '',
        additionalInfo: '',
        referenceNumber: `REF-${id}`,
        channel: 'Mobile',
        agentName: '',
        commissionType: 'None',
        merchantCode: '',
        transactionPurpose: '',
        cardTransactionDate: date.toISOString().split('T')[0],
        cardTransactionTime: time,
        debitCard: 'xxxx-xxxx-xxxx-1234'
    });

    const tempTransactions: Transaction[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);

        // --- ΠΙΣΤΩΣΕΙΣ (Έσοδα & Διακυμάνσεις) ---

        // Κύρια Μισθοδοσία (Σταθερά στη 1 του μήνα)
        if (currentDate.getDate() === 1) {
            tempTransactions.push(createTransaction(
                `demo-${idCounter++}`,
                currentDate,
                '09:15',
                'ΜΙΣΘΟΔΟΣΙΑ',
                1200.00,
                'credit',
                'Μισθοδοσία',
                'ΕΤΑΙΡΕΙΑ Α.Ε.'
            ));
        }

        // Μικρές αυξήσεις εσόδων (φίλοι, επιστροφές, μερική πληρωμή) - Δημιουργία του "Κύματος"
        if (random(1, 15) === 1) {
            const types = ['ΜΕΤΑΦΟΡΑ ΑΠΟ ΦΙΛΟ', 'ΕΠΙΣΤΡΟΦΗ ΑΓΟΡΑΣ', 'REVOLUT TOPUP', 'ΜΙΚΡΟΠΛΗΡΩΜΗ'];
            const desc = types[random(0, types.length - 1)];
            tempTransactions.push(createTransaction(
                `demo-${idCounter++}`,
                currentDate,
                '14:20',
                desc,
                random(15, 80),
                'credit',
                'Μεταφορές',
                'ΔΙΑΦΟΡΟΙ'
            ));
        }

        // --- ΧΡΕΩΣΕΙΣ (Έξοδα) ---

        // Σταθεροί/Ημι-σταθεροί Λογαριασμοί
        if (currentDate.getDate() >= 1 && currentDate.getDate() <= 7) {
            if (Math.random() > 0.6) {
                const bill = categories.find(c => c.name === 'Λογαριασμοί')!;
                const merchant = bill.merchants[random(0, bill.merchants.length - 1)];
                tempTransactions.push(createTransaction(
                    `demo-${idCounter++}`,
                    currentDate,
                    '10:30',
                    `ΕΞΟΦΛΗΣΗ ΛΟΓΑΡΙΑΣΜΟΥ ${merchant}`,
                    -(random(40, 150)),
                    'debit',
                    'Λογαριασμοί',
                    merchant
                ));
            }
        }

        // Μεταβλητά Καθημερινά Έξοδα
        const dayOfWeek = currentDate.getDay();
        // Υψηλά έξοδα Παρ/Σαβ, Χαμηλά Κυρ/Δευ
        const baseChance = (dayOfWeek === 5 || dayOfWeek === 6) ? 0.9 : 0.6;

        if (Math.random() < baseChance) {
            const numTxns = random(1, (dayOfWeek === 5 || dayOfWeek === 6) ? 4 : 2);
            for (let i = 0; i < numTxns; i++) {
                const cat = categories[random(0, categories.length - 1)];
                const merchant = cat.merchants[random(0, cat.merchants.length - 1)];

                let amount = 0;
                if (cat.name === 'Σούπερ Μάρκετ') amount = random(10, 110);
                else if (cat.name === 'Φαγητό & Ποτό') amount = random(5, 55);
                else amount = random(5, 40);

                tempTransactions.push(createTransaction(
                    `demo-${idCounter++}`,
                    currentDate,
                    `${random(8, 22).toString().padStart(2, '0')}:${random(0, 59).toString().padStart(2, '0')}`,
                    `ΑΓΟΡΑ ${merchant}`,
                    -amount,
                    'debit',
                    cat.name,
                    merchant
                ));
            }
        }

        // Τυχαία μεσαίου μεγέθους δαπάνη (Ασφάλειες, Αυτοκίνητο, Τεχνολογία) - Κάθε ~3 εβδομάδες
        if (random(1, 20) === 1) {
            tempTransactions.push(createTransaction(
                `demo-${idCounter++}`,
                currentDate,
                '13:00',
                'ΕΚΤΑΚΤΗ ΑΓΟΡΑ / ΣΥΝΔΡΟΜΗ',
                -random(100, 350),
                'debit',
                'Άλλο',
                'ΔΙΑΦΟΡΟΙ'
            ));
        }
    }

    // Ταξινόμηση αύξουσα για υπολογισμό τρέχοντος υπολοίπου
    tempTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const txn of tempTransactions) {
        currentBalance += txn.amount;
        // Διατήρηση υπολοίπου ώστε να μην υπάρχουν αρνητικά σενάρια demo, αν και με μισθό 1850 θα είναι εντάξει
        if (currentBalance < 200) currentBalance = 200 + random(50, 150);
        txn.accountBalance = Number(currentBalance.toFixed(2));
    }

    // Επιστροφή φθίνουσας σειράς για εμφάνιση
    return tempTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const DEMO_TRANSACTIONS = generateTransactions();
