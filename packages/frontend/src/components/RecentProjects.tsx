import React, { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import type { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface RecentProjectsProps {
  onViewProject: (projectId: string) => void;
  onViewAllProjects: () => void;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ onViewProject, onViewAllProjects }) => {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProjectCount, setTotalProjectCount] = useState(0);

  useEffect(() => {
    try {
      const allProjects = projectService.getProjects();
      setTotalProjectCount(allProjects.length);
      const sortedProjects = [...allProjects].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentProjects(sortedProjects.slice(0, 3));
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <p className="text-center text-gray-500">Loading recent projects...</p>;
  if (recentProjects.length === 0 && !loading) return <p className="text-center text-gray-500">No recent projects to display.</p>;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recentProjects.map(project => (
          <Card key={project.id}>
            <CardHeader><CardTitle className="text-lg">{project.name}</CardTitle></CardHeader>
            <CardContent>
              <Button onClick={() => onViewProject(project.id)} className="w-full">
                Open Project <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {totalProjectCount > 3 && (
         <div className="mt-6 text-center">
            <Button variant="outline" onClick={onViewAllProjects}>View All Projects</Button>
        </div>
      )}
    </div>
  );
};
export default RecentProjects;
