import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ManagerDashboard from './pages/manager/Dashboard';
import DriverDashboard from './pages/driver/Dashboard';
import NewOrder from './pages/manager/NewOrder';
import OrderDetail from './pages/manager/OrderDetail';
import DriverOrderDetail from './pages/driver/OrderDetail';
import NewCustomer from './pages/manager/NewCustomer';
import Customers from './pages/manager/Customers';
import CustomerOrders from './pages/manager/CustomerOrders';
import Products from './pages/manager/Products';
import NewProduct from './pages/manager/NewProduct';
import Inventory from './pages/manager/Inventory';
import StockMovements from './pages/manager/StockMovements';
import Orders from './pages/manager/Orders';
import CashRegister from './pages/manager/CashRegister';
import Costs from './pages/manager/Costs';
import Reports from './pages/manager/Reports';
import Profitability from './pages/manager/Profitability';
import Garage from './pages/manager/Garage';

export const AppRoutes = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login\" replace />} />
      </Routes>
    );
  }

  if (currentUser.role === 'manager') {
    return (
      <Routes>
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/manager/new-order" element={<NewOrder />} />
        <Route path="/manager/order/:id" element={<OrderDetail />} />
        <Route path="/manager/customers" element={<Customers />} />
        <Route path="/manager/customers/:id/orders" element={<CustomerOrders />} />
        <Route path="/manager/new-customer" element={<NewCustomer />} />
        <Route path="/manager/products" element={<Products />} />
        <Route path="/manager/new-product" element={<NewProduct />} />
        <Route path="/manager/inventory" element={<Inventory />} />
        <Route path="/manager/stock-movements" element={<StockMovements />} />
        <Route path="/manager/orders" element={<Orders />} />
        <Route path="/manager/cash-register" element={<CashRegister />} />
        <Route path="/manager/costs" element={<Costs />} />
        <Route path="/manager/reports" element={<Reports />} />
        <Route path="/manager/profitability" element={<Profitability />} />
        <Route path="/manager/garage" element={<Garage />} />
        <Route path="*" element={<Navigate to="/manager\" replace />} />
      </Routes>
    );
  }

  if (currentUser.role === 'driver') {
    return (
      <Routes>
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/order/:id" element={<DriverOrderDetail />} />
        <Route path="*" element={<Navigate to="/driver\" replace />} />
      </Routes>
    );
  }

  return null;
};