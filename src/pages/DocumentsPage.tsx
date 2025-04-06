
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const DocumentsPage = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length === 0) {
          toast({
            title: 'Error',
            description: 'The uploaded file contains no data',
            variant: 'destructive',
          });
          return;
        }
        
        // Process the imported data based on the sheet name
        if (sheetName.toLowerCase().includes('goods')) {
          await importGoods(json);
        } else if (sheetName.toLowerCase().includes('supplier')) {
          await importSuppliers(json);
        } else if (sheetName.toLowerCase().includes('customer')) {
          await importCustomers(json);
        } else {
          toast({
            title: 'Error',
            description: 'Unrecognized sheet name. Please name your sheet as Goods, Suppliers, or Customers',
            variant: 'destructive',
          });
        }
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      toast({
        title: 'Import Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      // Clear the input
      e.target.value = '';
    }
  };

  const importGoods = async (data: any[]) => {
    try {
      // Map the Excel data to the expected format
      const formattedData = data.map(item => ({
        name: item.name || item.Name || '',
        quantity: Number(item.quantity || item.Quantity || 0),
        unit_price: Number(item.price || item.Price || item.unit_price || item["Unit Price"] || 0),
        category: item.category || item.Category || 'General',
        supplier_id: item.supplier_id || item["Supplier ID"] || null,
        low_stock_threshold: Number(item.low_stock_threshold || item["Low Stock Threshold"] || 5),
        high_stock_threshold: Number(item.high_stock_threshold || item["High Stock Threshold"] || 50)
      }));
      
      const { error } = await supabase.from('goods').insert(formattedData);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `${formattedData.length} goods imported successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Import Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const importSuppliers = async (data: any[]) => {
    try {
      const formattedData = data.map(item => ({
        name: item.name || item.Name || '',
        contact: item.contact || item.Contact || item.phone || item.Phone || '',
        email: item.email || item.Email || '',
        address: item.address || item.Address || ''
      }));
      
      const { error } = await supabase.from('suppliers').insert(formattedData);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `${formattedData.length} suppliers imported successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Import Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const importCustomers = async (data: any[]) => {
    try {
      const formattedData = data.map(item => ({
        name: item.name || item.Name || '',
        contact: item.contact || item.Contact || item.phone || item.Phone || '',
        email: item.email || item.Email || '',
        address: item.address || item.Address || ''
      }));
      
      const { error } = await supabase.from('customers').insert(formattedData);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `${formattedData.length} customers imported successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Import Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (tableName: string) => {
    setExporting(true);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast({
          title: 'Export Error',
          description: `No data found in ${tableName} table`,
          variant: 'destructive',
        });
        return;
      }
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, `shelfie_${tableName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: 'Success',
        description: `${tableName} exported successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Export Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mobile-container pb-20">
      <h1 className="text-2xl font-bold mt-4 mb-6">Inventory Documents</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload Excel (.xlsx) file to import inventory data. 
                Make sure your sheet is named according to the data type (Goods, Suppliers, or Customers).
              </p>
              
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
                <Button disabled={importing}>
                  <Upload className="h-4 w-4 mr-2" />
                  {importing ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your inventory data to Excel format. Choose which data to export.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center justify-center"
                  onClick={() => handleExport('goods')}
                  disabled={exporting}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span>Goods</span>
                  <Download className="h-4 w-4 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-center"
                  onClick={() => handleExport('expenses')}
                  disabled={exporting}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span>Expenses</span>
                  <Download className="h-4 w-4 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-center"
                  onClick={() => handleExport('suppliers')}
                  disabled={exporting}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span>Suppliers</span>
                  <Download className="h-4 w-4 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-center"
                  onClick={() => handleExport('customers')}
                  disabled={exporting}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span>Customers</span>
                  <Download className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentsPage;
