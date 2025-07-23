import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { localDB } from '../lib/database';

interface StockMovement {
  id: string;
  productId: string;
  type: 'increase' | 'decrease';
  quantity: number;
  reason: string;
  timestamp: string;
}

interface ProductContextType {
  products: Product[];
  stockMovements: StockMovement[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStock: (productId: string, quantity: number, newCostPrice?: number, reason?: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  deleteProduct: (productId: string) => Promise<void>;
  isLoading: boolean;
  connectionError: string | null;
}

const ProductContext = createContext<ProductContextType>({
  products: [],
  stockMovements: [],
  addProduct: async () => {},
  updateStock: async () => {},
  getProductById: () => undefined,
  deleteProduct: async () => {},
  isLoading: true,
  connectionError: null,
});

export const useProducts = () => useContext(ProductContext);

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider = ({ children }: ProductProviderProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      await Promise.all([fetchProducts(), fetchStockMovements()]);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = localDB.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  };

  const fetchStockMovements = async () => {
    try {
      const data = localDB.getAllStockMovements();
      setStockMovements(data);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      throw error;
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProduct = localDB.createProduct(productData);
      setProducts(prev => [...prev, newProduct]);

      // Record initial stock movement if stock > 0
      if (newProduct.stock > 0) {
        localDB.createStockMovement({
          product_id: newProduct.id,
          type: 'increase',
          quantity: newProduct.stock,
          reason: 'Estoque inicial'
        });
        
        fetchStockMovements();
      }
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateStock = async (productId: string, quantity: number, newCostPrice?: number, reason?: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // If a new cost price is provided, create a new product variant
      if (newCostPrice) {
        const newVariant = localDB.createProduct({
          name: product.name,
          description: product.description,
          cost_price: newCostPrice,
          selling_price: product.selling_price,
          stock: quantity
        });

        // Record stock movement for new variant
        localDB.createStockMovement({
          product_id: newVariant.id,
          type: 'increase',
          quantity: quantity,
          reason: reason || 'Nova variante com preço de custo atualizado'
        });

        setProducts(prev => [...prev, newVariant]);
      } else {
        // Update existing product stock
        const newStock = product.stock + quantity;
        localDB.updateProductStock(productId, newStock);

        // Record stock movement
        localDB.createStockMovement({
          product_id: productId,
          type: quantity > 0 ? 'increase' : 'decrease',
          quantity: Math.abs(quantity),
          reason: reason || (quantity > 0 ? 'Entrada de estoque' : 'Saída de estoque')
        });

        setProducts(prev =>
          prev.map(p =>
            p.id === productId
              ? { ...p, stock: newStock }
              : p
          )
        );
      }

      fetchStockMovements();
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const deleteProduct = async (productId: string) => {
    try {
      localDB.deleteProduct(productId);

      setProducts(prev => prev.filter(p => p.id !== productId));
      setStockMovements(prev => prev.filter(m => m.productId !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        stockMovements,
        addProduct,
        updateStock,
        getProductById,
        deleteProduct,
        isLoading,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};