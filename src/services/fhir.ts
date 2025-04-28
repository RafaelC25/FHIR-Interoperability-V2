import type { Patient, Doctor, Appointment, Condition, Medication } from '../types/fhir';

const BASE_URL = 'https://hapi.fhir.org/baseR4';

const headers = {
  'Content-Type': 'application/json',
};

export async function searchPatients(): Promise<Patient[]> {
  const response = await fetch(`${BASE_URL}/Patient`, { headers });
  const data = await response.json();
  
  return data.entry?.map((entry: any) => ({
    id: entry.resource.id,
    name: entry.resource.name?.[0]?.given?.join(' ') + ' ' + entry.resource.name?.[0]?.family || 'Unknown',
    birthDate: entry.resource.birthDate || '',
    gender: entry.resource.gender || '',
    address: entry.resource.address?.[0]?.text || ''
  })) || [];
}

export async function searchDoctors(): Promise<Doctor[]> {
  const response = await fetch(`${BASE_URL}/Practitioner`, { headers });
  const data = await response.json();
  
  return data.entry?.map((entry: any) => ({
    id: entry.resource.id,
    name: entry.resource.name?.[0]?.given?.join(' ') + ' ' + entry.resource.name?.[0]?.family || 'Unknown',
    speciality: entry.resource.qualification?.[0]?.code?.text || 'General',
    qualification: entry.resource.qualification?.[0]?.identifier?.[0]?.value || 'MD'
  })) || [];
}

export async function searchAppointments(): Promise<Appointment[]> {
  const response = await fetch(`${BASE_URL}/Appointment`, { headers });
  const data = await response.json();
  
  return data.entry?.map((entry: any) => ({
    id: entry.resource.id,
    patientId: entry.resource.participant?.find((p: any) => p.actor.reference.startsWith('Patient/'))?.actor.reference.split('/')[1] || '',
    doctorId: entry.resource.participant?.find((p: any) => p.actor.reference.startsWith('Practitioner/'))?.actor.reference.split('/')[1] || '',
    date: entry.resource.start || new Date().toISOString(),
    status: entry.resource.status || 'scheduled'
  })) || [];
}

export async function searchConditions(): Promise<Condition[]> {
  const response = await fetch(`${BASE_URL}/Condition`, { headers });
  const data = await response.json();
  
  return data.entry?.map((entry: any) => ({
    id: entry.resource.id,
    patientId: entry.resource.subject?.reference.split('/')[1] || '',
    code: entry.resource.code?.coding?.[0]?.code || '',
    description: entry.resource.code?.text || entry.resource.code?.coding?.[0]?.display || '',
    severity: entry.resource.severity?.coding?.[0]?.code || 'moderate'
  })) || [];
}

export async function searchMedications(): Promise<Medication[]> {
  const response = await fetch(`${BASE_URL}/Medication`, { headers });
  const data = await response.json();
  
  return data.entry?.map((entry: any) => ({
    id: entry.resource.id,
    name: entry.resource.code?.coding?.[0]?.display || 'Unknown Medication',
    code: entry.resource.code?.coding?.[0]?.code || '',
    form: entry.resource.form?.coding?.[0]?.display || 'tablet'
  })) || [];
}

// Create resources
export async function createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
  const fhirPatient = {
    resourceType: 'Patient',
    name: [{
      given: [patient.name.split(' ')[0]],
      family: patient.name.split(' ').slice(1).join(' ')
    }],
    birthDate: patient.birthDate,
    gender: patient.gender,
    address: [{
      text: patient.address
    }]
  };

  const response = await fetch(`${BASE_URL}/Patient`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fhirPatient)
  });

  const data = await response.json();
  return {
    id: data.id,
    ...patient
  };
}

export async function createDoctor(doctor: Omit<Doctor, 'id'>): Promise<Doctor> {
  const fhirPractitioner = {
    resourceType: 'Practitioner',
    name: [{
      given: [doctor.name.split(' ')[0]],
      family: doctor.name.split(' ').slice(1).join(' ')
    }],
    qualification: [{
      code: {
        text: doctor.speciality
      },
      identifier: [{
        value: doctor.qualification
      }]
    }]
  };

  const response = await fetch(`${BASE_URL}/Practitioner`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fhirPractitioner)
  });

  const data = await response.json();
  return {
    id: data.id,
    ...doctor
  };
}

// Update resources
export async function updatePatient(id: string, patient: Omit<Patient, 'id'>): Promise<Patient> {
  const fhirPatient = {
    resourceType: 'Patient',
    id,
    name: [{
      given: [patient.name.split(' ')[0]],
      family: patient.name.split(' ').slice(1).join(' ')
    }],
    birthDate: patient.birthDate,
    gender: patient.gender,
    address: [{
      text: patient.address
    }]
  };

  const response = await fetch(`${BASE_URL}/Patient/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(fhirPatient)
  });

  const data = await response.json();
  return {
    id: data.id,
    ...patient
  };
}

export async function updateDoctor(id: string, doctor: Omit<Doctor, 'id'>): Promise<Doctor> {
  const fhirPractitioner = {
    resourceType: 'Practitioner',
    id,
    name: [{
      given: [doctor.name.split(' ')[0]],
      family: doctor.name.split(' ').slice(1).join(' ')
    }],
    qualification: [{
      code: {
        text: doctor.speciality
      },
      identifier: [{
        value: doctor.qualification
      }]
    }]
  };

  const response = await fetch(`${BASE_URL}/Practitioner/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(fhirPractitioner)
  });

  const data = await response.json();
  return {
    id: data.id,
    ...doctor
  };
}

// Delete resources
export async function deletePatient(id: string): Promise<void> {
  await fetch(`${BASE_URL}/Patient/${id}`, {
    method: 'DELETE',
    headers
  });
}

export async function deleteDoctor(id: string): Promise<void> {
  await fetch(`${BASE_URL}/Practitioner/${id}`, {
    method: 'DELETE',
    headers
  });
}