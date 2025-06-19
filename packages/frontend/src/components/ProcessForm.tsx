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

// Mock services - replace with actual service calls
const mockSubAreaService = {
  getSubAreaById: async (id: string): Promise<SubArea | null> => {
    console.log(`[MockService] Fetching subarea with id: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (id === "sub1") { // Corresponds to parent SubArea of Process for generation
      return { id: "sub1", name: "Identity Management", code: "ALPHA-01.01", areaId: "area1", projectId: "proj1", description: "Handles user identity", status: "Active" };
    }
    return null;
  },
};
const mockProcessService = {
  getProcessesBySubAreaId: async (subAreaId: string): Promise<Process[]> => {
    console.log(`[MockService] Fetching processes for subarea id: ${subAreaId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (subAreaId === "sub1") {
      return [
        { id: "proc1", name: "User Verification", code: "ALPHA-01.01.01", subAreaId: "sub1", projectId: "proj1", description: "Verifies user docs", status: "Active", model: "<xml>...</xml>" },
      ];
    }
    return [];
  },
};

interface ProcessFormProps {
  process?: Process | null;
  subAreaId?: string; // For creating, to associate with a sub-area
  projectId?: string; // Passed down for context, new Processes need it.
  isOpen: boolean;
  onClose: () => void;
  // The Process type already includes subAreaId and projectId.
  // For creation, these are passed explicitly. For update, they are part of the process object.
  onSave: (processData: Omit<Process, 'id'> | Process) => void;
  errorMessage?: string | null;
}

export const ProcessForm: React.FC<ProcessFormProps> = ({ process, subAreaId, projectId, isOpen, onClose, onSave, errorMessage }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [model, setModel] = useState(''); // For BPMN XML
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (process) { // Editing existing process
        setName(process.name);
        setCode(process.code);
        setDescription(process.description || '');
        setStatus(process.status || '');
        setModel(process.model || '');
        // projectId is part of process object
      } else { // Creating new process
        setName('');
        setDescription('');
        setStatus('Active'); // Default status
        setModel(''); // Default empty model
        if (subAreaId) {
          setIsGeneratingCode(true);
          const fetchAndGenerateCode = async () => {
            try {
              const parentSubArea = await mockSubAreaService.getSubAreaById(subAreaId);
              const existingProcesses = await mockProcessService.getProcessesBySubAreaId(subAreaId);
              if (parentSubArea) {
                const existingProcessCodes = existingProcesses.map(p => p.code);
                const newCode = generateProcessCode(parentSubArea.code, existingProcessCodes);
                setCode(newCode);
              } else {
                console.error("Parent sub-area not found for code generation.");
                setCode('');
              }
            } catch (error) {
              console.error("Error generating process code:", error);
              setCode('');
            } finally {
              setIsGeneratingCode(false);
            }
          };
          fetchAndGenerateCode();
        } else {
          setCode('');
        }
      }
    }
  }, [process, subAreaId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Process name and code are required.');
      return;
    }

    const currentProjectId = process ? process.projectId : projectId;
    if (!currentProjectId && !process) {
        alert('Project ID is missing for the new Process. Cannot save.');
        return;
    }

    let dataToSave: Omit<Process, 'id'> | Process = {
      name,
      code,
      description,
      status,
      model, // Current model value from state
      subAreaId: process ? process.subAreaId : subAreaId!,
      projectId: currentProjectId!,
    };

    // If creating a new process and the model is empty, generate a minimal one.
    if (!process && !dataToSave.model && dataToSave.name) {
      const initialXml = generateMinimalBpmnXml(dataToSave.name);
      dataToSave.model = initialXml;
      // Optionally, update the form state as well, so the user sees the generated XML
      // setModel(initialXml); // This might be good for UX, but ensure it doesn't cause re-render issues with submit
    }

    if (process) { // Editing
      onSave({ ...dataToSave, id: process.id });
    } else if (subAreaId && currentProjectId) { // Creating
      // If model was generated, it's already in dataToSave
      onSave(dataToSave as Omit<Process, 'id'>); // Cast needed as id is not present for new
    } else {
      alert('SubArea ID or Project ID is missing. Cannot save process.');
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg"> {/* Increased width for model field */}
        <DialogHeader>
          <DialogTitle>{process ? 'Edit Process' : 'Create New Process'}</DialogTitle>
          <DialogDescription>
            {process ? `Update details for "${process.name}".` : 'Enter details for the new process.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="processName">Process Name</Label>
            <Input id="processName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., New Client Registration" required />
          </div>
          <div>
            <Label htmlFor="processCode">Process Code</Label>
            <Input id="processCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., SUBAREA-01.01.01" required disabled={isGeneratingCode} />
            {isGeneratingCode && <p className="text-sm text-muted-foreground">Generating code...</p>}
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
          <div>
            <Label htmlFor="processModel">BPMN Model (XML)</Label>
            <Textarea
              id="processModel"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Paste BPMN XML here or leave empty"
              rows={6}
            />
          </div>
          {errorMessage && <p className="text-sm text-red-600 mt-1">{errorMessage}</p>}
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isGeneratingCode}>{process ? 'Save Changes' : 'Create Process'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
