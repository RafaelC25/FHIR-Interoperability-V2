import React, { useState, useEffect } from 'react';
import { User, Plus, Edit, Trash2, Loader2, Stethoscope } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  getPatientsWithConditions,
  createPatientCondition,
  updatePatientCondition,
  deletePatientCondition,
  getPatientOptions,
  getConditionOptions,
  getDoctorOptions,
  PatientWithConditions,
  DoctorOption
} from '../services/patientConditionsService';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function PatientConditionsPage() {
  const [patientsWithConditions, setPatientsWithConditions] = useState<PatientWithConditions[]>([]);
  const [allPatients, setAllPatients] = useState<{id: string, name: string}[]>([]);
  const [allConditions, setAllConditions] = useState<{id: string, nombre: string}[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCondition, setCurrentCondition] = useState<{
    paciente_id?: string;
    condicion_medica_id?: string;
    paciente_nombre?: string;
    condicion_nombre?: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    paciente_id: '',
    condicion_medica_id: '',
    medico_id: '',
    fecha_diagnostico: '',
    observaciones: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [patientsData, conditionsData, doctorsData, patientsWithConditionsData] = await Promise.all([
          getPatientOptions(),
          getConditionOptions(),
          getDoctorOptions(),
          getPatientsWithConditions()
        ]);

        setAllPatients(patientsData);
        setAllConditions(conditionsData);
        setDoctorOptions(doctorsData);
        setPatientsWithConditions(patientsWithConditionsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Error al cargar datos');
        toast.error(err.message || 'Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (patient: PatientWithConditions, condicion: any) => {
    setCurrentCondition({
      paciente_id: patient.paciente_id,
      condicion_medica_id: condicion.id,
      paciente_nombre: patient.paciente_nombre,
      condicion_nombre: condicion.nombre
    });
    setFormData({
      paciente_id: patient.paciente_id.toString(),
      condicion_medica_id: condicion.id.toString(),
      medico_id: condicion.medico_asignador?.id || '',
      fecha_diagnostico: condicion.fecha_diagnostico || '',
      observaciones: condicion.observaciones || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentCondition?.paciente_id && currentCondition?.condicion_medica_id) {
        // Modo edición
        await updatePatientCondition(
          currentCondition.paciente_id,
          currentCondition.condicion_medica_id,
          {
            medico_id: formData.medico_id || null,
            fecha_diagnostico: formData.fecha_diagnostico || null,
            observaciones: formData.observaciones || null
          }
        );
        toast.success('Relación actualizada correctamente');
      } else {
        // Modo creación
        await createPatientCondition({
          paciente_id: formData.paciente_id,
          condicion_medica_id: formData.condicion_medica_id,
          medico_id: formData.medico_id || null,
          fecha_diagnostico: formData.fecha_diagnostico || null,
          observaciones: formData.observaciones || null
        });
        toast.success('Relación creada correctamente');
      }
      
      // Recargar datos
      const [patientsWithConditionsData, conditionsData, doctorsData] = await Promise.all([
        getPatientsWithConditions(),
        getConditionOptions(),
        getDoctorOptions()
      ]);
      
      setPatientsWithConditions(patientsWithConditionsData);
      setAllConditions(conditionsData);
      setDoctorOptions(doctorsData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'Error al guardar la relación');
    }
  };

  const handleDelete = async () => {
    if (!currentCondition?.paciente_id || !currentCondition?.condicion_medica_id) return;
    try {
      await deletePatientCondition(
        currentCondition.paciente_id,
        currentCondition.condicion_medica_id
      );
      toast.success('Relación eliminada correctamente');
      
      // Recargar datos
      const data = await getPatientsWithConditions();
      setPatientsWithConditions(data);
    } catch (error) {
      toast.error(error.message || 'Error al eliminar relación');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCreateCondition = async () => {
  try {
    const result = await createPatientCondition(formData);
    console.log('Relación creada:', result);
    // Ahora result tiene {paciente_id, condicion_medica_id}
    toast.success('Relación creada correctamente');
    // Recargar datos o actualizar estado
  } catch (error) {
    toast.error(error.message);
  }
};

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No especificada';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500 mb-4" />
        <p>Cargando pacientes con condiciones médicas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mx-4 my-8">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
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
        <h1 className="text-2xl font-bold text-gray-800">Pacientes con Condiciones Médicas</h1>
        <button
          onClick={() => {
            setCurrentCondition(null);
            setFormData({
              paciente_id: '',
              condicion_medica_id: '',
              medico_id: '',
              fecha_diagnostico: '',
              observaciones: ''
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Nueva Relación
        </button>
      </div>

      {patientsWithConditions.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pacientes con condiciones registradas</h3>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {patientsWithConditions.map(patient => (
            <div key={patient.paciente_id} className="border-b border-gray-200 p-4">
              <div className="flex items-center mb-3">
                <User className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-semibold">
                  {patient.paciente_nombre} (ID: {patient.paciente_id})
                </h2>
              </div>
              
              <div className="ml-7 space-y-3">
                {patient.condiciones.map(condicion => (
                  <div key={`${patient.paciente_id}-${condicion.id}`} className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{condicion.nombre}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(patient, condicion)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentCondition({
                              paciente_id: patient.paciente_id,
                              condicion_medica_id: condicion.id,
                              paciente_nombre: patient.paciente_nombre,
                              condicion_nombre: condicion.nombre
                            });
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {condicion.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{condicion.descripcion}</p>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {condicion.fecha_diagnostico && (
                        <p>Diagnóstico: {formatDate(condicion.fecha_diagnostico)}</p>
                      )}
                      {condicion.medico_asignador && (
                        <div className="flex items-center">
                          <Stethoscope className="h-3 w-3 text-gray-400 mr-1" />
                          <span>Médico: {condicion.medico_asignador.nombre}</span>
                        </div>
                      )}
                      {condicion.observaciones && (
                        <p>Observaciones: {condicion.observaciones}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentCondition ? 'Editar Relación' : 'Nueva Relación'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!currentCondition ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Paciente *</label>
                  <select
                    name="paciente_id"
                    value={formData.paciente_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar paciente</option>
                    {allPatients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Condición *</label>
                  <select
                    name="condicion_medica_id"
                    value={formData.condicion_medica_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar condición</option>
                    {allConditions.map(condition => (
                      <option key={condition.id} value={condition.id}>
                        {condition.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  Editando: <span className="font-medium">{currentCondition.paciente_nombre}</span> -{' '}
                  <span className="font-medium">{currentCondition.condicion_nombre}</span>
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Médico Asignado</label>
              <select
                name="medico_id"
                value={formData.medico_id}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar médico</option>
                {doctorOptions.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {currentCondition ? 'Nueva Fecha de Diagnóstico' : 'Fecha de Diagnóstico'}
              </label>
              <input
                type="date"
                name="fecha_diagnostico"
                value={formData.fecha_diagnostico}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Observaciones</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {currentCondition ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de eliminar la condición "${currentCondition?.condicion_nombre}" del paciente ${currentCondition?.paciente_nombre}?`}
      />
    </div>
  );
}