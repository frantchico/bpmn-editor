import React, { useState, useEffect } from 'react';
import { Process } // Assuming Process type exists
from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface ProcessFormProps {
  process?: Process | null;
  subAreaId?: string; // For creating
  isOpen: boolean;
  onClose: () => void;
  onSave: (processData: (Pick<Process, 'name'> & { subAreaId: string }) | (Pick<Process, 'name' | 'subAreaId'> & { id: string })) => void;
}

export const ProcessForm: React.FC<ProcessFormProps> = ({ process, subAreaId, isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (process) setName(process.name);
    else setName('');
  }, [process, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert('Process name is required.'); return; }
    if (process) {
      onSave({ id: process.id, name, subAreaId: process.subAreaId });
    } else if (subAreaId) {
      onSave({ name, subAreaId });
    } else {
        alert('SubArea ID is missing.'); return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{process ? 'Edit Process' : 'Create New Process'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Label htmlFor="processName">Name</Label>
            <Input id="processName" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{process ? 'Save Changes' : 'Create Process'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
