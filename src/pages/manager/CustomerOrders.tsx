import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useOrders } from '../../context/OrderContext';
import { useCustomers } from '../../context/CustomerContext';
import { ChevronLeft, Package, DollarSign, Plus, Minus, History } from 'lucide-react';
import OrderCard from '../../components/OrderCard';
import { CustomerTransaction } from '../../types';

const CustomerOrders: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders } = useOrders();
  const { getCustomerById, addTransaction, getTransactions } = useCustomers();

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);

  const customer = id ? getCustomerById(id) : undefined;
  const customerOrders = orders.filter(order => order.customerId === id);

  const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = customerOrders.length > 0 ? totalSpent / customerOrders.length : 0;

  useEffect(() => {
    if (id) {
      loadTransactions();
    }
  }, [id]);

  const loadTransactions = async () => {
    if (!id) return;
    try {
      const data = await getTransactions(id);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleAddTransaction = async () => {
    if (!id || !amount || !description) return;

    try {
      await addTransaction(id, transactionType, amount, description);
      setShowTransactionModal(false);
      setAmount(0);
      setDescription('');
      loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  if (!customer) {
    return (
      <Layout title="Cliente não encontrado">
        <div className="text-center py-12">
          <p className="text-gray-500">Cliente não encontrado</p>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Layout title="Histórico de Pedidos">
      <div className="space-y-6">
        <div>
          <button
            onClick={() => navigate('/manager/customers')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft size={16} className="mr-1" />
            Voltar para clientes
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{customer.name}</h2>
              <div className="text-gray-600">
                {customer.email && <p>Email: {customer.email}</p>}
                {customer.phone && <p>Telefone: {customer.phone}</p>}
                {customer.address && <p>Endereço: {customer.address}</p>}
              </div>
            </div>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 flex items-center"
            >
              <DollarSign size={18} className="mr-2" />
              Nova Transação
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Saldo Atual</h3>
            <p className={`text-2xl font-semibold ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(customer.balance)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total de Pedidos</h3>
            <p className="text-2xl font-semibold text-gray-900">{customerOrders.length}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Gasto</h3>
            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(totalSpent)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Ticket Médio</h3>
            <p className="text-2xl font-semibold text-blue-600">
              {formatCurrency(averageOrderValue)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transações</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos</h3>
            <div className="space-y-4">
              {customerOrders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Package size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum pedido encontrado</p>
                </div>
              ) : (
                customerOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showActions
                    actionLabel="Ver Detalhes"
                    onActionClick={() => navigate(`/manager/order/${order.id}`)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nova Transação
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Transação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTransactionType('credit')}
                    className={`flex items-center justify-center px-4 py-2 rounded-md ${
                      transactionType === 'credit'
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    <Plus size={16} className="mr-2" />
                    Crédito
                  </button>
                  <button
                    onClick={() => setTransactionType('debit')}
                    className={`flex items-center justify-center px-4 py-2 rounded-md ${
                      transactionType === 'debit'
                        ? 'bg-red-100 text-red-700 border-2 border-red-500'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    <Minus size={16} className="mr-2" />
                    Débito
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Descreva o motivo da transação..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setAmount(0);
                  setDescription('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTransaction}
                disabled={!amount || !description}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CustomerOrders;