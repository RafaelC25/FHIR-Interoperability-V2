import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { 
  getConditions, 
  createCondition, 
  updateCondition, 
  deleteCondition 
} from '../services/conditionsService';

interface Condition {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface ConditionFormData {
  nombre: string;
  descripcion?: string;
}

const emptyFormData: ConditionFormData = {
  nombre: '',
  descripcion: ''
};

const ConditionForm = React.memo(({ 
  onSubmit, 
  buttonText,
  formData,
  onInputChange,
  isSubmitting
}: { 
  onSubmit: (e: React.FormEvent) => void; 
  buttonText: string;
  formData: ConditionFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isSubmitting: boolean;
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Nombre <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="nombre"
        value={formData.nombre}
        onChange={onInputChange}
        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        required
        disabled={isSubmitting}
        autoFocus
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Descripción
      </label>
      <textarea
        name="descripcion"
        value={formData.descripcion || ''}
        onChange={onInputChange}
        rows={3}
        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        disabled={isSubmitting}
      />
    </div>

    <div className="flex justify-end space-x-3 pt-4">
      <button
        type="button"
        onClick={() => onSubmit}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={isSubmitting}
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Procesando...
          </>
        ) : (
          buttonText
        )}
      </button>
    </div>
  </form>
));

export default function Conditions() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ConditionFormData>(emptyFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConditions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Iniciando carga de condiciones...');
      
      const response = await fetch('http://localhost:3001/api/conditions');
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Datos crudos:', data);
      
      if (!Array.isArray(data)) {
        throw new Error(`Se esperaba array pero se recibió: ${typeof data}`);
      }
      
      setConditions(data);
      
    } catch (err) {
      console.error('Error al cargar condiciones:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setConditions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConditions();
  }, [fetchConditions]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Creando con datos:', formData);
      const newCondition = await createCondition({
        nombre: formData.nombre,
        descripcion: formData.descripcion
      });
      
      setConditions(prev => [...prev, newCondition]);
      setFormData(emptyFormData);
      setIsCreateModalOpen(false);
      setError(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error en handleCreateSubmit:', errorMessage);
      setError(`Error al crear: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCondition) return;
    setIsSubmitting(true);
    
    try {
      console.log('Actualizando condición:', selectedCondition.id, 'con:', formData);
      const updatedCondition = await updateCondition(selectedCondition.id, {
        nombre: formData.nombre,
        descripcion: formData.descripcion
      });
      
      setConditions(prev => prev.map(cond => 
        cond.id === selectedCondition.id ? updatedCondition : cond
      ));
      setIsEditModalOpen(false);
      setError(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error en handleEditSubmit:', errorMessage);
      setError(`Error al actualizar: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedCondition]);

  const handleDelete = useCallback(async () => {
    if (!selectedCondition) return;
    setIsSubmitting(true);
    
    try {
      console.log('Iniciando eliminación para ID:', selectedCondition.id);
      await deleteCondition(selectedCondition.id);
      
      setConditions(prev => prev.filter(cond => cond.id !== selectedCondition.id));
      setIsDeleteDialogOpen(false);
      setError(null);
      
      console.log('Eliminación exitosa');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error en handleDelete:', errorMessage);
      setError(`Error al eliminar: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCondition]);

  const openEditModal = useCallback((condition: Condition) => {
    setSelectedCondition(condition);
    setFormData({
      nombre: condition.nombre,
      descripcion: condition.descripcion
    });
    setIsEditModalOpen(true);
  }, []);

  const openViewModal = useCallback((condition: Condition) => {
    setSelectedCondition(condition);
    setIsViewModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((condition: Condition) => {
    setSelectedCondition(condition);
    setIsDeleteDialogOpen(true);
  }, []);

  useEffect(() => {
    console.log('Estado actual:', {
      isLoading,
      error,
      conditions,
      conditionsCount: conditions.length
    });
  }, [isLoading, error, conditions]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500 mb-4" />
        <p className="text-lg">Cargando condiciones médicas...</p>
        <p className="text-sm text-gray-500 mt-2">Por favor espere</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mx-4 my-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar datos</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Condiciones Médicas</h1>
        <button
          onClick={() => {
            setFormData(emptyFormData);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Nueva Condición
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {conditions.length === 0 ? (
          <div className="text-center p-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay condiciones médicas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando una nueva condición médica.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-4 w-4" />
                Nueva Condición
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conditions.map((condition) => (
                  <tr key={condition.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{condition.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {condition.descripcion || <span className="text-gray-300">Sin descripción</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openViewModal(condition)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(condition)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(condition)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Condición Médica"
      >
        <ConditionForm 
          onSubmit={handleCreateSubmit} 
          buttonText="Crear Condición" 
          formData={formData}
          onInputChange={handleInputChange}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Editar Condición: ${selectedCondition?.nombre || ''}`}
      >
        <ConditionForm 
          onSubmit={handleEditSubmit} 
          buttonText="Guardar Cambios" 
          formData={formData}
          onInputChange={handleInputChange}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Detalles de Condición: ${selectedCondition?.nombre || ''}`}
      >
        {selectedCondition && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Nombre</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedCondition.nombre}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {selectedCondition.descripcion || 'No especificada'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de eliminar la condición "${selectedCondition?.nombre}"?`}
        confirmText={isSubmitting ? (
          <>
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Eliminando...
          </>
        ) : "Eliminar"}
        cancelText="Cancelar"
        isSubmitting={isSubmitting}
        confirmButtonStyle="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </div>
  );
}