// src/pages/api/models/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import runMiddleware from '@/lib/cors'; // Adjust path if needed
import Cors from 'cors'; // Added this import based on usage below
import { z } from 'zod';

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
    await fs.access(modelsFilePath); // Check if file exists
    const data = await fs.readFile(modelsFilePath, 'utf-8');
    if (!data.trim()) { // Handle empty file case
      return [];
    }
    try {
      const parsedData = JSON.parse(data);
      if (Array.isArray(parsedData)) {
        return parsedData as BpmnModel[];
      } else {
        console.error('Error: models.json content is not an array. File content:', data);
        return [];
      }
    } catch (parseError) {
      console.error('Error parsing models.json:', parseError, 'File content:', data);
      return [];
    }
  } catch (accessError) {
    // If file doesn't exist (e.g., ENOENT), it's not an error, just means no models.
    // Check if it's a "file not found" type of error
    if ((accessError as NodeJS.ErrnoException).code === 'ENOENT') {
      // Optionally, create the file with an empty array here if desired
      // await fs.writeFile(modelsFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    // For other access errors, log it and return empty
    console.error('Error accessing models.json:', accessError);
    return [];
  }
}

async function saveModels(models: BpmnModel[]): Promise<void> {
  await fs.writeFile(modelsFilePath, JSON.stringify(models, null, 2), 'utf-8');
}

const CreateModelSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }),
  xml: z.string().min(1, { message: "XML content cannot be empty" }),
});

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
    const validationResult = CreateModelSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request body',
        errors: validationResult.error.flatten().fieldErrors
      });
    }

    const { name, xml } = validationResult.data; // Use validated data

    try {
      const models = await getModels();
      const now = new Date().toISOString();
      const newModel: BpmnModel = { // Ensure BpmnModel is defined or imported
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        name, // from validationResult.data
        xml,  // from validationResult.data
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
