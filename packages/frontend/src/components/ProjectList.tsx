import React, { useState, useEffect } from 'react';
import { Project } from '@/types'; // Area might not be needed here directly
import { projectService } from '@/services/projectService';
import { ProjectForm } from './ProjectForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
// Placeholder for navigation, replace with actual navigation call
// import { useNavigate } from 'react-router-dom'; // if using react-router

interface ProjectListProps {
  onNavigateToProjectAreas: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onNavigateToProjectAreas }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  // const navigate = useNavigate(); // Example for navigation

  const loadProjects = () => {
    setProjects(projectService.getProjects());
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSaveProject = (projectData: Pick<Project, 'name'> | (Pick<Project, 'name'> & { id: string })) => {
    if ('id' in projectData) { // Editing existing project
      projectService.updateProject(projectData.id, { name: projectData.name });
    } else { // Creating new project
      projectService.createProject({ name: projectData.name });
    }
    loadProjects(); // Refresh list
    setIsFormOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project and all its contents?')) {
      projectService.deleteProject(id);
      loadProjects(); // Refresh list
    }
  };

  const openCreateForm = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const openEditForm = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  // Placeholder for navigating to project details (areas)
  // const handleNavigateToProjectAreas = (projectId: string) => { // Old handler
  //   console.log(`Navigate to areas for project ${projectId}`);
  //   // navigate(`/projects/${projectId}/areas`); // Example navigation
  // };


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
                {/* Later, add more details like number of areas, etc. */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingProject(null); }}
        onSave={handleSaveProject}
        project={editingProject}
      />
    </div>
  );
};
