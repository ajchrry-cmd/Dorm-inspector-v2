import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './hooks/useAppState';
import { SettingsProvider } from './hooks/useSettings';
import { VisualSettingsProvider } from './hooks/useVisualSettings';
import { ToastProvider } from './hooks/useToast';
import InspectorSelect from './pages/InspectorSelect';
import Dashboard from './pages/Dashboard';
import InspectionForm from './pages/InspectionForm';
import InspectionHistory from './pages/InspectionHistory';
import EditInspection from './pages/EditInspection';
import RoomQueue from './pages/RoomQueue';
import Export from './pages/Export';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import VisualCustomization from './pages/VisualCustomization';
import InspectorComparison from './pages/InspectorComparison';
import OfflineIndicator from './components/OfflineIndicator';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <VisualSettingsProvider>
      <SettingsProvider>
        <ToastProvider>
          <AppProvider>
            <HashRouter>
              <div className="min-h-full bg-gray-100">
                <OfflineIndicator />
                <Routes>
                  <Route path="/" element={<Layout hideNav><InspectorSelect /></Layout>} />
                  <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                  <Route path="/inspect/:roomNumber" element={<Layout hideNav><InspectionForm /></Layout>} />
                  <Route path="/history" element={<Layout><InspectionHistory /></Layout>} />
                  <Route path="/history/:id" element={<Layout hideNav><EditInspection /></Layout>} />
                  <Route path="/queue" element={<Layout><RoomQueue /></Layout>} />
                  <Route path="/export" element={<Layout><Export /></Layout>} />
                  <Route path="/admin" element={<Layout hideNav><Admin /></Layout>} />
                  <Route path="/admin/compare" element={<Layout hideNav><InspectorComparison /></Layout>} />
                  <Route path="/settings" element={<Layout hideNav><Settings /></Layout>} />
                  <Route path="/settings/visual" element={<Layout hideNav><VisualCustomization /></Layout>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </HashRouter>
          </AppProvider>
        </ToastProvider>
      </SettingsProvider>
    </VisualSettingsProvider>
  );
}

export default App;
