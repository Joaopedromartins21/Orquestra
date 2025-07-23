import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useCosts } from '../../context/CostContext';
import { DollarSign, Plus, Trash2, Receipt, Filter } from 'lucide-react';

const Costs: React.FC = () => {
  const { costs, addCost, deleteCost, isLoading, error } = useCosts();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCost, setNewCost] = useState<{
    date: string;
    description: string;
    amount: number;
    category: string;
    notes?: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: '',
    notes: '',
  });
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().split('-').slice(0, 2).join('-')
  );

  const categories = ['Diesel', 'Alimentacao', 'Contas', 'Pneu', 'Outros'];

  const filteredCosts = costs.filter((cost) =>
    cost.date.startsWith(filterMonth)
  );

  const totalCosts = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);

  const handleAddCost = async () => {
    if (!newCost.description || !newCost.amount || !newCost.category) return;

    try {
      await addCost(newCost);
      setNewCost({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: '',
        notes: '',
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding cost:', error);
    }
  };

  const handleDeleteCost = async (id: string) => {
    try {
      await deleteCost(id);
    } catch (error) {
      console.error('Error deleting cost:', error);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Custos">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Custos">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Custos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestão de Custos
            </h1>
            <p className="text-gray-600 mt-1">
              Total no período:{' '}
              <span className="font-semibold text-red-600">
                R${' '}
                {totalCosts.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Novo Custo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => {
            const categoryCosts = filteredCosts.filter(
              (cost) => cost.category === category
            );
            const categoryTotal = categoryCosts.reduce(
              (sum, cost) => sum + cost.amount,
              0
            );

            return (
              <div key={category} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {category}
                  </h3>
                  <Receipt className="text-gray-400" size={20} />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  R${' '}
                  {categoryTotal.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {categoryCosts.length} lançamentos
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Data
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Descrição
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Categoria
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Valor
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCosts.map((cost) => (
                <tr key={cost.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cost.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {cost.description}
                    </div>
                    {cost.notes && (
                      <div className="text-sm text-gray-500">{cost.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {cost.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                    R${' '}
                    {cost.amount.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteCost(cost.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cost Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Adicionar Novo Custo
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={newCost.date}
                  onChange={(e) =>
                    setNewCost({ ...newCost, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newCost.description}
                  onChange={(e) =>
                    setNewCost({ ...newCost, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Descreva o custo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={newCost.category}
                  onChange={(e) =>
                    setNewCost({ ...newCost, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
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
                    value={newCost.amount}
                    onChange={(e) =>
                      setNewCost({ ...newCost, amount: Number(e.target.value) })
                    }
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={newCost.notes}
                  onChange={(e) =>
                    setNewCost({ ...newCost, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCost}
                disabled={
                  !newCost.description || !newCost.amount || !newCost.category
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Costs;