import React, { useState, useEffect } from 'react';
import { Process, SubArea } from '@/types'; // Assuming SubArea type is available
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { generateProcessCode } from '@/lib/codeGenerator';
import { generateMinimalBpmnXml } from '@/lib/bpmnUtils';
import MemoizedBpmnEditor from './BpmnEditor';
import { subAreaService } from '@/services/subAreaService';
import { processService } from '@/services/processService';
import { toast } from 'sonner'; // Added

interface ProcessFormProps {
  process?: Process | null;
  subAreaId?: string; // For creating, to associate with a sub-area
  // projectId?: string; // Removed
  isOpen: boolean;
  onClose: () => void;
  onSave: (processData: Omit<Process, 'id' | 'projectId'> | Omit<Process, 'projectId'>) => void;
  errorMessage?: string | null;
}

export const ProcessForm: React.FC<ProcessFormProps> = ({ process, subAreaId, isOpen, onClose, onSave, errorMessage }) => { // projectId removed from destructuring
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [model, setModel] = useState('');
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [codeGenerationError, setCodeGenerationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Added

  useEffect(() => {
    if (isOpen) {
      setCodeGenerationError(null);
      setIsSaving(false); // Reset isSaving
      if (process) {
        setName(process.name);
        setCode(process.code);
        setDescription(process.description || '');
        setStatus(process.status || '');

        if (process.model && process.model.trim() !== "") {
          setModel(process.model);
        } else if (process.name) {
          setModel(generateMinimalBpmnXml(process.name));
        } else {
          setModel(generateMinimalBpmnXml("Untitled Process"));
        }
        setEditorKey(prevKey => prevKey + 1);
      } else { // Creating new process
        setName('');
        setDescription('');
        setStatus('Active');
        setModel('');
        setEditorKey(prevKey => prevKey + 1);
        if (subAreaId) {
          setIsCodeLoading(true);
          const fetchAndGenerateCode = async () => {
            try {
              // Use actual services
              const parentSubArea = subAreaService.getSubAreaById(subAreaId); // Sync
              const existingProcesses = processService.getProcesses(subAreaId);

              if (parentSubArea) {
                const existingProcessCodes = existingProcesses.map(p => p.code);
                const newCode = generateProcessCode(parentSubArea.code, existingProcessCodes);
                setCode(newCode);
              } else {
                const err = `Parent sub-area (ID: ${subAreaId}) not found for code generation.`;
                console.error(err);
                toast.error(err); // Toast notification
                setCodeGenerationError(err);
                setCode('');
              }
            } catch (error: any) {
              const err = `Error preparing form: ${error?.message || String(error)}`;
              console.error(err);
              toast.error(err); // Toast notification
              setCodeGenerationError(err);
              setCode('');
            } finally {
              setIsCodeLoading(false);
            }
          };
          fetchAndGenerateCode();
        } else {
          setCode('');
          const err = "SubArea ID is missing, cannot generate process code.";
          setCodeGenerationError(err);
          toast.error(err); // Toast notification
        }
      }
    }
  }, [process, subAreaId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Process name and code are required.');
      return;
    }

    // const currentProjectId = process ? process.projectId : projectId; // Removed
    // if (!currentProjectId && !process) { // Removed
    //     toast.error('Project ID is missing for the new Process. Cannot save.');
    //     return;
    // }

    setIsSaving(true); // Set saving state
    let dataToSave: Omit<Process, 'id' | 'projectId'> = { // Ensure type matches onSave, projectId is removed
      name,
      code,
      description,
      status,
      model, // Current model value from state
      subAreaId: process ? process.subAreaId : subAreaId!,
      // projectId: currentProjectId!, // Removed
      version: (process?.version || 0) + 1, // Increment version or start at 1
      updatedAt: new Date().toISOString(), // Set current timestamp
    };

    // If creating a new process and the model is empty, generate a minimal one.
    // This ensures that 'name' is available for generateMinimalBpmnXml.
    if (!process && !dataToSave.model && dataToSave.name) {
      const initialXml = generateMinimalBpmnXml(dataToSave.name);
      dataToSave.model = initialXml;
    }

    // Ensure all fields for Process type are present, satisfying Omit<Process, 'id'> | Process
    // For new processes, 'id' is omitted. For existing, it will be spread from 'process' later.
    // 'version' and 'updatedAt' are now explicitly set.
    // The 'process' prop is aliased as process in the component's props.
    // Let's ensure dataToSave conforms to what onSave expects.
    // If 'process' exists (editing), then 'id' will be spread.
    // If creating, 'id' is not part of dataToSave yet.
    // The 'onSave' prop type is (processData: Omit<Process, 'id'> | Process)

    // If model was generated by handleSubmit, it's in dataToSave.model
      // If user manually cleared it, it might be empty.
      // If editor updated it via handleEditorModelChange, it's in dataToSave.model
      // The BpmnEditor's own save button would have updated modelStorage.
      // This 'model' field in dataToSave should be the most current XML.

    // The 'process' prop contains the original process data if editing
    try {
      if (process) {
        // For update, we pass all fields. The 'id' comes from 'process'.
        // The 'projectId' if present on 'process' will be part of '...process' spread,
        // but 'onSave' expects Omit<Process, 'projectId'> if id is present.
        // So, we explicitly create the object expected by onSave.
        const updateData: Omit<Process, 'projectId'> = {
            ...(process), // spread existing process, includes id, and existing projectId
            ...dataToSave // spread fields from form, this has no projectId
        };
        delete (updateData as any).projectId; // Ensure projectId is not in the final saved object for update consistency
        await onSave(updateData);
        toast.success(`Process '${dataToSave.name}' updated successfully!`);
      } else if (subAreaId) { // currentProjectId removed from condition
        await onSave(dataToSave); // dataToSave is already Omit<Process, 'id' | 'projectId'>
        toast.success(`Process '${dataToSave.name}' created successfully!`);
      } else {
        toast.error('SubArea ID is missing. Cannot save process.'); // Updated error message
        setIsSaving(false);
        return;
      }
      onClose(); // Close dialog on successful save
    } catch (error: any) {
      console.error("Failed to save process:", error);
      toast.error(`Failed to save process: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorModelChange = (newXml: string) => {
    setModel(newXml); // Update form's model state when editor's content changes (e.g., after its internal save)
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* Increased width for the dialog to accommodate the editor better */}
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{process ? 'Edit Process' : 'Create New Process'}</DialogTitle>
          <DialogDescription>
            {process ? `Update details for "${process.name}".` : 'Enter details for the new process.'}
          </DialogDescription>
        </DialogHeader>
        {/* Removed form tag here as BpmnEditor might have its own form controls or save is outside typical form submission */}
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="processName">Process Name</Label>
              <Input id="processName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., New Client Registration" required />
            </div>
            <div>
              <Label htmlFor="processCode">Process Code</Label>
              <Input id="processCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., SUBAREA-01.01.01" required disabled={isCodeLoading} />
              {isCodeLoading && <p className="text-sm text-muted-foreground">Generating code...</p>}
              {codeGenerationError && <p className="text-sm text-red-600 mt-1">{codeGenerationError}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="processDescription">Description</Label>
            <Textarea id="processDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the process" />
          </div>
          <div>
            <Label htmlFor="processStatus">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="processStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="Deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* BPMN Editor Integration */}
          <div className="h-[500px] border rounded-md"> {/* Editor needs a defined height */}
            <Label className="p-2 block">BPMN Model</Label>
            <MemoizedBpmnEditor
              key={editorKey} // Force re-mount when key changes
              processId={process?.id || ''} // Pass empty string if no process id (for new unsaved process)
              processName={name} // Pass current form name for fallback naming in editor
              initialXml={model} // Pass the model state from form
              onSave={handleEditorModelChange} // Update form's model state when editor saves
              // onElementSelect, onExport can be wired up if needed
            />
          </div>

          {errorMessage && <p className="text-sm text-red-600 mt-1">{errorMessage}</p>}
        </div>
        <DialogFooter className="pt-4">
          <DialogClose asChild><Button type="button" variant="outline" onClick={onClose} disabled={isSaving || isCodeLoading}>Cancel</Button></DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSaving || isCodeLoading}>
            {isSaving ? (process ? 'Saving...' : 'Creating...') : (process ? 'Save Changes' : 'Create Process')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
