import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localDB } from '../lib/database';

interface Cost {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CostContextType {
  costs: Cost[];
  addCost: (cost: Omit<Cost, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteCost: (id: string) => Promise<void>;
  getCostsByMonth: (month: string) => Cost[];
  isLoading: boolean;
  error: string | null;
}

const CostContext = createContext<CostContextType>({
  costs: [],
  addCost: async () => {},
  deleteCost: async () => {},
  getCostsByMonth: () => [],
  isLoading: true,
  error: null,
});

export const useCosts = () => useContext(CostContext);

interface CostProviderProps {
  children: ReactNode;
}

export const CostProvider = ({ children }: CostProviderProps) => {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCosts = async () => {
    try {
      setError(null);
      const data = localDB.getAllCosts();

      setCosts(data);
    } catch (error) {
      console.error('Error fetching costs:', error);
      setError('Failed to fetch costs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  const addCost = async (costData: Omit<Cost, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      localDB.createCost(costData);

      fetchCosts();
    } catch (error) {
      console.error('Error adding cost:', error);
      throw error;
    }
  };

  const deleteCost = async (id: string) => {
    try {
      setError(null);
      localDB.deleteCost(id);

      fetchCosts();
    } catch (error) {
      console.error('Error deleting cost:', error);
      throw error;
    }
  };

  const getCostsByMonth = (month: string) => {
    return costs.filter(cost => cost.date.startsWith(month));
  };

  return (
    <CostContext.Provider
      value={{
        costs,
        addCost,
        deleteCost,
        getCostsByMonth,
        isLoading,
        error,
      }}
    >
      {children}
    </CostContext.Provider>
  );
};