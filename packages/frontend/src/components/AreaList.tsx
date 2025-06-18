import React, { useState, useEffect } from 'react';
import { Area, Project } from '@/types';
import { areaService } from '@/services/areaService';
import { AreaForm } from './AreaForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface AreaListProps {
  project: Project; // The parent project
  onNavigateToAreaSubAreas: (area: Area) => void;
}

export const AreaList: React.FC<AreaListProps> = ({ project, onNavigateToAreaSubAreas }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  const loadAreas = () => {
    setAreas(areaService.getAreas(project.id));
  };

  useEffect(() => {
    loadAreas();
  }, [project.id]);

  const handleSaveArea = (areaData: any) => {
    if (areaData.id) {
      areaService.updateArea(areaData.id, { name: areaData.name, projectId: areaData.projectId });
    } else {
      areaService.createArea({ name: areaData.name, projectId: project.id });
    }
    loadAreas();
    setIsFormOpen(false);
    setEditingArea(null);
  };

  const handleDeleteArea = (id: string) => {
    if (window.confirm('Are you sure you want to delete this area and all its contents?')) {
      areaService.deleteArea(id);
      loadAreas();
    }
  };

  // const handleNavigateToSubAreas = (areaId: string) => {
  //   console.log(`Navigate to sub-areas for area ${areaId}`);
  //   // Example: onNavigateToSubAreas(areaId);
  // };


  return (
    <div className="mt-6"> {/* Adjusted margin for sub-listing */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Areas in {project.name}</h2>
        <Button onClick={() => { setEditingArea(null); setIsFormOpen(true); }}>Create New Area</Button>
      </div>

      {areas.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">No areas in this project yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Card key={area.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {area.name}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingArea(area); setIsFormOpen(true); }}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteArea(area.id)} className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Contains sub-areas and processes.</CardDescription>
                     <Button variant="outline" size="sm" className="mt-4" onClick={() => onNavigateToAreaSubAreas(area)}>
                   View Sub-Areas
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AreaForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingArea(null); }}
        onSave={handleSaveArea}
        area={editingArea}
        projectId={project.id}
      />
    </div>
  );
};
