import { Header } from './components/header';
import { MapCanvas } from './components/canvas';
import { PropertiesPanel, Sidebar } from './components/sidebar';
import { ToastContainer } from './components/ui/Toast';
import { ImportPCDModal, ImportOSMModal, SettingsModal } from './components/modals';

export default function App() {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 relative overflow-hidden">
        <MapCanvas />
        <Sidebar />
        <PropertiesPanel />
      </main>

      <ImportPCDModal />
      <ImportOSMModal />
      <SettingsModal />
      <ToastContainer />
    </div>
  );
}