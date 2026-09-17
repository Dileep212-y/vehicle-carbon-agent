import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import VehicleTrip from './pages/VehicleTrip';
import Driving from './pages/Driving';
import DrivingAnalysis from './pages/DrivingAnalysis';
import RoutePage from './pages/RoutePage';
import Carbon from './pages/Carbon';
import Assistant from './pages/Assistant';
import History from './pages/History';
import Settings from './pages/Settings';
import { EcoDriveProvider } from './context/EcoDriveContext';
import './styles/global.css';
import './App.css';

export default function App() {
  return (
    <EcoDriveProvider>
      <BrowserRouter>
        <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicle-trip" element={<VehicleTrip />} />
            <Route path="/driving" element={<Driving />} />
            <Route path="/driving-analysis" element={<DrivingAnalysis />} />
            <Route path="/route" element={<RoutePage />} />
            <Route path="/carbon" element={<Carbon />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        </div>
      </BrowserRouter>
    </EcoDriveProvider>
  );
}
