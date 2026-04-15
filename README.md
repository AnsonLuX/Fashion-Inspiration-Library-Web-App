# Fashion Inspiration Library

AI-powered inspiration management app for fashion designers. The project turns uploaded street-style and garment photos into a searchable visual library with structured metadata, designer annotations, and evaluation tooling.

This repository was built as a lightweight full-stack take-home case study. The focus was not just image upload, but the full workflow:

`upload -> classify -> review -> annotate -> search/filter -> evaluate`

## What It Does

- [x] Upload one or many fashion images at a time
- [x] Run multimodal classification on each image with Gemini
- [x] Store both natural-language summaries and structured fashion metadata
- [x] Browse the library in a visual grid
- [x] Search across AI-generated descriptions and designer-authored annotations
- [x] Filter by garment type, style, occasion, country, season, and designer
- [x] Open an image detail panel to review AI output and save human annotations
- [x] Export evaluation labels and run a structured evaluation pass on a labeled subset

## Product Scope

The intended user is a fashion designer collecting reference imagery from stores, streetwear, runway-inspired looks, or open-source fashion photos. In practice, those image collections become hard to reuse because they are usually stored as loose files without consistent metadata.

This app treats each image as a design record:

- the image itself
- AI-generated summary and structured attributes
- human annotations added over time

That combination makes the library more useful than either raw images or model output alone.

## Current Stack

### Frontend

- React + Vite
- Tailwind CSS
- Axios

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Multer for uploads
- Gemini via `@google/genai`
- Zod for output normalization

### Testing

- Vitest for unit and integration tests
- Playwright for end-to-end tests

## Core Features

### 1. Image Upload + AI Classification

Users can upload images from the UI. Uploaded files are stored locally on disk, then passed through a multimodal classification pipeline. The model returns:

- `aiSummary`
- `garmentType`
- `style`
- `material`
- `colorPalette`
- `pattern`
- `season`
- `occasion`
- `consumerProfile`
- `trendNotes`
- `locationContext`
- `capturedAt`

The backend normalizes model output before saving it, so the UI can rely on predictable fields even when the model response is imperfect.

![Core Feature 1: Upload and AI classification](docs/screenshots/corefeature1.png)

### 2. Search + Filters

The image library supports:

- free-text search across summaries and annotation fields
- structured filters for fashion metadata
- filter combinations across design and contextual attributes

The filter logic is centralized in [`app/server/utils/buildImageQuery.js`](app/server/utils/buildImageQuery.js), which keeps the controller thinner and makes query behavior testable.

![Core Feature 2: Search and filters](docs/screenshots/corefeature2.png)

### 3. Designer Annotations

Each image can also store designer-authored:

- tags
- notes
- observations

In the detail drawer, AI-generated output and saved designer annotations are presented as separate sections so the human-authored layer stays explicit.

![Core Feature 3: Designer annotations](docs/screenshots/corefeature3.png)

### 4. Evaluation Workflow

The repository includes an `eval/` folder with:

- a labeled subset in [`eval/labels/labels.json`](eval/labels/labels.json)
- an evaluation runner in [`eval/run_eval.js`](eval/run_eval.js)
- exported results in [`eval/results.json`](eval/results.json)
- a short written summary in [`eval/summary.md`](eval/summary.md)

There is also [`eval/export-labels.js`](eval/export-labels.js), which exports the current parsed image records into label format for faster evaluation iteration.

## Repository Structure

```text
app/
  client/   React frontend
  server/   Express API, MongoDB models, Gemini integration
eval/       Evaluation scripts, labels, and results
tests/      Unit, integration, and e2e tests
README.md
context.md
```

## Architecture Notes

### Why this stack

- **React + Vite** keeps the frontend lightweight and quick to iterate on
- **Express + MongoDB** keeps the backend simple while still fitting flexible AI-generated metadata
- **Multer + local file storage** is enough for a local-first proof of concept
- **Gemini** provides multimodal classification without building a custom vision pipeline

### Important trade-offs

