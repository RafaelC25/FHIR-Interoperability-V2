import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Patient } from '../types/fhir';
import { searchPatients, createPatient, updatePatient, deletePatient } from '../services/fhir';

interface PatientFormData {
  name: string;
  birthDate: string;
  gender: string;
  address: string;
}

const emptyFormData: PatientFormData = {
  name: '',
  birthDate: '',
  gender: '',
  address: ''
};

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>(emptyFormData);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      setLoading(true);
      const data = await searchPatients();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los pacientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPatient = await createPatient(formData);
      setPatients([...patients, newPatient]);
      setFormData(emptyFormData);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating patient:', err);
      alert('Error al crear el paciente');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    try {
      const updatedPatient = await updatePatient(selectedPatient.id, formData);
      const updatedPatients = patients.map(patient => 
        patient.id === selectedPatient.id ? updatedPatient : patient
      );
      setPatients(updatedPatients);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating patient:', err);
      alert('Error al actualizar el paciente');
    }
  };

  const handleDelete = async () => {
    if (!selectedPatient) return;
    
    try {
      await deletePatient(selectedPatient.id);
      const updatedPatients = patients.filter(patient => patient.id !== selectedPatient.id);
      setPatients(updatedPatients);
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting patient:', err);
      alert('Error al eliminar el paciente');
    }
  };

  const openEditModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      birthDate: patient.birthDate,
      gender: patient.gender,
      address: patient.address || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  const PatientForm = ({ onSubmit, buttonText }: { onSubmit: (e: React.FormEvent) => void, buttonText: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
          Fecha de Nacimiento
        </label>
        <input
          type="date"
          id="birthDate"
          value={formData.birthDate}
          onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          Género
        </label>
        <select
          id="gender"
          value={formData.gender}
          onChange={e => setFormData({ ...formData, gender: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="">Seleccionar...</option>
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
          <option value="other">Otro</option>
        </select>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Dirección
        </label>
        <input
          type="text"
          id="address"
          value={formData.address}
          onChange={e => setFormData({ ...formData, address: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
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
        <h1 className="text-2xl font-bold text-gray-800">Pacientes</h1>
        <button
          onClick={() => {
            setFormData(emptyFormData);
            setIsCreateModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Paciente
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Nacimiento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Género</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td className="px-6 py-4 whitespace-nowrap">{patient.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patient.birthDate}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{patient.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patient.address}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openViewModal(patient)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(patient)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(patient)}
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
        title="Crear Nuevo Paciente"
      >
        <PatientForm onSubmit={handleCreateSubmit} buttonText="Crear Paciente" />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Paciente"
      >
        <PatientForm onSubmit={handleEditSubmit} buttonText="Guardar Cambios" />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles del Paciente"
      >
        {selectedPatient && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Nombre</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedPatient.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Fecha de Nacimiento</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedPatient.birthDate}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Género</h4>
              <p className="mt-1 text-sm text-gray-900 capitalize">{selectedPatient.gender}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Dirección</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedPatient.address}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Paciente"
        message="¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer."
      />
    </div>
  );
}