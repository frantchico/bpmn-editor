import React, { useState } from 'react';
import { Project, Area, SubArea, Process } from '@/types';
import { ProjectList } from '@/components/ProjectList';
import { AreaList } from '@/components/AreaList';
import { SubAreaList } from '@/components/SubAreaList';
import { ProcessList } from '@/components/ProcessList';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/Breadcrumbs'; // Import Breadcrumbs

// This component will replace the direct usage of ProjectList in App.tsx or Dashboard.tsx later
export const HierarchyManager: React.FC = () => {
  const [currentView, setCurrentView] = useState<'projects' | 'areas' | 'subareas' | 'processes'>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedSubArea, setSelectedSubArea] = useState<SubArea | null>(null);

  // Modify ProjectList, AreaList, SubAreaList to accept navigation functions as props
  // For now, we'll update them to call these handlers directly.
  // This is a simplified navigation. A router library would be better.

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

  // This would navigate to the BPMN editor, which is a separate page/route
  const navigateToEditor = (processId: string) => {
    // For now, just log. In a real app, this would change window.location or use a router.
    console.log(`Navigate to editor for process: ${processId}`);
    // Example: window.location.href = `/editor/${processId}`;
    alert(`Navigation to editor for process ${processId} (actual navigation not implemented in this step).`);
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

  // We need to update ProjectList, AreaList, SubAreaList to call these handlers.
  // This subtask will focus on HierarchyManager and App.tsx.
  // A follow-up subtask will adjust the List components.

  return (
    <div className="container mx-auto p-4">
      <Breadcrumbs
        project={selectedProject}
        area={selectedArea}
        subArea={selectedSubArea}
        currentView={currentView}
        onNavigate={handleBreadcrumbNavigation}
      />
      {currentView !== 'projects' && (
        <Button onClick={goBack} variant="outline" className="mb-4">
          &larr; Back
        </Button>
      )}

      {currentView === 'projects' && (
        // ProjectList will need an onNavigateToProjectAreas prop
         <ProjectList onNavigateToProjectAreas={navigateToProjectAreas} />
      )}
      {currentView === 'areas' && selectedProject && (
        // AreaList will need project and onNavigateToAreaSubAreas props
        <AreaList project={selectedProject} onNavigateToAreaSubAreas={navigateToAreaSubAreas} />
      )}
      {currentView === 'subareas' && selectedArea && selectedProject && (
        // SubAreaList will need area and onNavigateToSubAreaProcesses props
        <SubAreaList area={selectedArea} onNavigateToSubAreaProcesses={navigateToSubAreaProcesses} project={selectedProject}/>
      )}
      {currentView === 'processes' && selectedSubArea && selectedArea && selectedProject && (
        // ProcessList will need subArea and onNavigateToEditor props
        <ProcessList subArea={selectedSubArea} onNavigateToEditor={navigateToEditor} area={selectedArea} project={selectedProject} />
      )}
    </div>
  );
};
