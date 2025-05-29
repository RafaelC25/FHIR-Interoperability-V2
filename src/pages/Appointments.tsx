import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { 
  getAppointments, 
  createAppointment, 
  updateAppointment, 
  deleteAppointment,
  getPatients,
  getDoctors
} from '../services/appointments';

interface Appointment {
  id: number;
  paciente_id: number;
  medico_id: number;
  fecha_cita: string;
  motivo: string;
  estado: string;
  paciente_nombre: string;
  medico_nombre: string;
  especialidad: string;
}

interface UserOption {
  id: number;
  name: string;
}

const emptyFormData = {
  paciente_id: 0,
  medico_id: 0,
  fecha_cita: '',
  motivo: '',
  estado: 'Programada'
};

const AppointmentForm = React.memo(({ 
  onSubmit, 
  buttonText,
  formData,
  onInputChange,
  patients,
  doctors,
  error,
  isLoading
}: { 
  onSubmit: (e: React.FormEvent) => void, 
  buttonText: string,
  formData: typeof emptyFormData,
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
  patients: UserOption[],
  doctors: UserOption[],
  error: string | null,
  isLoading: boolean
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        {error}
      </div>
    )}
    <div>
      <label htmlFor="paciente_id" className="block text-sm font-medium text-gray-700">
        Paciente
      </label>
      <select
        id="paciente_id"
        name="paciente_id"
        value={formData.paciente_id}
        onChange={onInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        required
        disabled={isLoading}
      >
        <option value="">Seleccionar paciente...</option>
        {patients.map(patient => (
          <option key={patient.id} value={patient.id}>{patient.name}</option>
        ))}
      </select>
    </div>
    <div>
      <label htmlFor="medico_id" className="block text-sm font-medium text-gray-700">
        Médico
      </label>
      <select
        id="medico_id"
        name="medico_id"
        value={formData.medico_id}
        onChange={onInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        required
        disabled={isLoading}
      >
        <option value="">Seleccionar médico...</option>
        {doctors.map(doctor => (
          <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
        ))}
      </select>
    </div>
    <div>
      <label htmlFor="fecha_cita" className="block text-sm font-medium text-gray-700">
        Fecha y Hora
      </label>
      <input
        type="datetime-local"
        id="fecha_cita"
        name="fecha_cita"
        value={formData.fecha_cita}
        onChange={onInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        required
        disabled={isLoading}
        autoFocus
      />
    </div>
    <div>
      <label htmlFor="motivo" className="block text-sm font-medium text-gray-700">
        Motivo
      </label>
      <input
        type="text"
        id="motivo"
        name="motivo"
        value={formData.motivo}
        onChange={onInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        required
        disabled={isLoading}
      />
    </div>
    <div>
      <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
        Estado
      </label>
      <select
        id="estado"
        name="estado"
        value={formData.estado}
        onChange={onInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        required
        disabled={isLoading}
      >
        <option value="Programada">Programada</option>
        <option value="Pendiente">Pendiente</option>
        <option value="Completada">Completada</option>
        <option value="Cancelada">Cancelada</option>
      </select>
    </div>
    <div className="mt-5 sm:mt-6">
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {isLoading ? 'Procesando...' : buttonText}
      </button>
    </div>
  </form>
));

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<UserOption[]>([]);
  const [doctors, setDoctors] = useState<UserOption[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [apps, pats, docs] = await Promise.all([
        getAppointments(),
        getPatients(),
        getDoctors()
      ]);
      setAppointments(apps);
      setPatients(pats);
      setDoctors(docs);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newAppointment = await createAppointment({
        ...formData,
        paciente_id: Number(formData.paciente_id),
        medico_id: Number(formData.medico_id)
      });
      setAppointments(prev => [...prev, newAppointment]);
      setFormData(emptyFormData);
      setIsCreateModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Error al crear la cita. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    setIsLoading(true);
    
    try {
      const updatedAppointment = await updateAppointment(selectedAppointment.id, {
        ...formData,
        paciente_id: Number(formData.paciente_id),
        medico_id: Number(formData.medico_id) 
      });
      setAppointments(prev => prev.map(app => 
        app.id === selectedAppointment.id ? updatedAppointment : app
      ));
      setIsEditModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err.message || 'Error al actualizar la cita. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, selectedAppointment]);

  const handleDelete = useCallback(async () => {
    if (!selectedAppointment) return;
    setIsLoading(true);
    
    try {
      await deleteAppointment(selectedAppointment.id);
      setAppointments(prev => prev.filter(
        app => app.id !== selectedAppointment.id
      ));
      setIsDeleteDialogOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError(err.message || 'Error al eliminar la cita. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAppointment]);

  const openEditModal = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      paciente_id: appointment.paciente_id,
      medico_id: appointment.medico_id,
      fecha_cita: appointment.fecha_cita.slice(0, 16),
      motivo: appointment.motivo,
      estado: appointment.estado
    });
    setIsEditModalOpen(true);
  }, []);

  const openViewModal = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteDialogOpen(true);
  }, []);

  const getPatientName = useCallback((id: number) => {
    return patients.find(p => p.id === id)?.name || 'Paciente no encontrado';
  }, [patients]);

  const getDoctorName = useCallback((id: number) => {
    return doctors.find(d => d.id === id)?.name || 'Doctor no encontrado';
  }, [doctors]);

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !isRefreshing) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <p>{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Citas Médicas</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => {
              setFormData(emptyFormData);
              setIsCreateModalOpen(true);
              setError(null);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.paciente_nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.medico_nombre} ({appointment.especialidad})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(appointment.fecha_cita).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.motivo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    appointment.estado === 'Programada' ? 'bg-yellow-100 text-yellow-800' :
                    appointment.estado === 'Completada' ? 'bg-green-100 text-green-800' :
                    appointment.estado === 'Pendiente' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {appointment.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openViewModal(appointment)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Ver detalles"
                      disabled={isLoading}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(appointment)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                      disabled={isLoading}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(appointment)}
                      className="text-red-600 hover:text-red-800"
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
        {appointments.length === 0 && (
          <div className="px-6 py-4 text-center text-gray-500">
            No hay citas programadas
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setError(null);
        }}
        title="Crear Nueva Cita"
      >
        <AppointmentForm 
          onSubmit={handleCreateSubmit}
          buttonText="Crear Cita"
          formData={formData}
          onInputChange={handleInputChange}
          patients={patients}
          doctors={doctors}
          error={error}
          isLoading={isLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setError(null);
        }}
        title="Editar Cita"
      >
        <AppointmentForm 
          onSubmit={handleEditSubmit}
          buttonText="Guardar Cambios"
          formData={formData}
          onInputChange={handleInputChange}
          patients={patients}
          doctors={doctors}
          error={error}
          isLoading={isLoading}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles de la Cita"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Paciente</h4>
              <p className="mt-1 text-sm text-gray-900">
                {selectedAppointment.paciente_nombre}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Médico</h4>
              <p className="mt-1 text-sm text-gray-900">
                {selectedAppointment.medico_nombre} ({selectedAppointment.especialidad})
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Fecha y Hora</h4>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedAppointment.fecha_cita).toLocaleString()}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Motivo</h4>
              <p className="mt-1 text-sm text-gray-900">
                {selectedAppointment.motivo}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Estado</h4>
              <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                selectedAppointment.estado === 'Programada' ? 'bg-yellow-100 text-yellow-800' :
                selectedAppointment.estado === 'Completada' ? 'bg-green-100 text-green-800' :
                selectedAppointment.estado === 'Pendiente' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedAppointment.estado}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Cita"
        message="¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer."
        confirmText={isLoading ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Appointments;