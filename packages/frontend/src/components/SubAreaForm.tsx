import React, { useState, useEffect } from 'react';
import { SubArea, Area } from '@/types'; // Assuming Area type is available
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { generateSubAreaCode } from '@/lib/codeGenerator';
import { areaService } from '@/services/areaService';
import { subAreaService } from '@/services/subAreaService';
import toast from 'react-hot-toast'; // Added

interface SubAreaFormProps {
  subArea?: SubArea | null;
  areaId?: string; // For creating, to associate with an area
  isOpen: boolean;
  onClose: () => void;
  onSave: (subAreaData: Omit<SubArea, 'id'> | SubArea) => void;
  errorMessage?: string | null;
}

export const SubAreaForm: React.FC<SubAreaFormProps> = ({ subArea, areaId, isOpen, onClose, onSave, errorMessage }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [codeGenerationError, setCodeGenerationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Added

  useEffect(() => {
    if (isOpen) {
      setCodeGenerationError(null);
      setIsSaving(false); // Reset
      if (subArea) {
        setName(subArea.name);
        setCode(subArea.code);
        setDescription(subArea.description || '');
        setStatus(subArea.status || '');
      } else {
        setName('');
        setDescription('');
        setStatus('Active');
        if (areaId) {
          setIsCodeLoading(true);
          setCodeGenerationError(null);
          try {
            const parentArea = areaService.getAreaById(areaId);
            const existingSubAreas = subAreaService.getSubAreas(areaId);

            if (parentArea) {
              const existingSubAreaCodes = existingSubAreas.map(sa => sa.code);
              const newCode = generateSubAreaCode(parentArea.code, existingSubAreaCodes);
              setCode(newCode);
            } else {
              const err = `Parent area (ID: ${areaId}) not found for code generation.`;
              console.error(err);
              toast.error(err);
              setCodeGenerationError(err);
              setCode('');
            }
          } catch (error: any) {
            const err = `Error preparing form: ${error?.message || String(error)}`;
            console.error(err);
            toast.error(err);
            setCodeGenerationError(err);
            setCode('');
          } finally {
            setIsCodeLoading(false);
          }
        } else {
          setCode('');
          const err = "Area ID is missing, cannot generate sub-area code.";
          setCodeGenerationError(err);
          toast.error(err);
        }
      }
    }
  }, [subArea, areaId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SubAreaForm] handleSubmit called. Initial Name:', name, 'Initial Code:', code, 'areaId prop:', areaId, 'subArea prop:', subArea);

    let currentName = name;
    let currentCode = code;

    if (typeof currentName !== 'string') {
      console.warn('[SubAreaForm] Name was not a string, defaulting to empty string. Original value:', currentName);
      currentName = ''; // Default to empty string if undefined or other type
    }
    if (typeof currentCode !== 'string') {
      console.warn('[SubAreaForm] Code was not a string, defaulting to empty string. Original value:', currentCode);
      currentCode = ''; // Default to empty string if undefined or other type
    }

    // Use currentName and currentCode for trim validation and in subAreaDataToSave
    console.log('[SubAreaForm] Validating name and code (after ensuring they are strings). Name:', currentName, 'Code:', currentCode);
    if (!currentName.trim() || !currentCode.trim()) { // Now this trim is safer
      console.log('[SubAreaForm] Name or code is empty after trim.');
      toast.error('SubArea name and code are required and cannot be empty.');
      return;
    }

    // Crucial: Ensure projectId is correctly passed for new SubAreas.
    // If editing, subArea.projectId is used. If creating, the projectId prop (passed from parent context) is used.
    // const currentProjectId = subArea ? subArea.projectId : projectId; // projectId removed from SubArea and props
    // console.log('[SubAreaForm] Validating currentProjectId for new subArea. currentProjectId:', currentProjectId);
    // if (!currentProjectId && !subArea) { // projectId removed
    //     console.log('[SubAreaForm] currentProjectId is missing for a new subArea.');
    //     toast.error('Project ID is missing for the new SubArea. Cannot save.');
    //     return;
    // }

    setIsSaving(true);
    const subAreaDataToSave = {
      name: currentName,
      code: currentCode,
      description, // Assuming description and status are less problematic
      status,
      areaId: subArea ? subArea.areaId : areaId!,
      // projectId: currentProjectId!, // projectId removed
    };

    try {
      if (subArea) {
        // For updates, you might also want to log, but the task specifically asked for create path
        console.log('[SubAreaForm] About to call onSave (Update). Data:', JSON.stringify({ ...subAreaDataToSave, id: subArea.id }, null, 2));
        await onSave({ ...subAreaDataToSave, id: subArea.id } as SubArea); // Cast to SubArea for update
        toast.success(`SubArea '${currentName}' updated successfully!`); // Use currentName
      } else if (areaId) { // currentProjectId removed from condition
        console.log('[SubAreaForm] About to call onSave (Create). Data:', JSON.stringify(subAreaDataToSave, null, 2));
        await onSave(subAreaDataToSave as Omit<SubArea, 'id'>); // Cast to Omit<SubArea, 'id'> for create
        // toast.success(`SubArea '${currentName}' created successfully!`); // Use currentName, Removed as per previous request
      } else {
        // console.log('[SubAreaForm] Missing areaId or currentProjectId for create.'); // currentProjectId removed
        console.log('[SubAreaForm] Missing areaId for create.');
        toast.error('Area ID is missing. Cannot save sub-area.'); // Updated error message
        setIsSaving(false);
        return;
      }
      onClose(); // Close dialog on success
    } catch (error: any) {
      console.error('[SubAreaForm] Error during onSave call:', error);
      console.error("Failed to save sub-area:", error);
      toast.error(`Failed to save sub-area: ${error.message}`);
    } finally {
      setIsSaving(false);
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
            <Input id="subAreaCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., AREA-01.01" required disabled={isCodeLoading} />
            {isCodeLoading && <p className="text-sm text-muted-foreground">Generating code...</p>}
            {codeGenerationError && <p className="text-sm text-red-600 mt-1">{codeGenerationError}</p>}
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
            <DialogClose asChild><Button type="button" variant="outline" onClick={onClose} disabled={isSaving || isCodeLoading}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSaving || isCodeLoading}>
              {isSaving ? (subArea ? 'Saving...' : 'Creating...') : (subArea ? 'Save Changes' : 'Create SubArea')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
