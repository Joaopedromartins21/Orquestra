import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useOrders } from '../../context/OrderContext';
import { useProducts } from '../../context/ProductContext';
import { Package, Filter, MapPin, Phone, ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReturnItem } from '../types';

const Orders: React.FC = () => {
  const { orders, processReturn } = useOrders();
  const { updateStock } = useProducts();
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();
  const [showReturnModal, setShowReturnModal] = useState<string | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'assigned':
        return 'Atribuído';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReturn = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.products) return;

    try {
      // Calculate refund amount based on returned items
      const refundAmount = returnItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      // Process the return
      await processReturn(orderId, returnItems, returnReason, refundAmount);

      // Return items to stock
      for (const item of returnItems) {
        await updateStock(
          item.productId,
          item.quantity,
          undefined,
          'Devolução do pedido'
        );
      }

      setShowReturnModal(null);
      setReturnItems([]);
      setReturnReason('');
    } catch (error) {
      console.error('Error processing return:', error);
    }
  };

  return (
    <Layout title="Pedidos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lista de Pedidos</h1>
            <p className="text-gray-600 mt-1">
              Total de pedidos: {filteredOrders.length}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-500" />
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
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Itens
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valores
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin size={14} className="mr-1" />
                          {order.customerAddress}
                        </div>
                        {order.customerPhone && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone size={14} className="mr-1" />
                            {order.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.products?.map((product, index) => (
                            <div key={index}>
                              {product.quantity}x {product.name}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          R$ {order.totalAmount.toFixed(2)}
                        </div>
                        {order.tripCosts.length > 0 && (
                          <>
                            <div className="text-sm text-red-600">
                              - R$ {order.tripCosts.reduce((sum, cost) => sum + cost.amount, 0).toFixed(2)}
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              = R$ {order.netAmount.toFixed(2)}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/manager/order/${order.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ChevronRight size={20} />
                          </button>
                          {order.status === 'completed' && (
                            <button
                              onClick={() => setShowReturnModal(order.id)}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              <RefreshCw size={20} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Processar Devolução
            </h3>

            {(() => {
              const order = orders.find(o => o.id === showReturnModal);
              if (!order) return null;

              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Itens para Devolução
                    </label>
                    <div className="space-y-2">
                      {order.products?.map(product => (
                        <div key={product.productId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              Quantidade original: {product.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max={product.quantity}
                              value={returnItems.find(i => i.productId === product.productId)?.quantity || 0}
                              onChange={(e) => {
                                const qty = Math.min(product.quantity, Math.max(0, parseInt(e.target.value) || 0));
                                setReturnItems(prev => {
                                  const existing = prev.find(i => i.productId === product.productId);
                                  if (!existing && qty > 0) {
                                    return [...prev, {
                                      productId: product.productId,
                                      quantity: qty,
                                      price: product.price,
                                      name: product.name || ''
                                    }];
                                  }
                                  if (existing && qty === 0) {
                                    return prev.filter(i => i.productId !== product.productId);
                                  }
                                  if (existing) {
                                    return prev.map(i => 
                                      i.productId === product.productId 
                                        ? { ...i, quantity: qty }
                                        : i
                                    );
                                  }
                                  return prev;
                                });
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo da Devolução
                    </label>
                    <textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Descreva o motivo da devolução..."
                    />
                  </div>

                  {returnItems.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Resumo da Devolução</h4>
                      <div className="space-y-1">
                        {returnItems.map(item => (
                          <div key={item.productId} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="pt-2 mt-2 border-t border-gray-200">
                          <div className="flex justify-between font-medium">
                            <span>Total a Reembolsar:</span>
                            <span>R$ {returnItems.reduce((sum, item) => 
                              sum + (item.price * item.quantity), 0
                            ).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowReturnModal(null);
                        setReturnItems([]);
                        setReturnReason('');
                      }}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleReturn(showReturnModal)}
                      disabled={returnItems.length === 0 || !returnReason}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-orange-300"
                    >
                      Processar Devolução
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Orders;