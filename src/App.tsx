import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';

// Lazy load pages
const Roles = React.lazy(() => import('./pages/Roles'));
const Users = React.lazy(() => import('./pages/Users'));
const Patients = React.lazy(() => import('./pages/Patients'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const Doctors = React.lazy(() => import('./pages/Doctors'));
const Conditions = React.lazy(() => import('./pages/Conditions'));
const Medications = React.lazy(() => import('./pages/Medications'));

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Layout>
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/roles"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Roles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute allowedRoles={['admin', 'physician', 'patient']}>
                <Patients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute allowedRoles={['admin', 'physician', 'patient']}>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors"
            element={
              <ProtectedRoute allowedRoles={['admin', 'physician']}>
                <Doctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conditions"
            element={
              <ProtectedRoute allowedRoles={['admin', 'physician', 'patient']}>
                <Conditions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medications"
            element={
              <ProtectedRoute allowedRoles={['admin', 'physician', 'patient']}>
                <Medications />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/patients" replace />} />
        </Routes>
      </React.Suspense>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;