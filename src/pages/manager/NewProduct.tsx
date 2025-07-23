import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useProducts } from '../../context/ProductContext';
import { ChevronLeft, Save } from 'lucide-react';

const NewProduct: React.FC = () => {
  const navigate = useNavigate();
  const { addProduct } = useProducts();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Nome do produto é obrigatório';
    }
    
    if (!costPrice || isNaN(Number(costPrice)) || Number(costPrice) < 0) {
      errors.costPrice = 'Preço de custo deve ser um número maior ou igual a zero';
    }
    
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) <= 0) {
      errors.sellingPrice = 'Preço de venda deve ser um número maior que zero';
    }

    if (Number(sellingPrice) <= Number(costPrice)) {
      errors.sellingPrice = 'Preço de venda deve ser maior que o preço de custo';
    }
    
    if (!stock || isNaN(Number(stock)) || Number(stock) < 0) {
      errors.stock = 'Quantidade em estoque deve ser um número maior ou igual a zero';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    addProduct({
      name,
      description: description.trim() || undefined,
      cost_price: Number(costPrice),
      selling_price: Number(sellingPrice),
      stock: Number(stock),
    });
    
    navigate('/manager');
  };
  
  return (
    <Layout title="Novo Produto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/manager')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft size={16} className="mr-1" />
          Voltar para o painel
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Adicionar Novo Produto</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 border ${
                  formErrors.name ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de Custo (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="costPrice"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    formErrors.costPrice ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {formErrors.costPrice && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.costPrice}</p>
                )}
              </div>

              <div>
                <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de Venda (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="sellingPrice"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    formErrors.sellingPrice ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {formErrors.sellingPrice && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.sellingPrice}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade em Estoque *
                </label>
                <input
                  type="number"
                  min="0"
                  id="stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    formErrors.stock ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {formErrors.stock && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.stock}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/manager')}
              className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center"
            >
              <Save size={16} className="mr-2" />
              Salvar Produto
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewProduct;