
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
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type IncomingItem = {
  id: string;
  name?: string;
  quantity: number;
  unit_price?: number;
  expected_date: string;
  supplier_id: string;
  status: 'pending' | 'received' | 'canceled';
  date: string;
  goods?: { name: string };
  suppliers?: { name: string };
};

const IncomingPage = () => {
  const [incoming, setIncoming] = useState<IncomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '', 
    quantity: 0,
    unit_price: 0, 
    expected_date: format(new Date(), 'yyyy-MM-dd'),
    supplier_id: '',
    status: 'pending',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchIncoming();
    fetchSuppliers();
  }, []);

  async function fetchIncoming() {
    setLoading(true);
    try {
      // Update query to fetch with name and unit_price
      const { data, error } = await supabase
        .from('incoming')
        .select(`
          *,
          suppliers!incoming_supplier_id_fkey(name)
        `)
        .order('expected_date', { ascending: true });
      
      if (error) throw error;
      setIncoming(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching incoming stock',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

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
  };

  const handleAddIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Insert the incoming record with name and price
      const { data, error } = await supabase
        .from('incoming')
        .insert([{
          name: formData.name,
          quantity: formData.quantity,
          unit_price: formData.unit_price,
          expected_date: formData.expected_date,
          supplier_id: formData.supplier_id,
          status: formData.status,
          date: formData.date
        }])
        .select(`
          *,
          suppliers!incoming_supplier_id_fkey(name)
        `);
      
      if (error) throw error;
      
      setIncoming([...(data || []), ...incoming]);
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        quantity: 0,
        unit_price: 0,
        expected_date: format(new Date(), 'yyyy-MM-dd'),
        supplier_id: '',
        status: 'pending',
        date: format(new Date(), 'yyyy-MM-dd')
      });
      toast({
        title: 'Success',
        description: 'Incoming stock added successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error adding incoming stock',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'received' | 'canceled') => {
    try {
      // First find the item to get its details before updating
      const incomingItem = incoming.find(item => item.id === id);
      if (!incomingItem) {
        throw new Error('Item not found');
      }
      
      // Update the status in the database
      const { error: updateError } = await supabase
        .from('incoming')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // If status changed to received, add or update the goods
      if (newStatus === 'received') {
        // Check if the good with this name already exists
        const { data: existingGoods, error: checkError } = await supabase
          .from('goods')
          .select('*')
          .eq('name', incomingItem.name)
          .limit(1);
        
        if (checkError) throw checkError;
        
        if (existingGoods && existingGoods.length > 0) {
          // Update existing good
          const existingGood = existingGoods[0];
          const newQuantity = existingGood.quantity + incomingItem.quantity;
          
          const { error: goodsError } = await supabase
            .from('goods')
            .update({ 
              quantity: newQuantity,
              unit_price: incomingItem.unit_price || existingGood.unit_price // Keep existing price if new one isn't provided
            })
            .eq('id', existingGood.id);
            
          if (goodsError) throw goodsError;
          
          // Add to expenses
          await addToExpenses(incomingItem);
        } else {
          // Create new good
          const { error: goodsError } = await supabase
            .from('goods')
            .insert([{ 
              name: incomingItem.name,
              quantity: incomingItem.quantity,
              unit_price: incomingItem.unit_price || 0,
              supplier_id: incomingItem.supplier_id,
              category: 'General' 
            }]);
            
          if (goodsError) throw goodsError;
          
          // Add to expenses
          await addToExpenses(incomingItem);
        }
      }
      
      // Update local state
      setIncoming(incoming.map(item => 
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

  const addToExpenses = async (incomingItem: IncomingItem) => {
    // Calculate the total cost
    const totalCost = (incomingItem.unit_price || 0) * incomingItem.quantity;

    if (totalCost <= 0) return; // Skip if no cost

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          supplier_id: incomingItem.supplier_id,
          amount: totalCost,
          description: `Purchase of ${incomingItem.quantity} units of ${incomingItem.name}`,
          date: format(new Date(), 'yyyy-MM-dd')
        }]);
        
      if (error) throw error;
    } catch (error: any) {
      console.error('Error adding expense:', error);
    }
  };

  return (
    <div className="mobile-container pb-20">
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">Incoming Stock</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Incoming
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Incoming Stock</DialogTitle>
                <DialogDescription>Track new incoming inventory from suppliers.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddIncoming} className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">Good Name</label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
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
                  <label htmlFor="unit_price" className="text-sm font-medium">Unit Price (KSH)</label>
                  <Input
                    id="unit_price"
                    name="unit_price"
                    type="number"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
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
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="expected_date" className="text-sm font-medium">Expected Date</label>
                  <Input
                    id="expected_date"
                    name="expected_date"
                    type="date"
                    value={formData.expected_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="date" className="text-sm font-medium">Recording Date</label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">Add Incoming</Button>
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
                    <TableHead>Good</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incoming.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        No incoming stock found
                      </TableCell>
                    </TableRow>
                  ) : (
                    incoming.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>KSH {(item.unit_price || 0).toFixed(2)}</TableCell>
                        <TableCell>{item.suppliers?.name}</TableCell>
                        <TableCell>
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                            className="text-xs rounded border px-2 py-1 bg-transparent"
                          >
                            <option value="pending">Pending</option>
                            <option value="received">Received</option>
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

export default IncomingPage;
