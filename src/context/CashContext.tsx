import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localDB } from '../lib/database';

interface CashRegister {
  id: string;
  date: string;
  opening_balance: number;
  closing_balance: number | null;
  total_cash: number;
  total_pix: number;
  deposits: {
    amount: number;
    reason: string;
    timestamp: string;
  }[];
  withdrawals: {
    amount: number;
    reason: string;
    timestamp: string;
  }[];
  notes?: string;
  status: 'open' | 'closed';
}

interface CashContextType {
  currentCash: CashRegister | null;
  cashHistory: CashRegister[];
  openCash: (date: string, openingBalance: number) => Promise<void>;
  closeCash: (date: string, notes?: string) => Promise<void>;
  addDeposit: (date: string, amount: number, reason: string) => Promise<void>;
  addWithdrawal: (date: string, amount: number, reason: string) => Promise<void>;
  updateCashTotals: (date: string, cash: number, pix: number) => Promise<void>;
  getCashByDate: (date: string) => CashRegister | null;
  isLoading: boolean;
  error: string | null;
}

const CashContext = createContext<CashContextType>({
  currentCash: null,
  cashHistory: [],
  openCash: async () => {},
  closeCash: async () => {},
  addDeposit: async () => {},
  addWithdrawal: async () => {},
  updateCashTotals: async () => {},
  getCashByDate: () => null,
  isLoading: true,
  error: null,
});

export const useCash = () => useContext(CashContext);

interface CashProviderProps {
  children: ReactNode;
}

export const CashProvider = ({ children }: CashProviderProps) => {
  const [cashHistory, setCashHistory] = useState<CashRegister[]>([]);
  const [currentCash, setCurrentCash] = useState<CashRegister | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCashHistory = async () => {
    try {
      setError(null);
      const data = await localDB.getAllCashRegister();

      setCashHistory(data);
      const openCash = data.find(c => c.status === 'open');
      setCurrentCash(openCash || null);
    } catch (error) {
      console.error('Error fetching cash history:', error);
      setError('Failed to fetch cash history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashHistory();
  }, []);

  const openCash = async (date: string, openingBalance: number) => {
    try {
      setError(null);
      localDB.createCashRegister({
        date,
        opening_balance: openingBalance,
        status: 'open',
        total_cash: 0,
        total_pix: 0,
        deposits: '[]',
        withdrawals: '[]'
      });
      fetchCashHistory();
    } catch (error) {
      console.error('Error opening cash:', error);
      throw error;
    }
  };

  const closeCash = async (date: string, notes?: string) => {
    try {
      setError(null);
      const cash = cashHistory.find(c => c.date === date && c.status === 'open');
      if (!cash) return;

      const deposits = JSON.parse(cash.deposits || '[]');
      const withdrawals = JSON.parse(cash.withdrawals || '[]');
      const totalDeposits = deposits.reduce((sum: number, d: any) => sum + d.amount, 0);
      const totalWithdrawals = withdrawals.reduce((sum: number, w: any) => sum + w.amount, 0);
      const closingBalance = cash.opening_balance + cash.total_cash + totalDeposits - totalWithdrawals;

      localDB.updateCashRegister(cash.id, {
        status: 'closed',
        closing_balance: closingBalance,
        notes
      });
      fetchCashHistory();
    } catch (error) {
      console.error('Error closing cash:', error);
      throw error;
    }
  };

  const addDeposit = async (date: string, amount: number, reason: string) => {
    try {
      setError(null);
      const cash = cashHistory.find(c => c.date === date && c.status === 'open');
      if (!cash) return;

      const newDeposit = {
        amount,
        reason,
        timestamp: new Date().toISOString()
      };

      const deposits = JSON.parse(cash.deposits || '[]');
      localDB.updateCashRegister(cash.id, {
        deposits: JSON.stringify([...deposits, newDeposit])
      });

      fetchCashHistory();
    } catch (error) {
      console.error('Error adding deposit:', error);
      throw error;
    }
  };

  const addWithdrawal = async (date: string, amount: number, reason: string) => {
    try {
      setError(null);
      const cash = cashHistory.find(c => c.date === date && c.status === 'open');
      if (!cash) return;

      const newWithdrawal = {
        amount,
        reason,
        timestamp: new Date().toISOString()
      };

      const withdrawals = JSON.parse(cash.withdrawals || '[]');
      localDB.updateCashRegister(cash.id, {
        withdrawals: JSON.stringify([...withdrawals, newWithdrawal])
      });

      fetchCashHistory();
    } catch (error) {
      console.error('Error adding withdrawal:', error);
      throw error;
    }
  };

  const updateCashTotals = async (date: string, cash: number, pix: number) => {
    try {
      setError(null);
      const register = cashHistory.find(c => c.date === date && c.status === 'open');
      if (!register) return;

      localDB.updateCashRegister(register.id, {
        total_cash: cash,
        total_pix: pix
      });

      fetchCashHistory();
    } catch (error) {
      console.error('Error updating cash totals:', error);
      throw error;
    }
  };

  const getCashByDate = (date: string) => {
    return cashHistory.find(c => c.date === date) || null;
  };

  return (
    <CashContext.Provider
      value={{
        currentCash,
        cashHistory,
        openCash,
        closeCash,
        addDeposit,
        addWithdrawal,
        updateCashTotals,
        getCashByDate,
        isLoading,
        error,
      }}
    >
      {children}
    </CashContext.Provider>
  );
};