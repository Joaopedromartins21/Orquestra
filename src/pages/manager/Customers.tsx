import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useCustomers } from '../../context/CustomerContext';
import { Plus, Users, Trash2, Edit, LayoutDashboard, History, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { customers, deleteCustomer } = useCustomers();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (customerId: string) => {
    setShowDeleteConfirm(customerId);
  };

  const handleConfirmDelete = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Layout title="Clientes">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Clientes</h1>
          <p className="text-gray-600 mt-1">
            Total de clientes: <span className="font-semibold">{customers.length}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/manager"
            className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200"
          >
            <LayoutDashboard size={18} className="mr-2" />
            Dashboard
          </Link>
          <Link
            to="/manager/new-customer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
          >
            <Plus size={18} className="mr-2" />
            Novo Cliente
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endereço
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end">
                      {customer.balance >= 0 ? (
                        <TrendingUp size={16} className="text-green-500 mr-1" />
                      ) : (
                        <TrendingDown size={16} className="text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        customer.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(customer.balance)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {showDeleteConfirm === customer.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(customer.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Confirmar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/manager/customers/${customer.id}/orders`)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Histórico de Pedidos"
                        >
                          <History size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/manager/edit-customer/${customer.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(customer.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Customers;