import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { auth } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar solo visible cuando está autenticado */}
      {auth.token && <Sidebar />}
      
      {/* Contenido principal con margen izquierdo cuando hay sidebar */}
      <main className={`flex-1 transition-all duration-300 ${
        auth.token ? 'ml-64' : ''
      }`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;