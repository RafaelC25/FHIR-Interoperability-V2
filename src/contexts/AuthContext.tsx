import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  email: string;
  role: string; 
}

interface AuthState {
  token: string | null;
  user: User | null;
}

interface AuthContextType {
  auth: AuthState;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    user: null
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!auth.token;

  const login = async (token: string, userData: User) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('userData', JSON.stringify(userData));
  setAuth({
    token,
    user: userData
  });
  
  // Redirigir directamente a /users para todos los roles excepto paciente
  const redirectPath = userData.role === 'patient' 
    ? '/medical-history' 
    : '/users'; // Cambiado a /users
  navigate(redirectPath);
};

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setAuth({
      token: null,
      user: null
    });
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData) as User;
        setAuth({
          token,
          user: parsedUser
        });
      } catch (error) {
        console.error('Error parsing user data', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      auth, 
      login, 
      logout, 
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}