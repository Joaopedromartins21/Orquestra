import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, CustomerTransaction } from '../types';
import { localDB } from '../lib/database';
import { useAuth } from './AuthContext';

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  addTransaction: (customerId: string, type: 'credit' | 'debit', amount: number, description: string) => Promise<void>;
  getTransactions: (customerId: string) => Promise<CustomerTransaction[]>;
  isLoading: boolean;
}

const CustomerContext = createContext<CustomerContextType>({
  customers: [],
  addCustomer: async () => {},
  updateCustomer: async () => {},
  deleteCustomer: async () => {},
  getCustomerById: () => undefined,
  addTransaction: async () => {},
  getTransactions: async () => [],
  isLoading: true,
});

export const useCustomers = () => useContext(CustomerContext);

interface CustomerProviderProps {
  children: ReactNode;
}

export const CustomerProvider = ({ children }: CustomerProviderProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchCustomers();
    }
  }, [currentUser]);

  const fetchCustomers = async () => {
    try {
      const data = localDB.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) => {
    try {
      const data = localDB.createCustomer({ ...customerData, balance: 0 });

      setCustomers(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      setCustomers(prev =>
        prev.map(customer =>
          customer.id === id
            ? { ...customer, ...customerData }
            : customer
        )
      );
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      localDB.deleteCustomer(id);

      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  const addTransaction = async (customerId: string, type: 'credit' | 'debit', amount: number, description: string) => {
    try {
      localDB.createCustomerTransaction({
        customer_id: customerId,
        type,
        amount,
        description
      });

      // Update customer balance
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const newBalance = type === 'credit' 
          ? customer.balance + amount 
          : customer.balance - amount;
        
        localDB.updateCustomerBalance(customerId, newBalance);
        
        setCustomers(prev =>
          prev.map(c =>
            c.id === customerId
              ? { ...c, balance: newBalance }
              : c
          )
        );
      }

    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const getTransactions = async (customerId: string): Promise<CustomerTransaction[]> => {
    try {
      const data = localDB.getCustomerTransactions(customerId);

      return data.map(transaction => ({
        id: transaction.id,
        customerId: transaction.customer_id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.created_at
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
        addTransaction,
        getTransactions,
        isLoading,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};