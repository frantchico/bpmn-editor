import React, { useState, useRef } from 'react'; // Added useRef
import { Project, Area, SubArea, Process } from '@/types';
import { ProjectList } from '@/components/ProjectList';
import { AreaList } from '@/components/AreaList';
import { SubAreaList } from '@/components/SubAreaList';
import { ProcessList } from '@/components/ProcessList';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { dataSyncService } from '@/services/dataSyncService';
import toast from 'react-hot-toast'; // Changed to react-hot-toast
import { Download, Upload } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext'; // Added import

export const HierarchyManager: React.FC = () => {
  const { navigateTo } = useNavigation(); // Added useNavigation
  const [currentView, setCurrentView] = useState<'projects' | 'areas' | 'subareas' | 'processes'>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedSubArea, setSelectedSubArea] = useState<SubArea | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const navigateToProjectAreas = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('areas');
  };

  const navigateToAreaSubAreas = (area: Area) => {
    setSelectedArea(area);
    setCurrentView('subareas');
  };

  const navigateToSubAreaProcesses = (subArea: SubArea) => {
    setSelectedSubArea(subArea);
    setCurrentView('processes');
  };

  const navigateToEditor = (processId: string) => {
    if (!processId) {
      console.error("navigateToEditor: processId is missing");
      toast.error("Cannot navigate to editor: Process ID is missing.");
      return;
    }
    navigateTo({ view: 'editor', itemId: processId });
  };

  const handleBreadcrumbNavigation = (
    targetView: 'projects' | 'areas' | 'subareas',
    project?: Project,
    area?: Area
  ) => {
    setCurrentView(targetView);
    if (targetView === 'projects') {
      setSelectedProject(null);
      setSelectedArea(null);
      setSelectedSubArea(null);
    } else if (targetView === 'areas' && project) {
      setSelectedProject(project);
      setSelectedArea(null);
      setSelectedSubArea(null);
    } else if (targetView === 'subareas' && project && area) {
      setSelectedProject(project);
      setSelectedArea(area);
      setSelectedSubArea(null);
    }
  };

  const goBack = () => {
    if (currentView === 'processes' && selectedProject && selectedArea) {
      handleBreadcrumbNavigation('subareas', selectedProject, selectedArea);
    } else if (currentView === 'subareas' && selectedProject) {
      handleBreadcrumbNavigation('areas', selectedProject);
    } else if (currentView === 'areas') {
      handleBreadcrumbNavigation('projects');
    }
  };

  const handleExportData = () => {
    try {
      dataSyncService.exportAllData();
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleImportTrigger = () => {
    importFileRef.current?.click();
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (window.confirm("Importing data will overwrite ALL existing local data. This action cannot be undone. Are you sure you want to proceed?")) {
          const result = dataSyncService.importAllData(content);
          if (result.success) {
            toast.success(result.message);
            window.location.reload();
          } else {
            toast.error(result.message);
          }
        } else {
          toast.info("Data import cancelled.");
        }
      };
      reader.readAsText(file);
      if(importFileRef.current) importFileRef.current.value = ""; // Reset file input
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <Breadcrumbs
          project={selectedProject}
          area={selectedArea}
          subArea={selectedSubArea}
          currentView={currentView}
          onNavigate={handleBreadcrumbNavigation}
        />
        <div className="flex space-x-2 mt-2 sm:mt-0"> {/* Adjusted for mobile stacking */}
          <input type="file" ref={importFileRef} onChange={handleImportData} accept=".json" style={{ display: 'none' }} />
          <Button onClick={handleImportTrigger} variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {currentView !== 'projects' && (
        <Button onClick={goBack} variant="outline" className="mb-4">
          &larr; Back
        </Button>
      )}

      {currentView === 'projects' && (
         <ProjectList onNavigateToProjectAreas={navigateToProjectAreas} />
      )}
      {currentView === 'areas' && selectedProject && (
        <AreaList project={selectedProject} onNavigateToAreaSubAreas={navigateToAreaSubAreas} />
      )}
      {currentView === 'subareas' && selectedArea && selectedProject && (
        <SubAreaList area={selectedArea} onNavigateToSubAreaProcesses={navigateToSubAreaProcesses} project={selectedProject}/>
      )}
      {currentView === 'processes' && selectedSubArea && selectedArea && selectedProject && (
        <ProcessList subArea={selectedSubArea} onNavigateToEditor={navigateToEditor} area={selectedArea} project={selectedProject} />
      )}
    </div>
  );
};
