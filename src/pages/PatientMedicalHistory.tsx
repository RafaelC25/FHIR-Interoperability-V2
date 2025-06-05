import React, { useState, useEffect } from 'react';
import { User, Calendar, FileText, Pill, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../contexts/AuthContext';

interface Appointment {
  id: number;
  fecha: string;
  motivo: string;
  estado: string;
  medico: {
    nombre: string;
    especialidad: string;
  } | null;
}

interface MedicalCondition {
  id: number;
  nombre: string;
  descripcion: string;
  fecha_diagnostico: string;
  observaciones: string;
  medico: {
    nombre: string;
    especialidad: string;
  } | null;
}

interface Medication {
  id: number;
  medicamento: {
    id: number;
    nombre: string;
    descripcion: string;
  };
  fecha_prescripcion: string;
  dosis: string;
  frecuencia: string;
  observaciones: string;
  medico: {
    nombre: string;
    especialidad: string;
  } | null;
}

interface PatientMedicalHistory {
  paciente_nombre: string;
  numero_identificacion?: string;
  fecha_nacimiento?: string;
  genero?: string;
  telefono?: string;
  direccion?: string;
  citas: Appointment[];
  condiciones: MedicalCondition[];
  medicamentos: Medication[];
}

export default function PatientMedicalHistoryPage() {
  const { auth } = useAuth();
  const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pacienteId, setPacienteId] = useState<number | null>(null);

  // Obtener el ID de paciente asociado al usuario
  // Nuevo efecto para obtener el ID de paciente
useEffect(() => {
  const fetchPacienteId = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verificación básica
      if (!auth.user?.id || !auth.token) {
        throw new Error('Usuario no autenticado correctamente');
      }

      console.log('Iniciando búsqueda de paciente para usuario:', auth.user.id); // Log

      const response = await fetch(`http://localhost:3001/api/paciente/by-user/${auth.user.id}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del servidor:', response.status); // Log

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la respuesta del servidor');
      }

      const data = await response.json();
      console.log('Datos recibidos:', data); // Log

      if (!data.success || !data.id) {
        throw new Error('El servidor no devolvió un ID de paciente válido');
      }

      setPacienteId(data.id);
    } catch (error) {
      console.error('Error completo:', error);
      setError(error.message);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  fetchPacienteId();
}, [auth.user?.id, auth.token]);

  // Obtener la historia clínica
  useEffect(() => {
  const fetchData = async () => {
    if (!pacienteId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/medical-history/patient/${pacienteId}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar historia clínica');
      }

      const responseData = await response.json();
      
      // Obtener datos del paciente por separado
      const pacienteResponse = await fetch(`http://localhost:3001/api/paciente/by-user/${auth.user?.id}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (!pacienteResponse.ok) {
        throw new Error('Error al obtener datos del paciente');
      }
      
      const pacienteData = await pacienteResponse.json();

      // Combinar los datos
      setMedicalHistory({
        paciente_nombre: pacienteData.data.nombre,
        numero_identificacion: pacienteData.data.identificacion,
        fecha_nacimiento: pacienteData.data.fecha_nacimiento,
        genero: pacienteData.data.genero,
        telefono: pacienteData.data.telefono,
        direccion: pacienteData.data.direccion,
        citas: responseData.data?.citas || responseData.citas || [],
        condiciones: responseData.data?.condiciones || responseData.condiciones || [],
        medicamentos: responseData.data?.medicamentos || responseData.medicamentos || []
      });

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [auth.token, pacienteId, auth.user?.id]);

  const formatDate = (dateString?: string) => {
  if (!dateString) return 'No especificada';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString; // Devuelve el valor original si no se puede parsear
  }
};

  const formatGenero = (genero?: string) => {
    if (!genero) return 'No especificado';
    switch(genero.toLowerCase()) {
      case 'male': return 'Masculino';
      case 'female': return 'Femenino';
      case 'other': return 'Otro';
      default: return genero;
    }
  };

  const exportToPDF = async (section: 'appointments' | 'conditions' | 'medications') => {
    if (!medicalHistory) {
      toast.warning('No hay datos para exportar');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      doc.setProperties({
        title: `Historia Clínica - ${medicalHistory.paciente_nombre}`,
        subject: section.toUpperCase(),
        author: 'Sistema Médico'
      });

      // Encabezado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(40, 53, 147);
      doc.text(`Historia Clínica`, 15, 20);
      
      doc.setFontSize(14);
      doc.text(`Paciente: ${medicalHistory.paciente_nombre}`, 15, 30);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado: ${new Date().toLocaleDateString()}`, 15, 38);

      // Datos según sección
      let sectionTitle = '';
      let headers: string[] = [];
      let bodyData: any[][] = [];
      let startY = 45;

      switch (section) {
        case 'appointments':
          sectionTitle = 'CITAS MÉDICAS';
          headers = ['Fecha', 'Médico', 'Motivo', 'Estado'];
          bodyData = medicalHistory.citas.map(cita => [
            formatDate(cita.fecha),
            cita.medico?.nombre || 'N/A',
            cita.motivo,
            cita.estado
          ]);
          break;

        case 'conditions':
          sectionTitle = 'CONDICIONES MÉDICAS';
          headers = ['Condición', 'Descripción', 'Fecha Diagnóstico', 'Médico'];
          bodyData = medicalHistory.condiciones.map(cond => [
            cond.nombre,
            cond.descripcion || 'N/A',
            formatDate(cond.fecha_diagnostico),
            cond.medico?.nombre || 'N/A'
          ]);
          break;

        case 'medications':
          sectionTitle = 'MEDICAMENTOS';
          headers = ['Medicamento', 'Dosis', 'Frecuencia', 'Prescrito por'];
          bodyData = medicalHistory.medicamentos.map(med => [
            med.medicamento.nombre,
            med.dosis,
            med.frecuencia,
            med.medico?.nombre || 'N/A'
          ]);
          break;
      }

      // Agregar sección al PDF
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(sectionTitle, 15, startY);
      startY += 10;

      // @ts-ignore
      doc.autoTable({
        head: [headers],
        body: bodyData,
        startY: startY,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' }
        }
      });

      doc.save(`historia_clinica_${section}.pdf`);
      toast.success(`PDF exportado: ${sectionTitle}`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al exportar a PDF');
    }
  };

  if (isLoading || !pacienteId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p>{!pacienteId ? 'Buscando tu perfil de paciente...' : 'Cargando tu historia clínica...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mx-4 my-8">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!medicalHistory) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontró tu historia clínica</h3>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Historia Clínica</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {/* Sección de información del paciente */}
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
  <div className="flex items-center">
    <User className="h-5 w-5 text-gray-500 mr-2" />
    <h2 className="text-lg font-semibold">
      {medicalHistory.paciente_nombre}
    </h2>
  </div>
  <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-500">
    {medicalHistory.fecha_nacimiento && (
      <p>
        <span className="font-medium">Fecha de nacimiento:</span> 
        {formatDate(medicalHistory.fecha_nacimiento)}
      </p>
    )}
    {medicalHistory.genero && (
      <p>
        <span className="font-medium">Género:</span> 
        {formatGenero(medicalHistory.genero)}
      </p>
    )}
    {medicalHistory.telefono && (
      <p>
        <span className="font-medium">Teléfono:</span> 
        {medicalHistory.telefono}
      </p>
    )}
    {medicalHistory.direccion && (
      <p>
        <span className="font-medium">Dirección:</span> 
        {medicalHistory.direccion}
      </p>
    )}
    {medicalHistory.numero_identificacion && (
      <p>
        <span className="font-medium">Identificación:</span> 
        {medicalHistory.numero_identificacion}
      </p>
    )}
  </div>
</div>

        {/* Sección de citas médicas */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold">Mis Citas Médicas</h2>
            </div>
            <button
              onClick={() => exportToPDF('appointments')}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              disabled={medicalHistory.citas.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </button>
          </div>

          {medicalHistory.citas.length > 0 ? (
            <div className="space-y-3">
              {medicalHistory.citas.map(appointment => (
                <div key={appointment.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">Fecha: {formatDate(appointment.fecha)}</p>
                      <p className="text-sm">Motivo: {appointment.motivo}</p>
                      <p className="text-sm">Estado: <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.estado === 'Completada' ? 'bg-green-100 text-green-800' :
                        appointment.estado === 'Cancelada' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.estado}
                      </span></p>
                    </div>
                    {appointment.medico && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Médico:</span> {appointment.medico.nombre} ({appointment.medico.especialidad})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tienes citas registradas.</p>
          )}
        </div>

        {/* Sección de condiciones médicas */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-green-500 mr-2" />
              <h2 className="text-lg font-semibold">Mis Condiciones Médicas</h2>
            </div>
            <button
              onClick={() => exportToPDF('conditions')}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              disabled={medicalHistory.condiciones.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </button>
          </div>

          {medicalHistory.condiciones.length > 0 ? (
            <div className="space-y-3">
              {medicalHistory.condiciones.map(condition => (
                <div key={condition.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{condition.nombre}</p>
                      {condition.descripcion && (
                        <p className="text-sm">{condition.descripcion}</p>
                      )}
                      <div className="text-sm space-y-1 mt-1">
                        <p>Fecha diagnóstico: {formatDate(condition.fecha_diagnostico)}</p>
                        {condition.observaciones && <p>Observaciones: {condition.observaciones}</p>}
                      </div>
                    </div>
                    {condition.medico && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Médico:</span> {condition.medico.nombre} ({condition.medico.especialidad})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tienes condiciones médicas registradas.</p>
          )}
        </div>

        {/* Sección de medicamentos */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <Pill className="h-5 w-5 text-purple-500 mr-2" />
              <h2 className="text-lg font-semibold">Mis Medicamentos</h2>
            </div>
            <button
              onClick={() => exportToPDF('medications')}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              disabled={medicalHistory.medicamentos.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </button>
          </div>

          {medicalHistory.medicamentos.length > 0 ? (
            <div className="space-y-3">
              {medicalHistory.medicamentos.map(medication => (
                <div key={medication.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{medication.medicamento.nombre}</p>
                      {medication.medicamento.descripcion && (
                        <p className="text-sm">{medication.medicamento.descripcion}</p>
                      )}
                      <div className="text-sm space-y-1 mt-1">
                        {medication.fecha_prescripcion && <p>Fecha prescripción: {formatDate(medication.fecha_prescripcion)}</p>}
                        {medication.dosis && <p>Dosis: {medication.dosis}</p>}
                        {medication.frecuencia && <p>Frecuencia: {medication.frecuencia}</p>}
                        {medication.observaciones && <p>Observaciones: {medication.observaciones}</p>}
                      </div>
                    </div>
                    {medication.medico && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Médico:</span> {medication.medico.nombre} ({medication.medico.especialidad})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tienes medicamentos registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}