import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Condition } from '../types/fhir';

const mockConditions = [
  {
    id: '1',
    patientId: '1',
    code: 'I10',
    description: 'Hipertensión esencial (primaria)',
    severity: 'moderate' as const
  }
];

interface ConditionFormData {
  patientId: string;
  code: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
}

const emptyFormData: ConditionFormData = {
  patientId: '',
  code: '',
  description: '',
  severity: 'moderate'
};

// Mock data for patient dropdown
const mockPatients = [
  { id: '1', name: 'Juan Pérez' },
  { id: '2', name: 'María García' }
];

export default function Conditions() {
  const [conditions, setConditions] = useState<Condition[]>(mockConditions);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ConditionFormData>(emptyFormData);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCondition: Condition = {
      id: String(Date.now()),
      ...formData
    };
    setConditions([...conditions, newCondition]);
    setFormData(emptyFormData);
    setIsCreateModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCondition) return;
    
    const updatedConditions = conditions.map(condition => 
      condition.id === selectedCondition.id ? { ...condition, ...formData } : condition
    );
    setConditions(updatedConditions);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    if (!selectedCondition) return;
    
    const updatedConditions = conditions.filter(condition => condition.id !== selectedCondition.id);
    setConditions(updatedConditions);
    setIsDeleteDialogOpen(false);
  };

  const openEditModal = (condition: Condition) => {
    setSelectedCondition(condition);
    setFormData({
      patientId: condition.patientId,
      code: condition.code,
      description: condition.description,
      severity: condition.severity
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (condition: Condition) => {
    setSelectedCondition(condition);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (condition: Condition) => {
    setSelectedCondition(condition);
    setIsDeleteDialogOpen(true);
  };

  const getPatientName = (id: string) => {
    return mockPatients.find(p => p.id === id)?.name || 'Paciente no encontrado';
  };

  const ConditionForm = ({ onSubmit, buttonText }: { onSubmit: (e: React.FormEvent) => void, buttonText: string }) => (
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
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Código
        </label>
        <input
          type="text"
          id="code"
          value={formData.code}
          onChange={e => setFormData({ ...formData, code: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
          Severidad
        </label>
        <select
          id="severity"
          value={formData.severity}
          onChange={e => setFormData({ ...formData, severity: e.target.value as ConditionFormData['severity'] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="mild">Leve</option>
          <option value="moderate">Moderada</option>
          <option value="severe">Severa</option>
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
        <h1 className="text-2xl font-bold text-gray-800">Condiciones Médicas</h1>
        <button
          onClick={() => {
            setFormData(emptyFormData);
            setIsCreateModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Condición
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {conditions.map((condition) => (
              <tr key={condition.id}>
                <td className="px-6 py-4 whitespace-nowrap">{getPatientName(condition.patientId)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{condition.code}</td>
                <td className="px-6 py-4 whitespace-nowrap">{condition.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    condition.severity === 'mild' ? 'bg-green-100 text-green-800' :
                    condition.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {condition.severity === 'mild' ? 'Leve' :
                     condition.severity === 'moderate' ? 'Moderada' : 'Severa'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openViewModal(condition)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(condition)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(condition)}
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
        title="Crear Nueva Condición"
      >
        <ConditionForm onSubmit={handleCreateSubmit} buttonText="Crear Condición" />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Condición"
      >
        <ConditionForm onSubmit={handleEditSubmit} buttonText="Guardar Cambios" />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles de la Condición"
      >
        {selectedCondition && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Paciente</h4>
              <p className="mt-1 text-sm text-gray-900">{getPatientName(selectedCondition.patientId)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Código</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedCondition.code}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedCondition.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Severidad</h4>
              <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                selectedCondition.severity === 'mild' ? 'bg-green-100 text-green-800' :
                selectedCondition.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedCondition.severity === 'mild' ? 'Leve' :
                 selectedCondition.severity === 'moderate' ? 'Moderada' : 'Severa'}
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
        title="Eliminar Condición"
        message="¿Estás seguro de que deseas eliminar esta condición? Esta acción no se puede deshacer."
      />
    </div>
  );
}