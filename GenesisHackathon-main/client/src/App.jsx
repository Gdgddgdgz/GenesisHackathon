import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Inventory from './pages/Inventory';
import GeospatialMap from './pages/GeospatialMap';
import AuditTrail from './pages/AuditTrail';
import Outlets from './pages/Outlets';
import MapIntel from './pages/MapIntel';
import MockBilling from './pages/MockBilling';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0B1121] text-slate-500">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold tracking-widest uppercase text-xs">Authenticating Nexus...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/map" element={<GeospatialMap />} />
                      <Route path="/billing" element={<MockBilling />} />
                      <Route path="/vendors" element={<Vendors />} />
                      <Route path="/audit" element={<AuditTrail />} />
                      <Route path="/outlets" element={<Outlets />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
