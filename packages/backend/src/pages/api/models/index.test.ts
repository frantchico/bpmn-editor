// packages/backend/src/pages/api/models/index.test.ts
import { createMocks, RequestMethod } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import modelsHandler from './index'; // The API route handler
import fs from 'fs/promises';

// Mock the fs/promises module
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('/api/models GET endpoint', () => {
  const mockRes = () => createMocks<NextApiRequest, NextApiResponse>().res;

  beforeEach(() => {
    // Reset mocks before each test
    mockedFs.access.mockReset();
    mockedFs.readFile.mockReset();
    mockedFs.writeFile.mockReset(); // Though not used in GET, good practice
  });

  test('should return 200 and Content-Type application/json', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    // Simulate file exists and is empty array
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.readFile.mockResolvedValue('[]');

    await modelsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getHeaders()['content-type']).toContain('application/json');
  });

  test('should return an empty array when models.json is empty', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.readFile.mockResolvedValue('[]');

    await modelsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual([]);
  });

  test('should return an empty array when models.json does not exist', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    const error = new Error('File not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockedFs.access.mockRejectedValue(error);

    await modelsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual([]);
  });

  test('should return an empty array when models.json contains non-array JSON', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.readFile.mockResolvedValue('{}'); // Malformed: an object, not an array

    await modelsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual([]);
    // Optionally, check console.error was called if your handler logs this
  });

  test('should return an empty array when models.json contains invalid JSON', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.readFile.mockResolvedValue('invalid_json_string');

    await modelsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual([]);
  });

  test('should return models when models.json contains valid model data', async () => {
    const mockModels = [{ id: '1', name: 'Test Model', xml: '<xml>', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.readFile.mockResolvedValue(JSON.stringify(mockModels));

    await modelsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockModels);
  });

  // Test for other fs.access errors (not ENOENT)
  test('should return an empty array on other fs.access errors', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    const error = new Error('Permission denied') as NodeJS.ErrnoException;
    error.code = 'EACCES'; // Example of another error code
    mockedFs.access.mockRejectedValue(error);

    await modelsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual([]);
  });
});
