import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderStatus, TripCost, Payment, ReturnItem, ReturnStatus } from '../types';
import { localDB } from '../lib/database';
import { useAuth } from './AuthContext';
// import { useCash } from './CashContext';

interface OrderContextType {
  orders: Order[];
  getOrderById: (id: string) => Order | undefined;
  getOrdersByDriverId: (driverId: string) => Order[];
  getPendingOrders: () => Order[];
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tripCosts' | 'netAmount' | 'payments'>) => Promise<Order>;
  assignOrderToDriver: (orderId: string, driverId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  addTripCost: (orderId: string, cost: TripCost) => Promise<void>;
  removeTripCost: (orderId: string, index: number) => Promise<void>;
  addPayment: (orderId: string, payment: Payment) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  processReturn: (orderId: string, items: ReturnItem[], reason: string, refundAmount: number) => Promise<void>;
  updateReturnStatus: (orderId: string, status: ReturnStatus) => Promise<void>;
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType>({
  orders: [],
  getOrderById: () => undefined,
  getOrdersByDriverId: () => [],
  getPendingOrders: () => [],
  createOrder: async () => ({} as Order),
  assignOrderToDriver: async () => {},
  updateOrderStatus: async () => {},
  addTripCost: async () => {},
  removeTripCost: async () => {},
  addPayment: async () => {},
  deleteOrder: async () => {},
  processReturn: async () => {},
  updateReturnStatus: async () => {},
  isLoading: true,
});

export const useOrders = () => useContext(OrderContext);

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider = ({ children }: OrderProviderProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  // const { currentCash, updateCashTotals } = useCash();

  const fetchOrders = async () => {
    try {
      const data = localDB.getAllOrders();

      const formattedOrders = data.map(order => {
        const orderItems = localDB.getOrderItems(order.id);
        const products = orderItems.map(item => {
          const product = localDB.getProductById(item.product_id);
          return {
            productId: item.product_id,
            quantity: item.quantity,
            price: item.selling_price,
            name: product?.name
          };
        });

        return {
        id: order.id,
        customerId: order.customer_id,
        customerName: order.customer_name,
        customerAddress: order.customer_address,
        customerPhone: order.customer_phone,
        driverId: order.driver_id,
        status: order.status,
        notes: order.notes,
        totalAmount: order.total_amount,
        tripCosts: JSON.parse(order.trip_costs || '[]'),
        netAmount: order.net_amount,
        payments: JSON.parse(order.payments || '[]'),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        products
      };
      });

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchOrders();

      // Subscribe to changes
      const channel = supabase.channel('orders_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => fetchOrders()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  const getOrderById = (id: string) => orders.find(order => order.id === id);
  const getOrdersByDriverId = (driverId: string) => orders.filter(order => order.driverId === driverId);
  const getPendingOrders = () => orders.filter(order => order.status === 'pending');

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tripCosts' | 'netAmount' | 'payments'>) => {
    try {
      const data = localDB.createOrder({
        customer_id: orderData.customerId,
        customer_name: orderData.customerName,
        customer_address: orderData.customerAddress,
        customer_phone: orderData.customerPhone,
        notes: orderData.notes,
        total_amount: orderData.totalAmount,
        status: 'pending',
        trip_costs: '[]',
        net_amount: orderData.totalAmount,
        payments: '[]'
      });

      if (orderData.products) {
        orderData.products.forEach(product => {
          localDB.createOrderItem({
          order_id: data.id,
          product_id: product.productId,
          quantity: product.quantity,
          selling_price: product.price
          });
        });
      }

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const assignOrderToDriver = async (orderId: string, driverId: string) => {
    try {
      localDB.assignOrderToDriver(orderId, driverId);
    } catch (error) {
      console.error('Error assigning order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      localDB.updateOrderStatus(orderId, status);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const addTripCost = async (orderId: string, cost: TripCost) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const newTripCosts = [...order.tripCosts, cost];
      const newNetAmount = order.totalAmount - newTripCosts.reduce((sum, c) => sum + c.amount, 0);

      localDB.updateOrderTripCosts(orderId, JSON.stringify(newTripCosts), newNetAmount);
    } catch (error) {
      console.error('Error adding trip cost:', error);
      throw error;
    }
  };

  const removeTripCost = async (orderId: string, index: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const newTripCosts = order.tripCosts.filter((_, i) => i !== index);
      const newNetAmount = order.totalAmount - newTripCosts.reduce((sum, c) => sum + c.amount, 0);

      localDB.updateOrderTripCosts(orderId, JSON.stringify(newTripCosts), newNetAmount);
    } catch (error) {
      console.error('Error removing trip cost:', error);
      throw error;
    }
  };

  const addPayment = async (orderId: string, payment: Payment) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const newPayments = [...(order.payments || []), payment];

      localDB.updateOrderPayments(orderId, JSON.stringify(newPayments));
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      localDB.deleteOrder(orderId);

      // Update local state
      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  };

  const processReturn = async (orderId: string, items: ReturnItem[], reason: string, refundAmount: number) => {
    try {
      // For now, we'll skip returns implementation in local DB
      console.log('Return processed locally:', { orderId, items, reason, refundAmount });
    } catch (error) {
      console.error('Error processing return:', error);
      throw error;
    }
  };

  const updateReturnStatus = async (orderId: string, status: ReturnStatus) => {
    try {
      // For now, we'll skip returns implementation in local DB
      console.log('Return status updated locally:', { orderId, status });
    } catch (error) {
      console.error('Error updating return status:', error);
      throw error;
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        getOrderById,
        getOrdersByDriverId,
        getPendingOrders,
        createOrder,
        assignOrderToDriver,
        updateOrderStatus,
        addTripCost,
        removeTripCost,
        addPayment,
        deleteOrder,
        processReturn,
        updateReturnStatus,
        isLoading,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};