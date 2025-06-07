import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  UserCircle,
  UserCog,
  Calendar,
  Stethoscope,
  Activity,
  Pill,
  LogOut,
  ClipboardList,
  FileText,
  Home,
  User
} from 'lucide-react';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  exact?: boolean;
}

const menuItems: Record<string, MenuItem[]> = {
  admin: [
    { path: '/users', icon: Users, label: 'Usuarios', exact: true },
    { path: '/roles', icon: UserCog, label: 'Roles', exact: true },
    // { path: '/patients', icon: UserCircle, label: 'Pacientes', exact: true },
    { path: '/doctors', icon: Stethoscope, label: 'Médicos', exact: true },
    // { path: '/appointments', icon: Calendar, label: 'Citas', exact: true },
    // { path: '/conditions', icon: Activity, label: 'Condiciones', exact: true },
    // { path: '/medications', icon: Pill, label: 'Medicamentos', exact: true },
    // { path: '/patient-conditions', icon: ClipboardList, label: 'Asignar Condiciones', exact: true },
    // { path: '/patient-medications', icon: ClipboardList, label: 'Asignar Medicamentos', exact: true },
    // { path: '/medical-history', icon: FileText, label: 'Historias Clínicas', exact: true }
  ],
  physician: [
    { path: '/users', icon: Users, label: 'Usuarios', exact: true },
    { path: '/patients', icon: UserCircle, label: 'Pacientes', exact: true },
    { path: '/appointments', icon: Calendar, label: 'Citas', exact: true },
    { path: '/conditions', icon: Activity, label: 'Condiciones', exact: true },
    { path: '/medications', icon: Pill, label: 'Medicamentos', exact: true },
    { path: '/patient-conditions', icon: ClipboardList, label: 'Asignar Condiciones', exact: true },
    { path: '/patient-medications', icon: ClipboardList, label: 'Asignar Medicamentos', exact: true },
    { path: '/medical-history', icon: FileText, label: 'Historias Clínicas', exact: true }
  ],
  patient: [
  { path: '/patient-medical-history', icon: FileText, label: 'Mi Historia Clínica', exact: true },
  // { path: '/appointments', icon: Calendar, label: 'Mis Citas', exact: true },
  // { path: '/conditions', icon: Activity, label: 'Mis Condiciones', exact: true },
  // { path: '/medications', icon: Pill, label: 'Mis Medicamentos', exact: true }
]
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  if (!auth.token || !auth.user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string, exact: boolean = false) => {
    return exact 
      ? location.pathname === path
      : location.pathname.startsWith(path);
  };

  const items = menuItems[auth.user.role as keyof typeof menuItems] || [];

  return (
    <div className="w-64 bg-white h-full shadow-lg flex flex-col fixed border-r z-10">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-blue-600 flex items-center">
          <Home className="mr-2" size={20} />
          HealthSystem
        </h1>
        <div className="flex items-center mt-4">
          <User className="w-5 h-5 mr-2 text-gray-600" />
          <div>
            <p className="text-sm font-medium">{auth.user.username}</p>
            <p className="text-xs text-gray-500 capitalize">
              {auth.user.role === 'physician' ? 'Médico' : 
               auth.user.role === 'admin' ? 'Administrador' : 'Paciente'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 mx-2 my-1 rounded-md text-sm font-medium transition-colors ${
              isActive(item.path, item.exact)
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}