import React, { useState, useEffect } from 'react';
import { Area } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface AreaFormProps {
  area?: Area | null; // For editing
  projectId?: string; // For creating, to associate with a project
  isOpen: boolean;
  onClose: () => void;
  onSave: (areaData: (Pick<Area, 'name'> & { projectId: string }) | (Pick<Area, 'name' | 'projectId'> & { id: string })) => void;
}

export const AreaForm: React.FC<AreaFormProps> = ({ area, projectId, isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (area) {
      setName(area.name);
    } else {
      setName('');
    }
  }, [area, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Area name is required.'); // Replace with proper notification
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{area ? 'Edit Area' : 'Create New Area'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="areaName" className="text-right">
                Name
              </Label>
              <Input
                id="areaName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{area ? 'Save Changes' : 'Create Area'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
