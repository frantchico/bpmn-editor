import './App.css';
// import { Dashboard } from './pages/Dashboard'; // If Dashboard was the main page
import { HierarchyManager } from './pages/HierarchyManager'; // Import the new manager
import Layout from './components/Layout'; // Assuming a Layout component exists
import { Toaster } from "@/components/ui/sonner"; // Import Toaster

function App() {
  return (
    <Layout> {/* Assuming Layout provides header, sidebar, main content area */}
      {/*
        If using React Router, this would be part of the routing setup.
        For now, we directly render HierarchyManager.
        Example:
        <Routes>
          <Route path="/" element={<HierarchyManager />} />
          <Route path="/editor/:processId" element={<EditorPage />} /> // Example editor route
        </Routes>
      */}
      <HierarchyManager />
      <Toaster richColors position="top-right" /> {/* Add Toaster here */}
    </Layout>
  );
}

export default App;
