import React, { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import { useOrders } from '../../context/OrderContext';
import { useProducts } from '../../context/ProductContext';
import { ArrowUpDown, DollarSign, TrendingUp, Filter } from 'lucide-react';

const Profitability: React.FC = () => {
  const { orders } = useOrders();
  const { products } = useProducts();
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'revenue' | 'profit' | 'margin'>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const productMetrics = useMemo(() => {
    const metrics: {
      [key: string]: {
        id: string;
        code: string;
        name: string;
        quantity: number;
        pendingQuantity: number;
        cost: number;
        revenue: number;
        pendingRevenue: number;
        profit: number;
        pendingProfit: number;
        margin: number;
      }
    } = {};

    // Initialize metrics with all products
    products.forEach(product => {
      metrics[product.id] = {
        id: product.id,
        code: product.id.slice(0, 7),
        name: product.name,
        quantity: 0,
        pendingQuantity: 0,
        cost: product.cost_price,
        revenue: 0,
        pendingRevenue: 0,
        profit: 0,
        pendingProfit: 0,
        margin: 0
      };
    });

    // Calculate metrics from orders
    orders.forEach(order => {
      const isCompleted = order.status === 'completed';
      order.products?.forEach(item => {
        if (metrics[item.productId]) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            if (isCompleted) {
              metrics[item.productId].quantity += item.quantity;
              metrics[item.productId].revenue += item.price * item.quantity;
              const itemCost = product.cost_price * item.quantity;
              metrics[item.productId].profit += (item.price * item.quantity) - itemCost;
            } else {
              metrics[item.productId].pendingQuantity += item.quantity;
              metrics[item.productId].pendingRevenue += item.price * item.quantity;
              const itemCost = product.cost_price * item.quantity;
              metrics[item.productId].pendingProfit += (item.price * item.quantity) - itemCost;
            }
            // Calculate margin based on total revenue (including pending)
            const totalRevenue = metrics[item.productId].revenue + metrics[item.productId].pendingRevenue;
            const totalProfit = metrics[item.productId].profit + metrics[item.productId].pendingProfit;
            metrics[item.productId].margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
          }
        }
      });
    });

    return Object.values(metrics);
  }, [orders, products]);

  const sortedProducts = useMemo(() => {
    return [...productMetrics].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'quantity':
          comparison = (a.quantity + a.pendingQuantity) - (b.quantity + b.pendingQuantity);
          break;
        case 'revenue':
          comparison = (a.revenue + a.pendingRevenue) - (b.revenue + b.pendingRevenue);
          break;
        case 'profit':
          comparison = (a.profit + a.pendingProfit) - (b.profit + b.pendingProfit);
          break;
        case 'margin':
          comparison = a.margin - b.margin;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [productMetrics, sortField, sortDirection]);

  const totals = useMemo(() => {
    return productMetrics.reduce((acc, product) => ({
      quantity: acc.quantity + product.quantity,
      pendingQuantity: acc.pendingQuantity + product.pendingQuantity,
      revenue: acc.revenue + product.revenue,
      pendingRevenue: acc.pendingRevenue + product.pendingRevenue,
      profit: acc.profit + product.profit,
      pendingProfit: acc.pendingProfit + product.pendingProfit,
      margin: acc.revenue + acc.pendingRevenue > 0 
        ? ((acc.profit + acc.pendingProfit) / (acc.revenue + acc.pendingRevenue)) * 100 
        : 0
    }), {
      quantity: 0,
      pendingQuantity: 0,
      revenue: 0,
      pendingRevenue: 0,
      profit: 0,
      pendingProfit: 0,
      margin: 0
    });
  }, [productMetrics]);

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Layout title="Lucratividade">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vendas totais</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totals.revenue)}
                  {totals.pendingRevenue > 0 && (
                    <span className="text-yellow-600 text-sm ml-2">
                      (+{formatCurrency(totals.pendingRevenue)})
                    </span>
                  )}
                </h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Lucro bruto total</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.profit)}
                  {totals.pendingProfit > 0 && (
                    <span className="text-yellow-600 text-sm ml-2">
                      (+{formatCurrency(totals.pendingProfit)})
                    </span>
                  )}
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Margem média</p>
                <h3 className="text-2xl font-bold text-purple-600">
                  {totals.margin.toFixed(2)}%
                </h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Filter className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Lucratividade por Produto</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Produto
                      {sortField === 'name' && (
                        <ArrowUpDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Código
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center justify-end">
                      Quantidade
                      {sortField === 'quantity' && (
                        <ArrowUpDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('revenue')}
                  >
                    <div className="flex items-center justify-end">
                      Faturamento
                      {sortField === 'revenue' && (
                        <ArrowUpDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('profit')}
                  >
                    <div className="flex items-center justify-end">
                      Lucro
                      {sortField === 'profit' && (
                        <ArrowUpDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('margin')}
                  >
                    <div className="flex items-center justify-end">
                      Margem
                      {sortField === 'margin' && (
                        <ArrowUpDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {product.quantity}
                      {product.pendingQuantity > 0 && (
                        <span className="text-yellow-600 text-xs ml-1">
                          (+{product.pendingQuantity})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(product.revenue)}
                      {product.pendingRevenue > 0 && (
                        <span className="text-yellow-600 text-xs ml-1">
                          (+{formatCurrency(product.pendingRevenue)})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                      {formatCurrency(product.profit)}
                      {product.pendingProfit > 0 && (
                        <span className="text-yellow-600 text-xs ml-1">
                          (+{formatCurrency(product.pendingProfit)})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-medium">
                      {product.margin.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {totals.quantity}
                    {totals.pendingQuantity > 0 && (
                      <span className="text-yellow-600 text-xs ml-1">
                        (+{totals.pendingQuantity})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(totals.revenue)}
                    {totals.pendingRevenue > 0 && (
                      <span className="text-yellow-600 text-xs ml-1">
                        (+{formatCurrency(totals.pendingRevenue)})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                    {formatCurrency(totals.profit)}
                    {totals.pendingProfit > 0 && (
                      <span className="text-yellow-600 text-xs ml-1">
                        (+{formatCurrency(totals.pendingProfit)})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                    {totals.margin.toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profitability;