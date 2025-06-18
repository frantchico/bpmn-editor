# BPMN Editor Monorepo

This project is a BPMN (Business Process Model and Notation) editor built with React, now structured as a monorepo. It includes the frontend editor and a Next.js backend for model persistence.

## Project Structure

This monorepo is managed using pnpm workspaces and has the following structure:

-   **/packages/frontend**: The React-based BPMN editor application.
-   **/packages/backend**: A Next.js application providing a REST API for saving and managing BPMN models.
-   **/pnpm-workspace.yaml**: Defines the workspaces.
-   **/package.json**: Root package file with scripts to manage both frontend and backend.

## Prerequisites

Before you begin, ensure you have the following installed:
-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [pnpm](https://pnpm.io/installation) (v8.6.0 or later recommended)

## Getting Started

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    Run the following command in the root directory of the monorepo. This will install dependencies for both the frontend and backend packages.
    ```bash
    pnpm install
    ```

## Development

You can run the frontend and backend development servers concurrently or individually.

**1. Run both Frontend and Backend Concurrently:**

   In the root directory, run:
   ```bash
   pnpm dev
   ```
   This will typically start:
   -   The Frontend (React/Vite) on `http://localhost:5173` (or another port if 5173 is busy).
   -   The Backend (Next.js) on `http://localhost:3000`.

**2. Run Frontend Only:**

   In the root directory, run:
   ```bash
   pnpm dev:frontend
   ```

**3. Run Backend Only:**

   In the root directory, run:
   ```bash
   pnpm dev:backend
   ```

## Building for Production

To build both applications for production, run the following command in the root directory:
```bash
pnpm build
```
This will create production-ready builds in:
- `packages/frontend/dist`
- `packages/backend/.next`

You can also build them individually:
- `pnpm build:frontend`
- `pnpm build:backend`

## Linting

To lint both frontend and backend code, run:
```bash
pnpm lint
```

## Backend API

The backend provides a simple REST API for managing BPMN models, which are stored in a local `data/models.json` file.

-   `GET    /api/models`      - Retrieve all models
-   `POST   /api/models`      - Create a new model (expects JSON body: `{ "name": "string", "xml": "string" }`)
-   `GET    /api/models/:id`  - Retrieve a specific model by ID
-   `PUT    /api/models/:id`  - Update a model by ID (expects JSON body: `{ "name"?: "string", "xml"?: "string" }`)
-   `DELETE /api/models/:id`  - Delete a model by ID

CORS is enabled to allow requests from the frontend.
