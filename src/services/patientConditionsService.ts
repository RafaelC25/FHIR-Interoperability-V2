import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Patient {
  id: string;
  name: string; // Nombre completo
  nombre?: string; // Opcional para compatibilidad
  apellido?: string; // Opcional para compatibilidad
}

export interface Condition {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface PatientCondition {
  id: string;
  paciente_id: string;
  condicion_medica_id: string;
  fecha_diagnostico?: string;
  observaciones?: string;
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
  }[];
}

// Obtener pacientes con condiciones
export const getPatientsWithConditions = async (): Promise<PatientWithConditions[]> => {
  try {
    console.log('Iniciando getPatientsWithConditions...'); // [A]
    const response = await axios.get(`${API_BASE_URL}/patients-with-conditions`);
    console.log('Respuesta completa:', response); // [B]
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Formato de respuesta inválido');
    }
    
    const processedData = response.data.data.map((patient: any) => ({
      paciente_id: patient.paciente_id.toString(),
      paciente_nombre: patient.paciente_nombre,
      condiciones: patient.condiciones.map((cond: any) => ({
        id: cond.id.toString(),
        nombre: cond.nombre,
        descripcion: cond.descripcion || undefined,
        fecha_diagnostico: cond.fecha_diagnostico || undefined,
        observaciones: cond.observaciones || undefined
      }))
    }));
    
    console.log('Datos procesados:', processedData); // [C]
    return processedData;
    
  } catch (error) {
    console.error('Error en getPatientsWithConditions:', {
      error: error.response?.data || error.message
    });
    throw error;
  }
};

// Crear nueva relación paciente-condición
export const createPatientCondition = async (
  data: Omit<PatientCondition, 'id'>
): Promise<{id: string}> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/patient-conditions`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al crear relación');
    }
    return { id: response.data.id.toString() };
  } catch (error) {
    console.error('Error al crear relación paciente-condición:', error);
    throw new Error(
      error.response?.data?.error || 
      'Error al crear relación paciente-condición'
    );
  }
};

// Actualizar relación paciente-condición
export const updatePatientCondition = async (
  paciente_id: string,
  condicion_medica_id: string,
  data: {
    fecha_diagnostico?: string;
    observaciones?: string;
  }
): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/patient-conditions`, {
      paciente_id,
      condicion_medica_id,
      ...data
    });
  } catch (error) {
    console.error('Error updating condition:', {
      request: { paciente_id, condicion_medica_id, data },
      response: error.response?.data
    });
    throw new Error(
      error.response?.data?.error || 
      'Error al actualizar la relación paciente-condición'
    );
  }
};

// Eliminar relación paciente-condición
export const deletePatientCondition = async (
  paciente_id: string,
  condicion_medica_id: string
): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/patient-conditions`, {
      data: { // Axios requiere el 'data' para DELETE con body
        paciente_id,
        condicion_medica_id
      }
    });
  } catch (error) {
    console.error('Error deleting condition:', {
      request: { paciente_id, condicion_medica_id },
      response: error.response?.data
    });
    throw new Error(
      error.response?.data?.error || 
      'Error al eliminar la relación paciente-condición'
    );
  }
};

// Obtener todos los pacientes
export const getPatients = async (): Promise<Patient[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/patients`);
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Respuesta inválida del servidor');
    }
    
    return response.data.data.map((patient: any) => ({
      id: patient.id.toString(),
      name: `${patient.nombre} ${patient.apellido || ''}`.trim(),
      nombre: patient.nombre,
      apellido: patient.apellido
    }));
    
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Error al obtener pacientes'
    );
  }
};

// Obtener todas las condiciones médicas
export const getConditionOptions = async (): Promise<Condition[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/patient-conditions/options`);
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Respuesta inválida del servidor');
    }
    
    return response.data.data.map((condition: any) => ({
      id: condition.id.toString(),
      nombre: condition.nombre,
      descripcion: condition.descripcion || undefined
    }));
    
  } catch (error) {
    console.error('Error en getConditionOptions:', error);
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Error al obtener opciones de condiciones médicas'
    );
  }
};

export const getPatientOptions = async (): Promise<Patient[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/patient-conditions/patient-options`);
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Respuesta inválida del servidor');
    }
    
    return response.data.data.map((patient: any) => ({
      id: patient.id.toString(),
      name: patient.nombre_completo.trim()
    }));
    
  } catch (error) {
    console.error('Error en getPatientOptions:', {
      error: error.response?.data || error.message
    });
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Error al obtener opciones de pacientes'
    );
  }
};