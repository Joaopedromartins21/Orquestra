import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useOrders } from '../../context/OrderContext';
import { usePayments } from '../../context/PaymentContext';
import { ChevronLeft, CheckCircle, Navigation, MapPin, DollarSign, Trash2, Info } from 'lucide-react';
import OrderCard from '../../components/OrderCard';
import PixQRCode from '../../components/PixQRCode';
import { Order, TripCost } from '../../types';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, updateOrderStatus, addTripCost, removeTripCost, addPayment } = useOrders();
  const { generatePixQRCode, completePayment, getPaymentByOrderId } = usePayments();
  
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [showPayment, setShowPayment] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showTripCostModal, setShowTripCostModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [newTripCost, setNewTripCost] = useState<TripCost>({
    amount: 0,
    description: ''
  });
  
  useEffect(() => {
    if (id) {
      const foundOrder = getOrderById(id);
      setOrder(foundOrder);
      
      if (foundOrder?.status === 'completed') {
        setCompleted(true);
      }
    }
  }, [id, getOrderById]);
  
  const handleCompleteDelivery = () => {
    if (!order) return;
    setShowPaymentModal(true);
  };
  
  const handleConfirmPayment = async () => {
    if (!order) return;

    // Add cash payment if any
    if (cashAmount > 0) {
      await addPayment(order.id, {
        type: 'cash',
        amount: cashAmount
      });
    }

    // Add PIX payment for remaining amount
    const remainingAmount = order.totalAmount - cashAmount;
    if (remainingAmount > 0) {
      await addPayment(order.id, {
        type: 'pix',
        amount: remainingAmount
      });
    }

    // Complete the order
    await updateOrderStatus(order.id, 'completed');
    
    // Navigate back to driver dashboard
    navigate('/driver');
  };

  const handleAddTripCost = async () => {
    if (!order || !newTripCost.amount || !newTripCost.description) return;
    
    await addTripCost(order.id, newTripCost);
    const updatedOrder = getOrderById(order.id);
    if (updatedOrder) {
      setOrder(updatedOrder);
    }
    setShowTripCostModal(false);
    setNewTripCost({ amount: 0, description: '' });
  };

  const handleRemoveTripCost = async (index: number) => {
    if (!order) return;
    
    await removeTripCost(order.id, index);
    const updatedOrder = getOrderById(order.id);
    if (updatedOrder) {
      setOrder(updatedOrder);
    }
  };

  const handleProcessPayment = () => {
    if (!order) return;

    if (cashAmount > 0) {
      // If there's cash payment, generate QR code for remaining amount
      const remainingAmount = order.totalAmount - cashAmount;
      if (remainingAmount > 0) {
        setShowPayment(true);
        generatePixQRCode(order.id, remainingAmount);
      } else {
        // If cash covers the total, complete the order
        handleConfirmPayment();
      }
    } else {
      // If no cash payment, generate QR code for full amount
      setShowPayment(true);
      generatePixQRCode(order.id, order.totalAmount);
    }
    setShowPaymentModal(false);
  };
  
  const openMapsApp = () => {
    if (!order) return;
    const encodedAddress = encodeURIComponent(order.customerAddress);
    const mapsUrl = `https://maps.google.com?q=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
  };
  
  if (!order) {
    return (
      <Layout title="Detalhes da Entrega">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Pedido não encontrado</p>
        </div>
      </Layout>
    );
  }
  
  const existingPayment = getPaymentByOrderId(order.id);
  const totalTripCosts = order.tripCosts.reduce((sum, cost) => sum + cost.amount, 0);
  
  return (
    <Layout title="Detalhes da Entrega">
      <div className="mb-6">
        <button
          onClick={() => navigate('/driver')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft size={16} className="mr-1" />
          Voltar para o painel
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderCard order={order} />
          
          <div className="mt-4">
            <button
              onClick={openMapsApp}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 flex justify-center items-center"
            >
              <Navigation size={18} className="mr-2" />
              Navegar até o endereço
            </button>
          </div>
          
          <div className="mt-6 bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Endereço de Entrega</h3>
            <div className="flex items-start space-x-2">
              <MapPin size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-800 font-medium">{order.customerName}</p>
                <p className="text-gray-600">{order.customerAddress}</p>
                {order.customerPhone && (
                  <p className="text-gray-600">{order.customerPhone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          {showPayment || existingPayment ? (
            <PixQRCode 
              payment={existingPayment || generatePixQRCode(order.id, order.totalAmount - (cashAmount || 0))} 
              onComplete={handleConfirmPayment}
            />
          ) : completed ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle size={48} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Entrega Concluída</h2>
              <p className="text-gray-600 mb-4">
                Esta entrega foi concluída com sucesso.
              </p>
              <button
                onClick={() => navigate('/driver')}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
              >
                Voltar para as Entregas
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações</h2>
              
              {order.status === 'assigned' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'in_progress')}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 mb-3"
                >
                  Iniciar Entrega
                </button>
              )}
              
              {order.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => setShowTripCostModal(true)}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 mb-3 flex items-center justify-center"
                  >
                    <DollarSign size={18} className="mr-2" />
                    Adicionar Custo
                  </button>
                  
                  <button
                    onClick={handleCompleteDelivery}
                    className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200 mb-3"
                  >
                    Finalizar Entrega
                  </button>
                </>
              )}
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Resumo</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">
                      {order.status === 'assigned' && 'Atribuído'}
                      {order.status === 'in_progress' && 'Em andamento'}
                      {order.status === 'completed' && 'Concluído'}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">R$ {order.totalAmount.toFixed(2)}</span>
                  </div>
                  {totalTripCosts > 0 && (
                    <>
                      <div className="flex justify-between mt-2 text-red-600">
                        <span>Total dos custos:</span>
                        <span>- R$ {totalTripCosts.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mt-2 text-green-600 font-medium">
                        <span>Valor líquido:</span>
                        <span>R$ {order.netAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                {order.tripCosts.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Custos da Viagem</h3>
                    <div className="space-y-2">
                      {order.tripCosts.map((cost, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <div className="flex items-start">
                            <Info size={16} className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{cost.description}</p>
                              <p className="text-sm text-red-600">R$ {cost.amount.toFixed(2)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveTripCost(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Total dos custos:</span>
                        <span className="text-sm font-medium text-red-600">
                          R$ {totalTripCosts.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trip Cost Modal */}
      {showTripCostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Adicionar Custo da Viagem
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do custo
                </label>
                
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    value={newTripCost.amount}
                    onChange={(e) => setNewTripCost({
                      ...newTripCost,
                      amount: parseFloat(e.target.value) || 0
                    })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição do custo
                </label>
                <input
                  type="text"
                  value={newTripCost.description}
                  onChange={(e) => setNewTripCost({
                    ...newTripCost,
                    description: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Combustível, pedágio, etc."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTripCostModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTripCost}
                disabled={!newTripCost.amount || !newTripCost.description}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Forma de Pagamento
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor em Dinheiro
                </label>
                
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Math.min(order.totalAmount, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    min="0"
                    max={order.totalAmount}
                    step="0.01"
                  />
                </div>

                {cashAmount > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Restante (PIX): R$ {(order.totalAmount - cashAmount).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrderDetail;