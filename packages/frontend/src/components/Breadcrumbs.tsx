import React from 'react';
import { Project, Area, SubArea } from '@/types'; // Assuming Process is not shown in breadcrumb path items, but the current page is a process list
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  project?: Project | null;
  area?: Area | null;
  subArea?: SubArea | null;
  currentView: 'projects' | 'areas' | 'subareas' | 'processes';
  onNavigate: (targetView: 'projects' | 'areas' | 'subareas', project?: Project, area?: Area) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ project, area, subArea, currentView, onNavigate }) => {
  const items: BreadcrumbItem[] = [];

  items.push({
    label: 'Projects',
    onClick: currentView !== 'projects' ? () => onNavigate('projects') : undefined,
  });

  if (project && (currentView === 'areas' || currentView === 'subareas' || currentView === 'processes')) {
    items.push({
      label: project.name,
      onClick: currentView !== 'areas' ? () => onNavigate('areas', project) : undefined,
    });
  }

  if (area && project && (currentView === 'subareas' || currentView === 'processes')) {
    items.push({
      label: area.name,
      onClick: currentView !== 'subareas' ? () => onNavigate('subareas', project, area) : undefined,
    });
  }

  if (subArea && area && project && currentView === 'processes') {
    items.push({
      label: subArea.name, // The list of processes is under this subArea, so it's the last clickable item.
      // No onClick needed if we are currently viewing its processes.
    });
  }


  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-4">
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {item.onClick ? (
            <button onClick={item.onClick} className="hover:underline focus:outline-none">
              {item.label}
            </button>
          ) : (
            <span className="font-semibold text-primary">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
