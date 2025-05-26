import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';


interface User {
  id: number;
  nombre: string;
  email: string;
  rol_id: number;
  activo: boolean;
}

interface UserFormData {
  nombre: string;
  email: string;
  rol_id: number;
  contraseña: string;
  activo: boolean;
  // Añadir estos nuevos campos
  especialidad?: string;
  numero_identificacion?: string;
  fecha_nacimiento?: string;
  telefono?: string;
  direccion?: string;
}

const roleNames: { [key: number]: string } = {
  1: 'Administrador',
  2: 'Médico',
  3: 'Paciente'
};

const emptyFormData: UserFormData = {
  nombre: '',
  email: '',
  rol_id: 2,
  contraseña: '',
  activo: true,
  especialidad: '',
  numero_identificacion: '',
  fecha_nacimiento: '',
  telefono: '',
  direccion: ''
};

const UserForm = ({ 
  onSubmit, 
  buttonText, 
  isEdit = false,
  formData,
  onInputChange,
  onCheckboxChange,
  error,
  success
}: { 
  onSubmit: (e: React.FormEvent) => void; 
  buttonText: string; 
  isEdit?: boolean;
  formData: UserFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  success: string | null;
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre
        </label>
        <input
          type="text"
          id="nombre"
          value={formData.nombre}
          onChange={onInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={onInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="rol_id" className="block text-sm font-medium text-gray-700 mb-1">
          Rol
        </label>
        <select
          id="rol_id"
          value={formData.rol_id}
          onChange={onInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          {Object.entries(roleNames).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700 mb-1">
          {isEdit ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
        </label>
        <input
          type="password"
          id="contraseña"
          value={formData.contraseña}
          onChange={onInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required={!isEdit}
          minLength={6}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="activo"
          checked={formData.activo}
          onChange={onCheckboxChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
          Usuario Activo
        </label>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {buttonText}
        </button>
      </div>
    </form>
  );
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(emptyFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

const fetchUsers = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('http://localhost:3001/api/users');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    setUsers(data);
    setError(null);
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    setError('No se pudieron cargar los usuarios. Intente recargar la página.');
    // Mantener los datos existentes si hay error
  } finally {
    setIsLoading(false);
  }
};

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'rol_id' ? Number(value) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData(prev => ({
      ...prev,
      activo: checked
    }));
  };

const handleCreateSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  clearMessages();
  setIsLoading(true);

  try {
    // 1. Crear el usuario en el backend
    const userResponse = await fetch('http://localhost:3001/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: formData.nombre,
        email: formData.email,
        contrasena: formData.contraseña,
        rol_id: formData.rol_id,
        activo: formData.activo
      }),
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error(userData.message || 'Error al crear usuario');
    }

    // 2. Actualizar el estado local inmediatamente (optimistic update)
    setUsers(prevUsers => [...prevUsers, {
      id: userData.id,
      nombre: formData.nombre,
      email: formData.email,
      rol_id: formData.rol_id,
      activo: formData.activo
    }]);

    // 3. Redirigir o mostrar éxito
    if (formData.rol_id === 2) { // Médico
      navigate('/doctors/create', { 
        state: { 
          user_id: userData.id,
          userData: {
            nombre: formData.nombre,
            email: formData.email
          }
        }
      });
    } 
    else if (formData.rol_id === 3) { // Paciente
      navigate('/patients/create', { 
        state: { 
          user_id: userData.id,
          userData: {
            nombre: formData.nombre,
            email: formData.email
          }
        }
      });
    }
    else {
      // Para otros roles (admin, etc.)
      setSuccess('Usuario creado exitosamente');
      setFormData(emptyFormData);
      setIsCreateModalOpen(false);
      
      // Recargar datos del servidor para asegurar consistencia
      await fetchUsers();
    }

  } catch (error) {
    console.error('Error:', error);
    setError(error.message || 'Error al crear usuario');
    
    // Revertir el optimistic update en caso de error
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userData?.id));
    
  } finally {
    setIsLoading(false);
  }
};

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    clearMessages();
    setIsLoading(true);
    
    try {
      const dataToSend = {
        nombre: formData.nombre,
        email: formData.email,
        rol_id: formData.rol_id,
        activo: formData.activo,
        ...(formData.contraseña && { contraseña: formData.contraseña })
      };
      
      const response = await fetch(`http://localhost:3001/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar usuario');
      }

      setSuccess('Usuario actualizado exitosamente');
      fetchUsers();
      setTimeout(() => setIsEditModalOpen(false), 1500);
    } catch (error) {
      console.error('Error al editar usuario:', error);
      setError(error.message || 'Error al actualizar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    clearMessages();
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:3001/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }

      setSuccess('Usuario eliminado exitosamente');
      fetchUsers();
      setTimeout(() => {
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
      }, 1500);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setError(error.message || 'Error al eliminar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      nombre: user.nombre,
      email: user.email,
      rol_id: user.rol_id,
      contraseña: '',
      activo: user.activo,
    });
    clearMessages();
    setIsEditModalOpen(true);
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    clearMessages();
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <button
          onClick={() => {
            setFormData(emptyFormData);
            setIsCreateModalOpen(true);
            clearMessages();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-center">Cargando usuarios...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{user.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{roleNames[user.rol_id] || `Rol ${user.rol_id}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openViewModal(user)} 
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                        title="Ver"
                        disabled={isLoading}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditModal(user)} 
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Editar"
                        disabled={isLoading}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openDeleteDialog(user)} 
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Eliminar"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Crear Nuevo Usuario">
        <UserForm 
          onSubmit={handleCreateSubmit}
          buttonText={isLoading ? "Creando..." : "Crear Usuario"}
          formData={formData}
          onInputChange={handleInputChange}
          onCheckboxChange={handleCheckboxChange}
          error={error}
          success={success}
        />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Usuario">
        <UserForm 
          onSubmit={handleEditSubmit}
          buttonText={isLoading ? "Guardando..." : "Guardar Cambios"}
          isEdit
          formData={formData}
          onInputChange={handleInputChange}
          onCheckboxChange={handleCheckboxChange}
          error={error}
          success={success}
        />
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalles del Usuario">
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Nombre</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedUser.nombre}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Email</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Rol</h4>
              <p className="mt-1 text-sm text-gray-900">{roleNames[selectedUser.rol_id] || `Rol ${selectedUser.rol_id}`}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Estado</h4>
              <span
                className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  selectedUser.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {selectedUser.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        confirmText={isLoading ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
      />
    </div>
  );
}