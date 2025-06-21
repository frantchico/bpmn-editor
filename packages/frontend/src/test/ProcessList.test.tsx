import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProcessList } from '../components/ProcessList';
import { Process, SubArea, BpmnModel, Area, Project } from '../types';
import { processService } from '../services/processService';
import { modelStorage } from '../services/modelStorage';
import toast from 'react-hot-toast'; // Import toast

// Mock services
jest.mock('../services/processService');
jest.mock('../services/modelStorage');
jest.mock('react-hot-toast'); // Mock toast

const mockProject: Project = { id: 'proj1', name: 'Test Project', description: 'A project for testing' };
const mockArea: Area = { id: 'area1', name: 'Test Area', description: 'An area for testing', projectId: 'proj1' };
const mockSubArea: SubArea = { id: 'sub1', name: 'Test SubArea', description: 'A sub-area for testing', areaId: 'area1' };

const mockProcessWithModel: Process = {
  id: 'proc1',
  name: 'Process With Model',
  description: 'This process has a model',
  subAreaId: 'sub1',
};

const mockProcessWithoutModel: Process = {
  id: 'proc2',
  name: 'Process Without Model',
  description: 'This process does not have a model',
  subAreaId: 'sub1',
};

const mockModel: Omit<BpmnModel, 'xml'> = {
  id: 'model1',
  name: 'MyModel.bpmn',
  processId: 'proc1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('ProcessList Component', () => {
  let mockOnNavigateToEditor: jest.Mock;

  beforeEach(() => {
    mockOnNavigateToEditor = jest.fn();
    (processService.getProcesses as jest.Mock).mockReturnValue([]);
    (modelStorage.getModels as jest.Mock).mockResolvedValue([]);
    (toast.info as jest.Mock).mockImplementation(() => {}); // Mock toast.info
    (toast.success as jest.Mock).mockImplementation(() => {});
    (toast.error as jest.Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('When a process has a BPMN model', () => {
    beforeEach(async () => {
      (processService.getProcesses as jest.Mock).mockReturnValue([mockProcessWithModel]);
      // Simulate that getModels for proc1 returns the mockModel
      (modelStorage.getModels as jest.Mock).mockImplementation(async (processId: string) => {
        if (processId === mockProcessWithModel.id) {
          return [mockModel];
        }
        return [];
      });

      render(
        <ProcessList
          subArea={mockSubArea}
          area={mockArea}
          project={mockProject}
          onNavigateToEditor={mockOnNavigateToEditor}
        />
      );
      // Wait for async operations like loading models
      await screen.findByText(`Model: ${mockModel.name}`);
    });

    it('renders "Editar Modelo" and "Fazer Deploy" buttons', () => {
      expect(screen.getByRole('button', { name: /Editar Modelo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Fazer Deploy/i })).toBeInTheDocument();
    });

    it('ensures "Editar Modelo" and "Fazer Deploy" buttons are enabled', () => {
      expect(screen.getByRole('button', { name: /Editar Modelo/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /Fazer Deploy/i })).toBeEnabled();
    });

    it('displays the model name', () => {
      expect(screen.getByText(`Model: ${mockModel.name}`)).toBeInTheDocument();
    });

    it('calls onNavigateToEditor with the correct process ID when "Editar Modelo" is clicked', () => {
      fireEvent.click(screen.getByRole('button', { name: /Editar Modelo/i }));
      expect(mockOnNavigateToEditor).toHaveBeenCalledTimes(1);
      expect(mockOnNavigateToEditor).toHaveBeenCalledWith(mockProcessWithModel.id);
    });

    it('shows a toast message when "Fazer Deploy" is clicked (placeholder action)', () => {
        fireEvent.click(screen.getByRole('button', { name: /Fazer Deploy/i }));
        expect(toast.info).toHaveBeenCalledWith('Deploy action to be implemented.');
    });
  });

  describe('When a process does not have a BPMN model', () => {
    beforeEach(async () => {
      (processService.getProcesses as jest.Mock).mockReturnValue([mockProcessWithoutModel]);
      // Simulate that getModels for proc2 returns an empty array
      (modelStorage.getModels as jest.Mock).mockImplementation(async (processId: string) => {
        if (processId === mockProcessWithoutModel.id) {
          return [];
        }
        return []; // Default empty for others
      });

      render(
        <ProcessList
          subArea={mockSubArea}
          area={mockArea}
          project={mockProject}
          onNavigateToEditor={mockOnNavigateToEditor}
        />
      );
      // Wait for the component to update based on no model
      await screen.findByText('No BPMN model linked.');
    });

    it('renders "Editar Modelo" and "Fazer Deploy" buttons', () => {
      expect(screen.getByRole('button', { name: /Editar Modelo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Fazer Deploy/i })).toBeInTheDocument();
    });

    it('ensures "Editar Modelo" and "Fazer Deploy" buttons are disabled', () => {
      expect(screen.getByRole('button', { name: /Editar Modelo/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Fazer Deploy/i })).toBeDisabled();
    });

    it('displays "No BPMN model linked." description', () => {
      expect(screen.getByText('No BPMN model linked.')).toBeInTheDocument();
    });
  });
});
