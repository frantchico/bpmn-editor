import './App.css';
import Layout from './components/Layout';
import toast, { Toaster } from 'react-hot-toast'; // Import toast and Toaster
import { NavigationProvider, useNavigation, NavigationView } from './context/NavigationContext'; // Adjusted import for NavigationView

// Import dashboard components
import GeneralDashboard from './pages/GeneralDashboard';
import ProjectDashboard from './components/ProjectDashboard';
import AreaDashboard from './components/AreaDashboard';
import SubAreaDashboard from './components/SubAreaDashboard';
import { HierarchyManager } from './pages/HierarchyManager'; // Changed to named import
import EditorPage from './pages/Editor'; // Added import

// This component will decide which view to render based on navigation context
const MainContentRouter: React.FC = () => {
  const { currentView } = useNavigation();

  console.log('MainContentRouter rendering view:', currentView); // Log current view

  switch (currentView.view) {
    case 'project':
      // Ensure itemId is not undefined before rendering. Fallback or error if it is.
      if (!currentView.itemId) {
        console.error("ProjectDashboard requires an itemId, but it was not provided.", currentView);
        return <GeneralDashboard />; // Or some error component
      }
      return <ProjectDashboard projectId={currentView.itemId} />;
    case 'area':
      if (!currentView.itemId) {
        console.error("AreaDashboard requires an itemId, but it was not provided.", currentView);
        return <GeneralDashboard />;
      }
      return <AreaDashboard areaId={currentView.itemId} />;
    case 'subarea':
      if (!currentView.itemId) {
        console.error("SubAreaDashboard requires an itemId, but it was not provided.", currentView);
        return <GeneralDashboard />;
      }
      return <SubAreaDashboard subAreaId={currentView.itemId} />;
    case 'hierarchy':
      return <HierarchyManager />;
    case 'editor':
      if (!currentView.itemId) {
        console.error("EditorPage requires an itemId (processId), but it was not provided.", currentView);
        toast.error("Cannot open editor: Process ID is missing.");
        return <GeneralDashboard />; // Or navigate to 'hierarchy'
      }
      // Assuming EditorPage takes processId as modelId or similar prop
      return <EditorPage modelId={currentView.itemId} />;
    case 'general':
    default:
      return <GeneralDashboard />;
  }
};

function App() {
  return (
    <NavigationProvider> {/* Provider wraps Layout or part of it that needs context */}
      <Layout> {/* Layout now contains SidebarTreeMenu which will also use this context */}
        <MainContentRouter />
        {/* Default position is top-center, can be configured: <Toaster position="top-right" /> */}
        <Toaster />
      </Layout>
    </NavigationProvider>
  );
}

export default App;
