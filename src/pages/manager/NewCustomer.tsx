import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useCustomers } from '../../context/CustomerContext';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';

const NewCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { addCustomer } = useCustomers();
  
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Nome da distribuidora é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCepChange = async (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    setCep(numericValue);

    // Only proceed if we have 8 digits
    if (numericValue.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numericValue}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          const fullAddress = `${data.logradouro}${data.complemento ? `, ${data.complemento}` : ''}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
          setAddress(fullAddress);
        } else {
          setFormErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
        }
      } catch (error) {
        setFormErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP' }));
      } finally {
        setIsLoadingCep(false);
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await addCustomer({
        name,
        phone: phone || undefined,
        address: address || undefined,
      });
      
      navigate('/manager/customers');
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };
  
  return (
    <Layout title="Nova Distribuidora">
      <div className="mb-6">
        <button
          onClick={() => navigate('/manager/customers')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft size={16} className="mr-1" />
          Voltar para clientes
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Adicionar Nova Distribuidora</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Distribuidora *
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
              <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="cep"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  maxLength={8}
                  placeholder="00000000"
                  className={`w-full px-3 py-2 border ${
                    formErrors.cep ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {isLoadingCep && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={18} className="animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              {formErrors.cep && (
                <p className="mt-1 text-sm text-red-600">{formErrors.cep}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone (Opcional)
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/manager/customers')}
              className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center"
            >
              <Save size={16} className="mr-2" />
              Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewCustomer;