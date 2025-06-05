import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import { FhirProvider } from './contexts/FhirContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Importaciones de páginas
const MedicalHistory = React.lazy(() => import('./pages/MedicalHistory'));
const Roles = React.lazy(() => import('./pages/Roles'));
const Users = React.lazy(() => import('./pages/Users'));
const Patients = React.lazy(() => import('./pages/Patients'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const Doctors = React.lazy(() => import('./pages/Doctors'));
const Conditions = React.lazy(() => import('./pages/Conditions'));
const Medications = React.lazy(() => import('./pages/Medications'));
const PatientConditions = React.lazy(() => import('./pages/PatientConditionsPage'));
const PatientMedications = React.lazy(() => import('./pages/PatientMedications'));
const PatientMedicalHistory = React.lazy(() => import('./pages/PatientMedicalHistory'));

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  return auth.token ? <Navigate to="/" replace /> : children;
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { auth } = useAuth();

  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }

  if (!auth.user?.role || !allowedRoles.includes(auth.user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}

function RootRedirect() {
  const { auth, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Cargando...</div>;

  if (!auth.token) return <Navigate to="/login" replace />;

  // Solo redirige si está en la raíz ('/')
  if (location.pathname === '/') {
    const targetRoute = {
      admin: '/users',
      physician: '/patients', // <-- Cambio clave aquí
      patient: '/patient-medical-history'
    }[auth.user?.role || 'admin'];
    
    return <Navigate to={targetRoute} replace />;
  }

  return null;
}

function AppRoutes() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        
        {/* Rutas protegidas */}
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['admin', 'physician']}>
            <Users />
          </ProtectedRoute>
        } />
        
        <Route path="/roles" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Roles />
          </ProtectedRoute>
        } />
        
        <Route path="/patients" element={
          <ProtectedRoute allowedRoles={['admin', 'physician',]}>
            <Patients />
          </ProtectedRoute>
        } />
        
        <Route path="/appointments" element={
          <ProtectedRoute allowedRoles={['admin', 'physician', 'patient']}>
            <Appointments />
          </ProtectedRoute>
        } />
        
        <Route path="/doctors" element={
          <ProtectedRoute allowedRoles={['admin', 'physician']}>
            <Doctors />
          </ProtectedRoute>
        } />
        
        <Route path="/conditions" element={
          <ProtectedRoute allowedRoles={['admin', 'physician', 'patient']}>
            <Conditions />
          </ProtectedRoute>
        } />
        
        <Route path="/medications" element={
          <ProtectedRoute allowedRoles={['admin', 'physician', 'patient']}>
            <Medications />
          </ProtectedRoute>
        } />
        
        <Route path="/patient-conditions" element={
          <ProtectedRoute allowedRoles={['admin', 'physician']}>
            <PatientConditions />
          </ProtectedRoute>
        } />
        
        <Route path="/patient-medications" element={
          <ProtectedRoute allowedRoles={['admin', 'physician']}>
            <PatientMedications />
          </ProtectedRoute>
        } />
        
        <Route path="/medical-history" element={
          <ProtectedRoute allowedRoles={['admin', 'physician']}>
            <MedicalHistory />
          </ProtectedRoute>
        } />
        
        {/* Fixed route */}
        <Route path="/patient-medical-history" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientMedicalHistory />
          </ProtectedRoute>
        } />
      </Routes>
    </React.Suspense>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <FhirProvider>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </FhirProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;