import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useOrders } from '../../context/OrderContext';
import { useProducts } from '../../context/ProductContext';
import { useCustomers } from '../../context/CustomerContext';
import { ChevronLeft, Save, Plus, Minus, Trash2, Users, Percent, DollarSign } from 'lucide-react';
import { Product, Customer } from '../../types';

interface OrderItem {
  product: Product;
  quantity: number;
  customPrice?: number;
}

const NewOrder: React.FC = () => {
  const navigate = useNavigate();
  const { createOrder } = useOrders();
  const { products } = useProducts();
  const { customers } = useCustomers();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!selectedCustomerId) {
      errors.customer = 'Selecione um cliente';
    }
    
    if (selectedItems.length === 0) {
      errors.items = 'Selecione pelo menos um produto';
    }

    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      errors.discount = 'Desconto deve estar entre 0% e 100%';
    }

    if (discountType === 'fixed' && (discountValue < 0 || discountValue > calculateSubtotal())) {
      errors.discount = 'Desconto não pode ser maior que o valor total';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleAddProduct = (product: Product) => {
    const existingItem = selectedItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setSelectedItems(prev =>
          prev.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setSelectedItems(prev => [...prev, { 
        product, 
        quantity: 1,
        customPrice: product.selling_price 
      }]);
    }
  };
  
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || newQuantity < 0 || newQuantity > product.stock) return;
    
    setSelectedItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const handleUpdatePrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) return;
    
    setSelectedItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, customPrice: newPrice }
          : item
      )
    );
  };
  
  const calculateSubtotal = () => {
    return selectedItems.reduce(
      (total, item) => total + (item.customPrice || item.product.selling_price) * item.quantity,
      0
    );
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer) return;
    
    // Create new order
    createOrder({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerAddress: selectedCustomer.address || '',
      customerPhone: selectedCustomer.phone,
      items: selectedItems.map(item => 
        `${item.quantity}x ${item.product.name}`
      ).join(', '),
      notes: notes || undefined,
      totalAmount: calculateTotal(),
      products: selectedItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.customPrice || item.product.selling_price,
        name: item.product.name
      }))
    });
    
    // Navigate back to dashboard
    navigate('/manager');
  };
  
  return (
    <Layout title="Novo Pedido">
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Criar Novo Pedido</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <div className="flex gap-3">
                    <select
                      id="customerId"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className={`flex-1 px-3 py-2 border ${
                        formErrors.customer ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="">Selecione um cliente...</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => navigate('/manager/new-customer')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200 flex items-center"
                    >
                      <Users size={16} className="mr-2" />
                      Novo Cliente
                    </button>
                  </div>
                  {formErrors.customer && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.customer}</p>
                  )}
                </div>

                {selectedCustomerId && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {(() => {
                      const customer = customers.find(c => c.id === selectedCustomerId);
                      if (!customer) return null;
                      return (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Endereço:</span> {customer.address}
                          </p>
                          {customer.phone && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Telefone:</span> {customer.phone}
                            </p>
                          )}
                          {customer.email && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Email:</span> {customer.email}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/manager')}
                  className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center"
                >
                  <Save size={16} className="mr-2" />
                  Criar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos</h3>
            
            {formErrors.items && (
              <p className="mb-4 text-sm text-red-600">{formErrors.items}</p>
            )}
            
            <div className="space-y-4">
              {products.map(product => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-500">{product.description}</p>
                    </div>
                    <span className="text-green-600 font-medium">
                      R$ {product.selling_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Em estoque: {product.stock}
                    </span>
                    
                    {selectedItems.find(item => item.product.id === product.id) ? (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const item = selectedItems.find(i => i.product.id === product.id);
                            if (item) {
                              handleUpdateQuantity(product.id, item.quantity - 1);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Minus size={16} />
                        </button>
                        
                        <span className="w-8 text-center">
                          {selectedItems.find(item => item.product.id === product.id)?.quantity || 0}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const item = selectedItems.find(i => i.product.id === product.id);
                            if (item) {
                              handleUpdateQuantity(product.id, item.quantity + 1);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          disabled={product.stock === selectedItems.find(item => item.product.id === product.id)?.quantity}
                        >
                          <Plus size={16} />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(product.id, 0)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="ml-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={selectedItems.find(item => item.product.id === product.id)?.customPrice ?? product.selling_price}
                            onChange={(e) => handleUpdatePrice(product.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        disabled={product.stock === 0}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          product.stock === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        Adicionar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {selectedItems.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h4>
                
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span>R$ {((item.customPrice || item.product.selling_price) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal:</span>
                      <span>R$ {calculateSubtotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Desconto
                      </label>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setDiscountType('percentage')}
                          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                            discountType === 'percentage'
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}
                        >
                          <Percent size={16} className="inline-block mr-1" />
                          Porcentagem
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('fixed')}
                          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                            discountType === 'fixed'
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}
                        >
                          <DollarSign size={16} className="inline-block mr-1" />
                          Valor Fixo
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={discountType === 'percentage' ? 100 : calculateSubtotal()}
                          step={discountType === 'percentage' ? 1 : 0.01}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                          className="w-full pl-8 pr-8 py-2 border border-gray-300 rounded-md"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {discountType === 'percentage' ? '%' : 'R$'}
                        </span>
                      </div>
                      {formErrors.discount && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.discount}</p>
                      )}

                      {discountValue > 0 && (
                        <div className="flex justify-between text-sm text-red-600 mt-2">
                          <span>Desconto:</span>
                          <span>- R$ {calculateDiscount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 mt-2 border-t flex justify-between font-medium text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewOrder;