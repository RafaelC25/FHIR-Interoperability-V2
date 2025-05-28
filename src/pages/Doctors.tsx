import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { searchDoctors, createDoctor, updateDoctor, deleteDoctor } from '../services/fhir';
import { toast } from 'react-toastify';
import { useMemo } from 'react';

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
    action: false,
    fhirSync: false
  });
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    usuario_id: '',
    especialidad: ''
  });

  useEffect(() => {
  console.log('Estado actual de doctors:', doctors);
  console.log('Estado actual de medicalUsers:', medicalUsers);
}, [doctors, medicalUsers]);

useEffect(() => {
  // Prevenir pantalla en blanco por estado undefined
  if (!doctors) {
    fetchDoctors(); // Recargar datos si doctors es null/undefined
  }
}, [doctors]);

    // Función para sincronizar con FHIR
  const syncWithFHIR = async (localDoctors: Doctor[]) => {
    setLoading(prev => ({ ...prev, fhirSync: true }));
    try {
      // Obtener doctores de FHIR
      const fhirDoctors = await searchDoctors();
      
      // Sincronizar cambios
      for (const localDoctor of localDoctors) {
        const existsInFHIR = fhirDoctors.some(fd => fd.id === localDoctor.id);
        
        if (!existsInFHIR) {
          await createDoctor({
            name: localDoctor.usuario.nombre,
            speciality: localDoctor.especialidad,
            qualification: 'MD'
          });
        } else {
          await updateDoctor(localDoctor.id, {
            name: localDoctor.usuario.nombre,
            speciality: localDoctor.especialidad,
            qualification: 'MD'
          });
        }
      }
      
      // Eliminar en FHIR los que no están en local
      for (const fhirDoctor of fhirDoctors) {
        const existsInLocal = localDoctors.some(ld => ld.id === fhirDoctor.id);
        if (!existsInLocal) {
          await deleteDoctor(fhirDoctor.id);
        }
      }
    } catch (error) {
      console.error('Error sincronizando con FHIR:', error);
    } finally {
      setLoading(prev => ({ ...prev, fhirSync: false }));
    }
  };

useEffect(() => {
  if (doctors.length > 0) {
    const syncData = async () => {
      setLoading(prev => ({ ...prev, fhirSync: true }));
      try {
        const fhirDoctors = await searchDoctors();
        
        // Sincronización en segundo plano
        for (const localDoctor of doctors) {
          const existsInFHIR = fhirDoctors.some(fd => fd.id === localDoctor.id);
          
          if (!existsInFHIR) {
            await createDoctor({
              name: localDoctor.usuario.nombre,
              speciality: localDoctor.especialidad,
              qualification: 'MD'
            });
          } else {
            await updateDoctor(localDoctor.id, {
              name: localDoctor.usuario.nombre,
              speciality: localDoctor.especialidad,
              qualification: 'MD'
            });
          }
        }
      } catch (error) {
        console.error('Error en sincronización FHIR:', error);
      } finally {
        setLoading(prev => ({ ...prev, fhirSync: false }));
      }
    };
    
    syncData(); // No usar await aquí para no bloquear
  }
}, [doctors]); // Se ejecuta cuando doctors cambia

  // Cargar datos iniciales
  useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(prev => ({ ...prev, doctors: true, users: true }));
      
      // Cargar en paralelo
      const [doctorsRes, usersRes] = await Promise.all([
        fetch('http://localhost:3001/api/doctors?include=usuario'),
        fetch('http://localhost:3001/api/users?rol=2')
      ]);

      if (!doctorsRes.ok) throw new Error('Error al cargar médicos');
      if (!usersRes.ok) throw new Error('Error al cargar usuarios médicos');

      const { data: doctorsData } = await doctorsRes.json();
      const usersData = await usersRes.json();

      setDoctors(doctorsData);
      
      // Filtrar usuarios disponibles
      const assignedIds = doctorsData.map((d: Doctor) => d.usuario_id);
      setMedicalUsers(usersData.filter((user: User) => !assignedIds.includes(user.id)));
      
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
    const response = await fetch('http://localhost:3001/api/doctors');
    if (!response.ok) throw new Error('Error al cargar médicos');
    
    const { data } = await response.json();
    
    // Verifica la estructura de los datos recibidos
    console.log('Datos recibidos del backend:', data);
    
    setDoctors(data);
  } catch (error) {
    setError(error.message);
    console.error('Error fetching doctors:', error);
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
      body: JSON.stringify({
        usuario_id: formData.usuario_id,
        especialidad: formData.especialidad
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear médico');
    }

    const { data: newDoctor } = await response.json();
    
    // Actualiza el estado optimísticamente
    setDoctors(prev => [...prev, newDoctor]);
    
    // Actualiza la lista de usuarios médicos disponibles
    setMedicalUsers(prev => prev.filter(user => user.id !== formData.usuario_id));
    
    setIsCreateModalOpen(false);
    setFormData({ usuario_id: '', especialidad: '' });
    
  } catch (error) {
    setError(error.message);
    console.error('Error creating doctor:', error);
  } finally {
    setLoading(prev => ({ ...prev, action: false }));
  }
};

