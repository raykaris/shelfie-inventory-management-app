
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckSquare } from 'lucide-react';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [goodsData, setGoodsData] = useState<any[]>([]);
  const [totalStock, setTotalStock] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [highStockItems, setHighStockItems] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const { toast } = useToast();
  
  const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff'];

  useEffect(() => {
    fetchGoodsData();
  }, []);

  async function fetchGoodsData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('goods')
        .select('*');
      
      if (error) throw error;
      
      setGoodsData(data || []);
      
      // Calculate total stock and value
      const totalStockCount = (data || []).reduce((sum, item) => sum + item.quantity, 0);
      const totalStockValue = (data || []).reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      
      setTotalStock(totalStockCount);
      setTotalValue(totalStockValue);
      
      // Find low and high stock items
      const lowStock = (data || []).filter(item => item.quantity <= item.low_stock_threshold);
      const highStock = (data || []).filter(item => item.quantity >= item.high_stock_threshold);
      
      setLowStockItems(lowStock);
      setHighStockItems(highStock);
      
      // Group by category for pie chart
      const categories = (data || []).reduce((acc: any, item) => {
        if (!acc[item.category]) {
          acc[item.category] = 0;
        }
        acc[item.category] += item.quantity;
        return acc;
      }, {});
      
      const categoryChartData = Object.keys(categories).map(category => ({
        name: category,
        value: categories[category]
      }));
      
      setCategoryData(categoryChartData);
    } catch (error: any) {
      toast({
        title: 'Error fetching goods data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mobile-container pb-20">
      <h1 className="text-2xl font-bold mt-4 mb-6">Inventory Reports</h1>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-shelfie-600">{totalStock}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-shelfie-600">${totalValue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Stock Alerts */}
          <div className="space-y-4">
            {lowStockItems.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Low Stock Alert</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 text-sm">
                    {lowStockItems.map(item => (
                      <li key={item.id}>
                        {item.name}: {item.quantity} items left (below threshold of {item.low_stock_threshold})
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {highStockItems.length > 0 && (
              <Alert className="bg-shelfie-50 text-shelfie-800">
                <CheckSquare className="h-4 w-4" />
                <AlertTitle>High Stock Notice</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 text-sm">
                    {highStockItems.map(item => (
                      <li key={item.id}>
                        {item.name}: {item.quantity} items (above threshold of {item.high_stock_threshold})
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Category Distribution Chart */}
          {categoryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Breakdown of items by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
