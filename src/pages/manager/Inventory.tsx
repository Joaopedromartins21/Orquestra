import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useProducts } from '../../context/ProductContext';
import { Plus, Package, ArrowUpDown, DollarSign, Trash2, LayoutDashboard, ShoppingCart, ArrowUp, ArrowDown, History } from 'lucide-react';
import { Link } from 'react-router-dom';

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const { products, deleteProduct, updateStock } = useProducts();
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price' | 'profit'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(0);
  const [purchaseCostPrice, setPurchaseCostPrice] = useState<number>(0);
  const [showStockAdjustment, setShowStockAdjustment] = useState<string | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  
  const totalValue = products.reduce((total, product) => 
    total + (product.selling_price * product.stock), 0
  );
  
  const totalItems = products.reduce((total, product) => 
    total + product.stock, 0
  );

  const totalProfit = products.reduce((total, product) => 
    total + ((product.selling_price - product.cost_price) * product.stock), 0
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortBy === 'stock') {
      return sortOrder === 'asc' 
        ? a.stock - b.stock
        : b.stock - a.stock;
    }
    if (sortBy === 'price') {
      return sortOrder === 'asc' 
        ? a.selling_price - b.selling_price
        : b.selling_price - a.selling_price;
    }
    const profitA = a.selling_price - a.cost_price;
    const profitB = b.selling_price - b.cost_price;
    return sortOrder === 'asc' 
      ? profitA - profitB
      : profitB - profitA;
  });

  const handleSort = (field: 'name' | 'stock' | 'price' | 'profit') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteClick = (productId: string) => {
    setShowDeleteConfirm(productId);
  };

  const handleConfirmDelete = (productId: string) => {
    deleteProduct(productId);
    setShowDeleteConfirm(null);
  };

  const handleStockAdjustmentClick = (productId: string) => {
    setShowStockAdjustment(productId);
    setAdjustmentQuantity(0);
    setAdjustmentType('increase');
    setAdjustmentReason('');
  };

  const handleConfirmAdjustment = async (productId: string) => {
    try {
      const finalQuantity = adjustmentType === 'increase' ? adjustmentQuantity : -adjustmentQuantity;
      await updateStock(productId, finalQuantity);
      setShowStockAdjustment(null);
      setAdjustmentQuantity(0);
      setAdjustmentReason('');
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const handlePurchaseClick = () => {
    setShowPurchaseModal(true);
    setSelectedProductId('');
    setPurchaseQuantity(0);
    setPurchaseCostPrice(0);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedProductId || purchaseQuantity <= 0) return;

    try {
      await updateStock(selectedProductId, purchaseQuantity, purchaseCostPrice);
      setShowPurchaseModal(false);
      setSelectedProductId('');
      setPurchaseQuantity(0);
      setPurchaseCostPrice(0);
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  return (
    <Layout title="Estoque">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Estoque</h1>
          <p className="text-gray-600 mt-1">
            Valor total em estoque: <span className="font-semibold text-green-600">{formatCurrency(totalValue)}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/manager"
            className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200"
          >
            <LayoutDashboard size={18} className="mr-2" />
            Dashboard
          </Link>
          <Link
            to="/manager/stock-movements"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-200"
          >
            <History size={18} className="mr-2" />
            Movimentações
          </Link>
          <button
            onClick={handlePurchaseClick}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
          >
            <ShoppingCart size={18} className="mr-2" />
            Compra
          </button>
          <Link
            to="/manager/new-product"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
          >
            <Plus size={18} className="mr-2" />
            Novo Produto
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-2 mr-3">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total de Itens</h3>
              <p className="text-2xl font-semibold text-blue-600">{formatNumber(totalItems)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-2 mr-3">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Valor em Estoque</h3>
              <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-2 mr-3">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Lucro Potencial</h3>
              <p className="text-2xl font-semibold text-purple-600">{formatCurrency(totalProfit)}</p>
            </div>
          </div>
        </div>
      </div>

      {showStockAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ajuste de Estoque
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Ajuste
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAdjustmentType('increase')}
                    className={`flex items-center justify-center px-4 py-2 rounded-md ${
                      adjustmentType === 'increase'
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    <ArrowUp size={16} className="mr-2" />
                    Entrada
                  </button>
                  <button
                    onClick={() => setAdjustmentType('decrease')}
                    className={`flex items-center justify-center px-4 py-2 rounded-md ${
                      adjustmentType === 'decrease'
                        ? 'bg-red-100 text-red-700 border-2 border-red-500'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    <ArrowDown size={16} className="mr-2" />
                    Saída
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo do Ajuste
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Descreva o motivo do ajuste..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStockAdjustment(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmAdjustment(showStockAdjustment)}
                disabled={!adjustmentQuantity || !adjustmentReason}
                className={`px-4 py-2 rounded-md text-white ${
                  adjustmentType === 'increase'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                Confirmar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Adicionar Compra
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const product = products.find(p => p.id === e.target.value);
                    if (product) {
                      setPurchaseCostPrice(product.cost_price);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione um produto...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de Custo (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchaseCostPrice}
                  onChange={(e) => setPurchaseCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {selectedProductId && purchaseQuantity > 0 && purchaseCostPrice > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Total da compra: <span className="font-medium">{formatCurrency(purchaseCostPrice * purchaseQuantity)}</span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={!selectedProductId || purchaseQuantity <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
              >
                Confirmar Compra
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Produto
                    {sortBy === 'name' && (
                      <ArrowUpDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Preços
                    {sortBy === 'price' && (
                      <ArrowUpDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('profit')}
                >
                  <div className="flex items-center">
                    Lucro
                    {sortBy === 'profit' && (
                      <ArrowUpDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center">
                    Estoque
                    {sortBy === 'stock' && (
                      <ArrowUpDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">ID: {product.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{product.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">Custo: {formatCurrency(product.cost_price)}</div>
                    <div className="text-sm text-gray-900">Venda: {formatCurrency(product.selling_price)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600">
                      {formatCurrency(product.selling_price - product.cost_price)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(((product.selling_price - product.cost_price) / product.selling_price) * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      product.stock > 10 
                        ? 'text-green-600' 
                        : product.stock > 5 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {formatNumber(product.stock)} unidades
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(product.selling_price * product.stock)}</div>
                    <div className="text-xs text-green-600">
                      Lucro: {formatCurrency((product.selling_price - product.cost_price) * product.stock)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {showStockAdjustment === product.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setShowStockAdjustment(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : showDeleteConfirm === product.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(product.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Confirmar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleStockAdjustmentClick(product.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Ajustar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Inventory;