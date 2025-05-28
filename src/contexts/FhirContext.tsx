import { createContext, useContext, useEffect, useState } from 'react';
import * as fhirService from '../services/fhir';

interface FhirContextData {
  patients: any[];
  doctors: any[];
  appointments: any[];
  conditions: any[];
  medications: any[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const FhirContext = createContext<FhirContextData>({} as FhirContextData);

export const FhirProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState({
    patients: [],
    doctors: [],
    appointments: [],
    conditions: [],
    medications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patients, doctors, appointments, conditions, medications] = await Promise.all([
        fhirService.searchPatients(),
        fhirService.searchDoctors(),
        fhirService.searchAppointments(),
        fhirService.searchConditions(),
        fhirService.searchMedications(),
      ]);
      
      setData({ patients, doctors, appointments, conditions, medications });
      setError(null);
    } catch (err) {
      setError('Error al cargar datos de FHIR');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <FhirContext.Provider value={{ ...data, loading, error, refresh: fetchData }}>
      {children}
    </FhirContext.Provider>
  );
};

export const useFhir = () => useContext(FhirContext);