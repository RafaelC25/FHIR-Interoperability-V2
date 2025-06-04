import api from './api';

export interface PatientWithMedications {
  paciente_id: string;
  paciente_nombre: string;
  medicamentos: MedicationAssignment[];
}

export interface MedicationAssignment {
  id: string;
  nombre: string;
  descripcion?: string;
  fecha_prescripcion?: string;
  dosis?: string;
  frecuencia?: string;
  observaciones?: string;
  medico_asignador?: {
    id: string;
    nombre: string;
  };
}

export interface DoctorOption {
  id: string;
  nombre: string;
}

export interface MedicationOption {
  id: string;
  nombre: string;
  descripcion?: string;
}

export const getPatientsWithMedications = async (): Promise<PatientWithMedications[]> => {
  const response = await api.get('/patient-medications');
  return response.data;
};

export const createPatientMedication = async (data: {
  paciente_id: string;
  medicamento_id: string;
  medico_id: string;
  fecha_prescripcion?: string;
  dosis?: string;
  frecuencia?: string;
  observaciones?: string;
}) => {
  const response = await api.post('/patient-medications', data);
  return response.data;
};

export const updatePatientMedication = async (
  pacienteId: string,
  medicamentoId: string,
  data: {
    medico_id: string;
    fecha_prescripcion?: string;
    dosis?: string;
    frecuencia?: string;
    observaciones?: string;
  }
) => {
  const response = await api.put(`/patient-medications/${pacienteId}/${medicamentoId}`, data);
  return response.data;
};

export const deletePatientMedication = async (pacienteId: string, medicamentoId: string) => {
  const response = await api.delete(`/patient-medications/${pacienteId}/${medicamentoId}`);
  return response.data;
};

export const getDoctorOptions = async (): Promise<DoctorOption[]> => {
  const response = await api.get('/patient-medications/medicos/options');
  return response.data;
};

export const getMedicationOptions = async (): Promise<MedicationOption[]> => {
  const response = await api.get('/patient-medications/medicamentos/options');
  return response.data;
};

export interface PatientOption {
  id: string;
  nombre: string;
}

export const getPatientOptions = async (): Promise<PatientOption[]> => {
  const response = await api.get('/patient-medications/pacientes/options');
  return response.data;
};