import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { Form, DatePicker } from 'antd';
import type { FormInstance } from 'antd/es/form';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol_id: number;
}

interface Patient {
  id: string;
  usuario_id: string;
  numero_identificacion: string;
  fecha_nacimiento: string;
  telefono: string;
  direccion: string;
  genero: string;
  usuario: User;
}

const genderOptions = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
  { value: 'unknown', label: 'Desconocido' }
];

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientUsers, setPatientUsers] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState({
    patients: true,
    users: true,
    action: false
  });
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    usuario_id: '',
    numero_identificacion: '',
    fecha_nacimiento: '',
    telefono: '',
    direccion: '',
    genero: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(prev => ({ ...prev, patients: true, users: true }));
        
        const [patientsResponse, usersResponse] = await Promise.all([
          fetch('http://localhost:3001/api/patients?include=usuario'),
          fetch('http://localhost:3001/api/users?rol=3')
        ]);

        if (!patientsResponse.ok) throw new Error('Error al cargar pacientes');
        if (!usersResponse.ok) throw new Error('Error al cargar usuarios');

        const { data: patientsData } = await patientsResponse.json();
        const usersData = await usersResponse.json();

        setPatients(patientsData);
        
        const assignedUserIds = patientsData.map((p: Patient) => p.usuario_id);
        setPatientUsers(usersData.filter((user: User) => !assignedUserIds.includes(user.id)));
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(prev => ({ ...prev, patients: false, users: false }));
      }
    };

    loadData();
  }, []);

  const fetchPatients = async () => {
    setLoading(prev => ({ ...prev, patients: true }));
    try {
      const response = await fetch('http://localhost:3001/api/patients?include=usuario');
      if (!response.ok) throw new Error('Error al cargar pacientes');
      
      const { data } = await response.json();
      setPatients(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, patients: false }));
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, action: true }));
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear paciente');
      }

      const { data: newPatient } = await response.json();
      
      setPatients(prev => [...prev, newPatient]);
      setPatientUsers(prev => prev.filter(user => user.id !== formData.usuario_id));
      setFormData({
        usuario_id: '',
        numero_identificacion: '',
        fecha_nacimiento: '',
        telefono: '',
        direccion: '',
        genero: ''
      });
      setIsCreateModalOpen(false);
      
      toast.success('Paciente creado correctamente');
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Error al crear paciente');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;
    setLoading(prev => ({ ...prev, action: true }));
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/patients/${selectedPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar paciente');
      }

      setPatients(prev => prev.map(p => 
        p.id === selectedPatient.id ? { 
          ...p, 
          ...formData,
          usuario: p.usuario
        } : p
      ));
      setIsEditModalOpen(false);
      setFormData({
        usuario_id: '',
        numero_identificacion: '',
        fecha_nacimiento: '',
        telefono: '',
        direccion: '',
        genero: ''
      });
      
      toast.success('Paciente actualizado correctamente');
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Error al actualizar paciente');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    
    setLoading(prev => ({ ...prev, action: true }));
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/patients/${selectedPatient.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar paciente');
      }

      setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
      
      if (selectedPatient.usuario_id) {
        setPatientUsers(prev => [...prev, {
          id: selectedPatient.usuario_id,
          nombre: selectedPatient.usuario?.nombre || `Usuario ${selectedPatient.usuario_id}`,
          email: selectedPatient.usuario?.email || `usuario${selectedPatient.usuario_id}@hospital.com`
        }]);
      }

      setIsDeleteDialogOpen(false);
      setSelectedPatient(null);
      toast.success('Paciente eliminado correctamente');
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Error al eliminar paciente');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(prev => ({ ...prev, patients: true }));
      await fetchPatients();
      toast.success('Datos de pacientes actualizados');
    } catch (error) {
      setError(error.message);
      toast.error('Error al actualizar pacientes');
    } finally {
      setLoading(prev => ({ ...prev, patients: false }));
    }
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      usuario_id: patient.usuario_id,
      numero_identificacion: patient.numero_identificacion,
      fecha_nacimiento: patient.fecha_nacimiento,
      telefono: patient.telefono,
      direccion: patient.direccion,
      genero: patient.genero
    });
    setIsEditModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '0000-00-00') return 'No especificado';
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return dateString;
    }
  };

  const formatGender = (gender: string) => {
    const genderMap: Record<string, string> = {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Otro',
      unknown: 'Desconocido'
    };
    return genderMap[gender] || gender;
  };

  const normalizeDateForPicker = (dateString: string) => {
    if (!dateString) return null;
    try {
      // Primero intenta parsear como ISO string
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return dayjs(date);
      }
      
      // Luego intenta con formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dayjs(dateString, 'YYYY-MM-DD');
      }
      
      // Si no, devuelve null
      return null;
    } catch {
      return null;
    }
  };

  if (loading.patients || loading.users) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          onClick={handleRefresh} 
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
        >
          <RefreshCw className="h-6 w-6 text-red-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pacientes</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg flex items-center transition-colors"
            disabled={loading.patients}
          >
            <RefreshCw className={`w-4 h-4 ${loading.patients ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={patientUsers.length === 0 || loading.action}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Paciente
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <div className="flex justify-between items-center">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        </div>
      )}

      {loading.patients ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {patients && patients.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identificación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Nacimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Género</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.usuario?.nombre || 'Nombre no disponible'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.numero_identificacion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(patient.fecha_nacimiento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.telefono}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.direccion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatGender(patient.genero)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(patient);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Editar paciente"
                            disabled={loading.action}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(patient);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Eliminar paciente"
                            disabled={loading.action}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg mb-4">No hay pacientes registrados</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={patientUsers.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Registrar primer paciente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de creación */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => {
          setFormData({
            usuario_id: '',
            numero_identificacion: '',
            fecha_nacimiento: '',
            telefono: '',
            direccion: '',
            genero: ''
          });
          setIsCreateModalOpen(false);
        }}
        title="Registrar Nuevo Paciente"
      >
        <form onSubmit={handleCreatePatient} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Usuario
            </label>
            <select
              value={formData.usuario_id}
              onChange={(e) => setFormData({...formData, usuario_id: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              disabled={loading.action || patientUsers.length === 0}
            >
              <option value="">Seleccione un usuario</option>
              {patientUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nombre} ({user.email})
                </option>
              ))}
            </select>
            {patientUsers.length === 0 && (
              <p className="mt-1 text-sm text-red-600">No hay usuarios pacientes disponibles</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Identificación
            </label>
            <input
              type="text"
              value={formData.numero_identificacion}
              onChange={(e) => setFormData({...formData, numero_identificacion: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              disabled={loading.action}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento
            </label>
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              value={formData.fecha_nacimiento ? dayjs(formData.fecha_nacimiento, 'YYYY-MM-DD') : null}
              onChange={(date, dateString) => {
                setFormData({...formData, fecha_nacimiento: dateString});
              }}
              disabled={loading.action}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              disabled={loading.action}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              disabled={loading.action}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Género
            </label>
            <select
              value={formData.genero}
              onChange={(e) => setFormData({...formData, genero: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              disabled={loading.action}
            >
              <option value="">Seleccione un género</option>
              {genderOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading.action || patientUsers.length === 0}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.action ? 'Registrando...' : 'Registrar Paciente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de edición */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setFormData({
            usuario_id: '',
            numero_identificacion: '',
            fecha_nacimiento: '',
            telefono: '',
            direccion: '',
            genero: ''
          });
          setIsEditModalOpen(false);
        }}
        title="Editar Paciente"
      >
        {selectedPatient && (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdatePatient();
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paciente
              </label>
              <p className="mt-1 text-sm">{selectedPatient.usuario?.nombre || 'Nombre no disponible'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Identificación
              </label>
              <input
                type="text"
                value={formData.numero_identificacion}
                onChange={(e) => setFormData({...formData, numero_identificacion: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                disabled={loading.action}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                value={normalizeDateForPicker(formData.fecha_nacimiento)}
                onChange={(date, dateString) => {
                  setFormData({...formData, fecha_nacimiento: dateString});
                }}
                disabled={loading.action}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                disabled={loading.action}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                disabled={loading.action}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género
              </label>
              <select
                value={formData.genero}
                onChange={(e) => setFormData({...formData, genero: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                disabled={loading.action}
              >
                {genderOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading.action}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.action ? 'Actualizando...' : 'Actualizar Paciente'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeletePatient}
        title="Eliminar Paciente"
        message="¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer."
        confirmText={loading.action ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
      />
    </div>
  );
}