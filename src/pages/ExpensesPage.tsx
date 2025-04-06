
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ExpenseForm, Expense } from '@/components/expenses/ExpenseForm';
import { ExpensesList } from '@/components/expenses/ExpensesList';
import { ExpenseSummary } from '@/components/expenses/ExpenseSummary';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, suppliers!expenses_supplier_id_fkey(name)')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      setExpenses(data as Expense[] || []);
      
      // Calculate total amount
      const total = (data || []).reduce((sum, expense) => sum + expense.amount, 0);
      setTotalAmount(total);
    } catch (error: any) {
      toast({
        title: 'Error fetching expenses',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleExpenseAdded = (newExpense: Expense, amount: number) => {
    setExpenses([newExpense, ...expenses]);
    setTotalAmount(totalAmount + amount);
  };

  return (
    <div className="mobile-container pb-20">
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">Expenses</CardTitle>
          <ExpenseForm onExpenseAdded={handleExpenseAdded} />
        </CardHeader>
        <CardContent>
          <ExpensesList expenses={expenses} loading={loading} />
        </CardContent>
        <ExpenseSummary totalAmount={totalAmount} />
      </Card>
    </div>
  );
};

export default ExpensesPage;
