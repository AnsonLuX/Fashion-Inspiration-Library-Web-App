# Context

# Fashion Image Classification App

## Goal

Build a lightweight full-stack web app using **React + Node.js/Express** that allows fashion designers to:

1. Upload garment or street fashion images
2. Run AI classification to generate:
   - natural language description
   - structured fashion attributes
3. Browse the image library in a visual grid
4. Search and filter by dynamic metadata
5. Add designer annotations
6. Show a basic but honest model evaluation with 50-100 test images
7. Include required tests and a clear README

This project should feel like a **small but credible product prototype**, not just a coding exercise.

---

## Success Criteria

The submission should show:

- End-to-end functionality works
- Scope is controlled and realistic for a one-day build
- Product thinking is visible
- AI output is structured and handled safely
- Filters are dynamic, not hardcoded
- Evaluation is real, not superficial
- README clearly explains architecture, trade-offs, limitations, and next steps

---

## Recommended Stack

### Frontend
- React
- Vite
- TypeScript preferred, JavaScript acceptable if needed for speed
- Tailwind CSS 
- React Router only if needed, otherwise single-page app is enough

### Backend
- Node.js
- Express

### Database
- MongoDB

### Testing
- Unit: Vitest or Jest
- Integration: backend API tests or React integration test
- E2E: Playwright

### AI / Multimodal
- One multimodal model API
- Return:
  - summary text
  - structured JSON attributes

---

## Core Product Scope

## 1. Upload + AI Classification
User uploads one image.
Backend sends image to a multimodal model.
Model returns:

- aiSummary
- garmentType
- style
- material
- colorPalette
- pattern
- season
- occasion
- consumerProfile
- trendNotes
- locationContext
  - continent
  - country
  - city
- capturedAt
  - year
  - month
  - season

Store both:
- raw model output
- normalized structured metadata

### Must-have
- image upload
- loading state
- classification success state
- error handling
- save result to database

### Strong implementation choice
Use a parser + schema validation layer before saving AI results.

---

## 2. Image Library Grid
Main screen should show:
- search bar
- upload button
- left filter panel
- image grid
- details drawer or modal on click

Each card should show:
- image thumbnail
- short garment label
- a few metadata chips
- designer name or capture context if available

### Must-have
- clean, simple layout
- easy scanning
- click card to see details

---

## 3. Search + Dynamic Filters
Support:
- text search across AI summary and annotations
- filter by structured metadata
- filter by contextual metadata

### Required filter dimensions
- garment type
- style
- material
- color palette
- pattern
- occasion
- consumer profile
- trend notes
- location
- time
- designer

### Important requirement
Filter options must be **generated dynamically from data**, not hardcoded.

### Good practical implementation
Backend returns:
- filtered results
- distinct facet values for current dataset

---

## 4. Designer Annotations
Allow users to add:
- tags
- notes
- observations

These must be:
- searchable
- stored separately from AI metadata
- clearly labeled as human-added

### UI requirement
Use two clear sections in details view:
- AI-generated metadata
- Designer annotations

---

## 5. Model Evaluation
Use 50-100 public fashion or streetwear images.

Create a labeled mini test set manually for a subset of attributes.

### Evaluate at least:
- garment type
- style
- material
- occasion
- location context

### Output
- per-attribute accuracy
- short summary of strengths
- short summary of weaknesses
- improvement ideas

### Important
Keep evaluation simple, but real.

---

## App Architecture

## Frontend Responsibilities
- upload image
- show library grid
- manage search and filters
- open details drawer
- add annotations
- display loading/error/empty states

## Backend Responsibilities
- receive upload
- call multimodal model
- parse and normalize response
- store image metadata
- expose endpoints for:
  - upload/classify
  - list/search/filter
  - read single item
  - add/update annotation
  - fetch filter facets

## Database Collections

### images
Fields:
- _id
- imageUrl or local file path
- originalFilename
- designer
- createdAt
- updatedAt

### classifications
Fields:
- imageId
- aiSummary
- garmentType
- style
- material
- colorPalette
- pattern
- season
- occasion
- consumerProfile
- trendNotes
- locationContext
  - continent
  - country
  - city
- capturedAt
  - year
  - month
  - season
- rawModelOutput
- parseStatus

### annotations
Fields:
- imageId
- tags
- notes
- observations
- createdAt
- updatedAt

---

## API Plan

### POST /api/images/upload
Upload image file

### POST /api/images/:id/classify
Call multimodal model and store structured metadata

### GET /api/images
Support:
- search
- filter query params
- pagination optional

### GET /api/images/facets
Return dynamic filter options from stored data

### GET /api/images/:id
Return image details, AI metadata, and annotations

### PATCH /api/images/:id/annotations
Add or update designer annotations

---

## One-Day Development Plan

