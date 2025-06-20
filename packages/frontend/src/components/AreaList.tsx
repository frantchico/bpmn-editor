import React, { useState, useEffect } from 'react';
import { Area, Project } from '@/types';
import { areaService } from '@/services/areaService';
import { AreaForm } from './AreaForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner'; // Keeping sonner for now for existing delete toast

interface AreaListProps {
  project: Project;
  areas: Area[]; // Add areas as a direct prop
  onNavigateToAreaSubAreas: (area: Area, project: Project) => void;
  onOpenCreateAreaForm: () => void; // New prop for creating
  onOpenEditAreaForm: (area: Area) => void; // New prop for editing
}

export const AreaList: React.FC<AreaListProps> = ({ project, areas, onNavigateToAreaSubAreas, onOpenCreateAreaForm, onOpenEditAreaForm }) => {
  // Removed local state for areas, isFormOpen, editingArea, formErrorMessage
  // Removed loadAreas and its useEffect

  // Removed handleSaveArea

  const handleDeleteArea = (id: string) => {
    if (window.confirm('Are you sure you want to delete this area and all its contents? This action cannot be undone.')) {
      const success = areaService.deleteArea(id);
      if (success) {
        toast.success('Area deleted successfully.');
        // loadAreas(); // Parent (ProjectDashboard) will refresh its areas via fetchData and pass down
      } else {
        toast.error('Failed to delete area. It might have been already removed.');
      }
    } else {
      toast.info('Area deletion cancelled.');
    }
  };

  // openCreateForm now directly calls the prop
  const openCreateForm = () => {
    onOpenCreateAreaForm();
  };

  // openEditForm now directly calls the prop
  const openEditForm = (area: Area) => {
    onOpenEditAreaForm(area);
  };

  // Removed handleFormClose

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Areas in {project.name}</h2>
        <Button onClick={onOpenCreateAreaForm}>Create New Area</Button>
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
                      <DropdownMenuItem onClick={() => onOpenEditAreaForm(area)}>Edit</DropdownMenuItem>
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

      {/* AreaForm instance removed from AreaList */}
    </div>
  );
};
