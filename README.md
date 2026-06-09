# Fashion Inspiration Library

A deployed full-stack AI image management platform for fashion inspiration workflows. The app helps designers upload garment and street-style reference images, classify them with multimodal AI, search/filter the image library, and save human annotations for later review.

## Live Demo

- Frontend: https://fashion-inspiration-library-web-app.vercel.app
- Backend Health Check: https://fashion-inspiration-library-web-app.onrender.com/api/health

Note: The backend is hosted on Render free tier, so the first request may take extra time if the service has been inactive.

## Highlights

- Built a React + Vite frontend with searchable image grid, dynamic filters, detail drawer, and annotation workflow.
- Built a Node.js / Express backend with JWT authentication, protected image APIs, MongoDB models, and Gemini AI classification.
- Integrated AWS S3 for cloud image storage and MongoDB Atlas for user records, image metadata, AI output, and annotations.
- Deployed the frontend on Vercel and the backend on Render with production environment variables and CORS configuration.
- Added evaluation tooling to compare AI-generated fashion metadata against manually labeled records.
- Included unit, integration, and end-to-end test coverage for parsing, filtering, upload, classify, and filter workflows.

## Tech Stack

**Frontend**

- React
- Vite
- Tailwind CSS
- Axios

**Backend**

- Node.js
- Express.js
- MongoDB / Mongoose
- JWT authentication
- Multer upload handling
- Gemini via `@google/genai`
- Zod output normalization

**Cloud / Deployment**

- Vercel for frontend deployment
- Render for backend deployment
- MongoDB Atlas for cloud database
- AWS S3 for image storage

**Testing / Evaluation**

- Vitest
- Playwright
- Custom evaluation scripts for AI metadata accuracy

## Core Workflow

```text
register / login
-> upload image
-> store image in AWS S3
-> save image record in MongoDB Atlas
-> classify image with Gemini
-> normalize AI metadata
-> search / filter / annotate in the UI
```

## Features

### Authentication

Users can register and log in. Protected backend routes ensure image upload, classification, and annotation actions are tied to authenticated users.

### Image Upload + AWS S3 Storage

Users can upload one or multiple fashion images. The backend uploads files to AWS S3 and stores the S3 image URL, object key, owner, filename, classification status, and metadata in MongoDB Atlas.

![Upload and AI classification](docs/screenshots/corefeature1.png)

### AI Classification

Each image can be classified with Gemini multimodal AI. The model returns both a natural-language summary and structured fashion attributes, including:

- garment type
- style
- material
- color palette
- pattern
- season
- occasion
- consumer profile
- trend notes
- location context
- captured time context

The backend normalizes model output so the frontend can rely on consistent fields.

### Search + Filters

The library supports free-text search and structured filters across AI-generated metadata and human annotations. Users can filter by garment type, style, occasion, country, season, and designer.

![Search and filters](docs/screenshots/corefeature2.png)

### Designer Annotations

Users can open an image detail panel and add designer-authored tags, notes, and observations. AI-generated output and human-authored annotations are displayed separately.

![Designer annotations](docs/screenshots/corefeature3.png)

### Evaluation Workflow

The `eval/` folder includes a labeled subset, an evaluation runner, result output, and a written summary. This allows the model output to be reviewed against manually labeled garment attributes.

## Architecture

```text
User Browser
   ↓
Vercel - React Frontend
   ↓ API requests
Render - Express Backend
   ↓
MongoDB Atlas - users, image records, metadata, annotations
   ↓
AWS S3 - uploaded image files
   ↓
Gemini API - multimodal classification
```

## Repository Structure

```text
app/
  client/   React frontend
  server/   Express API, MongoDB models, Gemini integration, AWS S3 upload

eval/       Evaluation scripts, labels, and results
tests/      Unit, integration, and end-to-end tests
README.md
context.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas URI or local MongoDB URI
- Gemini API key
- AWS S3 bucket
- AWS access key with S3 upload permission

### Environment Variables

Create `app/server/.env` from `app/server/.env.example`.

Example backend environment:

```env
PORT=5050
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/fashion_inspiration
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key_here
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name
```

Create `app/client/.env` from `app/client/.env.example`.

Example frontend environment:

```env
VITE_API_BASE_URL=http://localhost:5050/api
```

### Install Dependencies

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

### Run Locally

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

Local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:5050
- Health check: http://localhost:5050/api/health

## API Overview

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/images`
- `GET /api/images/facets`
- `GET /api/images/:id`
- `POST /api/images/upload`
- `POST /api/images/:id/classify`
- `PATCH /api/images/:id/annotations`

## Testing

Unit tests:

```bash
npm run test:unit
```

Integration tests:

```bash
npm run test:integration
```

End-to-end tests:

```bash
npm run test:e2e
```

The Playwright workflow covers upload, classify, and filter behavior. The frontend and backend should be running before executing the end-to-end test.

## Evaluation Summary

The current labeled evaluation subset uses 20 manually labeled images and scores the following attributes:

- garment type accuracy: `80%` (`16/20`)
- style accuracy: `95%` (`19/20`)
- material accuracy: `84.6%` (`11/13`)
- occasion accuracy: `20%` (`4/20`)
- country accuracy: `10%` (`2/20`)

The results show that visual style and garment type are stronger categories, while occasion and country are harder because they require more contextual inference.

Run evaluation:

```bash
node eval/run_eval.js
```

Export labels from current DB state:

```bash
node eval/export-labels.js
```

## Deployment Notes

**Frontend**

- Platform: Vercel
- Root directory: `app/client`
- Build command: `npm run build`
- Output directory: `dist`
- Production API env: `VITE_API_BASE_URL=https://fashion-inspiration-library-web-app.onrender.com/api`

**Backend**

- Platform: Render
- Root directory: `app/server`
- Build command: `npm install`
- Start command: `npm start`

**Database**

- MongoDB Atlas stores users, image records, AI metadata, annotations, and classification status.

**Image Storage**

- AWS S3 stores uploaded image files.
- MongoDB stores S3 image URLs and object keys instead of storing files directly.

## Known Limitations

- Render free tier can introduce cold-start delays.
- AI classification is currently synchronous and can be affected by Gemini API latency or temporary model availability.
- S3 file cleanup is not yet automated when an image record is deleted.
- Search is keyword/filter based rather than semantic vector search.
- The evaluation dataset is still small relative to a production benchmark.
- The current S3 access setup is simplified for portfolio deployment and should be hardened for a production system.

## Future Improvements

- Add server-side pagination for larger image libraries.
- Add stronger indexing for frequently used filters.
- Add background classification jobs with queue support.
- Add retry and clearer failure messaging for AI classification.
- Add image deletion and S3 cleanup workflow.
- Add CloudFront or signed URL strategy for image delivery.
- Add semantic search with embeddings.
- Add GitHub Actions CI/CD pipeline.
- Add Docker Compose for local full-stack startup.
- Add monitoring and structured logging.
- Expand the labeled evaluation subset.
- Improve taxonomy normalization for garment categories.

## Project Summary

This project started as a local AI image classification prototype and was upgraded into a deployed full-stack portfolio application.

It demonstrates practical experience with React, Node.js, Express, MongoDB Atlas, AWS S3, JWT authentication, Gemini multimodal AI integration, structured metadata parsing, cloud deployment, testing, and evaluation workflows.
