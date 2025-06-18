// src/lib/cors.ts
import Cors from 'cors';
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize the cors middleware
const cors = Cors({
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'], // Allow OPTIONS for preflight
  origin: '*', // Allow all origins for now, can be configured more strictly
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
export default function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
