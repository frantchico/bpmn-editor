import React, { useEffect, useState, useCallback } from 'react';
import { areaService } from '@/services/areaService';
import { projectService } from '@/services/projectService';
import { subAreaService } from '@/services/subAreaService';
import type { Area, Project, SubArea } from '@/types';
import { useNavigation } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Edit3, Trash2, PlusCircle, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';

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

  const fetchData = useCallback(() => { // Removed async as services are sync
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
    if (area) {
      toast.info(`Placeholder: Show form to edit area "${area.name}".`);
    } else {
      toast.info('Placeholder: Show form to edit area.');
    }
  };
  const handleDeleteArea = () => {
    if (area) {
      toast.success(`Area "${area.name}" would be deleted.`, {
        description: `ID: ${areaId}`,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo delete (placeholder)'),
        },
      });
    } else {
      toast.error('Area details not available to simulate deletion.');
    }
    // if (parentProject) navigateTo({ view: 'project', itemId: parentProject.id }); // Example after actual deletion
  };
  const handleCreateSubArea = () => {
    if (area) {
      toast.info(`Placeholder: Show form to create new sub-area for area "${area.name}".`);
    } else {
      toast.info('Placeholder: Show form to create new sub-area.');
    }
  };
  const handleViewAreaModels = () => console.log(`TODO: View models for area: ${areaId}`); // Placeholder

  const handleViewSubArea = (subAreaId: string) => {
    navigateTo({ view: 'subarea', itemId: subAreaId });
  };

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
            <Button onClick={handleCreateSubArea}><PlusCircle className="mr-2 h-4 w-4"/> Create New Sub-Area</Button>
            <Button variant="secondary" onClick={handleViewAreaModels}><FileText className="mr-2 h-4 w-4"/> View Models ({modelsCount})</Button>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Sub-Areas ({subAreas.length})</h2>
        {subAreas.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subAreas.map(sub => (
              <Card key={sub.id} className="hover:shadow-md transition-shadow duration-150 ease-in-out">
                <CardHeader>
                  <CardTitle className="text-xl">{sub.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" onClick={() => handleViewSubArea(sub.id)}>
                    View Sub-Area Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-6 border-dashed">
             <p className="text-muted-foreground mb-3">No sub-areas have been created for this area yet.</p>
             <Button onClick={handleCreateSubArea}><PlusCircle className="mr-2 h-4 w-4"/> Create First Sub-Area</Button>
          </Card>
        )}
      </section>
    </div>
  );
};
export default AreaDashboard;
