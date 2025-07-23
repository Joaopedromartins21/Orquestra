import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useOrders } from '../../context/OrderContext';
import { useCash } from '../../context/CashContext';
import { DollarSign, ArrowDown, ArrowUp, Calendar, History } from 'lucide-react';

const CashRegister: React.FC = () => {
  const { orders } = useOrders();
  const { 
    currentCash,
    cashHistory,
    openCash,
    closeCash,
    addDeposit,
    addWithdrawal,
    error,
    isLoading 
  } = useCash();

  const [selectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(0);
  const [withdrawalReason, setWithdrawalReason] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositReason, setDepositReason] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  const calculateDailyTotals = (date: string) => {
    // Get all orders for the date, including pending ones
    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return orderDate === date;
    });

    const totals = dayOrders.reduce(
      (acc, order) => {
        if (order.status === 'completed') {
          const cashPayment = order.payments?.find(p => p.type === 'cash')?.amount || 0;
          const pixPayment = order.payments?.find(p => p.type === 'pix')?.amount || 0;
          return {
            cash: acc.cash + cashPayment,
            pix: acc.pix + pixPayment,
            pending: acc.pending
          };
        } else {
          // Add to pending total
          return {
            ...acc,
            pending: acc.pending + order.totalAmount
          };
        }
      },
      { cash: 0, pix: 0, pending: 0 }
    );

    return totals;
  };

  const handleOpenCash = async () => {
    try {
      await openCash(selectedDate, openingBalance);
      setOpeningBalance(0);
    } catch (error) {
      console.error('Error opening cash:', error);
    }
  };

  const handleCloseCash = async () => {
    if (!currentCash) return;
    
    try {
      await closeCash(currentCash.date, closingNotes);
      setClosingNotes('');
    } catch (error) {
      console.error('Error closing cash:', error);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || !withdrawalReason || !currentCash) return;

    try {
      await addWithdrawal(currentCash.date, withdrawalAmount, withdrawalReason);
      setWithdrawalAmount(0);
      setWithdrawalReason('');
      setShowWithdrawalModal(false);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositReason || !currentCash) return;

    try {
      await addDeposit(currentCash.date, depositAmount, depositReason);
      setDepositAmount(0);
      setDepositReason('');
      setShowDepositModal(false);
    } catch (error) {
      console.error('Error processing deposit:', error);
    }
  };

  const totals = calculateDailyTotals(selectedDate);
  const totalDeposits = currentCash?.deposits.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalWithdrawals = currentCash?.withdrawals.reduce((sum, w) => sum + w.amount, 0) || 0;
  const currentBalance = (currentCash?.opening_balance || 0) + totals.cash + totals.pix + totalDeposits - totalWithdrawals;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (isLoading) {
    return (
      <Layout title="Caixa">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Caixa">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Caixa">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Controle de Caixa</h1>
            <p className="text-gray-600 mt-1">
              Saldo atual: <span className="font-semibold text-green-600">{formatCurrency(currentBalance)}</span>
              {totals.pending > 0 && (
                <span className="text-yellow-600 ml-2">
                  (+ {formatCurrency(totals.pending)} pendente)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                showHistory
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <History size={18} className="mr-2" />
              Histórico
            </button>
          </div>
        </div>

        {!showHistory ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            {!currentCash ? (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Abrir Caixa</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Inicial
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <button
                  onClick={handleOpenCash}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Abrir Caixa
                </button>
              </div>
            ) : currentCash.status === 'open' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Caixa Aberto</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDepositModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                    >
                      <ArrowUp size={16} className="mr-2" />
                      Entrada
                    </button>
                    <button
                      onClick={() => setShowWithdrawalModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                    >
                      <ArrowDown size={16} className="mr-2" />
                      Retirada
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saldo Inicial:</span>
                    <span className="font-medium">{formatCurrency(currentCash.opening_balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendas em Dinheiro:</span>
                    <span className="font-medium">{formatCurrency(totals.cash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendas em PIX:</span>
                    <span className="font-medium">{formatCurrency(totals.pix)}</span>
                  </div>
                  {totals.pending > 0 && (
                    <div className="flex justify-between text-yellow-600">
                      <span>Pedidos Pendentes:</span>
                      <span className="font-medium">+ {formatCurrency(totals.pending)}</span>
                    </div>
                  )}
                  {totalDeposits > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total de Entradas:</span>
                      <span className="font-medium">+ {formatCurrency(totalDeposits)}</span>
                    </div>
                  )}
                  {totalWithdrawals > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Total de Retiradas:</span>
                      <span className="font-medium">- {formatCurrency(totalWithdrawals)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900">Saldo Atual:</span>
                      <div>
                        <span className="text-green-600">
                          {formatCurrency(currentBalance)}
                        </span>
                        {totals.pending > 0 && (
                          <span className="text-yellow-600 text-sm ml-2">
                            (+ {formatCurrency(totals.pending)} pendente)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {currentCash.deposits.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Entradas:</h3>
                    {currentCash.deposits.map((deposit, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{deposit.reason}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(deposit.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <span className="text-green-600 font-medium">
                            + {formatCurrency(deposit.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentCash.withdrawals.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Retiradas:</h3>
                    {currentCash.withdrawals.map((withdrawal, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{withdrawal.reason}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(withdrawal.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <span className="text-red-600 font-medium">
                            - {formatCurrency(withdrawal.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleCloseCash}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Fechar Caixa
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Caixa Fechado</h2>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saldo Inicial:</span>
                    <span className="font-medium">{formatCurrency(currentCash.opening_balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendas em Dinheiro:</span>
                    <span className="font-medium">{formatCurrency(currentCash.total_cash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendas em PIX:</span>
                    <span className="font-medium">{formatCurrency(currentCash.total_pix)}</span>
                  </div>
                  {totalDeposits > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total de Entradas:</span>
                      <span className="font-medium">+ {formatCurrency(totalDeposits)}</span>
                    </div>
                  )}
                  {totalWithdrawals > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Total de Retiradas:</span>
                      <span className="font-medium">- {formatCurrency(totalWithdrawals)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saldo Final:</span>
                    <span className="font-medium">{formatCurrency(currentCash.closing_balance || 0)}</span>
                  </div>
                  {currentCash.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600">{currentCash.notes}</p>
                    </div>
                  )}
                </div>

                {currentCash.deposits.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Entradas:</h3>
                    {currentCash.deposits.map((deposit, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{deposit.reason}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(deposit.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <span className="text-green-600 font-medium">
                            + {formatCurrency(deposit.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentCash.withdrawals.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Retiradas:</h3>
                    {currentCash.withdrawals.map((withdrawal, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{withdrawal.reason}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(withdrawal.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <span className="text-red-600 font-medium">
                            - {formatCurrency(withdrawal.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo Inicial
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entradas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retiradas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo Final
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cashHistory.map((cash) => {
                    const dailyTotals = calculateDailyTotals(cash.date);
                    const totalDeposits = cash.deposits.reduce((sum, d) => sum + d.amount, 0);
                    const totalWithdrawals = cash.withdrawals.reduce((sum, w) => sum + w.amount, 0);

                    return (
                      <tr key={cash.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(cash.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(cash.opening_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(totalDeposits)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(totalWithdrawals)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(dailyTotals.cash + dailyTotals.pix)}
                          {dailyTotals.pending > 0 && (
                            <span className="text-yellow-600 text-xs ml-1">
                              (+{formatCurrency(dailyTotals.pending)} pendente)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(cash.closing_balance || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            cash.status === 'open'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {cash.status === 'open' ? 'Aberto' : 'Fechado'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Retirada de Dinheiro
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da Retirada
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                    max={currentBalance}
                  />
                </div>
                {withdrawalAmount > currentBalance && (
                  <p className="mt-1 text-sm text-red-600">
                    Valor maior que o saldo disponível
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da Retirada
                </label>
                <input
                  type="text"
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ex: Pagamento de fornecedor"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleWithdrawal}
                disabled={!withdrawalAmount || !withdrawalReason || withdrawalAmount > currentBalance}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
              >
                Confirmar Retirada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Entrada de Dinheiro
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da Entrada
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da Entrada
                </label>
                <input
                  type="text"
                  value={depositReason}
                  onChange={(e) => setDepositReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ex: Depósito bancário"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDepositModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeposit}
                disabled={!depositAmount || !depositReason}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
              >
                Confirmar Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CashRegister;