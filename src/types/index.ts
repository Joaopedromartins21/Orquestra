export type UserRole = 'manager' | 'driver';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Driver extends User {
  role: 'driver';
  phone?: string;
  available: boolean;
}

export interface Manager extends User {
  role: 'manager';
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed';
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface TripCost {
  amount: number;
  description: string;
}

export interface Payment {
  type: 'cash' | 'pix';
  amount: number;
}

export interface ReturnItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Return {
  id: string;
  orderId: string;
  reason: string;
  status: ReturnStatus;
  items: ReturnItem[];
  refundAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  driverId?: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  items: string;
  notes?: string;
  totalAmount: number;
  tripCosts: TripCost[];
  netAmount: number;
  payments?: Payment[];
  products?: OrderProduct[];
  customer?: Customer;
  return?: Return;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderProduct {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
}

export interface PixPayment {
  orderId: string;
  amount: number;
  qrCodeData: string;
  generatedAt: string;
  status: 'pending' | 'completed';
}