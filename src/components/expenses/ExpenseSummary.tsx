
import { CardFooter } from '@/components/ui/card';

interface ExpenseSummaryProps {
  totalAmount: number;
}

export function ExpenseSummary({ totalAmount }: ExpenseSummaryProps) {
  return (
    <CardFooter className="border-t px-6 py-3">
      <div className="flex items-center justify-between w-full font-medium">
        <span>Total Expenses</span>
        <span>KSH {totalAmount.toFixed(2)}</span>
      </div>
    </CardFooter>
  );
}
