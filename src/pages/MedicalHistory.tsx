import React, { useState, useEffect } from 'react';
import { User, Calendar, FileText, Pill, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Patient {
  paciente_id: number;
  paciente_nombre: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string;
  direccion: string;
  citas: Appointment[];
  condiciones: MedicalCondition[];
  medicamentos: Medication[];
}

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

export default function MedicalHistoryPage() {
  const [medicalHistory, setMedicalHistory] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/medical-history', {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText.includes('<html') ? 
          'Error del servidor: Respuesta no es JSON' : 
          errorText
        );
      }

      const data = await response.json();
      setMedicalHistory(data);
      if (data.length > 0) setSelectedPatient(data[0]);
      
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      toast.error('Error al cargar datos. Verifica la consola para más detalles.');
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

 const exportToPDF = async (section: 'appointments' | 'conditions' | 'medications') => {
  if (!selectedPatient) {
    toast.warning('Seleccione un paciente primero');
    return;
  }

  try {
    // Importación dinámica para evitar problemas de SSR
    const { jsPDF } = await import('jspdf');
    // @ts-ignore - Necesario hasta que se actualicen los tipos
    await import('jspdf-autotable');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configuración del documento
    doc.setProperties({
      title: `Historia Clínica - ${selectedPatient.paciente_nombre}`,
      subject: section.toUpperCase(),
      author: 'Sistema Médico'
    });

    // Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(40, 53, 147);
    doc.text(`Historia Clínica`, 15, 20);
    
    doc.setFontSize(14);
    doc.text(`Paciente: ${selectedPatient.paciente_nombre}`, 15, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 15, 38);

    // Preparar datos según la sección
    let sectionTitle = '';
    let headers: string[] = [];
    let bodyData: any[][] = [];
    let startY = 45;

    switch (section) {
      case 'appointments':
        sectionTitle = 'CITAS MÉDICAS';
        headers = ['Fecha', 'Médico', 'Motivo', 'Estado'];
        bodyData = selectedPatient.citas.map(cita => [
          formatDate(cita.fecha),
          cita.medico?.nombre || 'N/A',
          cita.motivo,
          cita.estado
        ]);
        break;

      case 'conditions':
        sectionTitle = 'CONDICIONES MÉDICAS';
        headers = ['Condición', 'Descripción', 'Fecha Diagnóstico', 'Médico'];
        bodyData = selectedPatient.condiciones.map(cond => [
          cond.nombre,
          cond.descripcion || 'N/A',
          formatDate(cond.fecha_diagnostico),
          cond.medico?.nombre || 'N/A'
        ]);
        break;

      case 'medications':
        sectionTitle = 'MEDICAMENTOS';
        headers = ['Medicamento', 'Dosis', 'Frecuencia', 'Prescrito por'];
        bodyData = selectedPatient.medicamentos.map(med => [
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

    // Generar tabla
    // @ts-ignore - autoTable no está en los tipos oficiales
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

    // Guardar el PDF
    doc.save(`historia_clinica_${selectedPatient.paciente_id}_${section}.pdf`);
    toast.success(`PDF exportado: ${sectionTitle}`);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    toast.error('Error al exportar a PDF. Ver consola para detalles.');
  }
};

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p>Cargando historias clínicas...</p>
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Historia Clínica de Pacientes</h1>

      {/* Patient selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Paciente</label>
        <select
          onChange={(e) => {
            const patientId = parseInt(e.target.value);
            const patient = medicalHistory.find(p => p.paciente_id === patientId) || null;
            setSelectedPatient(patient);
          }}
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={selectedPatient?.paciente_id || ''}
        >
          <option value="">Seleccione un paciente</option>
          {medicalHistory.map(patient => (
            <option key={patient.paciente_id} value={patient.paciente_id}>
              {patient.paciente_nombre} (ID: {patient.paciente_id})
            </option>
          ))}
        </select>
      </div>

      {selectedPatient ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Patient header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold">
                {selectedPatient.paciente_nombre} (ID: {selectedPatient.paciente_id})
              </h2>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-500">
              <p><span className="font-medium">Fecha de nacimiento:</span> {formatDate(selectedPatient.fecha_nacimiento)}</p>
              <p><span className="font-medium">Género:</span> {selectedPatient.genero || 'No especificado'}</p>
              <p><span className="font-medium">Teléfono:</span> {selectedPatient.telefono || 'No especificado'}</p>
              <p><span className="font-medium">Dirección:</span> {selectedPatient.direccion || 'No especificado'}</p>
            </div>
          </div>

          {/* Appointments section */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                <h2 className="text-lg font-semibold">Citas Médicas</h2>
              </div>
              <button
                onClick={() => exportToPDF('appointments')}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                disabled={selectedPatient.citas.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar a PDF
              </button>
            </div>

            {selectedPatient.citas.length > 0 ? (
              <div className="space-y-3">
                {selectedPatient.citas.map(appointment => (
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
              <p className="text-sm text-gray-500">No hay citas registradas para este paciente.</p>
            )}
          </div>

          {/* Medical conditions section */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-green-500 mr-2" />
                <h2 className="text-lg font-semibold">Condiciones Médicas</h2>
              </div>
              <button
                onClick={() => exportToPDF('conditions')}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                disabled={selectedPatient.condiciones.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar a PDF
              </button>
            </div>

            {selectedPatient.condiciones.length > 0 ? (
              <div className="space-y-3">
                {selectedPatient.condiciones.map(condition => (
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
              <p className="text-sm text-gray-500">No hay condiciones médicas registradas para este paciente.</p>
            )}
          </div>

          {/* Medications section */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <Pill className="h-5 w-5 text-purple-500 mr-2" />
                <h2 className="text-lg font-semibold">Medicamentos</h2>
              </div>
              <button
                onClick={() => exportToPDF('medications')}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                disabled={selectedPatient.medicamentos.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar a PDF
              </button>
            </div>

            {selectedPatient.medicamentos.length > 0 ? (
              <div className="space-y-3">
                {selectedPatient.medicamentos.map(medication => (
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
              <p className="text-sm text-gray-500">No hay medicamentos registrados para este paciente.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Seleccione un paciente para ver su historia clínica</h3>
        </div>
      )}
    </div>
  );
}