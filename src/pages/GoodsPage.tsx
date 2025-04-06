
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Good = Tables['goods'];

const GoodsPage = () => {
  const [goods, setGoods] = useState<Good[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit_price: 0,
    category: '',
    supplier_id: '',
    low_stock_threshold: 5,
    high_stock_threshold: 50
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGoods();
    fetchSuppliers();
  }, []);

  async function fetchGoods() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('goods')
        .select('*, suppliers(name)')
        .order('name');
      
      if (error) throw error;
      setGoods(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching goods',
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

  const handleAddGood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('goods')
        .insert([formData])
        .select();
      
      if (error) throw error;
      
      setGoods([...(goods || []), ...(data || [])]);
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        quantity: 0,
        unit_price: 0,
        category: '',
        supplier_id: '',
        low_stock_threshold: 5,
        high_stock_threshold: 50
      });
      toast({
        title: 'Success',
        description: 'Item added successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error adding item',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGood = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { error } = await supabase
        .from('goods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setGoods(goods.filter(good => good.id !== id));
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting item',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredGoods = goods.filter(good => 
    good.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mobile-container pb-20">
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">Goods Inventory</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddGood} className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="category" className="text-sm font-medium">Category</label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="low_stock_threshold" className="text-sm font-medium">Low Stock Alert</label>
                    <Input
                      id="low_stock_threshold"
                      name="low_stock_threshold"
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="high_stock_threshold" className="text-sm font-medium">High Stock Alert</label>
                    <Input
                      id="high_stock_threshold"
                      name="high_stock_threshold"
                      type="number"
                      value={formData.high_stock_threshold}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full">Add Item</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGoods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGoods.map((good) => (
                      <TableRow key={good.id}>
                        <TableCell className="font-medium">{good.name}</TableCell>
                        <TableCell>{good.quantity}</TableCell>
                        <TableCell>KSH {good.unit_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteGood(good.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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

export default GoodsPage;
