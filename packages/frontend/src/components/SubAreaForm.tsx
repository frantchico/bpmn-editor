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
    if (!name.trim()) {
      // alert('SubArea name is required.'); // To be replaced
      return;
    }
    if (subArea) {
      onSave({ id: subArea.id, name, areaId: subArea.areaId });
    } else if (areaId) {
      onSave({ name, areaId });
    } else {
        alert('Area ID is missing.'); // Should not happen
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
