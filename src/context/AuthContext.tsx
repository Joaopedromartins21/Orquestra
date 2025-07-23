import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { localAuth, AuthUser } from '../lib/localAuth';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  checkUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  logout: async () => {},
  checkUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

function mapAuthUserToUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    role: authUser.role
  };
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check current session
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const authUser = localAuth.getCurrentUser();
      if (authUser) {
        setCurrentUser(mapAuthUserToUser(authUser));
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // First clear the local state
      setCurrentUser(null);
      
      await localAuth.signOut();
    } finally {
      // Always redirect to login page
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        logout,
        checkUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};