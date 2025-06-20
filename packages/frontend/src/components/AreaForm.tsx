import React, { useState, useEffect } from 'react';
import { Area, Project } from '@/types'; // Assuming Project type is available
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // For description
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // For status
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { generateAreaCode } from '@/lib/codeGenerator';
import { projectService } from '@/services/projectService';
import { areaService } from '@/services/areaService';
import { toast } from 'sonner'; // Added for notifications

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
  const [status, setStatus] = useState('');
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [codeGenerationError, setCodeGenerationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Added

  useEffect(() => {
    if (isOpen) {
      setCodeGenerationError(null);
      setIsSaving(false); // Reset saving state
      if (area) {
        setName(area.name);
        setCode(area.code);
        setDescription(area.description || '');
        setStatus(area.status || '');
      } else {
        setName('');
        setDescription('');
        setStatus('Active');
        if (projectId) {
          setIsCodeLoading(true);
          setCodeGenerationError(null); // Reset specific code gen error
          // No actual async calls to Promise.all needed since services are sync for now
          try {
            const parentProject = projectService.getProjectById(projectId);
            const existingAreas = areaService.getAreas(projectId);

            if (parentProject) {
              const existingAreaCodes = existingAreas.map(a => a.code);
              const newCode = generateAreaCode(parentProject.code, existingAreaCodes);
              setCode(newCode);
            } else {
              const err = `Parent project (ID: ${projectId}) not found for code generation.`;
              console.error(err);
              toast.error(err); // Use toast for code gen error
              setCodeGenerationError(err); // Still set local error if needed for inline display
              setCode('');
            }
          } catch (error: any) {
            const err = `Error preparing form: ${error?.message || String(error)}`;
            console.error(err);
            toast.error(err); // Use toast
            setCodeGenerationError(err);
            setCode('');
          } finally {
            setIsCodeLoading(false);
          }
        } else {
          setCode('');
          const err = "Project ID is missing, cannot generate area code.";
          setCodeGenerationError(err);
          toast.error(err); // Toast for missing projectId
        }
      }
    }
  }, [area, projectId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[AreaForm] handleSubmit entered.');
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Area name and code are required.');
      return;
    }

    setIsSaving(true);
    const areaDataToSave = {
      name,
      code,
      description,
      status,
      projectId: area ? area.projectId : projectId!,
    };

    try {
      if (area) {
        console.log('[AreaForm] About to call onSave with areaDataToSave (update):', JSON.stringify({ ...areaDataToSave, id: area.id }, null, 2));
        await onSave({ ...areaDataToSave, id: area.id });
        toast.success(`Area '${name}' updated successfully!`);
      } else if (projectId) {
        console.log('[AreaForm] About to call onSave with areaDataToSave (create):', JSON.stringify(areaDataToSave, null, 2));

        console.log('[AreaForm] Attempting direct synchronous test call to onSave...');
        try {
          if (typeof onSave === 'function') {
            (onSave as Function)("DIRECT TEST CALL FROM AREA FORM"); // Cast to generic Function to bypass specific type for this test call
          } else {
            console.log('[AreaForm] onSave is not a function, cannot make direct test call.');
          }
        } catch (e: any) {
          console.error('[AreaForm] Error during DIRECT TEST CALL to onSave:', e);
        }

        console.log('[AreaForm] typeof onSave before calling:', typeof onSave);
        if (typeof onSave === 'function') {
          console.log('[AreaForm] onSave.toString():', onSave.toString());
        }
        await onSave(areaDataToSave);
        toast.success(`Area '${name}' created successfully!`);
      } else {
        // This case should ideally be prevented by UI logic
        toast.error('Project ID is missing. Cannot save area.');
        setIsSaving(false);
        return;
      }
      onClose(); // Close dialog on success
    } catch (error: any) {
      console.error("Failed to save area:", error);
      toast.error(`Failed to save area: ${error.message}`);
    } finally {
      setIsSaving(false);
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
            <Input id="areaCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., CUST-ONB" required disabled={isCodeLoading} />
            {isCodeLoading && <p className="text-sm text-muted-foreground">Generating code...</p>}
            {codeGenerationError && <p className="text-sm text-red-600 mt-1">{codeGenerationError}</p>}
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
            <DialogClose asChild><Button type="button" variant="outline" onClick={onClose} disabled={isSaving || isCodeLoading}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSaving || isCodeLoading}>
              {isSaving ? (area ? 'Saving...' : 'Creating...') : (area ? 'Save Changes' : 'Create Area')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
