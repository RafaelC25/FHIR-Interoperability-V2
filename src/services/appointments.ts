import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Appointment {
  id: number;
  paciente_id: number;
  medico_id: number;
  fecha_cita: string;
  motivo: string;
  estado: string;
  paciente_nombre: string;
  medico_nombre: string;
  especialidad?: string;
}

export interface UserOption {
  id: number;
  name: string;
}

// Solo UNA declaración de getPatients
export const getPatients = async (): Promise<UserOption[]> => {
  const response = await axios.get(`${API_BASE_URL}/appointments/patients`);
  return response.data.map(patient => ({
    id: patient.id,
    name: patient.nombre // Asegúrate que 'nombre' coincide con tu API
  }));
};

// Solo UNA declaración de getDoctors
export const getDoctors = async (): Promise<UserOption[]> => {
  const response = await axios.get(`${API_BASE_URL}/appointments/doctors`);
  return response.data.map(doctor => ({
    id: doctor.id,
    name: doctor.nombre // Asegúrate que 'nombre' coincide con tu API
  }));
};

// Otras funciones de servicio (sin duplicados)
export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await axios.get(`${API_BASE_URL}/appointments`);
  return response.data;
};

export const createAppointment = async (
  data: Omit<Appointment, 'id' | 'paciente_nombre' | 'medico_nombre' | 'especialidad'>
): Promise<Appointment> => {
  const response = await axios.post(`${API_BASE_URL}/appointments`, data);
  return response.data;
};

export const updateAppointment = async (
  id: number,
  data: Partial<Appointment>
): Promise<Appointment> => {
  const response = await axios.put(`${API_BASE_URL}/appointments/${id}`, data);
  return response.data;
};

export const deleteAppointment = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/appointments/${id}`);
};