## Hour 0-1: Project Setup
### Goal
Set up the full-stack skeleton quickly.

### Tasks
- create frontend with Vite
- create backend with Express
- connect MongoDB
- set up folders
- set up basic environment variables
- set up upload handling
- define collections/models

### Done when
- frontend and backend both run locally
- database connection works
- image upload endpoint is reachable

---

## Hour 1-3: Data Model + Backend Core
### Goal
Finish backend foundation first.

### Tasks
- build upload endpoint
- build classify endpoint
- integrate multimodal model
- create parser/normalizer for model output
- save image + classification result
- create GET list endpoint
- create details endpoint

### Done when
- upload one image
- call classify
- save result in MongoDB
- retrieve result from API

### Important note
Do not over-engineer. One image at a time is enough.

---

## Hour 3-5: Frontend Main Workflow
### Goal
Build the demoable product path.

### Tasks
- upload UI
- loading and error state
- grid view
- details drawer/modal
- show AI summary and structured metadata

### Done when
- user can upload image from UI
- classification result appears in library
- clicking card shows details

---

## Hour 5-6.5: Search + Dynamic Filters
### Goal
Build the feature most likely to be discussed in review.

### Tasks
- search bar
- filter panel
- dynamic facet endpoint
- connect filters to backend query
- support location/time filtering
- support text search over AI summary

### Done when
- filters are visibly dynamic
- multiple filters work together
- search narrows results correctly

---

## Hour 6.5-7.5: Designer Annotations
### Goal
Complete the core workflow and show human-in-the-loop thinking.

### Tasks
- annotation form in details drawer
- save tags/notes/observations
- show AI vs Human sections
- include annotations in search

### Done when
- annotations save successfully
- annotations display clearly
- searching annotation content works

---

## Hour 7.5-8.5: Required Tests
### Goal
Cover the exact required test categories.

### Tasks
- unit test for parser
- integration test for filter logic, especially location/time
- e2e happy path:
  - upload
  - classify
  - filter/search

### Done when
- all 3 required testing levels exist
- at least one passing test in each category

---

## Hour 8.5-10: Evaluation
### Goal
Produce a credible mini-evaluation.

### Tasks
- collect 50-100 images
- manually label selected attributes
- run classifier
- compute per-attribute accuracy
- write short analysis

### Done when
- eval folder exists
- results can be reproduced
- strengths/weaknesses are documented honestly

---

## Hour 10-11: Polish + README
### Goal
Turn working code into a strong submission.

### Tasks
- improve empty/loading/error states
- check visual consistency
- add sample seed data if possible
- write README:
  - setup
  - architecture
  - workflow
  - evaluation summary
  - trade-offs
  - limitations
  - next steps

### Done when
- reviewer can run locally with minimal confusion
- README answers most expected questions

---

## Hour 11-12: Final Review + Commit Cleanup
### Goal
Prepare for submission and discussion round.

### Tasks
- test full demo flow end to end
- clean naming and comments
- remove dead code
- confirm required structure
- commit in logical steps
- rehearse demo story

### Final check
- app runs
- core workflow works
- tests exist
- eval exists
- README is strong

---

## Priorities

## P0 - Must Finish
- upload image
- AI classification
- save both summary and structured metadata
- image grid
- dynamic filters
- text search
- designer annotations
- required tests
- evaluation folder
- strong README

## P1 - High Value
- parser with schema validation
- AI vs Human visual separation
- filter counts
- good loading/error/empty states
- clean details drawer
- honest evaluation notes

## P2 - Only If Time Allows
- pagination
- bulk upload
- confidence scores
- semantic search
- duplicate detection
- nicer animations

---

## Trade-Off Guidance

This project is timeboxed to one day.
Do not attempt:
- auth
- cloud deployment complexity
- vector database
- microservices
- advanced recommendation engine
- perfect model benchmarking
- highly polished design system

Prefer:
- simplicity
- stability
- clarity
- explainability
- strong README
- honest scope

---

## What Makes This Submission Stand Out

A strong submission is not the one with the most features.
A strong submission is the one that feels:

- complete
- thoughtful
- realistic
- easy to review
- honest about limitations
- strong in product and engineering judgment

The winning angle is:
**small scope, strong execution, clear reasoning.**

---

## Demo Narrative for Review Round

Use this order when walking through the project:

1. Briefly explain the user problem
2. Upload an image
3. Show AI summary + structured attributes
4. Show the image in the grid
5. Use search and filters
6. Open details view
7. Add designer annotation
8. Search using annotation content
9. Show evaluation results
10. Explain trade-offs and next steps

This keeps the review focused, product-oriented, and senior-level.

---

## Suggested Repo Structure

```bash
/app
  /client
  /server
/eval
  /dataset
  /labels
  run_eval.js
  results.json
/tests
  /unit
  /integration
  /e2e
README.md