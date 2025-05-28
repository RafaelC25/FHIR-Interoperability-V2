import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

interface Role {
  id: number;
  nombre: string;
}

interface RoleFormData {
  nombre: string;
}

const emptyFormData: RoleFormData = {
  nombre: ''
};

const RoleForm = React.memo(({ 
  onSubmit, 
  buttonText,
  formData,
  onInputChange,
  isLoading,
  error
}: { 
  onSubmit: (e: React.FormEvent) => void; 
  buttonText: string;
  formData: RoleFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  error: string | null;
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del Rol
        </label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={onInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
          disabled={isLoading}
          autoFocus
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Procesando...' : buttonText}
        </button>
      </div>
    </form>
  );
});

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RoleFormData>(emptyFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/roles');
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al cargar roles');
      }
      
      setRoles(data.data);
      setSuccess('Roles cargados exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la solicitud');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al crear rol');
      }

      setSuccess('Rol creado exitosamente');
      setFormData(emptyFormData);
      await fetchRoles();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error desconocido al crear rol');
    } finally {
      setIsLoading(false);
      setIsCreateModalOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3001/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al actualizar rol');
      }

      setSuccess('Rol actualizado exitosamente');
      await fetchRoles();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3001/api/roles/${selectedRole.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al eliminar rol');
      }

      setSuccess('Rol eliminado exitosamente');
      await fetchRoles();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      nombre: role.nombre
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  const openViewModal = (role: Role) => {
    setSelectedRole(role);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role);
    setError(null);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Roles</h1>
        <button
          onClick={() => {
            setFormData(emptyFormData);
            setError(null);
            setSuccess(null);
            setIsCreateModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Rol
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
        {isLoading && !roles.length ? (
          <div className="p-4 text-center">Cargando roles...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{role.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{role.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(role)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                        disabled={isLoading}
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(role)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        disabled={isLoading}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(role)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        disabled={isLoading}
                        title="Eliminar"
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

      {/* Modal para crear rol */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Crear Nuevo Rol"
      >
        <RoleForm 
          onSubmit={handleCreateSubmit} 
          buttonText="Crear Rol"
          formData={formData}
          onInputChange={handleInputChange}
          isLoading={isLoading}
          error={error}
        />
      </Modal>

      {/* Modal para editar rol */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Editar Rol"
      >
        <RoleForm 
          onSubmit={handleEditSubmit} 
          buttonText="Guardar Cambios"
          formData={formData}
          onInputChange={handleInputChange}
          isLoading={isLoading}
          error={error}
        />
      </Modal>

      {/* Modal para ver detalles */}
      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Detalles del Rol"
      >
        {selectedRole && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">ID</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedRole.id}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Nombre</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedRole.nombre}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseas eliminar el rol "${selectedRole?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText={isLoading ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
      />
    </div>
  );
}