import React, { useState, useEffect, useRef } from 'react';
import { Process, SubArea, BpmnModel } from '@/types';
import { processService } from '@/services/processService';
import { modelStorage } from '@/services/modelStorage';
import { ProcessForm } from './ProcessForm'; // Create this form
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreHorizontal, UploadCloud, Edit3, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// import { useNavigate } from 'react-router-dom'; // For navigation to editor

interface ProcessListProps {
  subArea: SubArea; // Parent SubArea
  area: Area; // Grandparent Area
  project: Project; // Great-grandparent project
  onNavigateToEditor: (processId: string) => void;
}

export const ProcessList: React.FC<ProcessListProps> = ({ subArea, area, project, onNavigateToEditor }) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [processModels, setProcessModels] = useState<Record<string, Omit<BpmnModel, 'xml'> | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProcessForUpload, setSelectedProcessForUpload] = useState<string | null>(null);
  // const navigate = useNavigate();

  const loadProcessesAndModels = async () => {
    const procs = processService.getProcesses(subArea.id);
    setProcesses(procs);
    const modelsData: Record<string, Omit<BpmnModel, 'xml'> | null> = {};
    for (const proc of procs) {
      const models = await modelStorage.getModels(proc.id); // Get metadata for models of this process
      modelsData[proc.id] = models.length > 0 ? models[0] : null; // Assuming one model per process for now
    }
    setProcessModels(modelsData);
  };

  useEffect(() => {
    loadProcessesAndModels();
  }, [subArea.id]);

  const handleSaveProcess = (processData: any) => {
    if (processData.id) {
      processService.updateProcess(processData.id, { name: processData.name, subAreaId: processData.subAreaId });
    } else {
      processService.createProcess({ name: processData.name, subAreaId: subArea.id });
    }
    loadProcessesAndModels();
    setIsFormOpen(false);
    setEditingProcess(null);
  };

  const handleDeleteProcess = (id: string) => {
    if (window.confirm('Are you sure you want to delete this process and its BPMN model?')) {
      processService.deleteProcess(id); // This also handles deleting the model via modelStorage
      loadProcessesAndModels();
    }
  };

  // const handleNavigateToEditor = (processId: string) => {
  //    console.log(`Navigate to editor for process ${processId}`);
  //    // navigate(`/editor/${processId}`);
  // };

  const handleUploadClick = (processId: string) => {
    setSelectedProcessForUpload(processId);
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && selectedProcessForUpload) {
      const file = event.target.files[0];
      try {
        await modelStorage.importModel(file, selectedProcessForUpload);
        loadProcessesAndModels(); // Refresh models
        alert('Model imported successfully!'); // Replace with better notification
      } catch (error) {
        console.error('Error importing model:', error);
        alert('Failed to import model. ' + (error instanceof Error ? error.message : ''));
      }
    }
    setSelectedProcessForUpload(null);
    if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
  };

  const handleDeleteModel = async (processId: string) => {
    const modelMeta = processModels[processId];
    if (modelMeta && window.confirm('Are you sure you want to delete the BPMN model for this process?')) {
        try {
            await modelStorage.deleteModel(modelMeta.id); // deleteModel expects metadata ID
            loadProcessesAndModels(); // Refresh
            alert('Model deleted successfully.');
        } catch (error) {
            console.error('Error deleting model:', error);
            alert('Failed to delete model.');
        }
    }
  };


  return (
    <div className="mt-6">
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileImport} accept=".bpmn,.xml,.json" />
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Processes in {subArea.name} <span className="text-sm text-muted-foreground">(Area: {area.name}, Project: {project.name})</span></h3>
        <Button onClick={() => { setEditingProcess(null); setIsFormOpen(true); }}>Create New Process</Button>
      </div>
      {processes.length === 0 ? <Card><CardContent className="p-4 text-center text-gray-500">No processes yet.</CardContent></Card> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {processes.map((process) => (
            <Card key={process.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-md">
                  {process.name}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="xs"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingProcess(process); setIsFormOpen(true); }}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit Process
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUploadClick(process.id)}>
                         <UploadCloud className="mr-2 h-4 w-4" /> Upload/Replace BPMN
                      </DropdownMenuItem>
                       {processModels[process.id] && (
                         <DropdownMenuItem onClick={() => handleDeleteModel(process.id)} className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete BPMN Model
                         </DropdownMenuItem>
                       )}
                      <DropdownMenuItem onClick={() => handleDeleteProcess(process.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Process
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processModels[process.id] ? (
                  <>
                    <CardDescription>Model: {processModels[process.id]?.name}</CardDescription>
                    <Button variant="default" size="sm" className="mt-2 w-full" onClick={() => handleNavigateToEditor(process.id)}>
                       <Eye className="mr-2 h-4 w-4" /> View/Edit Model
                    </Button>
                  </>
                ) : (
                  <>
                    <CardDescription>No BPMN model linked.</CardDescription>
                    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => handleUploadClick(process.id)}>
                      <UploadCloud className="mr-2 h-4 w-4" /> Upload BPMN Model
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ProcessForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingProcess(null); }} onSave={handleSaveProcess} process={editingProcess} subAreaId={subArea.id} />
    </div>
  );
};
