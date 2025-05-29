// src/services/conditionsService.ts
import axios from 'axios';
import { Condition } from '../types/conditions';

const API_BASE_URL = 'http://localhost:3001/api'; // Usa URL absoluta en desarrollo

export const getConditions = async (): Promise<Condition[]> => {
  try {
    const response = await fetch('/api/conditions');
    
    if (!response.ok) {
      throw new Error(`Error HTTP! estado: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', data); // Para depuración
    
    // Validación exhaustiva
    if (!Array.isArray(data)) {
      console.error('La respuesta no es un array:', data);
      throw new Error('Formato de respuesta inválido: se esperaba un array');
    }
    
    // Transformación segura de datos
    return data.map(item => ({
      id: String(item.id),
      nombre: item.nombre || 'Sin nombre',
      descripcion: item.descripcion
    }));
    
  } catch (error) {
    console.error('Error al obtener condiciones:', error);
    throw error;
  }
};

export const createCondition = async (conditionData: Omit<Condition, 'id'>): Promise<Condition> => {
  try {
    console.log('Enviando datos para crear:', conditionData);
    const response = await axios.post(`${API_BASE_URL}/conditions`, conditionData, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true // Importante para cookies de sesión
    });
    
    console.log('Respuesta de creación:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error en createCondition:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Error al crear la condición médica');
  }
};

export const updateCondition = async (id: string, conditionData: Partial<Condition>): Promise<Condition> => {
  try {
    console.log(`Actualizando condición ${id} con:`, conditionData);
    const response = await axios.put(`${API_BASE_URL}/conditions/${id}`, conditionData, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    
    console.log('Respuesta de actualización:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error en updateCondition:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Error al actualizar la condición médica');
  }
};

export const deleteCondition = async (id: string): Promise<void> => {
  try {
    console.log(`Eliminando condición con ID: ${id}`);
    const response = await axios.delete(`http://localhost:3001/api/conditions/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true // Importante para autenticación
    });
    
    console.log('Respuesta de eliminación:', response.status);
    return response.data;
  } catch (error) {
    console.error('Error en deleteCondition:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Error al eliminar la condición médica');
  }
};

export const getPatients = async () => {
  const response = await axios.get(`${API_BASE}/patients`);
  return response.data.map((patient: any) => ({
    id: patient.id,
    name: `${patient.nombre} ${patient.apellido}` // Asumiendo que tu tabla usuario tiene nombre y apellido
  }));
};

export const getDoctors = async () => {
  const response = await axios.get(`${API_BASE}/doctors`);
  return response.data.map((doctor: any) => ({
    id: doctor.id,
    name: `${doctor.nombre} ${doctor.apellido}` // Asumiendo que tu tabla usuario tiene nombre y apellido
  }));
};