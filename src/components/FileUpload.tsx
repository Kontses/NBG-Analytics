import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { parseExcelFile } from '@/utils/excelParser';
import { Transaction } from '@/types/transaction';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUpload: (transactions: Transaction[]) => number;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Μη έγκυρο αρχείο',
        description: 'Παρακαλώ ανεβάστε αρχείο Excel (.xlsx ή .xls)',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const transactions = await parseExcelFile(file);
      const newCount = onUpload(transactions);

      toast({
        title: 'Επιτυχής εισαγωγή',
        description: `Προστέθηκαν ${newCount} νέες συναλλαγές`,
      });
    } catch (error) {
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία ανάγνωσης του αρχείου',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-500 cursor-pointer border-2 ${isDragging
          ? 'border-primary bg-primary/5 shadow-2xl scale-[1.01]'
          : 'border-dashed border-muted-foreground/20 bg-background/50 hover:border-primary/50 hover:bg-primary/[0.02] shadow-sm hover:shadow-md'
        }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <CardContent className="p-12">
        <label className="flex flex-col items-center gap-6 cursor-pointer relative z-10">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-primary text-primary-foreground rotate-0 scale-110' : 'bg-primary/10 text-primary -rotate-3 hover:rotate-0'
            }`}>
            {isProcessing ? (
              <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-10 h-10" />
            )}
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {isProcessing ? 'Επεξεργασία αρχείου...' : 'Σύρετε το αρχείο Excel εδώ'}
            </h3>
            <p className="text-muted-foreground">
              ή κάντε κλικ για αναζήτηση στον υπολογιστή σας
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-full text-xs font-medium text-muted-foreground border border-border/50">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <span>Υποστηρίζονται αρχεία .xlsx & .xls</span>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </CardContent>
    </Card>
  );
}
