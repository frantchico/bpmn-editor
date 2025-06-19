import React, { useState, useEffect } from 'react';
import { Area, Project } from '@/types'; // Assuming Project type is available
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // For description
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // For status
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { generateAreaCode } from '@/lib/codeGenerator';
// Mock services - replace with actual service calls
const mockProjectService = {
  getProjectById: async (id: string): Promise<Project | null> => {
    console.log(`[MockService] Fetching project with id: ${id}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Example project data - adapt as needed
    if (id === "proj1") {
      return { id: "proj1", name: "Project Alpha", code: "ALPHA", description: "Proj Alpha desc", status: "Active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }
    return null;
  },
};
const mockAreaService = {
  getAreasByProjectId: async (projectId: string): Promise<Area[]> => {
    console.log(`[MockService] Fetching areas for project id: ${projectId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    // Example existing areas - adapt as needed
    if (projectId === "proj1") {
      return [
        { id: "area1", name: "Core Systems", code: "ALPHA-01", projectId: "proj1", description: "Core systems area", status: "Active" },
      ];
    }
    return [];
  },
};

interface AreaFormProps {
  area?: Area | null;
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (areaData: Omit<Area, 'id' | 'projectId'> & { projectId: string } | Area) => void;
  errorMessage?: string | null;
  isLoading?: boolean; // Optional: for external loading state control
}

export const AreaForm: React.FC<AreaFormProps> = ({ area, projectId, isOpen, onClose, onSave, errorMessage }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(''); // Default or fetched
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (area) { // Editing existing area
        setName(area.name);
        setCode(area.code);
        setDescription(area.description || '');
        setStatus(area.status || '');
      } else { // Creating new area
        setName('');
        // Code is generated below
        setDescription('');
        setStatus('Active'); // Default status for new areas
        if (projectId) {
          setIsGeneratingCode(true);
          const fetchAndGenerateCode = async () => {
            try {
              const parentProject = await mockProjectService.getProjectById(projectId);
              const existingAreas = await mockAreaService.getAreasByProjectId(projectId);
              if (parentProject) {
                const existingAreaCodes = existingAreas.map(a => a.code);
                const newCode = generateAreaCode(parentProject.code, existingAreaCodes);
                setCode(newCode);
              } else {
                console.error("Parent project not found for code generation.");
                setCode(''); // Or handle error appropriately
              }
            } catch (error) {
              console.error("Error generating area code:", error);
              setCode(''); // Or handle error appropriately
            } finally {
              setIsGeneratingCode(false);
            }
          };
          fetchAndGenerateCode();
        } else {
          setCode(''); // No projectId, cannot generate code
        }
      }
    }
  }, [area, projectId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      // Proper error handling/notification should be implemented
      alert('Area name and code are required.');
      return;
    }
    const areaData = {
      name,
      code,
      description,
      status,
      projectId: area ? area.projectId : projectId!, // Ensure projectId is correctly assigned
    };

    if (area) { // Editing
      onSave({ ...areaData, id: area.id });
    } else if (projectId) { // Creating
      onSave(areaData);
    } else {
      alert('Project ID is missing. Cannot save area.');
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{area ? 'Edit Area' : 'Create New Area'}</DialogTitle>
          <DialogDescription>
            {area ? `Update details for "${area.name}".` : 'Enter details for the new area.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="areaName">Area Name</Label>
            <Input id="areaName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Customer Onboarding" required />
          </div>
          <div>
            <Label htmlFor="areaCode">Area Code</Label>
            <Input id="areaCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., CUST-ONB" required disabled={isGeneratingCode} />
            {isGeneratingCode && <p className="text-sm text-muted-foreground">Generating code...</p>}
          </div>
          <div>
            <Label htmlFor="areaDescription">Description</Label>
            <Textarea id="areaDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the area" />
          </div>
          <div>
            <Label htmlFor="areaStatus">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="areaStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {errorMessage && <p className="text-sm text-red-600 mt-1">{errorMessage}</p>}
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isGeneratingCode}>{area ? 'Save Changes' : 'Create Area'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
