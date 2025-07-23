import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useProducts } from '../../context/ProductContext';
import { Package, Edit, Trash2, Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { products, deleteProduct } = useProducts();
  const [search, setSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteClick = (productId: string) => {
    setShowDeleteConfirm(productId);
  };

  const handleConfirmDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <Layout title="Produtos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Produtos Cadastrados</h1>
            <p className="text-gray-600 mt-1">
              Total de produtos: {products.length}
            </p>
          </div>

          <Link
            to="/manager/new-product"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
          >
            <Plus size={18} className="mr-2" />
            Novo Produto
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/manager/edit-product/${product.id}`)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Preço de Custo:</span>
                      <span className="font-medium">{formatCurrency(product.cost_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Preço de Venda:</span>
                      <span className="font-medium">{formatCurrency(product.selling_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Margem de Lucro:</span>
                      <span className="font-medium text-green-600">
                        {((product.selling_price - product.cost_price) / product.selling_price * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Em Estoque:</span>
                      <span className={`font-medium ${
                        product.stock > 10 
                          ? 'text-green-600' 
                          : product.stock > 5 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                      }`}>
                        {product.stock} unidades
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Valor em Estoque:</span>
                      <span className="text-lg font-medium text-gray-900">
                        {formatCurrency(product.selling_price * product.stock)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Products;