import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useOrders } from '../../context/OrderContext';
import { useDrivers } from '../../context/DriverContext';
import { useCash } from '../../context/CashContext';
import { useCosts } from '../../context/CostContext';
import { RefreshCw, DollarSign, Package, ArrowDown, ArrowUp } from 'lucide-react';
import OrderCard from '../../components/OrderCard';

const ManagerDashboard: React.FC = () => {
  const { orders, deleteOrder } = useOrders();
  const { drivers } = useDrivers();
  const { currentCash, cashHistory } = useCash();
  const { costs } = useCosts();
  const [filter, setFilter] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Filter orders for today
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });
  
  const filteredOrders = todayOrders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const pendingCount = todayOrders.filter(order => order.status === 'pending').length;
  const assignedCount = todayOrders.filter(order => order.status === 'assigned').length;
  const inProgressCount = todayOrders.filter(order => order.status === 'in_progress').length;
  const completedCount = todayOrders.filter(order => order.status === 'completed').length;

  // Calculate financial metrics for today
  const todayMetrics = {
    totalDeliveryValue: todayOrders.reduce((total, order) => total + (order.totalAmount || 0), 0),
    completedValue: todayOrders
      .filter(order => order.status === 'completed')
      .reduce((total, order) => total + (order.totalAmount || 0), 0),
    pendingValue: todayOrders
      .filter(order => order.status !== 'completed')
      .reduce((total, order) => total + (order.totalAmount || 0), 0),
    cashPayments: todayOrders
      .filter(order => order.status === 'completed')
      .reduce((total, order) => total + (order.payments?.find(p => p.type === 'cash')?.amount || 0), 0),
    pixPayments: todayOrders
      .filter(order => order.status === 'completed')
      .reduce((total, order) => total + (order.payments?.find(p => p.type === 'pix')?.amount || 0), 0)
  };
  
  const availableDriversCount = drivers.filter(driver => driver.available).length;

  // Get today's cash register data
  const todayCash = currentCash || cashHistory.find(c => c.date === todayStr);
  const totalDeposits = todayCash?.deposits.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalWithdrawals = todayCash?.withdrawals.reduce((sum, w) => sum + w.amount, 0) || 0;

  // Get today's costs
  const todayCosts = costs.filter(cost => cost.date === todayStr);
  const totalCostsToday = todayCosts.reduce((sum, cost) => sum + cost.amount, 0);

  // Calculate best-selling products
  const productSales = new Map<string, { quantity: number; revenue: number; name: string }>();
  orders.forEach(order => {
    order.products?.forEach(product => {
      const current = productSales.get(product.productId) || { quantity: 0, revenue: 0, name: product.name || '' };
      productSales.set(product.productId, {
        quantity: current.quantity + product.quantity,
        revenue: current.revenue + (product.price * product.quantity),
        name: product.name || current.name
      });
    });
  });

  const bestSellingProduct = Array.from(productSales.entries())
    .sort((a, b) => b[1].quantity - a[1].quantity)[0];

  const handleDeleteClick = (orderId: string) => {
    setShowDeleteConfirm(orderId);
  };

  const handleConfirmDelete = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  return (
    <Layout title="Painel do Gerente">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-600 mt-1">
          Total em entregas hoje: <span className="font-semibold text-green-600">{formatCurrency(todayMetrics.completedValue)}</span>
          {todayMetrics.pendingValue > 0 && (
            <span className="text-yellow-600 ml-2">(+ {formatCurrency(todayMetrics.pendingValue)} pendente)</span>
          )}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Pedidos Pendentes</h3>
          <p className="text-2xl font-semibold text-yellow-600">{pendingCount}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Pedidos Atribuídos</h3>
          <p className="text-2xl font-semibold text-blue-600">{assignedCount}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Em Andamento</h3>
          <p className="text-2xl font-semibold text-purple-600">{inProgressCount}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Concluídos</h3>
          <p className="text-2xl font-semibold text-green-600">{completedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Valor Total</h3>
          <p className="text-2xl font-semibold text-green-600">
            {formatCurrency(todayMetrics.completedValue)}
            {todayMetrics.pendingValue > 0 && (
              <span className="text-yellow-600 text-sm ml-2">
                (+{formatCurrency(todayMetrics.pendingValue)})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro do Dia</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Caixa</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Dinheiro:</span>
                <span className="font-medium">{formatCurrency(todayMetrics.cashPayments)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">PIX:</span>
                <span className="font-medium">{formatCurrency(todayMetrics.pixPayments)}</span>
              </div>
              {todayMetrics.pendingValue > 0 && (
                <div className="flex justify-between mb-2 text-yellow-600">
                  <span>Pendente:</span>
                  <span>{formatCurrency(todayMetrics.pendingValue)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total:</span>
                <div>
                  <span className="font-medium text-green-600">
                    {formatCurrency(todayMetrics.cashPayments + todayMetrics.pixPayments)}
                  </span>
                  {todayMetrics.pendingValue > 0 && (
                    <span className="text-yellow-600 text-sm ml-2">
                      (+{formatCurrency(todayMetrics.pendingValue)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Movimentações</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <ArrowUp size={16} className="text-green-600 mr-1" />
                  <span className="text-gray-600">Entradas:</span>
                </div>
                <span className="font-medium text-green-600">+ {formatCurrency(totalDeposits)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <ArrowDown size={16} className="text-red-600 mr-1" />
                  <span className="text-gray-600">Saídas:</span>
                </div>
                <span className="font-medium text-red-600">- {formatCurrency(totalWithdrawals)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Saldo:</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(totalDeposits - totalWithdrawals)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Custos</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {todayCosts.length > 0 ? (
                <>
                  {todayCosts.map((cost, index) => (
                    <div key={index} className="flex justify-between mb-2">
                      <span className="text-gray-600">{cost.description}:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(cost.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Total:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(totalCostsToday)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-2">Nenhum custo registrado hoje</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Motoristas Disponíveis</h3>
          <span className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs font-medium">
            {availableDriversCount} disponíveis
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map(driver => (
            <div key={driver.id} className={`p-3 rounded-lg border ${
              driver.available ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center">
                <div className="mr-3 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">{driver.name.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{driver.name}</h4>
                  <p className="text-xs text-gray-500">{driver.phone || driver.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Selling Product */}
      {bestSellingProduct && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Produto Mais Vendido</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{bestSellingProduct[1].name}</h3>
                <p className="text-sm text-gray-500">Quantidade vendida: {bestSellingProduct[1].quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Faturamento total</p>
                <p className="font-medium text-green-600">{formatCurrency(bestSellingProduct[1].revenue)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Pedidos de Hoje</h2>
          <div className="flex items-center">
            <button className="mr-4 text-blue-600 hover:text-blue-800 flex items-center">
              <RefreshCw size={16} className="mr-1" />
              <span className="text-sm">Atualizar</span>
            </button>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            >
              <option value="all">Todos os pedidos</option>
              <option value="pending">Pendentes</option>
              <option value="assigned">Atribuídos</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluídos</option>
            </select>
          </div>
        </div>
        
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar exclusão</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirmDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Nenhum pedido encontrado hoje</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                showActions
                actionLabel={
                  order.status === 'pending' 
                    ? 'Atribuir Motorista' 
                    : 'Ver Detalhes'
                }
                onActionClick={() => {
                  window.location.href = `/manager/order/${order.id}`;
                }}
                onDeleteClick={
                  order.status === 'pending'
                    ? () => handleDeleteClick(order.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManagerDashboard;