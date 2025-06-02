import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Patient {
  id: string;
  name: string;
  nombre?: string;
  apellido?: string;
}

export interface Condition {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface DoctorOption {
  id: string;
  nombre: string;
}

export interface PatientCondition {
  id: string;
  paciente_id: string;
  condicion_medica_id: string;
  medico_id?: string;
  fecha_diagnostico?: string;
  observaciones?: string;
  medico_asignador?: {
    id: string;
    nombre: string;
  };
}

export interface PatientWithConditions {
  paciente_id: string;
  paciente_nombre: string;
  condiciones: {
    id: string;
    nombre: string;
    descripcion?: string;
    fecha_diagnostico?: string;
    observaciones?: string;
    medico_asignador?: {
      id: string;
      nombre: string;
    };
  }[];
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const errorMessage = error.response.data?.error || 
                         error.response.data?.message || 
                         'Error en la solicitud';
      console.error('Error response:', {
        status: error.response.status,
        message: errorMessage,
        url: error.config.url,
        data: error.response.data
      });
      return Promise.reject(new Error(errorMessage));
    }
    return Promise.reject(error);
  }
);

export const getPatientsWithConditions = async (): Promise<PatientWithConditions[]> => {
  try {
    const response = await api.get('/patients-with-conditions');
    return response.data.data.map((patient: any) => ({
      paciente_id: patient.paciente_id.toString(),
      paciente_nombre: patient.paciente_nombre,
      condiciones: patient.condiciones.map((cond: any) => ({
        id: cond.id.toString(),
        nombre: cond.nombre,
        descripcion: cond.descripcion || undefined,
        fecha_diagnostico: cond.fecha_diagnostico || undefined,
        observaciones: cond.observaciones || undefined,
        medico_asignador: cond.medico_asignador ? {
          id: cond.medico_asignador.id.toString(),
          nombre: cond.medico_asignador.nombre
        } : undefined
      }))
    }));
  } catch (error) {
    console.error('Error en getPatientsWithConditions:', error);
    throw new Error(error.message || 'Error al obtener pacientes con condiciones');
  }
};

export const createPatientCondition = async (
  data: Omit<PatientCondition, 'id'>
): Promise<{paciente_id: string, condicion_medica_id: string}> => {
  try {
    const response = await api.post('/patient-conditions', data);
    
    // Verifica que la respuesta tenga la estructura esperada
    if (!response.data.success || !response.data.data) {
      throw new Error('Respuesta inesperada del servidor');
    }
    
    return {
      paciente_id: response.data.data.paciente_id.toString(),
      condicion_medica_id: response.data.data.condicion_medica_id.toString()
    };
  } catch (error) {
    console.error('Error al crear relación paciente-condición:', error);
    throw new Error(error.message || 'Error al crear relación paciente-condición');
  }
};

export const updatePatientCondition = async (
  paciente_id: string,
  condicion_medica_id: string,
  data: {
    medico_id?: string;
    fecha_diagnostico?: string;
    observaciones?: string;
  }
): Promise<void> => {
  try {
    await api.put(`/patient-conditions/${paciente_id}/${condicion_medica_id}`, data);
  } catch (error) {
    console.error('Error updating condition:', error);
    throw new Error(error.message || 'Error al actualizar la relación paciente-condición');
  }
};

export const deletePatientCondition = async (
  paciente_id: string,
  condicion_medica_id: string
): Promise<void> => {
  try {
    await api.delete(`/patient-conditions/${paciente_id}/${condicion_medica_id}`);
  } catch (error) {
    console.error('Error deleting condition:', error);
    throw new Error(error.message || 'Error al eliminar la relación paciente-condición');
  }
};

export const getPatientOptions = async (): Promise<Patient[]> => {
  try {
    const response = await api.get('/patient-conditions/patient-options');
    return response.data.data.map((patient: any) => ({
      id: patient.id.toString(),
      name: patient.nombre_completo.trim()
    }));
  } catch (error) {
    console.error('Error en getPatientOptions:', error);
    throw new Error(error.message || 'Error al obtener opciones de pacientes');
  }
};

export const getConditionOptions = async (): Promise<Condition[]> => {
  try {
    const response = await api.get('/patient-conditions/options');
    return response.data.data.map((condition: any) => ({
      id: condition.id.toString(),
      nombre: condition.nombre,
      descripcion: condition.descripcion || undefined
    }));
  } catch (error) {
    console.error('Error en getConditionOptions:', error);
    throw new Error(error.message || 'Error al obtener opciones de condiciones médicas');
  }
};

export const getDoctorOptions = async (): Promise<DoctorOption[]> => {
  try {
    const response = await api.get('/patient-conditions/medicos/options');
    return response.data.data.map((doctor: any) => ({
      id: doctor.id.toString(),
      nombre: doctor.nombre
    }));
  } catch (error) {
    console.error('Error en getDoctorOptions:', error);
    throw new Error(error.message || 'Error al obtener opciones de médicos');
  }
};