import React, { useState, useEffect } from 'react';
import { User, Plus, Edit, Trash2, Loader2, Pill, Stethoscope } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  getPatientsWithMedications,
  createPatientMedication,
  updatePatientMedication,
  deletePatientMedication,
  getDoctorOptions,
  getMedicationOptions,
  PatientWithMedications,
  MedicationAssignment,
  DoctorOption,
  MedicationOption
} from '../services/PatientMedicationsService';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function PatientMedicationsPage() {
  const [patientsWithMedications, setPatientsWithMedications] = useState<PatientWithMedications[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [medicationOptions, setMedicationOptions] = useState<MedicationOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentMedication, setCurrentMedication] = useState<{
    paciente_id?: string;
    medicamento_id?: string;
    paciente_nombre?: string;
    medicamento_nombre?: string;
    fecha_original?: string;
  } | null>(null);

  const [formData, setFormData] = useState<MedicationAssignment>({
    paciente_id: '',
    medicamento_id: '',
    medico_id: '',
    fecha_prescripcion: '',
    dosis: '',
    frecuencia: '',
    observaciones: ''
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [patientsData, doctorsData, medsData] = await Promise.all([
          getPatientsWithMedications(),
          getDoctorOptions(),
          getMedicationOptions()
        ]);

        setPatientsWithMedications(patientsData);
        setDoctorOptions(doctorsData);
        setMedicationOptions(medsData);
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

  const handleEdit = (patient: PatientWithMedications, medicamento: any) => {
    setCurrentMedication({
      paciente_id: patient.paciente_id,
      medicamento_id: medicamento.id,
      paciente_nombre: patient.paciente_nombre,
      medicamento_nombre: medicamento.nombre,
      fecha_original: medicamento.fecha_prescripcion
    });
    setFormData({
      paciente_id: patient.paciente_id,
      medicamento_id: medicamento.id,
      medico_id: medicamento.medico_asignador?.id || '',
      fecha_prescripcion: medicamento.fecha_prescripcion || '',
      dosis: medicamento.dosis || '',
      frecuencia: medicamento.frecuencia || '',
      observaciones: medicamento.observaciones || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.medico_id) {
        toast.error('Debe seleccionar un médico');
        return;
      }

      if (currentMedication?.paciente_id && currentMedication?.medicamento_id) {
        // Update existing medication
        await updatePatientMedication(
          currentMedication.paciente_id,
          currentMedication.medicamento_id,
          {
            ...formData,
            fecha_prescripcion: formData.fecha_prescripcion || currentMedication.fecha_original
          }
        );
        toast.success('Medicamento actualizado correctamente');
      } else {
        // Create new medication
        await createPatientMedication(formData);
        toast.success('Medicamento asignado correctamente');
      }
      
      // Refresh data
      const [patientsData, doctorsData, medsData] = await Promise.all([
        getPatientsWithMedications(),
        getDoctorOptions(),
        getMedicationOptions()
      ]);
      
      setPatientsWithMedications(patientsData);
      setDoctorOptions(doctorsData);
      setMedicationOptions(medsData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'Error al guardar el medicamento');
    }
  };

  const handleDelete = async () => {
    if (!currentMedication?.paciente_id || !currentMedication?.medicamento_id) return;
    try {
      await deletePatientMedication(
        currentMedication.paciente_id,
        currentMedication.medicamento_id
      );
      toast.success('Medicamento eliminado correctamente');
      
      const data = await getPatientsWithMedications();
      setPatientsWithMedications(data);
    } catch (error) {
      toast.error(error.message || 'Error al eliminar medicamento');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500 mb-4" />
        <p>Cargando pacientes con medicamentos...</p>
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
        <h1 className="text-2xl font-bold text-gray-800">Pacientes con Medicamentos</h1>
        <button
          onClick={() => {
            setCurrentMedication(null);
            setFormData({
              paciente_id: '',
              medicamento_id: '',
              medico_id: '',
              fecha_prescripcion: '',
              dosis: '',
              frecuencia: '',
              observaciones: ''
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Asignar Medicamento
        </button>
      </div>

      {patientsWithMedications.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pacientes con medicamentos registrados</h3>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {patientsWithMedications.map(patient => (
            <div key={patient.paciente_id} className="border-b border-gray-200 p-4">
              <div className="flex items-center mb-3">
                <User className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-semibold">
                  {patient.paciente_nombre} (ID: {patient.paciente_id})
                </h2>
              </div>
              
              <div className="ml-7 space-y-3">
                {patient.medicamentos.map(medicamento => (
                  <div key={`${patient.paciente_id}-${medicamento.id}`} className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <Pill className="h-4 w-4 text-blue-500 mr-2" />
                        <h3 className="font-medium">{medicamento.nombre}</h3>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(patient, medicamento)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentMedication({
                              paciente_id: patient.paciente_id,
                              medicamento_id: medicamento.id,
                              paciente_nombre: patient.paciente_nombre,
                              medicamento_nombre: medicamento.nombre
                            });
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {medicamento.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{medicamento.descripcion}</p>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {medicamento.fecha_prescripcion && (
                        <p>Prescrito: {formatDate(medicamento.fecha_prescripcion)}</p>
                      )}
                      {medicamento.dosis && (
                        <p>Dosis: {medicamento.dosis}</p>
                      )}
                      {medicamento.frecuencia && (
                        <p>Frecuencia: {medicamento.frecuencia}</p>
                      )}
                      {medicamento.observaciones && (
                        <p>Observaciones: {medicamento.observaciones}</p>
                      )}
                      {medicamento.medico_asignador && (
                        <div className="flex items-center mt-2">
                          <Stethoscope className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs">Médico: {medicamento.medico_asignador.nombre}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for create/edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentMedication ? 'Editar Medicamento' : 'Asignar Medicamento'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!currentMedication ? (
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
                    {patientsWithMedications.map(patient => (
                      <option key={patient.paciente_id} value={patient.paciente_id}>
                        {patient.paciente_nombre} (ID: {patient.paciente_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medicamento *</label>
                  <select
                    name="medicamento_id"
                    value={formData.medicamento_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar medicamento</option>
                    {medicationOptions.map(medication => (
                      <option key={medication.id} value={medication.id}>
                        {medication.nombre} {medication.descripcion && `- ${medication.descripcion}`}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  Editando: <span className="font-medium">{currentMedication.paciente_nombre}</span> -{' '}
                  <span className="font-medium">{currentMedication.medicamento_nombre}</span>
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Médico *</label>
              <select
                name="medico_id"
                value={formData.medico_id}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar médico</option>
                {doctorOptions.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            {currentMedication && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Prescripción Original</label>
                <input
                  type="text"
                  value={currentMedication.fecha_original ? formatDate(currentMedication.fecha_original) : 'No especificada'}
                  readOnly
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm bg-gray-100"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {currentMedication ? 'Nueva Fecha de Prescripción' : 'Fecha de Prescripción'}
              </label>
              <input
                type="date"
                name="fecha_prescripcion"
                value={formData.fecha_prescripcion}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Dosis</label>
              <input
                type="text"
                name="dosis"
                value={formData.dosis}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 500mg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Frecuencia</label>
              <input
                type="text"
                name="frecuencia"
                value={formData.frecuencia}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Cada 8 horas"
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
                {currentMedication ? 'Actualizar' : 'Asignar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de eliminar el medicamento "${currentMedication?.medicamento_nombre}" del paciente ${currentMedication?.paciente_nombre}?`}
      />
    </div>
  );
}