- This is intentionally a local-first prototype, not a deployed production system
- Images are stored on local disk rather than cloud object storage
- Search is practical and useful, but still keyword/filter driven rather than embedding-based retrieval
- Model output is normalized for consistency, but taxonomy drift still exists for ambiguous labels

## Local Setup

## Prerequisites

- Node.js 18+
- npm
- Local MongoDB running on `127.0.0.1:27017`, or your own MongoDB URI
- A Gemini API key

## Environment Variables

Create `app/server/.env` from [`app/server/.env.example`](app/server/.env.example).

Example:

```env
PORT=5050
MONGO_URI=mongodb://127.0.0.1:27017/walmart-fashion-ai
GEMINI_API_KEY=your_gemini_api_key_here
```

## Install Dependencies

Root-level test tooling:

```bash
npm install
```

Frontend:

```bash
cd app/client
npm install
```

Backend:

```bash
cd app/server
npm install
```

## Run the App

Start the backend:

```bash
cd app/server
npm run dev
```

Start the frontend:

```bash
cd app/client
npm run dev
```

App URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5050`
- Health check: `http://localhost:5050/api/health`

## Testing

### Unit Tests

```bash
npm run test:unit
```

Covers parsing and normalization behavior, including defaults and array coercion.

### Integration Tests

```bash
npm run test:integration
```

Covers filter query construction, especially season, location, search, and annotation-aware behavior.

### End-to-End Test

```bash
npm run test:e2e
```

This Playwright test covers:

- upload
- classify
- filter

Notes:

- Playwright browsers may need to be installed with `npx playwright install`
- The frontend and backend must already be running before the e2e test is executed
- The Gemini key must be valid, since the test exercises the classify step

## Evaluation

The current labeled evaluation subset uses 20 manually labeled images and scores the following attributes:

- garmentType
- style
- material
- occasion
- locationContext.country

Current results from [`eval/results.json`](eval/results.json):

- garment type accuracy: `80%` (`16/20`)
- style accuracy: `95%` (`19/20`)
- material accuracy: `84.6%` (`11/13`)
- occasion accuracy: `20%` (`4/20`)
- country accuracy: `10%` (`2/20`)

Interpretation:

- **Style** performs best because broad aesthetic cues are visually strong
- **Garment type** is reasonably solid, but normalization mismatches still matter
- **Material** is weaker when texture is subtle
- **Occasion** is difficult because labels overlap semantically
- **Country** is weakest because most images do not provide strong geographic evidence

Run evaluation:

```bash
node eval/run_eval.js
```

Export labels from current DB state:

```bash
node eval/export-labels.js
```

## API Overview

Main routes:

- `GET /api/health`
- `GET /api/images`
- `GET /api/images/facets`
- `GET /api/images/:id`
- `POST /api/images/upload`
- `POST /api/images/:id/classify`
- `PATCH /api/images/:id/annotations`

## Known Limitations

- The app is currently optimized for local demo use, not deployment
- Uploaded images are stored locally and are not deduplicated
- Classification quality still depends heavily on prompt wording and model interpretation
- Label normalization is not yet strict enough for edge cases like `tuxedo` vs `tuxedo jacket`
- Search is useful, but not yet semantic retrieval
- The evaluation subset is still small relative to a production benchmark

## If I Had More Time

- Expand the labeled evaluation subset
- Add synonym normalization dictionaries for garment taxonomy
- Add confidence scoring per attribute
- Add background classification jobs instead of synchronous classify requests
- Move image storage to cloud storage
- Add authentication and multi-user support
- Add pagination and stronger dataset management workflows

## Submission Notes

This repository is intentionally honest about trade-offs. The goal was to build a working end-to-end prototype that demonstrates:

- multimodal AI integration
- structured output handling
- practical retrieval UX for designers
- test coverage across parsing, filtering, and workflow-level behavior
- a basic but real evaluation loop

For a take-home exercise, I prioritized a coherent product workflow and testable architecture over production-scale infrastructure.
