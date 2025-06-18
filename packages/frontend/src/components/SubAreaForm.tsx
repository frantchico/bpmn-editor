import React, { useState, useEffect } from 'react';
import { SubArea } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface SubAreaFormProps {
  subArea?: SubArea | null;
  areaId?: string; // For creating
  isOpen: boolean;
  onClose: () => void;
  onSave: (subAreaData: (Pick<SubArea, 'name'> & { areaId: string }) | (Pick<SubArea, 'name' | 'areaId'> & { id: string })) => void;
}

export const SubAreaForm: React.FC<SubAreaFormProps> = ({ subArea, areaId, isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (subArea) setName(subArea.name);
    else setName('');
  }, [subArea, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert('SubArea name is required.'); return; }
    if (subArea) {
      onSave({ id: subArea.id, name, areaId: subArea.areaId });
    } else if (areaId) {
      onSave({ name, areaId });
    } else {
        alert('Area ID is missing.'); return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{subArea ? 'Edit SubArea' : 'Create New SubArea'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Label htmlFor="subAreaName">Name</Label>
            <Input id="subAreaName" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{subArea ? 'Save Changes' : 'Create SubArea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
