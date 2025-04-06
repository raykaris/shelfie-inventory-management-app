
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/lib/types';

export type Supplier = {
  id: string;
  name: string;
};

export type Expense = Tables['expenses'] & { 
  suppliers: { name: string } 
};

interface ExpenseFormProps {
  onExpenseAdded: (newExpense: Expense, amount: number) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onExpenseAdded }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    supplier_id: '',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching suppliers',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    
    if ((type === 'number') && name === 'amount') {
      processedValue = parseFloat(value) || 0;
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setFormData({
        ...formData,
        date: format(selectedDate, 'yyyy-MM-dd')
      });
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([formData])
        .select('*, suppliers(name)');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newExpense = data[0] as Expense;
        onExpenseAdded(newExpense, newExpense.amount);
      }
      
      setIsDialogOpen(false);
      setFormData({
        supplier_id: '',
        amount: 0,
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
      
      toast({
        title: 'Success',
        description: 'Expense added successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error adding expense',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddExpense} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <label htmlFor="supplier_id" className="text-sm font-medium">Supplier</label>
            <select 
              id="supplier_id"
              name="supplier_id"
              value={formData.supplier_id}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers && suppliers.length > 0 && suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="amount" className="text-sm font-medium">Amount (KSH)</label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="date" className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              required
            />
          </div>
          
          <Button type="submit" className="w-full">Add Expense</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
