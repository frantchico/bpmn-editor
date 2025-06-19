import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import runMiddleware from '@/lib/cors';
import Cors from 'cors';
type SubArea = { id: string; name: string; areaId: string; };

const subareasFilePath = path.join(process.cwd(), 'data', 'subareas.json');

async function getItemsFromFile(): Promise<SubArea[]> {
  try {
    await fs.access(subareasFilePath);
    const data = await fs.readFile(subareasFilePath, 'utf-8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    console.error('Error reading subareas.json:', error);
    throw error;
  }
}

async function saveItemsToFile(items: SubArea[]): Promise<void> {
  await fs.writeFile(subareasFilePath, JSON.stringify(items, null, 2), 'utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, Cors({ methods: ['GET', 'POST', 'OPTIONS'], origin: '*' }));
  if (req.method === 'GET') {
    try {
      const items = await getItemsFromFile();
      res.status(200).json(items);
    } catch (error) { res.status(500).json({ message: 'Error retrieving subareas' }); }
  } else if (req.method === 'POST') {
    try {
      const itemsToSave: SubArea[] = req.body;
      if (!Array.isArray(itemsToSave)) return res.status(400).json({ message: 'Expected array of subareas.' });
      await saveItemsToFile(itemsToSave);
      res.status(200).json({ message: 'Subareas saved.' });
    } catch (error) { console.error('Error saving subareas:', error); res.status(500).json({ message: 'Error saving subareas' }); }
  } else if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
