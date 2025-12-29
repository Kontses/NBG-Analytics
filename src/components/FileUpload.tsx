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
      className={`border-2 border-dashed transition-all duration-300 cursor-pointer hover:border-primary hover:bg-primary/5 ${
        isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <CardContent className="p-8">
        <label className="flex flex-col items-center gap-4 cursor-pointer">
          <div className={`p-4 rounded-full transition-colors ${
            isDragging ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
          }`}>
            {isProcessing ? (
              <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              {isProcessing ? 'Επεξεργασία...' : 'Σύρετε το αρχείο Excel εδώ'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ή κάντε κλικ για να επιλέξετε αρχείο
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Υποστηριζόμενα: .xlsx, .xls</span>
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
