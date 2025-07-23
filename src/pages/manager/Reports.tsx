import React, { useState, useMemo } from 'react';
import { useCash } from '../../context/CashContext';
import { useCosts } from '../../context/CostContext';
import { useOrders } from '../../context/OrderContext';
import Layout from '../../components/Layout';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Filter, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Reports: React.FC = () => {
  const { cashHistory } = useCash();
  const { costs } = useCosts();
  const { orders } = useOrders();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'day' | 'month' | 'year'>('month');

  // Filter cash register entries based on date range
  const filterCashEntries = () => {
    if (filterType === 'all') return cashHistory;

    return cashHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) {
        end.setHours(23, 59, 59, 999);
        return entryDate >= start && entryDate <= end;
      }
      
      return true;
    });
  };

  // Calculate daily revenue data for chart
  const chartData = useMemo(() => {
    const dailyRevenue = new Map<string, number>();
    const filteredEntries = filterCashEntries();

    // Include both cash register entries and pending orders
    filteredEntries.forEach(entry => {
      const total = entry.total_cash + entry.total_pix;
      dailyRevenue.set(entry.date, (dailyRevenue.get(entry.date) || 0) + total);
    });

    // Add pending orders to the chart
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      if (!order.status.includes('completed')) {
        dailyRevenue.set(orderDate, (dailyRevenue.get(orderDate) || 0) + order.totalAmount);
      }
    });

    const sortedDates = Array.from(dailyRevenue.keys()).sort();

    return {
      labels: sortedDates.map(date => {
        const [year, month, day] = date.split('-');
        return `${day}/${month}`;
      }),
      datasets: [
        {
          label: 'Faturamento',
          data: sortedDates.map(date => dailyRevenue.get(date) || 0),
          fill: true,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          borderWidth: 3,
        },
      ],
    };
  }, [cashHistory, orders, startDate, endDate, filterType]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => `R$ ${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 12,
          },
          callback: (value: number) => `R$ ${value.toFixed(2)}`,
        },
      },
    },
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
  };

  // Calculate financial metrics including pending orders
  const metrics = useMemo(() => {
    const filteredEntries = filterCashEntries();
    const totalCash = filteredEntries.reduce((sum, entry) => sum + entry.total_cash, 0);
    const totalPix = filteredEntries.reduce((sum, entry) => sum + entry.total_pix, 0);
    const totalDeposits = filteredEntries.reduce((sum, entry) => 
      sum + entry.deposits.reduce((depSum: number, dep: any) => depSum + dep.amount, 0), 0);
    const totalWithdrawals = filteredEntries.reduce((sum, entry) => 
      sum + entry.withdrawals.reduce((withSum: number, wit: any) => withSum + wit.amount, 0), 0);
    
    // Calculate pending orders total
    const pendingOrdersTotal = orders
      .filter(order => !order.status.includes('completed'))
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    return {
      totalRevenue: totalCash + totalPix + pendingOrdersTotal,
      totalCash,
      totalPix,
      pendingOrdersTotal,
      totalDeposits,
      totalWithdrawals,
      netCashFlow: totalCash + totalPix + totalDeposits - totalWithdrawals
    };
  }, [cashHistory, orders, startDate, endDate, filterType]);

  const handleFilterChange = (type: 'all' | 'day' | 'month' | 'year') => {
    setFilterType(type);
    
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
      case 'day':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'month':
        start.setDate(1);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'year':
        start.setMonth(0, 1);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      default:
        setStartDate('');
        setEndDate('');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Layout title="Relatórios">
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500" size={20} />
            <span className="font-medium">Período:</span>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value as any)}
                className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-md font-medium text-gray-700"
              >
                <option value="day">Hoje</option>
                <option value="month">Últimos 30 dias</option>
                <option value="year">Este ano</option>
                <option value="all">Todo período</option>
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Faturamento Total</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics.totalRevenue)}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Dinheiro:</span>
                <span className="font-medium">{formatCurrency(metrics.totalCash)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">PIX:</span>
                <span className="font-medium">{formatCurrency(metrics.totalPix)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pedidos Pendentes:</span>
                <span className="font-medium">{formatCurrency(metrics.pendingOrdersTotal)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Movimentações</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-green-600">
                  <ArrowUp size={16} className="mr-1" />
                  <span>Entradas:</span>
                </div>
                <span className="font-medium text-green-600">
                  {formatCurrency(metrics.totalDeposits)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-red-600">
                  <ArrowDown size={16} className="mr-1" />
                  <span>Saídas:</span>
                </div>
                <span className="font-medium text-red-600">
                  {formatCurrency(metrics.totalWithdrawals)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Fluxo de Caixa</h3>
            <p className={`text-2xl font-bold ${metrics.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.netCashFlow)}
            </p>
          </div>
        </div>

        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Faturamento por dia</h2>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Cash Register History */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Histórico do Caixa</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Dinheiro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    PIX
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Entradas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Saídas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filterCashEntries().map((entry) => {
                  const totalDeposits = entry.deposits.reduce((sum: number, dep: any) => sum + dep.amount, 0);
                  const totalWithdrawals = entry.withdrawals.reduce((sum: number, wit: any) => sum + wit.amount, 0);
                  const total = entry.total_cash + entry.total_pix + totalDeposits - totalWithdrawals;

                  // Get pending orders for this date
                  const pendingOrders = orders.filter(order => {
                    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                    return orderDate === entry.date && !order.status.includes('completed');
                  });
                  const pendingTotal = pendingOrders.reduce((sum, order) => sum + order.totalAmount, 0);

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {formatCurrency(entry.total_cash)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {formatCurrency(entry.total_pix)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        {totalDeposits > 0 ? `+ ${formatCurrency(totalDeposits)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {totalWithdrawals > 0 ? `- ${formatCurrency(totalWithdrawals)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatCurrency(total + pendingTotal)}
                        {pendingTotal > 0 && (
                          <span className="text-yellow-600 text-xs ml-1">
                            (+{formatCurrency(pendingTotal)} pendente)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;