const handleUpdateDoctor = async () => {
  if (!selectedDoctor) return;
  setLoading(prev => ({ ...prev, action: true }));
  setError(null);

  try {
    // Usar el servicio FHIR
    await updateDoctor(selectedDoctor.id, {
      name: selectedDoctor.usuario.nombre,
      speciality: formData.especialidad,
      qualification: 'MD' // Mantener o actualizar según necesidad
    });

    // Actualizar estado local
    setDoctors(prev => prev.map(doc => 
      doc.id === selectedDoctor.id ? {
        ...doc,
        especialidad: formData.especialidad
      } : doc
    ));
    setIsEditModalOpen(false);
  } catch (error) {
    setError('Error al actualizar médico en FHIR: ' + error.message);
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

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Error al eliminar médico');
    }

    // Actualizar el estado optimistamente
    setDoctors(prev => prev.filter(doc => doc.id !== selectedDoctor.id));
    
    // Si necesitas volver a cargar los usuarios médicos disponibles
    if (selectedDoctor.usuario_id) {
      setMedicalUsers(prev => [...prev, {
        id: selectedDoctor.usuario_id,
        nombre: selectedDoctor.usuario?.nombre || `Usuario ${selectedDoctor.usuario_id}`,
        email: selectedDoctor.usuario?.email || `usuario${selectedDoctor.usuario_id}@hospital.com`
      }]);
    }

    setIsDeleteDialogOpen(false);
    setSelectedDoctor(null);

    // Mostrar notificación de éxito
    toast.success('Médico eliminado correctamente');

  } catch (error) {
    setError(error.message);
    toast.error(error.message || 'Error al eliminar médico');
    console.error('Delete error:', error);
  } finally {
    setLoading(prev => ({ ...prev, action: false }));
  }
};

const handleRefresh = async () => {
  try {
    setLoading(prev => ({ ...prev, doctors: true }));
    
    // Limpiar datos antiguos primero
    setDoctors([]);
    
    await fetchDoctors();
    
    // Mostrar feedback visual
    toast.success('Datos actualizados correctamente');
  } catch (error) {
    setError(error.message);
    toast.error('Error al actualizar los datos');
  } finally {
    setLoading(prev => ({ ...prev, doctors: false }));
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
  {/* Encabezado y controles */}
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-gray-800">Médicos</h1>
    <div className="flex space-x-2">
      <button
        onClick={handleRefresh}
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg flex items-center transition-colors"
        disabled={loading.doctors}
      >
        <RefreshCw className={`w-4 h-4 ${loading.doctors ? 'animate-spin' : ''}`} />
      </button>
      <button
        onClick={() => setIsCreateModalOpen(true)}
        disabled={medicalUsers.length === 0 || loading.action}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        Asignar Especialidad
      </button>
    </div>
  </div>

  {/* Manejo de errores */}
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

  {/* Contenido principal */}
  {loading.doctors ? (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ) : (
    <>
      {doctors && doctors.length > 0 ? (
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doctor.usuario?.nombre || 'Nombre no disponible'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doctor.usuario?.email || 'Email no disponible'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doctor.especialidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoctor(doctor);
                          setFormData({
                            usuario_id: doctor.usuario_id,
                            especialidad: doctor.especialidad
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar especialidad"
                        disabled={loading.action}
                      >
                        <Edit className="w-5 h-5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoctor(doctor);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Eliminar médico"
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
          <p className="text-gray-500 text-lg mb-4">No hay médicos registrados</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={medicalUsers.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Agregar primer médico
          </button>
        </div>
      )}
    </>
  )}

  {/* Modal de creación */}
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
          disabled={loading.action || medicalUsers.length === 0}
        >
          <option value="">Seleccione un médico</option>
          {medicalUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.nombre} ({user.email})
            </option>
          ))}
        </select>
        {medicalUsers.length === 0 && (
          <p className="mt-1 text-sm text-red-600">No hay usuarios médicos disponibles</p>
        )}
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
          disabled={loading.action}
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
          disabled={loading.action || medicalUsers.length === 0}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.action ? 'Guardando...' : 'Asignar Especialidad'}
        </button>
      </div>
    </form>
  </Modal>

  {/* Modal de edición */}
  <Modal 
    isOpen={isEditModalOpen} 
    onClose={() => setIsEditModalOpen(false)}
    title="Editar Especialidad Médica"
  >
    {selectedDoctor && (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleUpdateDoctor();
      }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Médico
          </label>
          <p className="mt-1 text-sm">{selectedDoctor.usuario?.nombre || 'Nombre no disponible'}</p>
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
            disabled={loading.action}
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.action ? 'Actualizando...' : 'Actualizar Especialidad'}
          </button>
        </div>
      </form>
    )}
  </Modal>

  {/* Diálogo de confirmación para eliminar */}
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