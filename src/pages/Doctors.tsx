import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Doctor } from '../types/fhir';

const mockDoctors = [
  {
    id: '1',
    name: 'Dr. García',
    speciality: 'Cardiología',
    qualification: 'MD, PhD'
  }
];

interface DoctorFormData {
  name: string;
  speciality: string;
  qualification: string;
}

const emptyFormData: DoctorFormData = {
  name: '',
  speciality: '',
  qualification: ''
};

const specialities = [
  'Cardiología',
  'Dermatología',
  'Endocrinología',
  'Gastroenterología',
  'Neurología',
  'Oncología',
  'Pediatría',
  'Psiquiatría',
  'Traumatología'
];

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<DoctorFormData>(emptyFormData);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoctor: Doctor = {
      id: String(Date.now()),
      ...formData
    };
    setDoctors([...doctors, newDoctor]);
    setFormData(emptyFormData);
    setIsCreateModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    
    const updatedDoctors = doctors.map(doctor => 
      doctor.id === selectedDoctor.id ? { ...doctor, ...formData } : doctor
    );
    setDoctors(updatedDoctors);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    if (!selectedDoctor) return;
    
    const updatedDoctors = doctors.filter(doctor => doctor.id !== selectedDoctor.id);
    setDoctors(updatedDoctors);
    setIsDeleteDialogOpen(false);
  };

  const openEditModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.name,
      speciality: doctor.speciality,
      qualification: doctor.qualification
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDeleteDialogOpen(true);
  };

  const DoctorForm = ({ onSubmit, buttonText }: { onSubmit: (e: React.FormEvent) => void, buttonText: string }) => (
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
        <label htmlFor="speciality" className="block text-sm font-medium text-gray-700">
          Especialidad
        </label>
        <select
          id="speciality"
          value={formData.speciality}
          onChange={e => setFormData({ ...formData, speciality: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="">Seleccionar...</option>
          {specialities.map(speciality => (
            <option key={speciality} value={speciality}>{speciality}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="qualification" className="block text-sm font-medium text-gray-700">
          Calificación
        </label>
        <input
          type="text"
          id="qualification"
          value={formData.qualification}
          onChange={e => setFormData({ ...formData, qualification: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
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
        <h1 className="text-2xl font-bold text-gray-800">Doctores</h1>
        <button
          onClick={() => {
            setFormData(emptyFormData);
            setIsCreateModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Doctor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td className="px-6 py-4 whitespace-nowrap">{doctor.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{doctor.speciality}</td>
                <td className="px-6 py-4 whitespace-nowrap">{doctor.qualification}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openViewModal(doctor)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(doctor)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(doctor)}
                      className="text-red-600 hover: text-red-800"
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
        title="Crear Nuevo Doctor"
      >
        <DoctorForm onSubmit={handleCreateSubmit} buttonText="Crear Doctor" />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Doctor"
      >
        <DoctorForm onSubmit={handleEditSubmit} buttonText="Guardar Cambios" />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles del Doctor"
      >
        {selectedDoctor && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Nombre</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedDoctor.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Especialidad</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedDoctor.speciality}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Calificación</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedDoctor.qualification}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Doctor"
        message="¿Estás seguro de que deseas eliminar este doctor? Esta acción no se puede deshacer."
      />
    </div>
  );
}