// src/pages/api/models/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import runMiddleware from '@/lib/cors'; // Adjust path if needed
import Cors from 'cors'; // Added this import based on usage below

type BpmnModel = {
  id: string;
  name: string;
  xml: string;
  createdAt: string;
  updatedAt: string;
};

const modelsFilePath = path.join(process.cwd(), 'data', 'models.json');

async function getModels(): Promise<BpmnModel[]> {
  try {
    await fs.access(modelsFilePath);
    const data = await fs.readFile(modelsFilePath, 'utf-8');
    return JSON.parse(data) as BpmnModel[];
  } catch (error) {
    return [];
  }
}

async function saveModels(models: BpmnModel[]): Promise<void> {
  await fs.writeFile(modelsFilePath, JSON.stringify(models, null, 2), 'utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, Cors({
    methods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
    origin: '*', // Be sure to restrict this in production
  }));

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Model ID must be a string' });
  }

  if (req.method === 'GET') {
    try {
      const models = await getModels();
      const model = models.find(m => m.id === id);
      if (model) {
        res.status(200).json(model);
      } else {
        res.status(404).json({ message: 'Model not found' });
      }
    } catch (error) {
      console.error(`Failed to get model ${id}:`, error);
      res.status(500).json({ message: 'Error retrieving model' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, xml } = req.body;
      // Basic validation: at least one updatable field should be present
      if (!name && !xml) {
        return res.status(400).json({ message: 'Name or XML must be provided for update' });
      }

      let models = await getModels();
      const modelIndex = models.findIndex(m => m.id === id);

      if (modelIndex === -1) {
        return res.status(404).json({ message: 'Model not found for update' });
      }

      const updatedModel = { ...models[modelIndex] };
      if (name) {
        updatedModel.name = name;
      }
      if (xml) {
        updatedModel.xml = xml;
      }
      updatedModel.updatedAt = new Date().toISOString();

      models[modelIndex] = updatedModel;
      await saveModels(models);
      res.status(200).json(updatedModel);
    } catch (error) {
      console.error(`Failed to update model ${id}:`, error);
      res.status(500).json({ message: 'Error updating model' });
    }
  } else if (req.method === 'DELETE') {
    try {
      let models = await getModels();
      const modelExists = models.some(m => m.id === id);
      if (!modelExists) {
        return res.status(404).json({ message: 'Model not found for deletion' });
      }
      models = models.filter(m => m.id !== id);
      await saveModels(models);
      res.status(200).json({ message: 'Model deleted successfully' });
    } catch (error) {
      console.error(`Failed to delete model ${id}:`, error);
      res.status(500).json({ message: 'Error deleting model' });
    }
  } else if (req.method === 'OPTIONS') {
      res.status(200).end(); // Pre-flight request
  }
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
