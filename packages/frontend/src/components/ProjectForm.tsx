import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface ProjectFormProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Pick<Project, 'name'> | (Pick<Project, 'name'> & { id: string })) => void;
  errorMessage?: string | null;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, isOpen, onClose, onSave, errorMessage }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setName(project.name);
      } else {
        setName('');
      }
    }
  }, [project, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ProjectForm] handleSubmit - name:', name, 'existing project:', project);
    // Client-side pre-emptive check for empty name (optional, as service validates too)
    if (!name.trim()) {
        // The `required` attribute on Input provides browser feedback.
        // Service layer will catch this and ProjectList will set errorMessage.
        // If specific form-level error state were desired here *before* submitting:
        // setLocalErrorMessage("Project name cannot be empty.");
        // return;
    }
    if (project) {
      onSave({ id: project.id, name });
    } else {
      onSave({ name });
    }
    // onClose() is NOT called here. ProjectList controls dialog closure based on save success/failure.
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {project ? `Update the details for "${project.name}".` : 'Enter a name for your new project.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="projectName" className="mb-2 block">
              Project Name
            </Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Campaign Q3"
              required // Basic HTML5 validation for empty
              aria-describedby="projectNameError"
            />
            {errorMessage && <p id="projectNameError" className="text-sm text-red-600 mt-1">{errorMessage}</p>}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{project ? 'Save Changes' : 'Create Project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
