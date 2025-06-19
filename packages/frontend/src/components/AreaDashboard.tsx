import React, { useEffect, useState, useCallback } from 'react';
import { areaService } from '@/services/areaService';
import { projectService } from '@/services/projectService';
import { subAreaService } from '@/services/subAreaService';
import type { Area, Project, SubArea } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Edit3, Trash2, PlusCircle, FileText, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';

interface AreaDashboardProps {
  areaId: string;
  // onNavigateBackToProject?: (projectId: string) => void; // Example for navigation
  // onNavigateToSubArea?: (subAreaId: string) => void;
}

const AreaDashboard: React.FC<AreaDashboardProps> = ({ areaId /*, onNavigateBackToProject */ }) => {
  const [area, setArea] = useState<Area | null>(null);
  const [parentProject, setParentProject] = useState<Project | null>(null);
  const [subAreas, setSubAreas] = useState<SubArea[]>([]);
  const [modelsCount, setModelsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const handleEditArea = () => console.log(`Edit area: ${areaId}`);
  const handleDeleteArea = () => console.log(`Delete area: ${areaId}`);
  const handleCreateSubArea = () => console.log(`Create new sub-area for area: ${areaId}`);
  const handleViewAreaModels = () => console.log(`View models for area: ${areaId}`);
  const handleViewSubArea = (subAreaId: string) => console.log(`View sub-area: ${subAreaId}`);
  const handleBackToProject = () => {
    if (parentProject) {
      console.log(`Navigate back to project: ${parentProject.id}`);
      // onNavigateBackToProject?.(parentProject.id);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading area details...</p>
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
