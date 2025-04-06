import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type OutgoingItem = {
  id: string;
  good_id: string;
  quantity: number;
  customer_id: string;
  amount: number;
  status: 'pending' | 'delivered' | 'canceled';
  goods?: { name: string };
  customers?: { name: string };
};

const OutgoingPage = () => {
  const [outgoing, setOutgoing] = useState<OutgoingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [goods, setGoods] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    good_id: '',
    quantity: 0,
    customer_id: '',
    amount: 0,
    status: 'pending'
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOutgoing();
    fetchGoods();
    fetchCustomers();
  }, []);

  async function fetchOutgoing() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('outgoing')
        .select(`
          *,
          goods(name),
          customers!outgoing_customer_id_fkey(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOutgoing(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching outgoing stock',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchGoods() {
    try {
      const { data, error } = await supabase
        .from('goods')
        .select('id, name, unit_price');
      
      if (error) throw error;
      setGoods(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching goods',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching customers',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    
    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    
    if (name === 'good_id' || name === 'quantity') {
      const selectedGood = goods.find(g => g.id === (name === 'good_id' ? value : formData.good_id));
      if (selectedGood) {
        const quantity = name === 'quantity' ? parseFloat(value) || 0 : formData.quantity;
        const calculatedAmount = selectedGood.unit_price * quantity;
        setFormData(prev => ({
          ...prev,
          [name]: processedValue,
          amount: calculatedAmount
        }));
      }
    }
  };

  const handleAddOutgoing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('outgoing')
        .insert([formData])
        .select(`
          *,
          goods(name),
          customers!outgoing_customer_id_fkey(name)
        `);
      
      if (error) throw error;
      
      setOutgoing([...(data || []), ...outgoing]);
      setIsAddDialogOpen(false);
      setFormData({
        good_id: '',
        quantity: 0,
        customer_id: '',
        amount: 0,
        status: 'pending'
      });
      toast({
        title: 'Success',
        description: 'Outgoing order added successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error adding outgoing order',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'delivered' | 'canceled') => {
    try {
      const outgoingItem = outgoing.find(item => item.id === id);
      if (!outgoingItem) {
        throw new Error('Item not found');
      }

      const { error } = await supabase
        .from('outgoing')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      if (newStatus === 'delivered') {
        const { data: goodsData, error: goodsError } = await supabase
          .from('goods')
          .select('quantity')
          .eq('id', outgoingItem.good_id)
          .single();
        
        if (goodsError) throw goodsError;
        
        if (goodsData) {
          const newQuantity = Math.max(0, goodsData.quantity - outgoingItem.quantity);
          const { error: updateError } = await supabase
            .from('goods')
            .update({ quantity: newQuantity })
            .eq('id', outgoingItem.good_id);
            
          if (updateError) throw updateError;
        }
      }
      
      setOutgoing(outgoing.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));
      
      toast({
        title: 'Success',
        description: `Status updated to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mobile-container pb-20">
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">Outgoing Orders</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Order
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Outgoing Order</DialogTitle>
                <DialogDescription>Create a new outgoing order for a customer.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddOutgoing} className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <label htmlFor="customer_id" className="text-sm font-medium">Customer</label>
                  <select 
                    id="customer_id"
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="good_id" className="text-sm font-medium">Good</label>
                  <select 
                    id="good_id"
                    name="good_id"
                    value={formData.good_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select Good</option>
                    {goods.map(good => (
                      <option key={good.id} value={good.id}>
                        {good.name} (${good.unit_price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="amount" className="text-sm font-medium">Amount (KSH)</label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">Add Order</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Good</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outgoing.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        No outgoing orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    outgoing.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.customers?.name}</TableCell>
                        <TableCell>{item.goods?.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>KSH {item.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                            className="text-xs rounded border px-2 py-1 bg-transparent"
                          >
                            <option value="pending">Pending</option>
                            <option value="delivered">Delivered</option>
                            <option value="canceled">Canceled</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OutgoingPage;
