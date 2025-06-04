import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { 
  createMedication, 
  getMedications, 
  updateMedication, 
  deleteMedication 
} from '../services/medicationService.ts';

interface Medication {
  id: string;
  name: string;
  description: string;
}

export default function Medications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentMedication, setCurrentMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Cargar medicamentos
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Iniciando carga de medicamentos...');
        const data = await getMedications();
        console.log('Datos recibidos:', data);
        setMedications(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar medicamentos:', err);
        setError('Error al cargar los medicamentos. Por favor intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (currentMedication) {
      setCurrentMedication({
        ...currentMedication,
        [name]: value
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (currentMedication) {
        await updateMedication(currentMedication);
      } else {
        await createMedication(formData);
      }
      const updatedData = await getMedications();
      setMedications(updatedData);
      resetForm();
    } catch (err) {
      console.error('Error al guardar medicamento:', err);
      setError('Error al guardar el medicamento. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medication: Medication) => {
    setCurrentMedication(medication);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este medicamento?')) {
      try {
        setLoading(true);
        await deleteMedication(id);
        const updatedData = await getMedications();
        setMedications(updatedData);
      } catch (err) {
        console.error('Error al eliminar medicamento:', err);
        setError('Error al eliminar el medicamento');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setCurrentMedication(null);
    setFormData({
      name: '',
      description: ''
    });
    setIsFormOpen(false);
  };

  if (loading && medications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
        <p className="mt-4 text-lg">Cargando medicamentos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <X className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Medicamentos</h1>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Medicamento
        </button>
      </div>

      {/* Formulario */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {currentMedication ? 'Editar Medicamento' : 'Agregar Nuevo Medicamento'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Nombre *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={currentMedication ? currentMedication.name : formData.name}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="Ej: Paracetamol"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                value={currentMedication ? currentMedication.description : formData.description}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={3}
                placeholder="Ej: Analgésico y antipirético"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {currentMedication ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de medicamentos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medications.length > 0 ? (
              medications.map((medication) => (
                <tr key={medication.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{medication.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-700 whitespace-pre-line">{medication.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(medication)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(medication.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No hay medicamentos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}