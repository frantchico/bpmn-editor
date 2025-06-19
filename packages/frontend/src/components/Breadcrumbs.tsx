import React, { useEffect, useState } from 'react';
import { useNavigation, NavigationView, ViewType } from '@/context/NavigationContext';
import { projectService } from '@/services/projectService';
import { areaService } from '@/services/areaService';
import { subAreaService } from '@/services/subAreaService';
import type { Project, Area, SubArea } from '@/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbPart {
  label: string;
  view: ViewType;
  itemId?: string;
  isCurrent: boolean;
}

const Breadcrumbs: React.FC = () => {
  const { currentView, navigateTo } = useNavigation();
  const [parts, setParts] = useState<BreadcrumbPart[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const buildBreadcrumbs = () => {
      setIsLoading(true);
      const newParts: BreadcrumbPart[] = [];

      const homePart: BreadcrumbPart = {
        label: 'Home',
        view: 'general',
        isCurrent: currentView.view === 'general' && !currentView.itemId
      };
      newParts.push(homePart);

      try {
        let project: Project | undefined | null;
        let area: Area | undefined | null;
        let subArea: SubArea | undefined | null;

        if (currentView.view === 'project' && currentView.itemId) {
          project = projectService.getProject(currentView.itemId);
        } else if (currentView.view === 'area' && currentView.itemId) {
          area = areaService.getArea(currentView.itemId);
          if (area) project = projectService.getProject(area.projectId);
        } else if (currentView.view === 'subarea' && currentView.itemId) {
          subArea = subAreaService.getSubArea(currentView.itemId);
          if (subArea) area = areaService.getArea(subArea.areaId);
          if (area) project = projectService.getProject(area.projectId);
        }

        if (project) {
          // Update 'Home' to not be current if it was, since we have a more specific current item.
          if (homePart.isCurrent && currentView.view !== 'general') homePart.isCurrent = false;

          newParts.push({
            label: project.name || 'Project',
            view: 'project',
            itemId: project.id,
            isCurrent: currentView.view === 'project' && currentView.itemId === project.id,
          });
        }
        if (area) {
          newParts.push({
            label: area.name || 'Area',
            view: 'area',
            itemId: area.id,
            isCurrent: currentView.view === 'area' && currentView.itemId === area.id,
          });
        }
        if (subArea) {
          newParts.push({
            label: subArea.name || 'Sub-Area',
            view: 'subarea',
            itemId: subArea.id,
            isCurrent: currentView.view === 'subarea' && currentView.itemId === subArea.id,
          });
        }
        // Future: Handle 'editor' view, possibly showing model name, process name, etc.
      } catch (error) {
        console.error("Error building breadcrumbs:", error);
        // Potentially set an error state for breadcrumbs display
      }

      setParts(newParts);
      setIsLoading(false);
    };

    buildBreadcrumbs();
  }, [currentView]);

  const handleNavigate = (view: ViewType, itemId?: string) => {
    navigateTo({ view, itemId });
  };

  if (isLoading) {
    return <div className="h-6 mb-4 px-4 md:px-6 py-3 text-sm text-muted-foreground">Loading breadcrumbs...</div>;
  }

  // Do not render if on 'general' view and it's the only item (i.e., parts = [Home (current)])
  if (parts.length === 1 && parts[0].isCurrent && parts[0].view === 'general') {
    return null;
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4 px-4 md:px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-sm">
      <BreadcrumbList>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {part.isCurrent ? (
                <BreadcrumbPage className="font-semibold text-gray-700 dark:text-gray-300">{part.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  onClick={() => handleNavigate(part.view, part.itemId)}
                  className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {part.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < parts.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;
