import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, Menu, X, LayoutDashboard, Users, ShoppingCart, Truck, DollarSign, TrendingUp, ChevronDown, ChevronRight, Receipt, Car } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

interface NavGroupProps {
  title: string;
  icon: any;
  children: React.ReactNode;
}

const NavGroup: React.FC<NavGroupProps> = ({ title, icon: Icon, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = location.pathname.includes(title.toLowerCase());

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-600'
            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
        }`}
      >
        <Icon size={20} />
        <span className="flex-1 text-left">{title}</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div className="pl-4 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const NavLink = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => (
    <Link
      to={to}
      onClick={closeSidebar}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        location.pathname === to
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      <Icon size={20} />
      <span>{children}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 bg-white border-r border-gray-200 flex flex-col
      `}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/Design sem nome(4).png" 
              alt="Orquestra Logo" 
              className="w-8 h-8 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900">Orquestra</span>
              <span className="text-xs text-gray-500">v1.0.0</span>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {currentUser?.role === 'manager' ? (
            <>
              <NavLink to="/manager" icon={LayoutDashboard}>Dashboard</NavLink>
              
              <NavGroup title="Estoque" icon={Package}>
                <NavLink to="/manager/inventory" icon={Package}>Ver Estoque</NavLink>
                <NavLink to="/manager/products" icon={Package}>Produtos</NavLink>
                <NavLink to="/manager/new-product" icon={ShoppingCart}>Adicionar Produto</NavLink>
              </NavGroup>

              <NavGroup title="Clientes" icon={Users}>
                <NavLink to="/manager/customers" icon={Users}>Ver Clientes</NavLink>
                <NavLink to="/manager/new-customer" icon={Users}>Novo Cliente</NavLink>
              </NavGroup>

              <NavGroup title="Pedidos" icon={ShoppingCart}>
                <NavLink to="/manager/orders" icon={Package}>Ver Pedidos</NavLink>
                <NavLink to="/manager/new-order" icon={ShoppingCart}>Novo Pedido</NavLink>
              </NavGroup>

              <NavGroup title="Financeiro" icon={DollarSign}>
                <NavLink to="/manager/cash-register" icon={DollarSign}>Caixa</NavLink>
                <NavLink to="/manager/costs" icon={Receipt}>Custos</NavLink>
                <NavLink to="/manager/garage" icon={Car}>Garagem</NavLink>
                <NavLink to="/manager/reports" icon={DollarSign}>Relatórios</NavLink>
                <NavLink to="/manager/profitability" icon={TrendingUp}>Lucratividade</NavLink>
              </NavGroup>
            </>
          ) : (
            <NavLink to="/driver" icon={Truck}>Minhas Entregas</NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
              <p className="text-xs text-gray-500">
                {currentUser?.role === 'manager' ? 'Gestor' : 'Motorista'}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default Layout;