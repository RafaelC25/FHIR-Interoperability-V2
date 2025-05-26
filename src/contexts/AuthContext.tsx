import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'physician' | 'patient';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, role: User['role']) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean; // Para manejar el estado de carga inicial
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticación al cargar
    const verifyAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Aquí podrías agregar una verificación con el backend
          // para confirmar que el token/sesión sigue siendo válida
          // const isValid = await verifySessionWithBackend(parsedUser);
          // if (isValid) {
          setUser(parsedUser);
          // }
        }
      } catch (error) {
        console.error('Error verifying auth:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (username: string, role: User['role']) => {
    const newUser = { id: Date.now().toString(), username, role };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    navigate('/'); // Redirigir después de login exitoso
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login'); // Redirigir a login después de logout
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}