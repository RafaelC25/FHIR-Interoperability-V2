import axios from 'axios';

// IMPORTANTE: Verifica que el puerto (3001) coincida con tu backend
const API_URL = 'http://localhost:3001/api/medications';

interface Medication {
  id: string;
  name: string;
  description: string;
}

// Configura Axios para mejor manejo de errores
const api = axios.create({
  baseURL: API_URL,
  timeout: 8000, // 8 segundos
  headers: {
    'Accept': 'application/json',
  }
});

export const getMedications = async (): Promise<Medication[]> => {
  try {
    // Verificación adicional de la URL
    console.log('[DEBUG] Making request to:', API_URL);
    
    const response = await api.get('');
    
    console.log('[DEBUG] Response data:', response.data);
    
    // Aseguramos el tipo de datos aunque la API responda correctamente
    return response.data.map((item: any) => ({
      id: String(item.id), // Convertimos a string por si acaso
      name: item.name,
      description: item.description
    }));
    
  } catch (err: any) {
    console.error('[ERROR] Full error details:', {
      message: err.message,
      code: err.code,
      config: err.config,
      response: err.response?.data
    });
    
    throw new Error(err.response?.data?.message || 'Error al obtener medicamentos');
  }
};

export const createMedication = async (medication: Omit<Medication, 'id'>): Promise<Medication> => {
  const response = await axios.post(API_URL, medication);
  return response.data;
};

export const updateMedication = async (medication: Medication): Promise<Medication> => {
  const response = await axios.put(`${API_URL}/${medication.id}`, medication);
  return response.data;
};

export const deleteMedication = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};