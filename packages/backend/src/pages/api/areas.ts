import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import runMiddleware from '@/lib/cors';
import Cors from 'cors';
type Area = { id: string; name: string; projectId: string; };

const areasFilePath = path.join(process.cwd(), 'data', 'areas.json');

async function getItemsFromFile(): Promise<Area[]> {
  try {
    await fs.access(areasFilePath);
    const data = await fs.readFile(areasFilePath, 'utf-8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    console.error('Error reading areas.json:', error);
    throw error;
  }
}

async function saveItemsToFile(items: Area[]): Promise<void> {
  await fs.writeFile(areasFilePath, JSON.stringify(items, null, 2), 'utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, Cors({ methods: ['GET', 'POST', 'OPTIONS'], origin: '*' }));
  if (req.method === 'GET') {
    try {
      // Optionally filter by projectId: const { projectId } = req.query;
      const items = await getItemsFromFile();
      res.status(200).json(items);
    } catch (error) { res.status(500).json({ message: 'Error retrieving areas' }); }
  } else if (req.method === 'POST') {
    try {
      const itemsToSave: Area[] = req.body;
      if (!Array.isArray(itemsToSave)) return res.status(400).json({ message: 'Expected array of areas.' });
      await saveItemsToFile(itemsToSave);
      res.status(200).json({ message: 'Areas saved.' });
    } catch (error) { console.error('Error saving areas:', error); res.status(500).json({ message: 'Error saving areas' }); }
  } else if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
