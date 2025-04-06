
import { Link } from 'react-router-dom';
import { ShoppingBag, DollarSign, Download, Upload, BarChart2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Dashboard = () => {
  const menuItems = [
    { 
      title: 'Goods', 
      icon: ShoppingBag, 
      description: 'Manage your inventory items',
      path: '/goods',
      color: 'bg-shelfie-50'
    },
    { 
      title: 'Expenses', 
      icon: DollarSign, 
      description: 'Track your expenses',
      path: '/expenses',
      color: 'bg-shelfie-50'
    },
    { 
      title: 'New Incoming', 
      icon: Download, 
      description: 'Manage incoming inventory',
      path: '/incoming',
      color: 'bg-shelfie-50'
    },
    { 
      title: 'New Outgoing', 
      icon: Upload, 
      description: 'Track outgoing inventory',
      path: '/outgoing',
      color: 'bg-shelfie-50'
    },
    { 
      title: 'Reports', 
      icon: BarChart2, 
      description: 'View inventory analytics',
      path: '/reports',
      color: 'bg-shelfie-50'
    },
    { 
      title: 'Documents', 
      icon: FileText, 
      description: 'Manage inventory documents',
      path: '/documents',
      color: 'bg-shelfie-50'
    },
  ];

  return (
    <div className="mobile-container pb-20">
      <h1 className="text-2xl font-bold mb-6 text-center mt-4">Shelfie Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item, index) => (
          <Link to={item.path} key={index} className="focus:outline-none">
            <Card className={`h-36 ${item.color} border-none shadow-sm card-hover`}>
              <CardContent className="flex flex-col items-center justify-center h-full p-4 text-center">
                <item.icon className="h-10 w-10 mb-2 text-shelfie-600" />
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
