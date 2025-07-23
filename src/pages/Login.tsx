import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { localAuth } from '../lib/localAuth';
import { LogIn } from 'lucide-react';
import AuthLayout, { AuthInput, AuthButton } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const message = (location.state as any)?.message;
    if (message) {
      setSuccess(message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await localAuth.signIn(email, password);

      if (user) {
        // Trigger auth context update
        await checkUser();
        
        if (user.role === 'manager') {
          navigate('/manager');
        } else if (user.role === 'driver') {
          navigate('/driver');
        }
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('Email ou senha inválidos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bem-vindo ao Orquestra"
      subtitle="Sistema M&M Atacadista"
      imageUrl="https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    >
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-500">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
          disabled={isLoading}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700/50 bg-gray-800/50 text-blue-500 focus:ring-blue-500/20"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-400">
              Manter Conectado
            </span>
          </label>

          <button
            type="button"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Esqueci minha senha
          </button>
        </div>

        <AuthButton type="submit" disabled={isLoading}>
          <span className="flex items-center justify-center">
            <LogIn size={18} className="mr-2" />
            {isLoading ? 'Entrando...' : 'Entrar'}
          </span>
        </AuthButton>

        <p className="text-center text-sm text-gray-400">
          Não tem uma conta?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Criar conta
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;