import React, { useState, useEffect } from 'react';
import { Area } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface AreaFormProps {
  area?: Area | null; // For editing
  projectId?: string; // For creating, to associate with a project
  isOpen: boolean;
  onClose: () => void;
  onSave: (areaData: (Pick<Area, 'name'> & { projectId: string }) | (Pick<Area, 'name' | 'projectId'> & { id: string })) => void;
  errorMessage?: string | null;
}

export const AreaForm: React.FC<AreaFormProps> = ({ area, projectId, isOpen, onClose, onSave, errorMessage }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) { // Reset form when it's opened
      if (area) {
        setName(area.name);
      } else {
        setName('');
      }
    }
  }, [area, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      // alert('Area name is required.'); // To be replaced by notification system
      return;
    }
    if (area) {
      onSave({ id: area.id, name, projectId: area.projectId });
    } else if (projectId) {
      onSave({ name, projectId });
    } else {
        alert('Project ID is missing.'); // Should not happen in normal flow
        return;
    }
    // onClose(); // Consider successful save before closing. Kept as is from example.
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{area ? 'Edit Area' : 'Create New Area'}</DialogTitle>
          <DialogDescription>
            {area ? `Update details for "${area.name}".` : 'Enter a name for the new area.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="areaName" className="mb-2 block">Area Name</Label>
            <Input
              id="areaName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Onboarding"
              required
              aria-describedby="areaNameError"
            />
            {errorMessage && <p id="areaNameError" className="text-sm text-red-600 mt-1">{errorMessage}</p>}
          </div>
          {/* projectId is usually implicit, not an editable field here */}
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{area ? 'Save Changes' : 'Create Area'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
