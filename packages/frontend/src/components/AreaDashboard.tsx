import React, { useEffect, useState, useCallback } from 'react';
import { areaService } from '@/services/areaService';
import { projectService } from '@/services/projectService';
import { subAreaService } from '@/services/subAreaService';
import type { Area, Project, SubArea } from '@/types';
import { useNavigation } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast'; // Changed to react-hot-toast
import { Edit3, Trash2, PlusCircle, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';
import { AreaForm } from '@/components/AreaForm'; // Changed to named import
import { SubAreaForm } from '@/components/SubAreaForm'; // Changed to named import
import { SubAreaList } from '@/components/SubAreaList'; // Added import
// Removed redundant SubArea import, it's already imported with Area, Project

interface AreaDashboardProps {
  areaId: string;
  // No onNavigateBackToProject or onNavigateToSubArea needed from props
}

const AreaDashboard: React.FC<AreaDashboardProps> = ({ areaId }) => {
  const [area, setArea] = useState<Area | null>(null);
  const [parentProject, setParentProject] = useState<Project | null>(null);
  const [subAreas, setSubAreas] = useState<SubArea[]>([]);
  const [modelsCount, setModelsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { navigateTo } = useNavigation();

  // State for modal visibility
  const [isAreaFormOpen, setIsAreaFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [isSubAreaFormOpen, setIsSubAreaFormOpen] = useState(false);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedArea = areaService.getArea(areaId);
      if (!fetchedArea) {
        setError('Area not found.');
        setArea(null);
        setParentProject(null);
        setSubAreas([]);
        setModelsCount(0);
        setIsLoading(false);
        return;
      }
      setArea(fetchedArea);

      const fetchedProject = projectService.getProject(fetchedArea.projectId);
      setParentProject(fetchedProject);

      const fetchedSubAreas = subAreaService.getSubAreas(areaId);
      setSubAreas(fetchedSubAreas);

      const count = areaService.getAreaModelsCount(areaId);
      setModelsCount(count);

    } catch (e) {
      console.error('Error fetching area data:', e);
      setError('Failed to load area data.');
    } finally {
      setIsLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    if (areaId) {
      fetchData();
    } else {
      setError("No area ID provided.");
      setIsLoading(false);
      setArea(null);
      setParentProject(null);
      setSubAreas([]);
      setModelsCount(0);
    }
  }, [areaId, fetchData]);

  // Action Handlers
  const handleEditArea = () => {
    if (!area) {
      toast.error("Area data not loaded.");
      return;
    }
    setEditingArea(area);
    setIsAreaFormOpen(true);
  };

  const handleAreaFormSave = async (formData: Pick<Area, 'name' | 'description'>) => {
    if (!editingArea) {
      toast.error("No area selected for editing.");
      return false;
    }
    try {
      await areaService.updateArea(editingArea.id, formData);
      toast.success(`Area "${formData.name}" updated successfully.`);
      fetchData(); // Refresh area data (and potentially parent project if name changed in breadcrumbs)
      setIsAreaFormOpen(false);
      setEditingArea(null);
      return true;
    } catch (e: any) {
      toast.error(`Failed to update area: ${e.message || String(e)}`);
      return false;
    }
  };

  const handleDeleteArea = async () => {
    if (!area || !parentProject) {
      toast.error("Area data or parent project context not loaded.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete area "${area.name}" and all its contents?`)) {
      try {
        const success = await areaService.deleteArea(area.id);
        if (success) {
          toast.success(`Area "${area.name}" deleted successfully.`);
          navigateTo({ view: 'project', itemId: parentProject.id }); // Navigate to parent project
        } else {
          toast.error("Failed to delete area. It might have been already removed.");
        }
      } catch (e: any) {
        console.error("Error deleting area:", e);
        toast.error(`Failed to delete area: ${e.message || String(e)}`);
      }
    }
  };

  const handleCreateSubArea = () => {
    if (!area) {
      toast.error("Area data not loaded. Cannot create sub-area.");
      return;
    }
    setIsSubAreaFormOpen(true);
  };

  // Updated to handle full SubArea data from the form
  const handleSubAreaFormSave = async (subAreaData: Omit<SubArea, 'id'>) => {
    console.log('[AreaDashboard] handleSubAreaFormSave - Data received from SubAreaForm:', JSON.stringify(subAreaData, null, 2));

    if (!area) {
      toast.error("Area context is missing for creating a sub-area.");
      console.error('[AreaDashboard] handleSubAreaFormSave - Area context is missing.');
      return false;
    }

    // Validate that the areaId in subAreaData (if provided by form, which it should be) matches the current area.
    // SubAreaForm is expected to include areaId in its payload.
    if (subAreaData.areaId !== area.id) {
        toast.error("Area ID mismatch. Cannot create sub-area under the wrong parent.");
        console.error(`[AreaDashboard] Mismatch: subAreaData.areaId (${subAreaData.areaId}) vs current area.id (${area.id})`);
        return false;
    }

    try {
      // The subAreaData from the form should now contain all necessary fields including name, code, description, status, and areaId.
      console.log('[AreaDashboard] Data being sent to subAreaService.createSubArea:', JSON.stringify(subAreaData, null, 2));
      await subAreaService.createSubArea(subAreaData);
      toast.success(`Sub-Area "${subAreaData.name}" created successfully.`);
      fetchData(); // Refreshes subAreas list and other relevant data
      setIsSubAreaFormOpen(false);
      return true;
    } catch (e: any) {
      toast.error(`Failed to create Sub-Area: ${e.message || String(e)}`);
      return false;
    }
  };

  const handleViewAreaModels = () => console.log(`TODO: View models for area: ${areaId}`); // Placeholder

  // handleViewSubArea is now managed by SubAreaList's onNavigateToSubAreaProcesses prop
  // const handleViewSubArea = (subAreaId: string) => {
  //   navigateTo({ view: 'subarea', itemId: subAreaId });
  // };

  const handleBackToProject = () => {
    if (parentProject) { // parentProject should be in state and fetched
      navigateTo({ view: 'project', itemId: parentProject.id });
    } else {
      console.warn("Cannot navigate back, parent project not found.");
      navigateTo({ view: 'general' }); // Fallback to general dashboard
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Skeleton for Back Button */}
        <Skeleton className="h-9 w-48 mb-4" />

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" /> {/* Area Name */}
            <Skeleton className="h-4 w-1/2" /> {/* Parent Project Info */}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-10 w-28" /> {/* Edit Area Button */}
              <Skeleton className="h-10 w-32" /> {/* Delete Area Button */}
              <Skeleton className="h-10 w-40" /> {/* Create New Sub-Area Button */}
              <Skeleton className="h-10 w-40" /> {/* View Models Button */}
            </div>
          </CardContent>
        </Card>

        <section>
          <Skeleton className="h-7 w-1/3 mb-4" /> {/* Section Title "Sub-Areas..." */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => ( // Show 3 skeleton cards for sub-areas
              <Card key={index}>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
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

  if (!area) {
    // Fallback, should be caught by 'Area not found' error
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p>Area data is unavailable or area could not be loaded.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {parentProject && ( // Only show button if parentProject is loaded
        <Button variant="outline" size="sm" onClick={handleBackToProject} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project ({parentProject.name})
        </Button>
      )}

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">{area.name}</CardTitle>
          <CardDescription className="pt-1">
            Part of Project: {parentProject ? parentProject.name : 'Loading project info...'} (Area ID: {area.id})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={handleEditArea}><Edit3 className="mr-2 h-4 w-4"/> Edit Area</Button>
            <Button variant="destructive" onClick={handleDeleteArea}><Trash2 className="mr-2 h-4 w-4"/> Delete Area</Button>
            {/* Removed general "Create New Sub-Area" button from here */}
            <Button variant="secondary" onClick={handleViewAreaModels}><FileText className="mr-2 h-4 w-4"/> View Models ({modelsCount})</Button>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Sub-Areas</h2>
        {area && parentProject && ( // Ensure area and parentProject are loaded
          subAreas.length > 0 ? (
            <SubAreaList
              area={area}
              project={parentProject}
              subAreas={subAreas} // Pass fetched subAreas
              onNavigateToSubAreaProcesses={(subArea) => navigateTo({ view: 'subarea', itemId: subArea.id })}
            />
          ) : (
            <Card className="flex flex-col items-center justify-center p-6 border-dashed">
               <p className="text-muted-foreground mb-3">No sub-areas have been created for this area yet.</p>
               <Button onClick={handleCreateSubArea}><PlusCircle className="mr-2 h-4 w-4"/> Create First Sub-Area</Button>
            </Card>
          )
        )}
      </section>

      {/* Forms Modals */}
      {area && editingArea && ( // For editing the current area
        <AreaForm
          isOpen={isAreaFormOpen}
          onClose={() => { setIsAreaFormOpen(false); setEditingArea(null); }}
          onSave={handleAreaFormSave}
          area={editingArea}
          project={parentProject} // Pass parent project for context if needed by AreaForm
        />
      )}
      {area && !editingArea && ( // Ensure we are in creation mode for SubAreaForm
        <SubAreaForm
          isOpen={isSubAreaFormOpen}
          onClose={() => setIsSubAreaFormOpen(false)}
          onSave={handleSubAreaFormSave}
          subArea={null} // Explicitly null for creation mode
          areaId={area.id} // Pass area.id for creation context
          // errorMessage={...} // If SubAreaForm supports an errorMessage prop
        />
      )}
    </div>
  );
};
export default AreaDashboard;
