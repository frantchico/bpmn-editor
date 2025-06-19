import React, { useState, useEffect } from 'react';
import { Process } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface ProcessFormProps {
  process?: Process | null;
  subAreaId?: string; // For creating
  isOpen: boolean;
  onClose: () => void;
  onSave: (processData: (Pick<Process, 'name'> & { subAreaId: string }) | (Pick<Process, 'name' | 'subAreaId'> & { id: string })) => void;
  errorMessage?: string | null;
}

export const ProcessForm: React.FC<ProcessFormProps> = ({ process, subAreaId, isOpen, onClose, onSave, errorMessage }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (process) setName(process.name);
      else setName('');
    }
  }, [process, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ProcessForm] handleSubmit - Props: process=', process, 'subAreaId=', subAreaId, 'Current form name:', name);
    if (!name.trim()) {
      // alert('Process name is required.'); // To be replaced
      // Consider setting a local error message if form needs to display it directly
      return;
    }
    if (process) { // Editing existing process
      onSave({ id: process.id, name, subAreaId: process.subAreaId });
    } else if (subAreaId) { // Creating new process
      console.log('[ProcessForm] Calling onSave for CREATE with: name=', name, 'subAreaId=', subAreaId);
      onSave({ name, subAreaId });
    } else {
        // This case should ideally not be reached if the form is opened correctly with a subAreaId for creation.
        alert('SubArea ID is missing. Cannot save process.');
        return;
    }
    // onClose(); // Consider successful save before closing
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{process ? 'Edit Process' : 'Create New Process'}</DialogTitle>
          <DialogDescription>
            {process ? `Update details for "${process.name}".` : 'Enter a name for the new process.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="processName" className="mb-2 block">Process Name</Label>
            <Input
              id="processName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., New Client Registration"
              required
              aria-describedby="processNameError"
            />
            {errorMessage && <p id="processNameError" className="text-sm text-red-600 mt-1">{errorMessage}</p>}
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{process ? 'Save Changes' : 'Create Process'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
