import React, { useState, useEffect, useRef } from 'react';
import { Process, SubArea, BpmnModel, Area, Project } from '@/types'; // Added Area, Project
import { processService } from '@/services/processService';
import { modelStorage } from '@/services/modelStorage';
import { ProcessForm } from './ProcessForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreHorizontal, UploadCloud, Edit3, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast'; // Corrected import

interface ProcessListProps {
  subArea: SubArea;
  area: Area; // For context
  project: Project; // For context
  onNavigateToEditor: (processId: string) => void;
}

export const ProcessList: React.FC<ProcessListProps> = ({ subArea, area, project, onNavigateToEditor }) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [processModels, setProcessModels] = useState<Record<string, Omit<BpmnModel, 'xml'> | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProcessForUpload, setSelectedProcessForUpload] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const loadProcessesAndModels = async () => {
    const procs = processService.getProcesses(subArea.id);
    setProcesses(procs);
    const modelsData: Record<string, Omit<BpmnModel, 'xml'> | null> = {};
    for (const proc of procs) {
      const models = await modelStorage.getModels(proc.id);
      modelsData[proc.id] = models.length > 0 ? models[0] : null;
    }
    setProcessModels(modelsData);
  };

  useEffect(() => {
    loadProcessesAndModels();
  }, [subArea.id]);

  const handleSaveProcess = (processData: Omit<Process, 'id' | 'projectId'> | Omit<Process, 'projectId'>) => {
    setFormErrorMessage(null);
    try {
      let savedProcess: Process;
      if ('id' in processData && processData.id) {
        // Type assertion to satisfy service's expected full Process for updates (minus id, subAreaId, projectId)
        // processData here is Omit<Process, 'projectId'> & {id: string}
        savedProcess = processService.updateProcess(processData.id, processData as Partial<Omit<Process, 'id' | 'subAreaId' | 'projectId'>>);
        toast.success(`Process "${savedProcess.name}" updated successfully.`);
      } else {
        // processData here is Omit<Process, 'id' | 'projectId'>
        // We need to add subAreaId explicitly as it's from ProcessList's context for new items
        const dataForService: Omit<Process, 'id' | 'projectId'> = {
          ...(processData as Omit<Process, 'id' | 'projectId'>), // Cast to assure TypeScript
          subAreaId: subArea.id, // Add subAreaId from context
        };
        // projectId will be derived by the service
        savedProcess = processService.createProcess(dataForService);
        toast.success(`Process "${savedProcess.name}" created successfully in sub-area "${subArea.name}".`);
      }
      loadProcessesAndModels(); // Ensure this is called
      setIsFormOpen(false);
      setEditingProcess(null);
    } catch (error: any) { // Keep error handling
      const message = error.message || "An unknown error occurred.";
      toast.error(`Failed to save process: ${message}`);
      setFormErrorMessage(message);
    }
  };

  const handleDeleteProcess = (id: string) => {
    if (window.confirm('Are you sure you want to delete this process and its BPMN model? This action cannot be undone.')) {
      const success = processService.deleteProcess(id);
      if (success) {
        toast.success('Process and its associated model deleted successfully.');
        loadProcessesAndModels();
      } else {
        toast.error('Failed to delete process. It might have been already removed.');
      }
    } else {
      toast.info('Process deletion cancelled.');
    }
  };

  const handleUploadClick = (processId: string) => {
    setSelectedProcessForUpload(processId);
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && selectedProcessForUpload) {
      const file = event.target.files[0];
      const processId = selectedProcessForUpload;
      setSelectedProcessForUpload(null);
      if(fileInputRef.current) fileInputRef.current.value = "";

      try {
        await modelStorage.importModel(file, processId);
        toast.success(`Model "${file.name}" imported successfully for the process!`);
        loadProcessesAndModels();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error during import.";
        toast.error(`Failed to import model: ${message}`);
      }
    }
  };

  const handleDeleteModel = async (processId: string) => {
    const modelMeta = processModels[processId];
    if (modelMeta && modelMeta.id && window.confirm('Are you sure you want to delete the BPMN model for this process?')) {
      try {
        const success = await modelStorage.deleteModel(modelMeta.id);
        if (success) {
          toast.success('BPMN model deleted successfully.');
          loadProcessesAndModels();
        } else {
          toast.error('Failed to delete BPMN model. It might have been already removed or an error occurred.');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error during model deletion.";
        toast.error(`Failed to delete BPMN model: ${message}`);
      }
    } else if (!modelMeta || !modelMeta.id) {
      toast.error('Could not delete model: Model information or ID is missing.');
    } else {
      toast.info('BPMN model deletion cancelled.');
    }
  };

  const openCreateForm = () => {
    setEditingProcess(null);
    setFormErrorMessage(null);
    setIsFormOpen(true);
  };

  const openEditForm = (processToEdit: Process) => {
    setEditingProcess(processToEdit);
    setFormErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProcess(null);
    setFormErrorMessage(null);
  };

  return (
    <div className="mt-6">
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileImport} accept=".bpmn,.xml,.json" />
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Processes in {subArea.name} <span className="text-sm text-muted-foreground">(Area: {area.name}, Project: {project.name})</span></h3>
        <Button onClick={openCreateForm}>Create New Process</Button>
      </div>
      {processes.length === 0 ? (
        <Card><CardContent className="p-4 text-center text-gray-500">No processes yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {processes.map((processItem) => (
            <Card key={processItem.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-md">
                  {processItem.name}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="xs"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditForm(processItem)}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit Process
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUploadClick(processItem.id)}>
                         <UploadCloud className="mr-2 h-4 w-4" /> Upload/Replace BPMN
                      </DropdownMenuItem>
                       {processModels[processItem.id] && (
                         <DropdownMenuItem onClick={() => handleDeleteModel(processItem.id)} className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete BPMN Model
                         </DropdownMenuItem>
                       )}
                      <DropdownMenuItem onClick={() => handleDeleteProcess(processItem.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Process
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processModels[processItem.id] ? (
                  <>
                    <CardDescription>Model: {processModels[processItem.id]?.name}</CardDescription>
                    <div className="mt-2 space-y-2">
                      <Button variant="default" size="sm" className="w-full" onClick={() => onNavigateToEditor(processItem.id)}>
                        <Edit3 className="mr-2 h-4 w-4" /> Editar Modelo
                      </Button>
                      <Button variant="default" size="sm" className="w-full" onClick={() => {/* Placeholder for deploy action */ toast.info('Deploy action to be implemented.');}}>
                        <UploadCloud className="mr-2 h-4 w-4" /> Fazer Deploy
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <CardDescription>No BPMN model linked.</CardDescription>
                    <div className="mt-2 space-y-2">
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        <Edit3 className="mr-2 h-4 w-4" /> Editar Modelo
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        <UploadCloud className="mr-2 h-4 w-4" /> Fazer Deploy
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ProcessForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleSaveProcess}
        process={editingProcess}
        subAreaId={subArea.id} // For create context
        errorMessage={formErrorMessage}
      />
    </div>
  );
};
