export interface User {
  id: string;
  username: string;
  role: string;
  active: boolean;
}

export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  address?: string;
}

export interface Doctor {
  id: string;
  name: string;
  speciality: string;
  qualification: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Condition {
  id: string;
  nombre: string;
  descripcion?: string; // Opcional
}

export interface Medication {
  id: string;
  name: string;
  code: string;
  form: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  medicationId: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
}