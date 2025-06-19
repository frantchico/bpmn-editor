import React, { useState, useEffect } from 'react';
import { SubArea, Area } from '@/types'; // Assuming Area type is available
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { generateSubAreaCode } from '@/lib/codeGenerator';

// Mock services - replace with actual service calls
const mockAreaService = {
  getAreaById: async (id: string): Promise<Area | null> => {
    console.log(`[MockService] Fetching area with id: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (id === "area1") { // Corresponds to parent Area of SubArea for generation
      return { id: "area1", name: "Core Systems", code: "ALPHA-01", projectId: "proj1", description: "Core systems area", status: "Active" };
    }
    return null;
  },
};
const mockSubAreaService = {
  getSubAreasByAreaId: async (areaId: string): Promise<SubArea[]> => {
    console.log(`[MockService] Fetching subareas for area id: ${areaId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (areaId === "area1") {
      return [
        { id: "sub1", name: "Identity Management", code: "ALPHA-01.01", areaId: "area1", projectId: "proj1", description: "Handles user identity", status: "Active" },
      ];
    }
    return [];
  },
};

interface SubAreaFormProps {
  subArea?: SubArea | null;
  areaId?: string; // For creating, to associate with an area
  projectId?: string; // Passed down for context, new SubAreas need it.
  isOpen: boolean;
  onClose: () => void;
  onSave: (subAreaData: Omit<SubArea, 'id' | 'areaId' | 'projectId'> & { areaId: string, projectId: string } | SubArea) => void;
  errorMessage?: string | null;
}

export const SubAreaForm: React.FC<SubAreaFormProps> = ({ subArea, areaId, projectId, isOpen, onClose, onSave, errorMessage }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (subArea) { // Editing existing subArea
        setName(subArea.name);
        setCode(subArea.code);
        setDescription(subArea.description || '');
        setStatus(subArea.status || '');
        // projectId is part of subArea object, no need to set explicitly if it's already there
      } else { // Creating new subArea
        setName('');
        setDescription('');
        setStatus('Active'); // Default status
        if (areaId) {
          setIsGeneratingCode(true);
          const fetchAndGenerateCode = async () => {
            try {
              const parentArea = await mockAreaService.getAreaById(areaId);
              const existingSubAreas = await mockSubAreaService.getSubAreasByAreaId(areaId);
              if (parentArea) {
                const existingSubAreaCodes = existingSubAreas.map(sa => sa.code);
                const newCode = generateSubAreaCode(parentArea.code, existingSubAreaCodes);
                setCode(newCode);
              } else {
                console.error("Parent area not found for code generation.");
                setCode('');
              }
            } catch (error) {
              console.error("Error generating sub-area code:", error);
              setCode('');
            } finally {
              setIsGeneratingCode(false);
            }
          };
          fetchAndGenerateCode();
        } else {
          setCode('');
        }
      }
    }
  }, [subArea, areaId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('SubArea name and code are required.');
      return;
    }

    // Crucial: Ensure projectId is correctly passed for new SubAreas.
    // If editing, subArea.projectId is used. If creating, the projectId prop (passed from parent context, e.g. Area page) is used.
    const currentProjectId = subArea ? subArea.projectId : projectId;
    if (!currentProjectId && !subArea) { // Check only if creating new and projectId is missing
        alert('Project ID is missing for the new SubArea. Cannot save.');
        return;
    }

    const subAreaData = {
      name,
      code,
      description,
      status,
      areaId: subArea ? subArea.areaId : areaId!,
      projectId: currentProjectId!, // Assert non-null as it's checked or from existing subArea
    };

    if (subArea) { // Editing
      onSave({ ...subAreaData, id: subArea.id });
    } else if (areaId && currentProjectId) { // Creating
      onSave(subAreaData);
    } else {
      // This case should be prevented by earlier checks.
      alert('Area ID or Project ID is missing. Cannot save sub-area.');
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subArea ? 'Edit SubArea' : 'Create New SubArea'}</DialogTitle>
          <DialogDescription>
            {subArea ? `Update details for "${subArea.name}".` : 'Enter details for the new sub-area.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subAreaName">SubArea Name</Label>
            <Input id="subAreaName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., KYC Process" required />
          </div>
          <div>
            <Label htmlFor="subAreaCode">SubArea Code</Label>
            <Input id="subAreaCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., AREA-01.01" required disabled={isGeneratingCode} />
            {isGeneratingCode && <p className="text-sm text-muted-foreground">Generating code...</p>}
          </div>
          <div>
            <Label htmlFor="subAreaDescription">Description</Label>
            <Textarea id="subAreaDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the sub-area" />
          </div>
          <div>
            <Label htmlFor="subAreaStatus">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="subAreaStatus">
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
            <Button type="submit" disabled={isGeneratingCode}>{subArea ? 'Save Changes' : 'Create SubArea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
