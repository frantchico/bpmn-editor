// packages/frontend/src/components/ProjectList.tsx
import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { projectService } from '@/services/projectService';
import { ProjectForm } from './ProjectForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectListProps {
  onNavigateToProjectAreas: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onNavigateToProjectAreas }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null); // New state

  const loadProjects = () => {
    setProjects(projectService.getProjects());
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSaveProject = (projectData: Pick<Project, 'name'> | (Pick<Project, 'name'> & { id: string })) => {
    setFormErrorMessage(null); // Clear previous errors before attempting to save
    try {
      let savedProject: Project | undefined;
      if ('id' in projectData) { // Editing existing project
        savedProject = projectService.updateProject(projectData.id, { name: projectData.name });
        // updateProject now throws if not found or validation error
        toast.success(`Project "${savedProject.name}" updated successfully.`);
      } else { // Creating new project
        savedProject = projectService.createProject({ name: projectData.name });
        toast.success(`Project "${savedProject.name}" created successfully.`);
      }

      loadProjects(); // Refresh list
      setIsFormOpen(false); // Close form ONLY on success
      setEditingProject(null);
    } catch (error) {
      console.error("Error saving project:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred while saving the project.";
      toast.error(`Failed to save project: ${message}`);
      setFormErrorMessage(message); // Set error message to display in the form
      // Do NOT close the form here, so user can see the error and correct it.
    }
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project and all its contents? This action cannot be undone.')) {
      const success = projectService.deleteProject(id);
      if (success) {
        toast.success('Project deleted successfully.');
        loadProjects();
      } else {
        toast.error('Failed to delete project. It might have been already removed.');
      }
    } else {
      toast.info('Project deletion cancelled.');
    }
  };

  const openCreateForm = () => {
    setEditingProject(null);
    setFormErrorMessage(null); // Clear error when opening form
    setIsFormOpen(true);
  };

  const openEditForm = (project: Project) => {
    setEditingProject(project);
    setFormErrorMessage(null); // Clear error when opening form
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProject(null);
    setFormErrorMessage(null); // Also clear error on manual close
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={openCreateForm}>Create New Project</Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">No projects yet. Click "Create New Project" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {project.name}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditForm(project)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="text-red-600">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Contains areas, sub-areas, and process models.</CardDescription>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => onNavigateToProjectAreas(project)}>
                   View Areas
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectForm
        isOpen={isFormOpen}
        onClose={handleFormClose} // Use the new handler
        onSave={handleSaveProject}
        project={editingProject}
        errorMessage={formErrorMessage} // Pass the error message
      />
    </div>
  );
};
