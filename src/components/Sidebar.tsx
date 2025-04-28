import React from 'react';
import {
  Users,
  UserCircle,
  UserCog,
  Calendar,
  Stethoscope,
  Activity,
  Pill,
  LogOut
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const menuItems = {
  admin: [
    { path: '/roles', icon: UserCog, label: 'Roles' },
    { path: '/users', icon: Users, label: 'Usuarios' },
    { path: '/patients', icon: UserCircle, label: 'Pacientes' },
    { path: '/appointments', icon: Calendar, label: 'Citas' },
    { path: '/doctors', icon: Stethoscope, label: 'Doctores' },
    { path: '/conditions', icon: Activity, label: 'Condiciones Médicas' },
    { path: '/medications', icon: Pill, label: 'Medicamentos' },
  ],
  physician: [
    { path: '/patients', icon: UserCircle, label: 'Pacientes' },
    { path: '/appointments', icon: Calendar, label: 'Citas' },
    { path: '/conditions', icon: Activity, label: 'Condiciones Médicas' },
    { path: '/medications', icon: Pill, label: 'Medicamentos' },
  ],
  patient: [
    { path: '/patients', icon: UserCircle, label: 'Pacientes' },
    { path: '/appointments', icon: Calendar, label: 'Citas' },
    { path: '/conditions', icon: Activity, label: 'Condiciones Médicas' },
    { path: '/medications', icon: Pill, label: 'Medicamentos' },
  ],
};

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const items = menuItems[user.role];

  return (
    <div className="w-64 bg-white h-screen shadow-lg flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-blue-600">HealthSystem</h1>
        <p className="text-sm text-gray-600 mt-2">
          Bienvenido, {user.username}
          <br />
          <span className="text-xs text-gray-500 capitalize">({user.role})</span>
        </p>
      </div>
      <nav className="flex-1 mt-8">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}