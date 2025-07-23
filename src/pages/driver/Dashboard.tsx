import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';
import { Truck, Package, History } from 'lucide-react';

const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { orders, updateOrderStatus } = useOrders();
  const [showHistory, setShowHistory] = useState(false);
  
  if (!currentUser || currentUser.role !== 'driver') {
    return null;
  }

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get orders assigned to this driver
  const driverOrders = orders.filter(order => order.driverId === currentUser.id);
  
  // Separate orders by date and status
  const todayOrders = driverOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });

  const historicOrders = driverOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() < today.getTime();
  });
  
  // Separate today's orders by status
  const pendingOrders = todayOrders.filter(order => order.status === 'assigned');
  const activeOrders = todayOrders.filter(order => order.status === 'in_progress');
  const completedOrders = todayOrders.filter(order => order.status === 'completed');
  
  const handleStartDelivery = (orderId: string) => {
    updateOrderStatus(orderId, 'in_progress');
  };
  
  const handleViewOrderDetails = (orderId: string) => {
    navigate(`/driver/order/${orderId}`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  return (
    <Layout title="Painel do Motorista">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Suas Entregas</h1>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showHistory
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <History size={18} className="mr-2" />
            Histórico
          </button>
        </div>
      </div>
      
      {!showHistory ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-2 mr-3">
                  <Package size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Pedidos Pendentes</h3>
                  <p className="text-2xl font-semibold text-blue-600">{pendingOrders.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="rounded-full bg-purple-100 p-2 mr-3">
                  <Truck size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Em Andamento</h3>
                  <p className="text-2xl font-semibold text-purple-600">{activeOrders.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-2 mr-3">
                  <Package size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Entregas Concluídas</h3>
                  <p className="text-2xl font-semibold text-green-600">{completedOrders.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pending Deliveries */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pedidos para Iniciar</h2>
            
            {pendingOrders.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">Não há pedidos pendentes para você</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    showActions
                    actionLabel="Iniciar Entrega"
                    onActionClick={() => handleStartDelivery(order.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Active Deliveries */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Em Andamento</h2>
            
            {activeOrders.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">Você não tem entregas em andamento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    showActions
                    actionLabel="Finalizar Entrega"
                    onActionClick={() => handleViewOrderDetails(order.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Completed Deliveries */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Entregas Concluídas Hoje</h2>
            
            {completedOrders.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">Você ainda não tem entregas concluídas hoje</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    showActions
                    actionLabel="Ver Detalhes"
                    onActionClick={() => handleViewOrderDetails(order.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Histórico de Entregas</h2>

          {historicOrders.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">Nenhuma entrega anterior encontrada</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endereço
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historicOrders.map(order => (
                      <tr 
                        key={order.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewOrderDetails(order.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{order.customerAddress}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            R$ {order.totalAmount.toFixed(2)}
                          </div>
                          {order.tripCosts.length > 0 && (
                            <>
                              <div className="text-xs text-red-600">
                                - R$ {order.tripCosts.reduce((sum, cost) => sum + cost.amount, 0).toFixed(2)}
                              </div>
                              <div className="text-xs font-medium text-green-600">
                                = R$ {order.netAmount.toFixed(2)}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'completed' ? 'Concluído' : 'Cancelado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default DriverDashboard;