import React, { useState, useEffect } from 'react';
import { Area, Project } from '@/types';
import { areaService } from '@/services/areaService';
import { AreaForm } from './AreaForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface AreaListProps {
  project: Project;
  onNavigateToAreaSubAreas: (area: Area, project: Project) => void;
}

export const AreaList: React.FC<AreaListProps> = ({ project, onNavigateToAreaSubAreas }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const loadAreas = () => {
    setAreas(areaService.getAreas(project.id));
  };

  useEffect(() => {
    loadAreas();
  }, [project.id]);

  const handleSaveArea = (areaData: Pick<Area, 'name' | 'projectId'> | (Pick<Area, 'name' | 'projectId'> & {id: string})) => {
    setFormErrorMessage(null);
    try {
      let savedArea: Area;
      if ('id' in areaData) {
        // Ensure projectId is not lost during update, though not directly editable in this form
        savedArea = areaService.updateArea(areaData.id, { name: areaData.name });
        toast.success(`Area "${savedArea.name}" updated successfully.`);
      } else {
        savedArea = areaService.createArea({ name: areaData.name, projectId: project.id });
        toast.success(`Area "${savedArea.name}" created successfully in project "${project.name}".`);
      }
      loadAreas();
      setIsFormOpen(false);
      setEditingArea(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to save area: ${message}`);
      setFormErrorMessage(message);
    }
  };

  const handleDeleteArea = (id: string) => {
    if (window.confirm('Are you sure you want to delete this area and all its contents? This action cannot be undone.')) {
      const success = areaService.deleteArea(id);
      if (success) {
        toast.success('Area deleted successfully.');
        loadAreas();
      } else {
        toast.error('Failed to delete area. It might have been already removed.');
      }
    } else {
      toast.info('Area deletion cancelled.');
    }
  };

  const openCreateForm = () => {
    setEditingArea(null);
    setFormErrorMessage(null);
    setIsFormOpen(true);
  };

  const openEditForm = (area: Area) => {
    setEditingArea(area);
    setFormErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingArea(null);
    setFormErrorMessage(null);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Areas in {project.name}</h2>
        <Button onClick={openCreateForm}>Create New Area</Button>
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
                      <DropdownMenuItem onClick={() => openEditForm(area)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteArea(area.id)} className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Contains sub-areas and processes.</CardDescription>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => onNavigateToAreaSubAreas(area, project)}>
                   View Sub-Areas
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AreaForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleSaveArea}
        area={editingArea}
        projectId={project.id} // For create context
        errorMessage={formErrorMessage}
      />
    </div>
  );
};
