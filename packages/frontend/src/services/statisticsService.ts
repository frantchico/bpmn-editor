import { projectService } from './projectService';
import { areaService } from './areaService';
import { subAreaService } from './subAreaService';
import { processService } from './processService';
import { modelStorage } from './modelStorage';
import type { GeneralStatistics, BpmnModel, Area, SubArea, Process } from '../types';

export const statisticsService = {
  getGeneralStatistics: (): GeneralStatistics => {
    return {
      totalProjects: projectService.getProjects().length,
      totalAreas: areaService.getAreas().length,
      totalSubAreas: subAreaService.getSubAreas().length,
      totalProcesses: processService.getProcesses().length, // Assumes getProcesses() gets all
      totalModels: modelStorage.getTotalModelsCount(),
    };
  },

  getModelsForProject: (projectId: string): BpmnModel[] => {
    let models: BpmnModel[] = [];
    const areas: Area[] = areaService.getAreas(projectId);
    for (const area of areas) {
      const subAreas: SubArea[] = subAreaService.getSubAreas(area.id);
      for (const subArea of subAreas) {
        const processes: Process[] = processService.getProcesses(subArea.id);
        for (const process of processes) {
          models = models.concat(modelStorage.getModelsForProcess(process.id));
        }
      }
    }
    return models;
  },

  getModelsForArea: (areaId: string): BpmnModel[] => {
    let models: BpmnModel[] = [];
    const subAreas: SubArea[] = subAreaService.getSubAreas(areaId);
    for (const subArea of subAreas) {
        const processes: Process[] = processService.getProcesses(subArea.id);
        for (const process of processes) {
            models = models.concat(modelStorage.getModelsForProcess(process.id));
        }
    }
    return models;
  },

  getModelsForSubArea: (subAreaId: string): BpmnModel[] => {
    let models: BpmnModel[] = [];
    const processes: Process[] = processService.getProcesses(subAreaId);
    for (const process of processes) {
        models = models.concat(modelStorage.getModelsForProcess(process.id));
    }
    return models;
  },
};
