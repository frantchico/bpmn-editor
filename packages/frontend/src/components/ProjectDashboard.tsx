import React, { useEffect, useState, useCallback } from 'react';
import { projectService } from '@/services/projectService';
import { areaService } from '@/services/areaService';
// statisticsService can also provide getProjectModelsCount if we moved it there
// For now, assuming projectService has getProjectModelsCount as per plan
import type { Project, Area } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Edit3, Trash2, PlusCircle, FileText, AlertTriangle, Loader2 } from 'lucide-react';

interface ProjectDashboardProps {
  projectId: string;
  // Props for navigation/callbacks, e.g.:
  // onNavigateToArea: (areaId: string) => void;
  // onEditProject: (projectId: string) => void;
  // onDeleteProject: (projectId: string) => void; // To inform parent to refresh/redirect
  // onCreateArea: (projectId: string) => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [modelsCount, setModelsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Action Handlers (currently logging)
  const handleEditProject = () => console.log(`Edit project: ${projectId}`);
  const handleDeleteProject = () => {
    console.log(`Delete project: ${projectId}`);
    // Example of future implementation:
    // if (window.confirm("Are you sure you want to delete this project and all its contents?")) {
    //   projectService.deleteProject(projectId);
    //   onDeleteProject?.(projectId); // Callback to parent
    // }
  };
  const handleCreateArea = () => console.log(`Create new area for project: ${projectId}`);
  const handleViewProjectModels = () => console.log(`View models for project: ${projectId}`);
  const handleViewArea = (areaId: string) => console.log(`View area: ${areaId}`);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading project details...</p>
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
