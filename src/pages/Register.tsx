import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { localAuth } from '../lib/localAuth';
import { UserPlus, Truck, Package } from 'lucide-react';
import AuthLayout, { AuthInput, AuthButton } from '../components/AuthLayout';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'manager' | 'driver'>('manager');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await localAuth.signUp(email, password, {
        name,
        role,
        phone: role === 'driver' ? phone : undefined
      });

      navigate('/login', { 
        state: { 
          message: 'Conta criada com sucesso! Por favor, faça login.' 
        } 
      });
    } catch (err) {
      console.error('Error during registration:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Criar Conta"
      subtitle="Cadastre-se no Sistema Orquestra"
      imageUrl="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    >
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          label="Nome Completo"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome completo"
          required
          disabled={isLoading}
        />

        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          disabled={isLoading}
        />

        <AuthInput
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
          disabled={isLoading}
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de Conta
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('manager')}
              className={`p-4 rounded-lg text-center transition-all ${
                role === 'manager'
                  ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-400'
                  : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-800'
              }`}
              disabled={isLoading}
            >
              <div className="flex flex-col items-center">
                <Package size={24} className="mb-2" />
                <span className="text-sm font-medium">Gestor</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`p-4 rounded-lg text-center transition-all ${
                role === 'driver'
                  ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-400'
                  : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-800'
              }`}
              disabled={isLoading}
            >
              <div className="flex flex-col items-center">
                <Truck size={24} className="mb-2" />
                <span className="text-sm font-medium">Motorista</span>
              </div>
            </button>
          </div>
        </div>

        {role === 'driver' && (
          <AuthInput
            label="Telefone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            required
            disabled={isLoading}
          />
        )}

        <AuthButton type="submit" disabled={isLoading}>
          <span className="flex items-center justify-center">
            <UserPlus size={18} className="mr-2" />
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </span>
        </AuthButton>

        <p className="text-center text-sm text-gray-400">
          Já tem uma conta?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            type="button"
          >
            Fazer login
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;