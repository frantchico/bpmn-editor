import React, { useEffect, useState } from 'react';
import RecentProjects from '@/components/RecentProjects';
import StatisticsSummary from '@/components/StatisticsSummary';
import { projectService } from '@/services/projectService';
import type { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// interface GeneralDashboardProps {
//   // setActiveView?: (view: string, id?: string) => void; // For future navigation
// }

const GeneralDashboard: React.FC<Record<string, never>> = (/*{ setActiveView }*/) => {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    try {
      const projects = projectService.getProjects();
       const sortedProjects = [...projects].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllProjects(sortedProjects);
    } catch (error) {
      console.error("Error fetching all projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const handleViewProject = (projectId: string) => {
    console.log(`View project: ${projectId}`);
    // setActiveView?.('project', projectId); // Future navigation
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
        <h2 className="text-2xl font-semibold mb-4">All Projects</h2>
        {loadingProjects ? (
          <p className="text-center text-gray-500">Loading projects...</p>
        ) : allProjects.length === 0 ? (
          <p className="text-center text-gray-500">No projects available. Create one to get started!</p>
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
    </div>
  );
};
export default GeneralDashboard;
