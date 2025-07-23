import React from 'react';
import clsx from 'clsx';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  imageUrl = 'https://images.pexels.com/photos/1267325/pexels-photo-1267325.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
}) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-6xl bg-[#1e293b] rounded-2xl overflow-hidden shadow-2xl flex">
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="w-24 h-24">
                <img 
                  src="/Design sem nome(4).png" 
                  alt="Orquestra Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white text-center mb-2">{title}</h1>
            {subtitle && (
              <p className="text-gray-400 text-center mb-8">{subtitle}</p>
            )}

            {children}

            <div className="mt-8 pt-8 border-t border-gray-700/50">
              <div className="text-center text-sm text-gray-500">
                <p>Orquestra v1.0.0</p>
                <p className="mt-1">Sistema M&M Atacadista</p>
                <p className="mt-1">© 2025 Nex Gen Todos os direitos reservados</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-1/2 relative">
          <img
            src={imageUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );
};

export const AuthInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
  }
>(({ className, label, error, ...props }, ref) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-300">
      {label}
    </label>
    <input
      ref={ref}
      className={clsx(
        "w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 transition-all",
        error
          ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
          : "border-gray-700/50 focus:border-blue-500 focus:ring-blue-500/20",
        "text-white placeholder:text-gray-500",
        className
      )}
      {...props}
    />
    {error && (
      <p className="text-sm text-red-500">{error}</p>
    )}
  </div>
));

AuthInput.displayName = 'AuthInput';

export const AuthButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={clsx(
      "w-full px-4 py-2 rounded-lg font-medium transition-all",
      "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      "text-white shadow-lg shadow-blue-500/20",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  >
    {children}
  </button>
));

AuthButton.displayName = 'AuthButton';

export default AuthLayout;