# NBG Analytics

> [!IMPORTANT]
> **Αποποίηση Ευθύνης**: Αυτή η εφαρμογή είναι demo, **δεν** είναι official εφαρμογή της Εθνικής Τράπεζας και δεν έχει σκοπό την εξαπάτηση των χρηστών, αλλά την ανάλυση των δεδομένων τους τοπικά στον browser.

Μια σύγχρονη web εφαρμογή για την ανάλυση και οπτικοποίηση των τραπεζικών συναλλαγών από την Εθνική Τράπεζα της Ελλάδος (NBG). Η εφαρμογή επιτρέπει στους χρήστες να ανεβάζουν τα αρχεία Excel (.xlsx) που εξάγουν από το e-banking και να βλέπουν στατιστικά στοιχεία και γραφήματα.

## Δυνατότητες

- 📊 **Ανάλυση Δεδομένων**: Αυτόματος υπολογισμός εσόδων, εξόδων και υπολοίπου.
- 📁 **Drag & Drop Upload**: Εύκολη εισαγωγή αρχείων Excel.
- 📅 **Φίλτρα Ημερομηνίας**: Επιλογή χρονικού εύρους για εξειδικευμένη ανάλυση.
- 📈 **Διαδραστικά Γραφήματα**: Οπτικοποίηση εσόδων και εξόδων ανά μήνα και κατηγορία.
- 🏷️ **Κατηγοριοποίηση**: Αυτόματη και χειροκίνητη κατηγοριοποίηση συναλλαγών.
- 🔒 **Ασφάλεια**: Όλη η επεξεργασία γίνεται τοπικά στον browser (δεν αποστέλλονται δεδομένα σε server).

## Τεχνολογίες

Η εφαρμογή έχει κατασκευαστεί με τις παρακάτω τεχνολογίες:

### Core

- **[React](https://react.dev/)**: JavaScript library για το user interface.
- **[TypeScript](https://www.typescriptlang.org/)**: Strongly typed γλώσσα προγραμματισμού που χτίζεται πάνω στη JavaScript.
- **[Vite](https://vitejs.dev/)**: Εργαλείο build επόμενης γενιάς για γρήγορη ανάπτυξη.

### UI & Styling

- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework.
- **[Shadcn UI](https://ui.shadcn.com/)**: Συλλογή επαναχρησιμοποιήσιμων components (χτισμένο πάνω στο Radix UI).
- **[Lucide React](https://lucide.dev/)**: Όμορφα και συνεπή εικονίδια.

### Data & Visualization

- **[Recharts](https://recharts.org/)**: Βιβλιοθήκη γραφημάτων για React.
- **[SheetJS (xlsx)](https://sheetjs.com/)**: Ανάγνωση και επεξεργασία αρχείων Excel.
- **[Date-fns](https://date-fns.org/)**: Βιβλιοθήκη για διαχείριση ημερομηνιών.

### Vue Version (`/vue-app`)

Η εφαρμογή διαθέτει και αντίστοιχη υλοποίηση σε **Vue.js** (μέσα στον φάκελο `vue-app`), η οποία προσφέρει τα ίδια χαρακτηριστικά με διαφορετικό τεχνολογικό stack:

- **[Vue.js 3](https://vuejs.org/)**: Προοδευτικό JavaScript Framework.
- **[Vuetify](https://vuetifyjs.com/)**: Component Framework βασισμένο στο Material Design.
- **[Pinia / Composables]**: Διαχείριση κατάστασης (State Management).
- **[Chart.js](https://www.chartjs.org/)** & **[vue-chartjs](https://vue-chartjs.org/)**: Για την οπτικοποίηση δεδομένων.

## Deployment (Live Demo)

Μπορείτε να δείτε τις εφαρμογές live στους παρακάτω συνδέσμους:

- ⚛️ **React Version**: [https://nbg-analytics.vercel.app/](https://nbg-analytics.vercel.app/)
- 🟢 **Vue Version**: [https://nbg-analytics-vue.vercel.app/](https://nbg-analytics-vue.vercel.app/)
