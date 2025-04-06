
import { AuthForm } from '@/components/auth/AuthForm';

const AuthPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-shelfie-50 to-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-shelfie-700">Shelfie Inventories</h1>
          <p className="mt-2 text-sm text-gray-600">Mobile Inventory Management System</p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  );
};

export default AuthPage;
