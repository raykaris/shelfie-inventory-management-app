
export type Tables = {
  goods: {
    id: string;
    created_at: string;
    name: string;
    quantity: number;
    unit_price: number;
    category: string;
    supplier_id: number;
    low_stock_threshold: number;
    high_stock_threshold: number;
  };
  suppliers: {
    id: string;
    created_at: string;
    name: string;
    contact: string;
    email: string;
    address: string;
  };
  customers: {
    id: string;
    created_at: string;
    name: string;
    contact: string;
    email: string;
    address: string;
  };
  expenses: {
    id: string;
    created_at: string;
    supplier_id: number;
    amount: number;
    description: string;
    date: string;
  };
  incoming: {
    id: string;
    created_at: string;
    good_id: number;
    quantity: number;
    expected_date: string;
    supplier_id: number;
    status: 'pending' | 'received' | 'canceled';
  };
  outgoing: {
    id: string;
    created_at: string;
    good_id: number;
    quantity: number;
    customer_id: number;
    amount: number;
    status: 'pending' | 'delivered' | 'canceled';
  };
};
