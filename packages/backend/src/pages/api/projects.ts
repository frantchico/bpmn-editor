import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import runMiddleware from '@/lib/cors'; // Assuming cors middleware from existing setup
import Cors from 'cors';

// Define Project type similar to frontend
type Project = {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

const projectsFilePath = path.join(process.cwd(), 'data', 'projects.json');

async function getProjectsFromFile(): Promise<Project[]> {
  try {
    await fs.access(projectsFilePath);
    const data = await fs.readFile(projectsFilePath, 'utf-8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // File not found, return empty array
    }
    console.error('Error reading projects.json:', error);
    throw error; // Or return empty array for other errors too
  }
}

async function saveProjectsToFile(projects: Project[]): Promise<void> {
  await fs.writeFile(projectsFilePath, JSON.stringify(projects, null, 2), 'utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, Cors({ methods: ['GET', 'POST', 'OPTIONS'], origin: '*' }));

  if (req.method === 'GET') {
    try {
      const projects = await getProjectsFromFile();
      res.status(200).json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving projects' });
    }
  } else if (req.method === 'POST') {
    try {
      // For simplicity, this POST replaces all projects.
      // A more robust API would handle individual creation, updates, deletions.
      const projectsToSave: Project[] = req.body;
      if (!Array.isArray(projectsToSave)) {
        return res.status(400).json({ message: 'Invalid request body: Expected an array of projects.' });
      }
      await saveProjectsToFile(projectsToSave);
      res.status(200).json({ message: 'Projects saved successfully.' });
    } catch (error) {
      console.error('Error saving projects:', error);
      res.status(500).json({ message: 'Error saving projects' });
    }
  } else if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
