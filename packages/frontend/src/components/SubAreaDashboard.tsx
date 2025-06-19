import React, { useEffect, useState, useCallback } from 'react';
import { subAreaService } from '@/services/subAreaService';
import { areaService } from '@/services/areaService';
import { projectService } from '@/services/projectService';
import { processService } from '@/services/processService'; // To list processes
import type { SubArea, Area, Project, Process } from '@/types';
import { useNavigation } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast'; // Changed to react-hot-toast
import { Edit3, Trash2, PlusCircle, FileText, AlertTriangle, ArrowLeft, Workflow } from 'lucide-react';
import SubAreaForm from '@/components/SubAreaForm'; // Added import
import ProcessForm from '@/components/ProcessForm'; // Added import
import { ProcessList } from '@/components/ProcessList'; // Added import
import type { Process } from '@/types'; // Ensure Process type is available

interface SubAreaDashboardProps {
  subAreaId: string;
  // No onNavigateBackToArea or onNavigateToProcess needed from props
}

const SubAreaDashboard: React.FC<SubAreaDashboardProps> = ({ subAreaId }) => {
  const [subArea, setSubArea] = useState<SubArea | null>(null);
  const [parentArea, setParentArea] = useState<Area | null>(null);
  const [parentProject, setParentProject] = useState<Project | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [modelsCount, setModelsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { navigateTo } = useNavigation();

  // State for modal visibility
  const [isSubAreaFormOpen, setIsSubAreaFormOpen] = useState(false);
  const [editingSubArea, setEditingSubArea] = useState<SubArea | null>(null);
  const [isProcessFormOpen, setIsProcessFormOpen] = useState(false);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSubArea = subAreaService.getSubArea(subAreaId);
      if (!fetchedSubArea) {
        setError('Sub-Area not found.');
        setSubArea(null); setParentArea(null); setParentProject(null); setProcesses([]); setModelsCount(0);
        setIsLoading(false);
        return;
      }
      setSubArea(fetchedSubArea);

      const fetchedArea = areaService.getArea(fetchedSubArea.areaId);
      setParentArea(fetchedArea);

      if (fetchedArea) {
        const fetchedProject = projectService.getProject(fetchedArea.projectId);
        setParentProject(fetchedProject);
      } else {
        setParentProject(null);
      }

      const fetchedProcesses = processService.getProcesses(subAreaId);
      setProcesses(fetchedProcesses);

      const count = subAreaService.getSubAreaModelsCount(subAreaId);
      setModelsCount(count);

    } catch (e) {
      console.error('Error fetching sub-area data:', e);
      setError('Failed to load sub-area data.');
    } finally {
      setIsLoading(false);
    }
  }, [subAreaId]);

  useEffect(() => {
    if (subAreaId) {
      fetchData();
    } else {
      setError("No Sub-Area ID provided.");
      setIsLoading(false);
      setSubArea(null); setParentArea(null); setParentProject(null); setProcesses([]); setModelsCount(0);
    }
  }, [subAreaId, fetchData]);

  // Action Handlers
  const handleEditSubArea = () => {
    if (!subArea) {
      toast.error("Sub-Area data not loaded.");
      return;
    }
    setEditingSubArea(subArea);
    setIsSubAreaFormOpen(true);
  };

  const handleSubAreaFormSave = async (formData: Pick<SubArea, 'name' | 'description'>) => {
    if (!editingSubArea) {
      toast.error("No Sub-Area selected for editing.");
      return false;
    }
    try {
      await subAreaService.updateSubArea(editingSubArea.id, formData);
      toast.success(`Sub-Area "${formData.name}" updated successfully.`);
      fetchData();
      setIsSubAreaFormOpen(false);
      setEditingSubArea(null);
      return true;
    } catch (e: any) {
      toast.error(`Failed to update Sub-Area: ${e.message || String(e)}`);
      return false;
    }
  };

  const handleDeleteSubArea = async () => {
    if (!subArea || !parentArea) {
      toast.error("Sub-Area data or parent area context not loaded.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete sub-area "${subArea.name}" and all its contents?`)) {
      try {
        const success = await subAreaService.deleteSubArea(subArea.id);
        if (success) {
          toast.success(`Sub-Area "${subArea.name}" deleted successfully.`);
          navigateTo({ view: 'area', itemId: parentArea.id }); // Navigate to parent area
        } else {
          toast.error("Failed to delete sub-area. It might have been already removed.");
        }
      } catch (e: any) {
        console.error("Error deleting sub-area:", e);
        toast.error(`Failed to delete sub-area: ${e.message || String(e)}`);
      }
    }
  };

  const handleCreateProcess = () => {
    if (!subArea) {
      toast.error("Sub-Area data not loaded. Cannot create process.");
      return;
    }
    setIsProcessFormOpen(true);
  };

  const handleProcessFormSave = async (processData: Pick<Process, 'name' | 'description'>) => {
    if (!subArea) {
      toast.error("Sub-Area context is missing for creating a process.");
      return false;
    }
    try {
      await processService.createProcess({ ...processData, subAreaId: subArea.id });
      toast.success(`Process "${processData.name}" created successfully.`);
      fetchData(); // Refreshes processes list and potentially modelsCount
      setIsProcessFormOpen(false);
      return true;
    } catch (e: any) {
      toast.error(`Failed to create Process: ${e.message || String(e)}`);
      return false;
    }
  };

  const handleViewSubAreaModels = () => console.log(`TODO: View models for sub-area: ${subAreaId}`); // Placeholder

  const handleViewProcess = (processId: string) => {
    if (!processId) {
      toast.error("Process ID is missing.");
      return;
    }
    navigateTo({ view: 'editor', itemId: processId });
  };

  const handleBackToArea = () => {
    if (parentArea) { // parentArea should be in state and fetched
      navigateTo({ view: 'area', itemId: parentArea.id });
    } else {
      console.warn("Cannot navigate back, parent area not found.");
      // Fallback, perhaps to general or try to find project if possible
      navigateTo({ view: 'general' });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Skeleton for Back Button */}
        <Skeleton className="h-9 w-44 mb-4" /> {/* Adjusted width for "Back to Area (...)" */}

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" /> {/* Sub-Area Name */}
            <Skeleton className="h-4 w-full mb-1" /> {/* Path Line 1 */}
            <Skeleton className="h-4 w-1/2" /> {/* Path Line 2 (ID) */}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-10 w-36" /> {/* Edit Sub-Area Button */}
              <Skeleton className="h-10 w-40" /> {/* Delete Sub-Area Button */}
              <Skeleton className="h-10 w-44" /> {/* Create New Process Button */}
              <Skeleton className="h-10 w-40" /> {/* View Models Button */}
            </div>
          </CardContent>
        </Card>

        <section>
          <Skeleton className="h-7 w-1/3 mb-4" /> {/* Section Title "Processes..." */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => ( // Show 3 skeleton cards for processes
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-1" /> {/* Process Name */}
                  <Skeleton className="h-4 w-1/2" /> {/* Process ID */}
                </CardHeader>
                <CardContent><Skeleton className="h-8 w-3/4" /></CardContent> {/* Button View Process */}
              </Card>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-red-600">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (!subArea) {
     return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p>Sub-Area data is unavailable or could not be loaded.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {parentArea && (
        <Button variant="outline" size="sm" onClick={handleBackToArea} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Area ({parentArea.name})
        </Button>
      )}

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">{subArea.name}</CardTitle>
          <CardDescription className="pt-1">
            Path: {parentProject ? `${parentProject.name} / ` : ''}{parentArea ? `${parentArea.name} / ` : ''}{subArea.name}
            <br />
            (Sub-Area ID: {subArea.id})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={handleEditSubArea}><Edit3 className="mr-2 h-4 w-4"/> Edit Sub-Area</Button>
            <Button variant="destructive" onClick={handleDeleteSubArea}><Trash2 className="mr-2 h-4 w-4"/> Delete Sub-Area</Button>
            <Button onClick={handleCreateProcess}><PlusCircle className="mr-2 h-4 w-4"/> Create New Process</Button>
            <Button variant="secondary" onClick={handleViewSubAreaModels}><FileText className="mr-2 h-4 w-4"/> View Models ({modelsCount})</Button>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Processes</h2>
        {subArea && parentArea && parentProject && ( // Ensure all parent context is loaded
          processes.length > 0 ? (
            <ProcessList
              subArea={subArea}
              area={parentArea}
              project={parentProject}
              processes={processes} // Pass fetched processes
              onNavigateToEditor={handleViewProcess}
            />
          ) : (
            <Card className="flex flex-col items-center justify-center p-6 border-dashed">
               <p className="text-muted-foreground mb-3">No processes have been created for this sub-area yet.</p>
               <Button onClick={handleCreateProcess}><PlusCircle className="mr-2 h-4 w-4"/> Create First Process</Button>
            </Card>
          )
        )}
      </section>

      {/* Forms Modals */}
      {subArea && editingSubArea && ( // For editing current sub-area
        <SubAreaForm
          isOpen={isSubAreaFormOpen}
          onClose={() => { setIsSubAreaFormOpen(false); setEditingSubArea(null); }}
          onSave={handleSubAreaFormSave}
          subArea={editingSubArea}
          area={parentArea} // Pass parent area for context
        />
      )}
      {subArea && ( // For creating a process under current sub-area
        <ProcessForm
          isOpen={isProcessFormOpen}
          onClose={() => setIsProcessFormOpen(false)}
          onSave={handleProcessFormSave}
          subArea={subArea} // Pass parent subArea
        />
      )}
    </div>
  );
};
export default SubAreaDashboard;
