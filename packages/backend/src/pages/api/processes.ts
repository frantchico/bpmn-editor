import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import runMiddleware from '@/lib/cors';
import Cors from 'cors';

type Process = {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  subAreaId: string; // Changed from areaId
  model: string; // Added - XML of the BPMN diagram
};

const processesFilePath = path.join(process.cwd(), 'data', 'processes.json');

async function getItemsFromFile(): Promise<Process[]> {
  try {
    await fs.access(processesFilePath);
    const data = await fs.readFile(processesFilePath, 'utf-8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    console.error('Error reading processes.json:', error);
    throw error;
  }
}

async function saveItemsToFile(items: Process[]): Promise<void> {
  await fs.writeFile(processesFilePath, JSON.stringify(items, null, 2), 'utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, Cors({ methods: ['GET', 'POST', 'OPTIONS'], origin: '*' }));
  if (req.method === 'GET') {
    try {
      const items = await getItemsFromFile();
      res.status(200).json(items);
    } catch (error) { res.status(500).json({ message: 'Error retrieving processes' }); }
  } else if (req.method === 'POST') {
    try {
      const itemsToSave: Process[] = req.body;
      if (!Array.isArray(itemsToSave)) return res.status(400).json({ message: 'Expected array of processes.' });
      await saveItemsToFile(itemsToSave);
      res.status(200).json({ message: 'Processes saved.' });
    } catch (error) { console.error('Error saving processes:', error); res.status(500).json({ message: 'Error saving processes' }); }
  } else if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
