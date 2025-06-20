import React, { useEffect, useState } from 'react';
import RecentProjects from '@/components/RecentProjects';
import StatisticsSummary from '@/components/StatisticsSummary';
import { projectService } from '@/services/projectService';
import type { Project } from '@/types';
import { useNavigation } from '@/context/NavigationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/ProjectForm'; // Added import
import toast from 'react-hot-toast'; // Added import
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

// interface GeneralDashboardProps {
//   // setActiveView?: (view: string, id?: string) => void; // For future navigation
// }

const GeneralDashboard: React.FC<Record<string, never>> = (/*{ setActiveView }*/) => {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const { navigateTo } = useNavigation();

  // State for ProjectForm modal
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [projectFormError, setProjectFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      setLoadingProjects(true);
      try {
        const projects = projectService.getProjects();
        const sortedProjects = [...projects].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAllProjects(sortedProjects);
      } catch (error) {
        console.error("Error fetching all projects:", error);
        // Potentially set an error state here to display to the user
      } finally {
        setLoadingProjects(false);
      }
    };

    loadData();
  }, []); // Empty dependency array to run once on mount

  const openCreateProjectForm = () => {
    setProjectFormError(null);
    setIsProjectFormOpen(true);
  };

  const handleCreateProjectSave = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    setProjectFormError(null);
    try {
      // Pass the full projectData object received from the form
      const newProject = await projectService.createProject(projectData);

      toast.success(`Project "${newProject.name}" created successfully!`);
      setIsProjectFormOpen(false);
      // Optimistically update the local state
      setAllProjects(prevProjects =>
        [newProject, ...prevProjects].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      return true; // Indicate success to form
    } catch (error: any) {
      console.error("Error creating project:", error);
      const message = error.message || "An unknown error occurred.";
      toast.error(`Failed to create project: ${message}`);
      setProjectFormError(message);
      return false; // Indicate failure to form
    }
  };

  const handleProjectFormClose = () => {
    setIsProjectFormOpen(false);
    setProjectFormError(null);
  };

  const handleViewProject = (projectId: string) => {
    navigateTo({ view: 'project', itemId: projectId });
  };

  const handleViewAllProjects = () => {
    document.getElementById('all-projects-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Projects</h2>
        <RecentProjects onViewProject={handleViewProject} onViewAllProjects={handleViewAllProjects} />
      </section>

      <section id="all-projects-section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">All Projects</h2>
          <Button onClick={openCreateProjectForm}>Create New Project</Button>
        </div>
        {loadingProjects ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <Card key={index}>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader> {/* CardTitle */}
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-1/2" /> {/* For "Created: date" */}
                  <Skeleton className="h-10 w-full" /> {/* Button */}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : allProjects.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No projects available. Click "Create New Project" to get started!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allProjects.map(project => (
              <Card key={project.id}>
                <CardHeader><CardTitle className="text-lg">{project.name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                  <Button onClick={() => handleViewProject(project.id)} className="w-full">
                    Open Project <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
        <StatisticsSummary />
      </section>

      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={handleProjectFormClose}
        onSave={handleCreateProjectSave}
        project={null} // Explicitly null for creation mode
        errorMessage={projectFormError}
      />
    </div>
  );
};
export default GeneralDashboard;
