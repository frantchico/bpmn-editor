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
import toast from 'react-hot-toast';
import { Edit3, Trash2, PlusCircle, FileText, AlertTriangle } from 'lucide-react';
import { ProjectForm } from '@/components/ProjectForm'; // Changed to named import
import { AreaForm } from '@/components/AreaForm'; // Changed to named import
import { AreaList } from '@/components/AreaList'; // Added import

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

  // State for modal visibility
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAreaFormOpen, setIsAreaFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null); // Added state for editing area

  const fetchData = useCallback(() => {
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
  const handleEditProject = () => { // No longer async, just opens form
    if (!project) {
      toast.error("Project data not loaded.");
      return;
    }
    setEditingProject(project);
    setIsProjectFormOpen(true);
  };

  const handleProjectFormSave = async (projectData: Pick<Project, 'name'>) => {
    if (!editingProject) {
      toast.error("No project selected for editing."); // Should not happen if form is opened correctly
      return false;
    }
    try {
      await projectService.updateProject(editingProject.id, { name: projectData.name });
      toast.success(`Project "${projectData.name}" updated successfully.`);
      fetchData(); // Refresh project data
      setIsProjectFormOpen(false);
      setEditingProject(null);
      return true;
    } catch (e: any) {
      console.error("Error updating project:", e);
      toast.error(`Failed to update project: ${e.message || String(e)}`);
      return false; // Indicate save failure
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

  // const handleCreateArea = () => { // No longer async, just opens form
  //   if (!project) { // Ensure project context exists
  //     toast.error("Project data not loaded. Cannot create area.");
  //     return;
  //   }
  //   setIsAreaFormOpen(true);
  // };
  const handleOpenAreaForm = useCallback((areaToEdit: Area | null = null) => {
    if (!project) {
      toast.error("Project data not loaded. Cannot open area form.");
      return;
    }
    setEditingArea(areaToEdit); // Set to area object for edit, or null for create
    setIsAreaFormOpen(true);
  }, [project, setIsAreaFormOpen, setEditingArea, toast]); // Added useCallback and dependencies

  // Updated to accept the full Area data (Omit 'id') from AreaForm
  const handleAreaFormSave = useCallback(async (areaData: Omit<Area, 'id'>) => {
    console.log('[ProjectDashboard] handleAreaFormSave (useCallback version) entered. Received areaData:', JSON.stringify(areaData, null, 2));
    console.log('[ProjectDashboard] Current project state (useCallback version):', project ? JSON.stringify(project, null, 2) : 'null');

    if (!project) {
      console.log('[ProjectDashboard] Project context is missing (useCallback version). Aborting save.');
      toast.error("Project context is missing for creating an area.");
      return false;
    }
    console.log('[ProjectDashboard] Project context check passed (useCallback version).');

    if (areaData.projectId !== project.id) {
        console.log(`[ProjectDashboard] ProjectID mismatch (useCallback version). Form projectId: ${areaData.projectId}, Dashboard projectId: ${project.id}. Aborting save.`);
        toast.error("Area data has an inconsistent projectId. Cannot save.");
        console.error("Mismatched projectId (useCallback version):", { formProjectId: areaData.projectId, dashboardProjectId: project.id });
        return false;
    }
    console.log('[ProjectDashboard] ProjectID match check passed (useCallback version).');
    console.log('[ProjectDashboard] All pre-checks passed (useCallback version). Attempting to create area...');

    try {
      console.log('[ProjectDashboard] Calling areaService.createArea (useCallback version) with data:', JSON.stringify(areaData, null, 2));
      const savedArea = await areaService.createArea(areaData);

      console.log('[ProjectDashboard] Area creation successful (useCallback version). Attempting to show success toast.');
      toast.success(`Area "${savedArea.name}" created successfully.`);
      fetchData(); // Refresh areas list
      setIsAreaFormOpen(false);
      return true;
    } catch (e: any) {
      console.log('[ProjectDashboard] Area creation failed (useCallback version). Attempting to show error toast.');
      console.error("Error creating area (useCallback version):", e);
      toast.error(`Failed to create area: ${e.message || String(e)}`);
      return false;
    }
  }, [project, fetchData, setIsAreaFormOpen, toast, areaService]); // Add dependencies

  const handleViewProjectModels = () => console.log(`TODO: View models for project: ${projectId}`); // Placeholder

  // handleViewArea is now managed by AreaList's onNavigateToAreaSubAreas prop effectively
  // const handleViewArea = (areaId: string) => {
  //   navigateTo({ view: 'area', itemId: areaId });
  // };


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
            {/* Removed general "Create New Area" button from here */}
            <Button variant="secondary" onClick={handleViewProjectModels}><FileText className="mr-2 h-4 w-4"/> View Models ({modelsCount})</Button>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Areas in this Project</h2>
        {project && ( // Ensure project is loaded before rendering AreaList or create button
          areas.length > 0 ? (
            <AreaList
              project={project}
              areas={areas} // Pass fetched areas to AreaList
              onNavigateToAreaSubAreas={(area) => navigateTo({ view: 'area', itemId: area.id })}
              onOpenCreateAreaForm={() => handleOpenAreaForm(null)} // For creating new
              onOpenEditAreaForm={(area) => handleOpenAreaForm(area)} // For editing existing
            />
          ) : (
            <Card className="flex flex-col items-center justify-center p-6 border-dashed">
               <p className="text-muted-foreground mb-3">No areas have been created for this project yet.</p>
               <Button onClick={() => handleOpenAreaForm(null)}><PlusCircle className="mr-2 h-4 w-4"/> Create First Area</Button>
            </Card>
          )
        )}
      </section>

      {/* Forms Modals */}
      {project && editingProject && ( // Ensure editingProject is not null for edit mode
        <ProjectForm
          isOpen={isProjectFormOpen}
          onClose={() => { setIsProjectFormOpen(false); setEditingProject(null); }}
          onSave={handleProjectFormSave}
          project={editingProject}
        />
      )}
      {project && ( // project check is sufficient as AreaForm handles both create and edit
        <AreaForm
          isOpen={isAreaFormOpen}
          onClose={() => { setIsAreaFormOpen(false); setEditingArea(null); }} // Also clear editingArea on close
          onSave={handleAreaFormSave}
          area={editingArea} // Use the new state here
          projectId={project.id} // Pass projectId for creation context
        />
      )}
    </div>
  );
};

export default ProjectDashboard;
