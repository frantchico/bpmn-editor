import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner'; // Added for notifications

interface ProjectFormProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> | Project) => void; // Updated to include all editable fields
  errorMessage?: string | null;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, isOpen, onClose, onSave, errorMessage }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Planned');
  const [isSaving, setIsSaving] = useState(false); // Added loading state

  useEffect(() => {
    if (isOpen) {
      setIsSaving(false); // Reset saving state when dialog opens
      if (project) {
        setName(project.name);
        setCode(project.code || ''); // Set code if available
        setDescription(project.description || ''); // Set description if available
        setStatus(project.status || 'Planned'); // Set status if available, else default
      } else {
        // Reset for new project
        setName('');
        setCode(''); // Code might be auto-generated elsewhere or entered manually
        setDescription('');
        setStatus('Planned'); // Default status for new projects
      }
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
        toast.error('Project name and code are required.'); // Using toast for validation feedback
        return;
    }

    setIsSaving(true);
    const projectDataToSave = {
      name,
      code,
      description,
      status,
    };

    try {
      if (project) { // Editing existing project
        // Types ensure onSave expects a full Project object for edits if id is present
        await onSave({ ...project, ...projectDataToSave });
        toast.success(`Project '${name}' updated successfully!`);
      } else { // Creating new project
        // Types ensure onSave expects Omit<Project, 'id'|'createdAt'|'updatedAt'> for new
        await onSave(projectDataToSave);
        toast.success(`Project '${name}' created successfully!`);
      }
      onClose(); // Close dialog on successful save
    } catch (error: any) {
      console.error("Failed to save project:", error);
      toast.error(`Failed to save project: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Available statuses for the Select component
  const statuses = [
    { value: 'Planned', label: 'Planned' },
    { value: 'Active', label: 'Active' },
    { value: 'OnHold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {project ? `Update the details for "${project.name}".` : 'Enter details for your new project.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Campaign Q3"
              required
            />
          </div>

          <div>
            <Label htmlFor="projectCode">Project Code</Label>
            <Input
              id="projectCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., MKT-Q3-2024"
              required
              // Consider if code should be read-only for existing projects after generation
              // disabled={!!project} // Example: make code read-only when editing
            />
          </div>

          <div>
            <Label htmlFor="projectDescription">Description</Label>
            <Textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project"
            />
          </div>

          <div>
            <Label htmlFor="projectStatus">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="projectStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errorMessage && <p className="text-sm text-red-600 mt-1">{errorMessage}</p>}

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (project ? 'Saving...' : 'Creating...') : (project ? 'Save Changes' : 'Create Project')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
