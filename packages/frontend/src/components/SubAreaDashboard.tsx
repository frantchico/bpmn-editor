import React, { useEffect, useState, useCallback } from 'react';
import { subAreaService } from '@/services/subAreaService';
import { areaService } from '@/services/areaService';
import { projectService } from '@/services/projectService';
import { processService } from '@/services/processService'; // To list processes
import type { SubArea, Area, Project, Process } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Edit3, Trash2, PlusCircle, FileText, AlertTriangle, Loader2, ArrowLeft, Workflow } from 'lucide-react';

interface SubAreaDashboardProps {
  subAreaId: string;
  // onNavigateBackToArea?: (areaId: string) => void;
  // onNavigateToProcess?: (processId: string) => void; // Or model editor
}

const SubAreaDashboard: React.FC<SubAreaDashboardProps> = ({ subAreaId /*, onNavigateBackToArea */ }) => {
  const [subArea, setSubArea] = useState<SubArea | null>(null);
  const [parentArea, setParentArea] = useState<Area | null>(null);
  const [parentProject, setParentProject] = useState<Project | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [modelsCount, setModelsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => { // Removed async as services are sync
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSubArea = subAreaService.getSubArea(subAreaId);
      if (!fetchedSubArea) {
        setError('Sub-Area not found.');
        setSubArea(null); setParentArea(null); setParentProject(null); setProcesses([]); setModelsCount(0);
        setIsLoading(false);
        return;
      }
      setSubArea(fetchedSubArea);

      const fetchedArea = areaService.getArea(fetchedSubArea.areaId);
      setParentArea(fetchedArea);

      if (fetchedArea) {
        const fetchedProject = projectService.getProject(fetchedArea.projectId);
        setParentProject(fetchedProject);
      } else {
        setParentProject(null);
      }

      const fetchedProcesses = processService.getProcesses(subAreaId);
      setProcesses(fetchedProcesses);

      const count = subAreaService.getSubAreaModelsCount(subAreaId);
      setModelsCount(count);

    } catch (e) {
      console.error('Error fetching sub-area data:', e);
      setError('Failed to load sub-area data.');
    } finally {
      setIsLoading(false);
    }
  }, [subAreaId]);

  useEffect(() => {
    if (subAreaId) {
      fetchData();
    } else {
      setError("No Sub-Area ID provided.");
      setIsLoading(false);
      setSubArea(null); setParentArea(null); setParentProject(null); setProcesses([]); setModelsCount(0);
    }
  }, [subAreaId, fetchData]);

  // Action Handlers
  const handleEditSubArea = () => console.log(`Edit sub-area: ${subAreaId}`);
  const handleDeleteSubArea = () => console.log(`Delete sub-area: ${subAreaId}`);
  const handleCreateProcess = () => console.log(`Create new process for sub-area: ${subAreaId}`);
  const handleViewSubAreaModels = () => console.log(`View models for sub-area: ${subAreaId}`);
  const handleViewProcess = (processId: string) => console.log(`View process: ${processId}`);
  const handleBackToArea = () => {
    if (parentArea) {
      console.log(`Navigate back to area: ${parentArea.id}`);
      // onNavigateBackToArea?.(parentArea.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading sub-area details...</p>
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

  if (!subArea) {
     return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p>Sub-Area data is unavailable or could not be loaded.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {parentArea && (
        <Button variant="outline" size="sm" onClick={handleBackToArea} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Area ({parentArea.name})
        </Button>
      )}

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">{subArea.name}</CardTitle>
          <CardDescription className="pt-1">
            Path: {parentProject ? `${parentProject.name} / ` : ''}{parentArea ? `${parentArea.name} / ` : ''}{subArea.name}
            <br />
            (Sub-Area ID: {subArea.id})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={handleEditSubArea}><Edit3 className="mr-2 h-4 w-4"/> Edit Sub-Area</Button>
            <Button variant="destructive" onClick={handleDeleteSubArea}><Trash2 className="mr-2 h-4 w-4"/> Delete Sub-Area</Button>
            <Button onClick={handleCreateProcess}><PlusCircle className="mr-2 h-4 w-4"/> Create New Process</Button>
            <Button variant="secondary" onClick={handleViewSubAreaModels}><FileText className="mr-2 h-4 w-4"/> View Models ({modelsCount})</Button>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Processes ({processes.length})</h2>
        {processes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {processes.map(proc => (
              <Card key={proc.id} className="hover:shadow-md transition-shadow duration-150 ease-in-out">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Workflow className="mr-2 h-5 w-5 text-indigo-500"/>
                    {proc.name}
                  </CardTitle>
                  <CardDescription>Process ID: {proc.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" onClick={() => handleViewProcess(proc.id)}>
                    View Process / Models
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-6 border-dashed">
             <p className="text-muted-foreground mb-3">No processes have been created for this sub-area yet.</p>
             <Button onClick={handleCreateProcess}><PlusCircle className="mr-2 h-4 w-4"/> Create First Process</Button>
          </Card>
        )}
      </section>
    </div>
  );
};
export default SubAreaDashboard;
