import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useProducts } from '../../context/ProductContext';
import { ArrowUp, ArrowDown, Search, Calendar, Filter, ChevronLeft } from 'lucide-react';

interface StockMovement {
  id: string;
  productId: string;
  type: 'increase' | 'decrease';
  quantity: number;
  reason: string;
  timestamp: string;
}

const StockMovements: React.FC = () => {
  const navigate = useNavigate();
  const { products, stockMovements } = useProducts();
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [filterType, setFilterType] = useState<'all' | 'increase' | 'decrease'>('all');

  const filteredMovements = stockMovements.filter(movement => {
    const product = products.find(p => p.id === movement.productId);
    const matchesSearch = product?.name.toLowerCase().includes(search.toLowerCase());
    const matchesDate = movement.timestamp.startsWith(filterDate);
    const matchesType = filterType === 'all' || movement.type === filterType;
    
    return matchesSearch && matchesDate && matchesType;
  });

  return (
    <Layout title="Movimentações de Estoque">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/manager/inventory')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ChevronLeft size={16} className="mr-1" />
              Voltar para Estoque
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Histórico de Movimentações
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por produto..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-gray-500" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="border-gray-300 rounded-md shadow-sm"
                >
                  <option value="all">Todos</option>
                  <option value="increase">Entradas</option>
                  <option value="decrease">Saídas</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMovements.map((movement) => {
                  const product = products.find(p => p.id === movement.productId);
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(movement.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          movement.type === 'increase'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {movement.type === 'increase' ? (
                            <ArrowUp size={14} className="mr-1" />
                          ) : (
                            <ArrowDown size={14} className="mr-1" />
                          )}
                          {movement.type === 'increase' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${
                          movement.type === 'increase'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {movement.type === 'increase' ? '+' : '-'}{movement.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.reason}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>

              {filteredMovements.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhuma movimentação encontrada</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StockMovements;