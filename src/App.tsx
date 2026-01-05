import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './hooks/useAppState';
import InspectorSelect from './pages/InspectorSelect';
import Dashboard from './pages/Dashboard';
import InspectionForm from './pages/InspectionForm';
import InspectionHistory from './pages/InspectionHistory';
import EditInspection from './pages/EditInspection';
import RoomQueue from './pages/RoomQueue';
import Export from './pages/Export';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-full bg-gray-100">
          <Routes>
            <Route path="/" element={<InspectorSelect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inspect/:roomNumber" element={<InspectionForm />} />
            <Route path="/history" element={<InspectionHistory />} />
            <Route path="/history/:id" element={<EditInspection />} />
            <Route path="/queue" element={<RoomQueue />} />
            <Route path="/export" element={<Export />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
