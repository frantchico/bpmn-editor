import React, { useState, useEffect } from 'react';
import { SubArea } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface SubAreaFormProps {
  subArea?: SubArea | null;
  areaId?: string; // For creating
  isOpen: boolean;
  onClose: () => void;
  onSave: (subAreaData: (Pick<SubArea, 'name'> & { areaId: string }) | (Pick<SubArea, 'name' | 'areaId'> & { id: string })) => void;
  errorMessage?: string | null;
}

export const SubAreaForm: React.FC<SubAreaFormProps> = ({ subArea, areaId, isOpen, onClose, onSave, errorMessage }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (subArea) setName(subArea.name);
      else setName('');
    }
  }, [subArea, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SubAreaForm] handleSubmit - Props: subArea=', subArea, 'areaId=', areaId, 'Current form name:', name);
    if (!name.trim()) {
      // alert('SubArea name is required.'); // To be replaced
      // Consider setting a local error message if form needs to display it directly
      return;
    }
    if (subArea) { // Editing existing subArea
      onSave({ id: subArea.id, name, areaId: subArea.areaId });
    } else if (areaId) { // Creating new subArea
      console.log('[SubAreaForm] Calling onSave for CREATE with: name=', name, 'areaId=', areaId);
      onSave({ name, areaId });
    } else {
        // This case should ideally not be reached if the form is opened correctly with an areaId for creation.
        alert('Area ID is missing. Cannot save sub-area.');
        return;
    }
    // onClose(); // Consider successful save before closing
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subArea ? 'Edit SubArea' : 'Create New SubArea'}</DialogTitle>
          <DialogDescription>
            {subArea ? `Update details for "${subArea.name}".` : 'Enter a name for the new sub-area.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subAreaName" className="mb-2 block">SubArea Name</Label>
            <Input
              id="subAreaName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., KYC Process"
              required
              aria-describedby="subAreaNameError"
            />
            {errorMessage && <p id="subAreaNameError" className="text-sm text-red-600 mt-1">{errorMessage}</p>}
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{subArea ? 'Save Changes' : 'Create SubArea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
