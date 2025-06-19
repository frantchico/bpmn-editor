import React, { useEffect, useState, useCallback } from 'react';
import { projectService } from '@/services/projectService';
import { areaService } from '@/services/areaService';
// statisticsService can also provide getProjectModelsCount if we moved it there
// For now, assuming projectService has getProjectModelsCount as per plan
import type { Project, Area } from '@/types';
import { useNavigation } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast'; // Changed to react-hot-toast
import { Edit3, Trash2, PlusCircle, FileText, AlertTriangle } from 'lucide-react';

interface ProjectDashboardProps {
  projectId: string;
  // No onNavigateToArea needed from props if using context directly
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [modelsCount, setModelsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { navigateTo } = useNavigation();

  const fetchData = useCallback(() => { // Removed async as services are sync
    setIsLoading(true);
    setError(null);
    try {
      const fetchedProject = projectService.getProject(projectId);
      if (!fetchedProject) {
        setError('Project not found.');
        setProject(null);
        setAreas([]);
        setModelsCount(0);
        setIsLoading(false); // Explicitly set loading to false here
        return;
      }
      setProject(fetchedProject);

      const fetchedAreas = areaService.getAreas(projectId);
      setAreas(fetchedAreas);

      const count = projectService.getProjectModelsCount(projectId);
      setModelsCount(count);

    } catch (e) {
      console.error('Error fetching project data:', e);
      setError('Failed to load project data.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchData();
    } else {
      setError("No project ID provided.");
      setIsLoading(false);
      setProject(null); // Clear project data if no ID
      setAreas([]);
      setModelsCount(0);
    }
  }, [projectId, fetchData]);

  // Action Handlers
  const handleEditProject = async () => {
    if (!project) {
      toast.error("Project data not loaded.");
      return;
    }
    const newName = prompt("Enter new project name:", project.name);
    if (newName && newName.trim() !== project.name) {
      try {
        // Assuming projectService.updateProject exists and works as intended
        // The current projectService in memory might be synchronous.
        // For this implementation, we'll follow the prompt's async/await structure.
        await projectService.updateProject(project.id, { name: newName.trim() });
        toast.success(`Project "${newName.trim()}" updated successfully.`);
        fetchData(); // Reload data
      } catch (e: any) {
        console.error("Error updating project:", e);
        toast.error(`Failed to update project: ${e.message || String(e)}`);
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!project) {
      toast.error("Project data not loaded.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete project "${project.name}" and all its contents?`)) {
      try {
        // Assuming projectService.deleteProject returns a boolean or throws an error.
        const success = await projectService.deleteProject(project.id); // Adapting to async
        if (success) {
          toast.success(`Project "${project.name}" deleted successfully.`);
          navigateTo({ view: 'general' }); // Or 'hierarchy'
        } else {
          // This else block might not be reached if deleteProject throws on failure.
          toast.error("Failed to delete project. It might have been already removed or an error occurred.");
        }
      } catch (e: any) {
        console.error("Error deleting project:", e);
        toast.error(`Failed to delete project: ${e.message || String(e)}`);
      }
    }
  };

  const handleCreateArea = async () => {
    if (!project) {
      toast.error("Project data not loaded.");
      return;
    }
    const areaName = prompt("Enter name for the new area:");
    if (areaName && areaName.trim()) {
      try {
        // Assuming areaService.createArea exists and works as intended.
        await areaService.createArea({ name: areaName.trim(), projectId: project.id, description: '' }); // Added description
        toast.success(`Area "${areaName.trim()}" created successfully in project "${project.name}".`);
        fetchData(); // Reload data to show new area
      } catch (e: any) {
        console.error("Error creating area:", e);
        toast.error(`Failed to create area: ${e.message || String(e)}`);
      }
    }
  };

  const handleViewProjectModels = () => console.log(`TODO: View models for project: ${projectId}`); // Placeholder

  const handleViewArea = (areaId: string) => {
    navigateTo({ view: 'area', itemId: areaId });
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" /> {/* Project Name */}
            <Skeleton className="h-4 w-1/2" /> {/* Project ID */}
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full mb-2" /> {/* Timestamps line */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-10 w-28" /> {/* Edit Project Button */}
              <Skeleton className="h-10 w-32" /> {/* Delete Project Button */}
              <Skeleton className="h-10 w-36" /> {/* Create New Area Button */}
              <Skeleton className="h-10 w-40" /> {/* View Models Button */}
            </div>
          </CardContent>
        </Card>
        <section>
          <Skeleton className="h-7 w-1/3 mb-4" /> {/* Section Title "Areas..." */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => ( // Show 3 skeleton cards for areas
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
        {/* Optionally, a button to retry or go back */}
      </div>
    );
  }

  if (!project) {
    // This state should ideally be caught by error 'Project not found'
    // but as a fallback:
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p>Project data is unavailable or project could not be loaded.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">{project.name}</CardTitle>
          <CardDescription className="pt-1">Project ID: {project.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Created: {new Date(project.createdAt).toLocaleDateString()} &bull;
            Last Updated: {new Date(project.updatedAt).toLocaleDateString()}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={handleEditProject}><Edit3 className="mr-2 h-4 w-4"/> Edit Project</Button>
            <Button variant="destructive" onClick={handleDeleteProject}><Trash2 className="mr-2 h-4 w-4"/> Delete Project</Button>
            <Button onClick={handleCreateArea}><PlusCircle className="mr-2 h-4 w-4"/> Create New Area</Button>
            <Button variant="secondary" onClick={handleViewProjectModels}><FileText className="mr-2 h-4 w-4"/> View Models ({modelsCount})</Button>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Areas in this Project ({areas.length})</h2>
        {areas.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {areas.map(area => (
              <Card key={area.id} className="hover:shadow-md transition-shadow duration-150 ease-in-out">
                <CardHeader>
                  <CardTitle className="text-xl">{area.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* <p className="text-sm text-muted-foreground mb-3">Contains X sub-areas, Y models</p> */}
                  <Button variant="outline" size="sm" onClick={() => handleViewArea(area.id)}>
                    View Area Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-6 border-dashed">
             <p className="text-muted-foreground mb-3">No areas have been created for this project yet.</p>
             <Button onClick={handleCreateArea}><PlusCircle className="mr-2 h-4 w-4"/> Create First Area</Button>
          </Card>
        )}
      </section>
      {/* Future sections for project-level models or other details can be added here */}
    </div>
  );
};

export default ProjectDashboard;
