import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Inventory from './pages/Inventory';
import GeospatialMap from './pages/GeospatialMap';
import AuditTrail from './pages/AuditTrail';
import MapIntel from './pages/MapIntel';
import MockBilling from './pages/MockBilling';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />

          <Route path="/map" element={<GeospatialMap />} />
          <Route path="/map-intel" element={<MapIntel />} />
          <Route path="/billing" element={<MockBilling />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/audit" element={<AuditTrail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
