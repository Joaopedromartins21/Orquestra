import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useOrders } from '../../context/OrderContext';
import { useDrivers } from '../../context/DriverContext';
import { ChevronLeft, Check, X, Truck, Printer, RefreshCw } from 'lucide-react';
import OrderCard from '../../components/OrderCard';
import { Order, ReturnItem } from '../../types';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, assignOrderToDriver, processReturn } = useOrders();
  const { getAvailableDrivers, drivers } = useDrivers();
  
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  
  useEffect(() => {
    if (id) {
      const foundOrder = getOrderById(id);
      setOrder(foundOrder);
      
      if (foundOrder?.driverId) {
        setSelectedDriverId(foundOrder.driverId);
      }
    }
  }, [id, getOrderById]);
  
  const availableDrivers = getAvailableDrivers();
  
  const handleAssignDriver = () => {
    if (!order || !selectedDriverId) return;
    
    assignOrderToDriver(order.id, selectedDriverId);
    setOrder({
      ...order,
      driverId: selectedDriverId,
      status: 'assigned',
      updatedAt: new Date().toISOString()
    });
    setShowAssignForm(false);
  };

  const handleReturn = async () => {
    if (!order || !returnItems.length || !returnReason) return;

    try {
      // Calculate refund amount
      const refundAmount = returnItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      await processReturn(order.id, returnItems, returnReason, refundAmount);
      setShowReturnModal(false);
      setReturnItems([]);
      setReturnReason('');

      // Refresh order data
      const updatedOrder = getOrderById(order.id);
      if (updatedOrder) {
        setOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error processing return:', error);
    }
  };

  const printReceipt = () => {
    if (!order) return;

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Format currency
    const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

    // Format date and time
    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString('pt-BR');
    const formattedTime = orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Calculate totals
    const totalTripCosts = order.tripCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
    const totalPaid = order.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const balance = order.totalAmount - totalPaid;

    // Create receipt content matching the M&M Atacadista format
    const receipt = `
      <style>
        @page {
          margin: 0;
          size: 80mm auto;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          margin: 0;
          padding: 8px;
          width: 80mm;
          line-height: 1.2;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .logo { width: 40px; height: 40px; margin: 0 auto 8px; }
        .divider { 
          border-top: 1px dashed #000; 
          margin: 8px 0; 
          width: 100%;
        }
        .line {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        .item-line {
          margin: 1px 0;
          font-size: 10px;
        }
        .total-line {
          border-top: 1px solid #000;
          margin-top: 4px;
          padding-top: 2px;
          font-weight: bold;
        }
      </style>

      <div class="center">
        <img src="/logo.jpg" class="logo" alt="M&M Logo" />
        <div class="bold">M&M ATACADISTA DE</div>
        <div class="bold">BEBIDAS</div>
        <div style="font-size: 9px; margin-top: 4px;">
          CNPJ: 28329618000119<br>
          WhatsApp:<br>
          Instagram:<br>
          Endereço:
        </div>
      </div>

      <div class="divider"></div>

      <div>
        <div class="bold">Cliente: ${order.customerName}</div>
        <div>Tel: ${order.customerPhone || ''}</div>
        <div>Vendedor: Administrador</div>
      </div>

      <div class="divider"></div>

      <div class="center bold" style="font-size: 9px;">
        Descrição | Quantidade X Unitário        Total
      </div>
      <div class="divider"></div>

      ${order.products?.map(product => `
        <div class="item-line">
          <div class="bold">${product.name}</div>
          <div class="line">
            <span>${product.quantity} X ${formatCurrency(product.price)}</span>
            <span>${formatCurrency(product.price * product.quantity)}</span>
          </div>
        </div>
      `).join('') || ''}

      <div class="divider"></div>

      <div class="line">
        <span>Total a Pagar</span>
        <span class="bold">${formatCurrency(order.totalAmount)}</span>
      </div>

      ${totalPaid > 0 ? `
      <div class="line">
        <span>Total Pago</span>
        <span>${formatCurrency(totalPaid)}</span>
      </div>
      ` : ''}

      ${totalTripCosts > 0 ? `
      <div class="line">
        <span>Valor Debitado</span>
        <span>${formatCurrency(totalTripCosts)}</span>
      </div>
      ` : ''}

      <div class="line total-line">
        <span>Saldo devedor</span>
        <span class="bold">${formatCurrency(Math.max(0, balance))}</span>
      </div>

      <div class="divider"></div>

      <div class="center" style="font-size: 9px; margin-top: 8px;">
        <div>Data: ${formattedDate} ${formattedTime}</div>
        <div style="margin-top: 8px;">Pedido #${order.id.slice(0, 8)}</div>
      </div>

      ${order.payments?.some(p => p.type === 'pix') ? `
      <div class="divider"></div>
      <div class="center" style="font-size: 9px;">
        <div style="border: 1px solid #000; width: 60px; height: 60px; margin: 8px auto;">
          <div style="padding: 20px 0;">QR CODE PIX</div>
        </div>
      </div>
      ` : ''}

      <div class="divider"></div>
      <div class="center" style="font-size: 9px; margin-top: 8px;">
        AGRADECEMOS A PREFERÊNCIA
      </div>
    `;
    
    iframe.contentWindow?.document.write(receipt);
    iframe.contentWindow?.document.close();

    // Print
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    
    // Remove iframe after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
  
  if (!order) {
    return (
      <Layout title="Detalhes do Pedido">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Pedido não encontrado</p>
        </div>
      </Layout>
    );
  }
  
  const assignedDriver = drivers.find(driver => driver.id === order.driverId);
  
  return (
    <Layout title="Detalhes do Pedido">
      <div className="mb-6">
        <button
          onClick={() => navigate('/manager')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft size={16} className="mr-1" />
          Voltar para o painel
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderCard order={order} />

          <div className="mt-4 flex gap-2">
            <button
              onClick={printReceipt}
              className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200 flex justify-center items-center"
            >
              <Printer size={18} className="mr-2" />
              Imprimir Recibo
            </button>

            {order.status === 'completed' && !order.return && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors duration-200 flex justify-center items-center"
              >
                <RefreshCw size={18} className="mr-2" />
                Processar Devolução
              </button>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status do Pedido</h2>
            
            {order.status === 'pending' && (
              <div>
                {!showAssignForm ? (
                  <button
                    onClick={() => setShowAssignForm(true)}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 flex justify-center items-center"
                  >
                    <Truck size={16} className="mr-2" />
                    Atribuir Motorista
                  </button>
                ) : (
                  <div>
                    <div className="mb-4">
                      <label htmlFor="driverId" className="block text-sm font-medium text-gray-700 mb-1">
                        Selecione um Motorista
                      </label>
                      <select
                        id="driverId"
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecionar motorista...</option>
                        {availableDrivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowAssignForm(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 flex justify-center items-center"
                      >
                        <X size={16} className="mr-2" />
                        Cancelar
                      </button>
                      
                      <button
                        onClick={handleAssignDriver}
                        disabled={!selectedDriverId}
                        className={`flex-1 py-2 px-4 rounded-md transition-colors duration-200 flex justify-center items-center ${
                          !selectedDriverId
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        <Check size={16} className="mr-2" />
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {order.status !== 'pending' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Motorista Designado</h3>
                  {assignedDriver ? (
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium">
                          {assignedDriver.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {assignedDriver.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assignedDriver.phone || assignedDriver.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Informações do motorista não disponíveis
                    </p>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Histórico de Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-gray-700">Pedido criado</p>
                      <p className="ml-auto text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    
                    {order.status !== 'pending' && (
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        <p className="text-gray-700">Atribuído ao motorista</p>
                        <p className="ml-auto text-gray-500 text-xs">
                          {new Date(order.updatedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    
                    {order.status === 'in_progress' && (
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                        <p className="text-gray-700">Em andamento</p>
                        <p className="ml-auto text-gray-500 text-xs">
                          {new Date(order.updatedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    
                    {order.status === 'completed' && (
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <p className="text-gray-700">Concluído</p>
                        <p className="ml-auto text-gray-500 text-xs">
                          {new Date(order.updatedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {order.return && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Devolução</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-sm font-medium ${
                          order.return.status === 'completed' 
                            ? 'text-green-600' 
                            : order.return.status === 'rejected'
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }`}>
                          {order.return.status === 'pending' && 'Pendente'}
                          {order.return.status === 'approved' && 'Aprovado'}
                          {order.return.status === 'rejected' && 'Rejeitado'}
                          {order.return.status === 'completed' && 'Concluído'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Motivo:</p>
                        <p>{order.return.reason}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Itens:</p>
                        {order.return.items.map((item, index) => (
                          <p key={index}>
                            {item.quantity}x {item.name} - R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                        ))}
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            Valor do Reembolso:
                          </span>
                          <span className="text-sm font-medium text-red-600">
                            R$ {order.return.refundAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Processar Devolução
            </h3>
            
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
                    setShowReturnModal(false);
                    setReturnItems([]);
                    setReturnReason('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReturn}
                  disabled={returnItems.length === 0 || !returnReason}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-orange-300"
                >
                  Processar Devolução
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrderDetail;