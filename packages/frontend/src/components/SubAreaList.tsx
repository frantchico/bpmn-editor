import React, { useState, useEffect } from 'react';
import { SubArea, Area, Project } from '@/types'; // Added Project for context
import { subAreaService } from '@/services/subAreaService';
import { SubAreaForm } from './SubAreaForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface SubAreaListProps {
  area: Area;
  project: Project; // For context like breadcrumbs or titles
  onNavigateToSubAreaProcesses: (subArea: SubArea) => void;
}

// Interface for the data coming from SubAreaForm
interface SubAreaFormData extends Omit<SubArea, 'id'> {
  id?: string; // id is optional for creation, present for updates
}

export const SubAreaList: React.FC<SubAreaListProps> = ({ area, project, onNavigateToSubAreaProcesses }) => {
  const [subAreas, setSubAreas] = useState<SubArea[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubArea, setEditingSubArea] = useState<SubArea | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const loadSubAreas = () => setSubAreas(subAreaService.getSubAreas(area.id));

  useEffect(loadSubAreas, [area.id]);

  const handleSaveSubArea = async (subAreaData: SubAreaFormData) => {
    setFormErrorMessage(null);
    try {
      let savedSubArea: SubArea;
      if (subAreaData.id) { // Update path
        const { id, name, code, description, status, projectId } = subAreaData; // Destructure projectId
        // Pass projectId in the updates object for the service to handle
        savedSubArea = await subAreaService.updateSubArea(id, { name, code, description, status, projectId });
        toast.success(`Sub-Area "${savedSubArea.name}" updated successfully.`);
      } else { // Create path
        // subAreaData for create already includes areaId and projectId from the form
        savedSubArea = await subAreaService.createSubArea(subAreaData);
        toast.success(`Sub-Area "${savedSubArea.name}" created successfully in area "${area.name}".`);
      }
      loadSubAreas();
      setIsFormOpen(false);
      setEditingSubArea(null);
      // return true; // Optional: indicate success to form if needed by ProjectForm's onSave structure
    } catch (error: any) {
      const message = error.message || "An unknown error occurred.";
      toast.error(`Failed to save sub-area: ${message}`);
      setFormErrorMessage(message);
      // return false; // Optional: indicate failure
    }
  };

  const handleDeleteSubArea = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sub-area and all its contents? This action cannot be undone.')) {
      const success = subAreaService.deleteSubArea(id);
      if (success) {
        toast.success('Sub-Area deleted successfully.');
        loadSubAreas();
      } else {
        toast.error('Failed to delete sub-area. It might have been already removed.');
      }
    } else {
      toast.info('Sub-Area deletion cancelled.');
    }
  };

  const openCreateForm = () => {
    setEditingSubArea(null);
    setFormErrorMessage(null);
    setIsFormOpen(true);
  };

  const openEditForm = (subAreaToEdit: SubArea) => {
    setEditingSubArea(subAreaToEdit);
    setFormErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSubArea(null);
    setFormErrorMessage(null);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Sub-Areas in {area.name} <span className="text-sm text-muted-foreground">(Project: {project.name})</span></h3>
        <Button onClick={openCreateForm}>Create New Sub-Area</Button>
      </div>
      {subAreas.length === 0 ? (
        <Card><CardContent className="p-4 text-center text-gray-500">No sub-areas yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {subAreas.map((subAreaItem) => (
            <Card key={subAreaItem.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-md">
                  {subAreaItem.name}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="xs"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditForm(subAreaItem)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteSubArea(subAreaItem.id)} className="text-red-500">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Contains processes and models.</CardDescription>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={() => onNavigateToSubAreaProcesses(subAreaItem)}>View Processes</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Add console.log for debugging before rendering SubAreaForm in create mode */}
      {isFormOpen && !editingSubArea && console.log('[SubAreaList] Rendering SubAreaForm for CREATE. areaId:', area.id, 'projectId:', project.id)}

      <SubAreaForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleSaveSubArea}
        subArea={editingSubArea} // null for create mode
        areaId={area.id}         // Passed for create context
        projectId={project.id}   // Ensure this is explicitly passed
        errorMessage={formErrorMessage}
      />
    </div>
  );
};
