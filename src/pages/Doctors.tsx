import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol_id: number;
}

interface Doctor {
  id: string;
  usuario_id: string;
  especialidad: string;
  usuario: User;
}

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
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicalUsers, setMedicalUsers] = useState<User[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState({
    doctors: true,
    users: true,
    action: false
  });
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    usuario_id: '',
    especialidad: ''
  });

  // Fetch data on component mount
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(prev => ({ ...prev, doctors: true, users: true }));
      
      // Primero cargar doctores
      const doctorsResponse = await fetch('http://localhost:3001/api/doctors?include=usuario');
      if (!doctorsResponse.ok) throw new Error('Error al cargar médicos');
      const { data: doctorsData } = await doctorsResponse.json();
      setDoctors(doctorsData);
      
      // Luego cargar usuarios médicos usando los doctores recién cargados
      await fetchMedicalUsers(doctorsData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, doctors: false, users: false }));
    }
  };

  loadData();
}, []);

  const fetchDoctors = async () => {
    setLoading(prev => ({ ...prev, doctors: true }));
    try {
      const response = await fetch('http://localhost:3001/api/doctors?include=usuario');
      if (!response.ok) throw new Error('Error al cargar médicos');
      const { data } = await response.json();
      setDoctors(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, doctors: false }));
    }
  };

const fetchMedicalUsers = async (currentDoctors: Doctor[] = doctors) => {
  setLoading(prev => ({ ...prev, users: true }));
  try {
    const response = await fetch('http://localhost:3001/api/users?rol=2');
    if (!response.ok) throw new Error('Error al cargar usuarios médicos');
    const users = await response.json();
    
    const assignedUserIds = currentDoctors.map(d => d.usuario_id);
    const availableUsers = users.filter((user: User) => 
      !assignedUserIds.includes(user.id)
    );
    
    setMedicalUsers(availableUsers);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(prev => ({ ...prev, users: false }));
  }
};

const handleCreateDoctor = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(prev => ({ ...prev, action: true }));
  setError(null);

  try {
    const response = await fetch('http://localhost:3001/api/doctors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear médico');
    }

    const { data: newDoctor } = await response.json();
    
    // Actualización optimizada y segura
    setDoctors(prevDoctors => [...prevDoctors, newDoctor]);
    setMedicalUsers(prevUsers => prevUsers.filter(user => user.id !== newDoctor.usuario_id));
    
    setIsCreateModalOpen(false);
    setFormData({ usuario_id: '', especialidad: '' });
    
    // Forzar recarga de datos para consistencia
    await fetchMedicalUsers();
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(prev => ({ ...prev, action: false }));
  }
};

  const handleUpdateDoctor = async () => {
    if (!selectedDoctor) return;
    setLoading(prev => ({ ...prev, action: true }));
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/doctors/${selectedDoctor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          especialidad: formData.especialidad
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar médico');
      }

      const { data: updatedDoctor } = await response.json();
      setDoctors(doctors.map(doc => 
        doc.id === selectedDoctor.id ? updatedDoctor : doc
      ));
      setIsEditModalOpen(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) return;
    setLoading(prev => ({ ...prev, action: true }));
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/doctors/${selectedDoctor.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar médico');
      }

      // Add the user back to available medical users
      const deletedDoctor = doctors.find(d => d.id === selectedDoctor.id);
      if (deletedDoctor) {
        setMedicalUsers([...medicalUsers, deletedDoctor.usuario]);
      }

      setDoctors(doctors.filter(doc => doc.id !== selectedDoctor.id));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

const handleRefresh = async () => {
  try {
    setLoading(prev => ({ ...prev, doctors: true, users: true }));
    const doctorsResponse = await fetch('http://localhost:3001/api/doctors?include=usuario');
    if (!doctorsResponse.ok) throw new Error('Error al cargar médicos');
    const { data: doctorsData } = await doctorsResponse.json();
    
    setDoctors(doctorsData);
    await fetchMedicalUsers(doctorsData);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(prev => ({ ...prev, doctors: false, users: false }));
  }
};

  if (loading.doctors || loading.users) {
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
        <h1 className="text-2xl font-bold text-gray-800">Médicos</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex items-center hover:bg-gray-300"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={medicalUsers.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            Asignar Especialidad
          </button>
        </div>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No hay médicos registrados</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={medicalUsers.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Asignar primer médico
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.usuario.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.usuario.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.especialidad}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setFormData({ 
                            usuario_id: doctor.usuario_id, 
                            especialidad: doctor.especialidad 
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Eliminar"
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
      )}

      {/* Modal para crear nuevo médico */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        title="Asignar Especialidad a Médico"
      >
        <form onSubmit={handleCreateDoctor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Médico
            </label>
            <select
              value={formData.usuario_id}
              onChange={(e) => setFormData({...formData, usuario_id: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Seleccione un médico</option>
              {medicalUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nombre} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especialidad
            </label>
            <select
              value={formData.especialidad}
              onChange={(e) => setFormData({...formData, especialidad: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Seleccione una especialidad</option>
              {specialities.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
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
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading.action ? 'Guardando...' : 'Asignar Especialidad'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para editar médico */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Especialidad"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          handleUpdateDoctor();
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Médico
            </label>
            <input
              type="text"
              value={selectedDoctor?.usuario.nombre || ''}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-gray-100"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especialidad
            </label>
            <select
              value={formData.especialidad}
              onChange={(e) => setFormData({...formData, especialidad: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Seleccione una especialidad</option>
              {specialities.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
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
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading.action ? 'Guardando...' : 'Actualizar Especialidad'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteDoctor}
        title="Eliminar Médico"
        message="¿Estás seguro de que deseas eliminar esta asignación de especialidad?"
        confirmText={loading.action ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
      />
    </div>
  );
}