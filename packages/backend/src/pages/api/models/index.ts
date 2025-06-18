// src/pages/api/models/index.ts
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
    // If file doesn't exist or other error, return empty array or handle appropriately
    return [];
  }
}

async function saveModels(models: BpmnModel[]): Promise<void> {
  await fs.writeFile(modelsFilePath, JSON.stringify(models, null, 2), 'utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, Cors({
    methods: ['GET', 'POST', 'OPTIONS'],
    origin: '*', // Be sure to restrict this in production
  }));

  if (req.method === 'GET') {
    try {
      const models = await getModels();
      res.status(200).json(models);
    } catch (error) {
      console.error('Failed to get models:', error);
      res.status(500).json({ message: 'Error retrieving models' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, xml } = req.body;
      if (!name || !xml) {
        return res.status(400).json({ message: 'Name and XML are required' });
      }

      const models = await getModels();
      const now = new Date().toISOString();
      const newModel: BpmnModel = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2), // Simple unique ID
        name,
        xml,
        createdAt: now,
        updatedAt: now,
      };
      models.push(newModel);
      await saveModels(models);
      res.status(201).json(newModel);
    } catch (error) {
      console.error('Failed to create model:', error);
      res.status(500).json({ message: 'Error creating model' });
    }
  } else if (req.method === 'OPTIONS') {
    res.status(200).end(); // Pre-flight request
  }
  else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
