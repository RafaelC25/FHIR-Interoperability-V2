import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Appointment } from '../types/fhir';

const mockAppointments = [
  {
    id: '1',
    patientId: '1',
    doctorId: '1',
    date: '2024-03-20T10:00:00',
    status: 'scheduled' as const
  }
];

interface AppointmentFormData {
  patientId: string;
  doctorId: string;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

const emptyFormData: AppointmentFormData = {
  patientId: '',
  doctorId: '',
  date: '',
  status: 'scheduled'
};

// Mock data for dropdowns
const mockPatients = [
  { id: '1', name: 'Juan Pérez' },
  { id: '2', name: 'María García' }
];

const mockDoctors = [
  { id: '1', name: 'Dr. García' },
  { id: '2', name: 'Dra. Rodríguez' }
];

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>(emptyFormData);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppointment: Appointment = {
      id: String(Date.now()),
      ...formData
    };
    setAppointments([...appointments, newAppointment]);
    setFormData(emptyFormData);
    setIsCreateModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    
    const updatedAppointments = appointments.map(appointment => 
      appointment.id === selectedAppointment.id ? { ...appointment, ...formData } : appointment
    );
    setAppointments(updatedAppointments);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    if (!selectedAppointment) return;
    
    const updatedAppointments = appointments.filter(appointment => appointment.id !== selectedAppointment.id);
    setAppointments(updatedAppointments);
    setIsDeleteDialogOpen(false);
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date.slice(0, 16), // Format for datetime-local input
      status: appointment.status
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteDialogOpen(true);
  };

  const getPatientName = (id: string) => {
    return mockPatients.find(p => p.id === id)?.name || 'Paciente no encontrado';
  };

  const getDoctorName = (id: string) => {
    return mockDoctors.find(d => d.id === id)?.name || 'Doctor no encontrado';
  };

  const AppointmentForm = ({ onSubmit, buttonText }: { onSubmit: (e: React.FormEvent) => void, buttonText: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
          Paciente
        </label>
        <select
          id="patientId"
          value={formData.patientId}
          onChange={e => setFormData({ ...formData, patientId: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="">Seleccionar paciente...</option>
          {mockPatients.map(patient => (
            <option key={patient.id} value={patient.id}>{patient.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700">
          Doctor
        </label>
        <select
          id="doctorId"
          value={formData.doctorId}
          onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="">Seleccionar doctor...</option>
          {mockDoctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Fecha y Hora
        </label>
        <input
          type="datetime-local"
          id="date"
          value={formData.date}
          onChange={e => setFormData({ ...formData, date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Estado
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={e => setFormData({ ...formData, status: e.target.value as AppointmentFormData['status'] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="scheduled">Programada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>
      <div className="mt-5 sm:mt-6">
        <button
          type="submit"
          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {buttonText}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Citas</h1>
        <button
          onClick={() => {
            setFormData(emptyFormData);
            setIsCreateModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-6 py-4 whitespace-nowrap">{getPatientName(appointment.patientId)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getDoctorName(appointment.doctorId)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(appointment.date).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {appointment.status === 'scheduled' ? 'Programada' :
                     appointment.status === 'completed' ? 'Completada' : 'Cancelada'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openViewModal(appointment)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(appointment)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(appointment)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Cita"
      >
        <AppointmentForm onSubmit={handleCreateSubmit} buttonText="Crear Cita" />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Cita"
      >
        <AppointmentForm onSubmit={handleEditSubmit} buttonText="Guardar Cambios" />
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
              <p className="mt-1 text-sm text-gray-900">{getPatientName(selectedAppointment.patientId)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Doctor</h4>
              <p className="mt-1 text-sm text-gray-900">{getDoctorName(selectedAppointment.doctorId)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Fecha y Hora</h4>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedAppointment.date).toLocaleString()}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Estado</h4>
              <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                selectedAppointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                selectedAppointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedAppointment.status === 'scheduled' ? 'Programada' :
                 selectedAppointment.status === 'completed' ? 'Completada' : 'Cancelada'}
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
      />
    </div>
  );
}