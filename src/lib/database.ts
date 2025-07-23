import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

// Database interface types
export interface DatabaseUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'manager' | 'driver';
  phone?: string;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProduct {
  id: string;
  name: string;
  description?: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrder {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_address: string;
  customer_phone?: string;
  driver_id?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  notes?: string;
  total_amount: number;
  trip_costs: string; // JSON string
  net_amount: number;
  payments: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  selling_price: number;
  created_at: string;
}

interface OrquestraDB extends DBSchema {
  users: {
    key: string;
    value: DatabaseUser;
    indexes: { 'by-email': string; 'by-role': string };
  };
  products: {
    key: string;
    value: DatabaseProduct;
    indexes: { 'by-name': string };
  };
  customers: {
    key: string;
    value: DatabaseCustomer;
    indexes: { 'by-name': string };
  };
  orders: {
    key: string;
    value: DatabaseOrder;
    indexes: { 'by-status': string; 'by-driver': string; 'by-customer': string };
  };
  order_items: {
    key: string;
    value: DatabaseOrderItem;
    indexes: { 'by-order': string; 'by-product': string };
  };
  stock_movements: {
    key: string;
    value: {
      id: string;
      product_id: string;
      type: 'increase' | 'decrease';
      quantity: number;
      reason: string;
      timestamp: string;
    };
    indexes: { 'by-product': string; 'by-timestamp': string };
  };
  customer_transactions: {
    key: string;
    value: {
      id: string;
      customer_id: string;
      type: 'credit' | 'debit';
      amount: number;
      description: string;
      created_at: string;
    };
    indexes: { 'by-customer': string };
  };
  cash_register: {
    key: string;
    value: {
      id: string;
      date: string;
      opening_balance: number;
      closing_balance?: number;
      total_cash: number;
      total_pix: number;
      deposits: string;
      withdrawals: string;
      notes?: string;
      status: 'open' | 'closed';
      created_at: string;
      updated_at: string;
    };
    indexes: { 'by-date': string };
  };
  costs: {
    key: string;
    value: {
      id: string;
      date: string;
      description: string;
      amount: number;
      category: 'Diesel' | 'Alimentacao' | 'Contas' | 'Pneu' | 'Outros';
      notes?: string;
      created_at: string;
      updated_at: string;
    };
    indexes: { 'by-date': string; 'by-category': string };
  };
  vehicles: {
    key: string;
    value: {
      id: string;
      plate: string;
      model: string;
      brand: string;
      year: number;
      status: 'active' | 'maintenance' | 'inactive';
      last_maintenance?: string;
      next_maintenance?: string;
      notes?: string;
      created_at: string;
      updated_at: string;
    };
    indexes: { 'by-plate': string; 'by-status': string };
  };
  returns: {
    key: string;
    value: {
      id: string;
      order_id: string;
      reason: string;
      status: 'pending' | 'approved' | 'rejected' | 'completed';
      items: string;
      refund_amount: number;
      notes?: string;
      created_at: string;
      updated_at: string;
    };
    indexes: { 'by-order': string; 'by-status': string };
  };
}

class LocalDatabase {
  private db: IDBPDatabase<OrquestraDB> | null = null;

  async init() {
    if (this.db) return;

    this.db = await openDB<OrquestraDB>('orquestra-db', 1, {
      upgrade(db) {
        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('by-email', 'email', { unique: true });
          userStore.createIndex('by-role', 'role');
        }

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-name', 'name');
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('by-name', 'name');
        }

        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('by-status', 'status');
          orderStore.createIndex('by-driver', 'driver_id');
          orderStore.createIndex('by-customer', 'customer_id');
        }

        // Order items store
        if (!db.objectStoreNames.contains('order_items')) {
          const orderItemStore = db.createObjectStore('order_items', { keyPath: 'id' });
          orderItemStore.createIndex('by-order', 'order_id');
          orderItemStore.createIndex('by-product', 'product_id');
        }

        // Stock movements store
        if (!db.objectStoreNames.contains('stock_movements')) {
          const stockStore = db.createObjectStore('stock_movements', { keyPath: 'id' });
          stockStore.createIndex('by-product', 'product_id');
          stockStore.createIndex('by-timestamp', 'timestamp');
        }

        // Customer transactions store
        if (!db.objectStoreNames.contains('customer_transactions')) {
          const transactionStore = db.createObjectStore('customer_transactions', { keyPath: 'id' });
          transactionStore.createIndex('by-customer', 'customer_id');
        }

        // Cash register store
        if (!db.objectStoreNames.contains('cash_register')) {
          const cashStore = db.createObjectStore('cash_register', { keyPath: 'id' });
          cashStore.createIndex('by-date', 'date');
        }

        // Costs store
        if (!db.objectStoreNames.contains('costs')) {
          const costStore = db.createObjectStore('costs', { keyPath: 'id' });
          costStore.createIndex('by-date', 'date');
          costStore.createIndex('by-category', 'category');
        }

        // Vehicles store
        if (!db.objectStoreNames.contains('vehicles')) {
          const vehicleStore = db.createObjectStore('vehicles', { keyPath: 'id' });
          vehicleStore.createIndex('by-plate', 'plate', { unique: true });
          vehicleStore.createIndex('by-status', 'status');
        }

        // Returns store
        if (!db.objectStoreNames.contains('returns')) {
          const returnStore = db.createObjectStore('returns', { keyPath: 'id' });
          returnStore.createIndex('by-order', 'order_id');
          returnStore.createIndex('by-status', 'status');
        }
      },
    });

    // Insert default admin user if no users exist
    const userCount = await this.db.count('users');
    if (userCount === 0) {
      const adminUser: DatabaseUser = {
        id: uuidv4(),
        email: 'admin@orquestra.com',
        password_hash: 'admin123',
        name: 'Administrador',
        role: 'manager',
        available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await this.db.add('users', adminUser);
    }
  }

  private async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // User methods
  async getUserByEmail(email: string): Promise<DatabaseUser | undefined> {
    const db = await this.ensureDB();
    return await db.getFromIndex('users', 'by-email', email);
  }

  async getUserById(id: string): Promise<DatabaseUser | undefined> {
    const db = await this.ensureDB();
    return await db.get('users', id);
  }

  async createUser(user: Omit<DatabaseUser, 'created_at' | 'updated_at'>): Promise<DatabaseUser> {
    const db = await this.ensureDB();
    const now = new Date().toISOString();
    const newUser = { ...user, created_at: now, updated_at: now };
    await db.add('users', newUser);
    return newUser;
  }

  async getAllDrivers(): Promise<DatabaseUser[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('users', 'by-role', 'driver');
  }

  // Product methods
  async getAllProducts(): Promise<DatabaseProduct[]> {
    const db = await this.ensureDB();
    return await db.getAll('products');
  }

  async getProductById(id: string): Promise<DatabaseProduct | undefined> {
    const db = await this.ensureDB();
    return await db.get('products', id);
  }

  async createProduct(product: Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseProduct> {
    const db = await this.ensureDB();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newProduct = { id, ...product, created_at: now, updated_at: now };
    await db.add('products', newProduct);
    return newProduct;
  }

  async updateProductStock(productId: string, newStock: number): Promise<void> {
    const db = await this.ensureDB();
    const product = await db.get('products', productId);
    if (product) {
      product.stock = newStock;
      product.updated_at = new Date().toISOString();
      await db.put('products', product);
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('products', productId);
  }

  // Customer methods
  async getAllCustomers(): Promise<DatabaseCustomer[]> {
    const db = await this.ensureDB();
    return await db.getAll('customers');
  }

  async getCustomerById(id: string): Promise<DatabaseCustomer | undefined> {
    const db = await this.ensureDB();
    return await db.get('customers', id);
  }

  async createCustomer(customer: Omit<DatabaseCustomer, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseCustomer> {
    const db = await this.ensureDB();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newCustomer = { id, ...customer, created_at: now, updated_at: now };
    await db.add('customers', newCustomer);
    return newCustomer;
  }

  async updateCustomerBalance(customerId: string, newBalance: number): Promise<void> {
    const db = await this.ensureDB();
    const customer = await db.get('customers', customerId);
    if (customer) {
      customer.balance = newBalance;
      customer.updated_at = new Date().toISOString();
      await db.put('customers', customer);
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('customers', customerId);
  }

  // Order methods
  async getAllOrders(): Promise<DatabaseOrder[]> {
    const db = await this.ensureDB();
    const orders = await db.getAll('orders');
    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getOrderById(id: string): Promise<DatabaseOrder | undefined> {
    const db = await this.ensureDB();
    return await db.get('orders', id);
  }

  async createOrder(order: Omit<DatabaseOrder, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseOrder> {
    const db = await this.ensureDB();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newOrder = { id, ...order, created_at: now, updated_at: now };
    await db.add('orders', newOrder);
    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const db = await this.ensureDB();
    const order = await db.get('orders', orderId);
    if (order) {
      order.status = status as any;
      order.updated_at = new Date().toISOString();
      await db.put('orders', order);
    }
  }

  async assignOrderToDriver(orderId: string, driverId: string): Promise<void> {
    const db = await this.ensureDB();
    const order = await db.get('orders', orderId);
    if (order) {
      order.driver_id = driverId;
      order.status = 'assigned';
      order.updated_at = new Date().toISOString();
      await db.put('orders', order);
    }
  }

  async updateOrderPayments(orderId: string, payments: string): Promise<void> {
    const db = await this.ensureDB();
    const order = await db.get('orders', orderId);
    if (order) {
      order.payments = payments;
      order.updated_at = new Date().toISOString();
      await db.put('orders', order);
    }
  }

  async updateOrderTripCosts(orderId: string, tripCosts: string, netAmount: number): Promise<void> {
    const db = await this.ensureDB();
    const order = await db.get('orders', orderId);
    if (order) {
      order.trip_costs = tripCosts;
      order.net_amount = netAmount;
      order.updated_at = new Date().toISOString();
      await db.put('orders', order);
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('orders', orderId);
    // Also delete related order items
    const orderItems = await db.getAllFromIndex('order_items', 'by-order', orderId);
    for (const item of orderItems) {
      await db.delete('order_items', item.id);
    }
  }

  // Order items methods
  async getOrderItems(orderId: string): Promise<DatabaseOrderItem[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('order_items', 'by-order', orderId);
  }

  async createOrderItem(item: Omit<DatabaseOrderItem, 'id' | 'created_at'>): Promise<DatabaseOrderItem> {
    const db = await this.ensureDB();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newItem = { id, ...item, created_at: now };
    await db.add('order_items', newItem);
    return newItem;
  }

  // Stock movements methods
  async getAllStockMovements(): Promise<any[]> {
    const db = await this.ensureDB();
    const movements = await db.getAll('stock_movements');
    return movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createStockMovement(movement: { product_id: string; type: string; quantity: number; reason: string }): Promise<void> {
    const db = await this.ensureDB();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.add('stock_movements', {
      id,
      product_id: movement.product_id,
      type: movement.type as any,
      quantity: movement.quantity,
      reason: movement.reason,
      timestamp: now
    });
  }

  // Customer transactions methods
  async getCustomerTransactions(customerId: string): Promise<any[]> {
    const db = await this.ensureDB();
    const transactions = await db.getAllFromIndex('customer_transactions', 'by-customer', customerId);
    return transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createCustomerTransaction(transaction: { customer_id: string; type: string; amount: number; description: string }): Promise<void> {
    const db = await this.ensureDB();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.add('customer_transactions', {
      id,
      customer_id: transaction.customer_id,
      type: transaction.type as any,
      amount: transaction.amount,
      description: transaction.description,
      created_at: now
    });
  }

  // Cash register methods
  async getAllCashRegister(): Promise<any[]> {
    const db = await this.ensureDB();
    const registers = await db.getAll('cash_register');
    return registers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getCashRegisterByDate(date: string): Promise<any> {
    const db = await this.ensureDB();
    return await db.getFromIndex('cash_register', 'by-date', date);
  }

  async createCashRegister(register: any): Promise<void> {
    const db = await this.ensureDB();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.add('cash_register', {
      ...register,
      id,
      created_at: now,
      updated_at: now
    });
  }

  async updateCashRegister(id: string, updates: any): Promise<void> {
    const db = await this.ensureDB();
    const register = await db.get('cash_register', id);
    if (register) {
      Object.assign(register, updates);
      register.updated_at = new Date().toISOString();
      await db.put('cash_register', register);
    }
  }

  // Costs methods
  async getAllCosts(): Promise<any[]> {
    const db = await this.ensureDB();
    const costs = await db.getAll('costs');
    return costs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createCost(cost: any): Promise<void> {
    const db = await this.ensureDB();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.add('costs', {
      ...cost,
      id,
      created_at: now,
      updated_at: now
    });
  }

  async deleteCost(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('costs', id);
  }

  // Vehicles methods
  async getAllVehicles(): Promise<any[]> {
    const db = await this.ensureDB();
    const vehicles = await db.getAll('vehicles');
    return vehicles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createVehicle(vehicle: any): Promise<void> {
    const db = await this.ensureDB();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.add('vehicles', {
      ...vehicle,
      id,
      created_at: now,
      updated_at: now
    });
  }

  async updateVehicle(id: string, updates: any): Promise<void> {
    const db = await this.ensureDB();
    const vehicle = await db.get('vehicles', id);
    if (vehicle) {
      Object.assign(vehicle, updates);
      vehicle.updated_at = new Date().toISOString();
      await db.put('vehicles', vehicle);
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('vehicles', id);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const localDB = new LocalDatabase();