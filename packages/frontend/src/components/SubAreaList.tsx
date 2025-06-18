import React, { useState, useEffect } from 'react';
import { SubArea, Area } from '@/types';
import { subAreaService } from '@/services/subAreaService';
import { SubAreaForm } from './SubAreaForm'; // Create this form
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


interface SubAreaListProps {
  area: Area; // Parent Area
  project: Project; // Grandparent project, for context
  onNavigateToSubAreaProcesses: (subArea: SubArea) => void;
}

export const SubAreaList: React.FC<SubAreaListProps> = ({ area, project, onNavigateToSubAreaProcesses }) => {
  const [subAreas, setSubAreas] = useState<SubArea[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubArea, setEditingSubArea] = useState<SubArea | null>(null);

  const loadSubAreas = () => setSubAreas(subAreaService.getSubAreas(area.id));

  useEffect(loadSubAreas, [area.id]);

  const handleSaveSubArea = (subAreaData: any) => {
    if (subAreaData.id) {
      subAreaService.updateSubArea(subAreaData.id, { name: subAreaData.name, areaId: subAreaData.areaId });
    } else {
      subAreaService.createSubArea({ name: subAreaData.name, areaId: area.id });
    }
    loadSubAreas();
    setIsFormOpen(false);
    setEditingSubArea(null);
  };

  const handleDeleteSubArea = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sub-area and all its contents?')) {
      subAreaService.deleteSubArea(id);
      loadSubAreas();
    }
  };

  // const handleNavigateToProcesses = (subAreaId: string) => {
  //   console.log(`Navigate to processes for sub-area ${subAreaId}`);
  //   // Example: onNavigateToProcesses(subAreaId);
  // };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Sub-Areas in {area.name} <span className="text-sm text-muted-foreground">(Project: {project.name})</span></h3>
        <Button onClick={() => { setEditingSubArea(null); setIsFormOpen(true); }}>Create New Sub-Area</Button>
      </div>
      {subAreas.length === 0 ? <Card><CardContent className="p-4 text-center text-gray-500">No sub-areas yet.</CardContent></Card> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {subAreas.map((subArea) => (
            <Card key={subArea.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-md">
                  {subArea.name}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="xs"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingSubArea(subArea); setIsFormOpen(true); }}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteSubArea(subArea.id)} className="text-red-500">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Contains processes and models.</CardDescription>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={() => onNavigateToSubAreaProcesses(subArea)}>View Processes</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <SubAreaForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingSubArea(null); }} onSave={handleSaveSubArea} subArea={editingSubArea} areaId={area.id} />
    </div>
  );
};
