export interface Doctor {
  id: string;
  nombre: string;
  especialidad?: string;
}

export interface MedicalCondition {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Medication {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Appointment {
  id: string;
  fecha_cita: string;
  motivo?: string;
  estado?: string;
  medico?: Doctor;
}

export interface PatientCondition {
  id: string;
  condicion_medica: MedicalCondition;
  fecha_diagnostico?: string;
  medico?: Doctor;
}

export interface PatientMedication {
  id: string;
  medicamento: Medication;
  fecha_prescripcion?: string;
  dosis?: string;
  frecuencia?: string;
  observaciones?: string;
  medico?: Doctor;
}

export interface PatientMedicalHistory {
  paciente_id: string;
  paciente_nombre: string;
  fecha_nacimiento?: string;
  genero?: string;
  telefono?: string;
  direccion?: string;
  citas: Appointment[];
  condiciones: PatientCondition[];
  medicamentos: PatientMedication[];
}

export const getPatientMedicalHistory = async (): Promise<PatientMedicalHistory[]> => {
  try {
    const response = await fetch('/api/medical-history');
    if (!response.ok) {
      throw new Error('Error al obtener historias clínicas');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching medical history:', error);
    throw error;
  }
};