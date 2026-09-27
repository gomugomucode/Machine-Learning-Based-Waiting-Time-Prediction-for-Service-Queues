# Engineering Work Log & Change Ledger

**Project:** Machine Learning-Based Waiting Time Prediction for Service Queues  
**Maintainer:** Lead Software Architect & Senior Full-Stack Engineer  

This document serves as the chronological audit trail for all implementation steps, architectural decisions, code changes, and verification actions performed after each prompt.

---

## Entry 001: 2026-09-27 — Initial Foundation, Dataset Inspection & Full-Stack Scaffolding

### Objective
Initialize BCA 6th-semester project monorepo, inspect 12,017 Kaggle queue records, establish PostgreSQL connection, build Django REST API with 4 apps, construct React 19 + TypeScript + Vite frontend, and enforce zero-fake-AI policy.

### 1. Files Created
* **Root & Config:**
  * [`.gitignore`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/.gitignore): Ignores `.env`, virtualenvs, `node_modules`, database files, and build outputs.
  * [`README.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/README.md): Project overview, architecture, local setup instructions, and Phase 2 roadmap.
* **Documentation:**
  * [`docs/architecture.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/architecture.md): Monorepo design, database schema, API contracts, and ML boundaries.
  * [`docs/data-dictionary.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/data-dictionary.md): Field-level audit of Kaggle CSV, leakage analysis, and missing attribute log.
  * [`docs/project-roadmap.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/project-roadmap.md): Complete phase lifecycle index.
  * [`docs/phases/phase-01-foundation-and-inspection.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/phases/phase-01-foundation-and-inspection.md): Comprehensive Phase 1 completion document.
* **Backend:**
  * [`backend/requirements.txt`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/requirements.txt): Django 5, DRF, psycopg2-binary, django-cors-headers, pandas, pytest.
  * [`backend/.env.example`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/.env.example) & [`backend/.env`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/.env): PostgreSQL credentials and Django secret keys.
  * [`backend/manage.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/manage.py): Django CLI runner.
  * [`backend/config/settings.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/config/settings.py): PostgreSQL ORM, CORS configuration, app declarations.
  * [`backend/config/urls.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/config/urls.py): Root URL dispatcher and `/api/health/` view.
  * [`backend/apps/queue_management/models.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/queue_management/models.py): `ServiceType` and `QueueObservation` models.
  * [`backend/apps/queue_management/serializers.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/queue_management/serializers.py): DRF serializers.
  * [`backend/apps/queue_management/views.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/queue_management/views.py): Viewsets with pagination and sorting.
  * [`backend/apps/queue_management/urls.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/queue_management/urls.py): Routers for service types and observations.
  * [`backend/apps/queue_management/tests.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/queue_management/tests.py): 8 unit and integration tests.
  * [`backend/apps/datasets/models.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/datasets/models.py): `DatasetMetadata` audit model.
  * [`backend/apps/datasets/management/commands/import_dataset.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/datasets/management/commands/import_dataset.py): CLI dataset importer with batching.
  * [`backend/apps/predictions/services.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/predictions/services.py): Prediction boundary service.
  * [`backend/apps/predictions/views.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/predictions/views.py): Rejection view returning HTTP 503 (no fake AI).
  * [`backend/apps/analytics/views.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/analytics/views.py): Summary and hourly diurnal queue statistics.
* **Frontend:**
  * [`frontend/vite.config.ts`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/vite.config.ts): Vite configuration with React, Tailwind CSS, and Vitest.
  * [`frontend/src/types/index.ts`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/types/index.ts): Strict TypeScript interfaces.
  * [`frontend/src/services/api.ts`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/services/api.ts): Centralized typed Axios client.
  * [`frontend/src/pages/Home.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/pages/Home.tsx): Home landing page.
  * [`frontend/src/pages/Dashboard.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/pages/Dashboard.tsx): Live PostgreSQL queue telemetry dashboard.
  * [`frontend/src/pages/Data.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/pages/Data.tsx): Paginated observation records browser.
  * [`frontend/src/pages/Prediction.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/pages/Prediction.tsx): Inference interface with model offline banner.
  * [`frontend/src/routes/AppRoutes.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/routes/AppRoutes.tsx): React Router v7 routes.
  * [`frontend/src/test/App.test.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/test/App.test.tsx): Vitest component and disclaimer test suite.

### 2. Database Changes
* Installed and launched PostgreSQL 17.2 locally on port 5432.
* Initialized database `bca_queue_db`.
* Created tables via migrations: `queue_management_servicetype`, `queue_management_queueobservation`, `datasets_datasetmetadata`.
* Imported 12,017 verified queue observation records.

### 3. Verification Commands Run & Results
* `python manage.py test apps.queue_management`: **8/8 tests passed**.
* `npm run build`: **0 errors, build generated in 407ms**.
* `npm run test`: **5/5 tests passed in 255ms**.
* Browser verification on `http://localhost:5173/`: Walked through Home, Dashboard, Data, and Prediction views.

---

## Entry 002: 2026-09-27 — IDE TypeScript Diagnostics Fix & Phase Documentation Framework

### Objective
Resolve IDE diagnostics in [`frontend/src/test/App.test.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/test/App.test.tsx) and [`frontend/vite.config.ts`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/vite.config.ts), and implement phase-based documentation system in `docs/`.

### 1. Code Changes & Bug Fixes
* [`frontend/vite.config.ts`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/vite.config.ts):
  * **Issue:** `'test' does not exist in type 'UserConfigExport'`.
  * **Fix:** Updated import to `import { defineConfig } from 'vitest/config'`.
* [`frontend/tsconfig.app.json`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/tsconfig.app.json):
  * **Issue:** `Property 'toBeInTheDocument' does not exist on type 'Assertion<void, HTMLElement>'`.
  * **Fix:** Added `"@testing-library/jest-dom/vitest"` to `compilerOptions.types`.
* [`frontend/src/test/setup.ts`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/test/setup.ts) & [`frontend/src/test/App.test.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/test/App.test.tsx):
  * **Fix:** Imported `'@testing-library/jest-dom/vitest'` for explicit type augmentation.
* **Documentation Framework Added:**
  * Created [`docs/phases/phase-01-foundation-and-inspection.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/phases/phase-01-foundation-and-inspection.md): In-depth Phase 1 completion dossier.
  * Created [`docs/project-roadmap.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/project-roadmap.md): Milestone tracker spanning all 9 academic project phases.
  * Created [`docs/work-log.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/work-log.md): Active change ledger updated after every prompt.

### 2. Verification
* `npm run build`: **0 errors**.
* `npm run test`: **5/5 tests passed**.

---

## Entry 003: 2026-09-27 — Repository Remote Synchronization & Developer CLI Guidance

### Objective
Track GitHub remote repository synchronization and provide operational guidance for running the Django backend and Vite frontend development servers.

### 1. Repository Status
* **Remote Origin:** `https://github.com/gomugomucode/Machine-Learning-Based-Waiting-Time-Prediction-for-Service-Queues.git`
* **Branch:** `main` (tracked with `origin/main`).
* **Git Status:** Clean working tree.

### 2. Developer Command Reference
* **Backend Dev Server:**
  ```powershell
  cd backend
  .\.venv\Scripts\activate
  python manage.py runserver 127.0.0.1:8000
  ```
  *(Note: Django CLI command is `python manage.py runserver`, not `python run .\manage.py`)*

* **Frontend Dev Server:**
  ```powershell
  cd frontend
  npm run dev
  ```

### 3. Active System Services
* **PostgreSQL 17.2:** Running on `127.0.0.1:5432` (Database: `bca_queue_db`).
* **Django API:** Operational at `http://127.0.0.1:8000/api/health/`.
* **React SPA:** Operational at `http://localhost:5173/`.

---

## Entry 004: 2026-09-27 — IDE PostgreSQL Extension Connection Configuration

### Objective
Document database connection parameters and provide instructions for connecting IDE/VS Code PostgreSQL database explorer extensions to the local database.

### 1. Connection Parameters
* **Host / Server:** `127.0.0.1` (or `localhost`)
* **Port:** `5432`
* **Database Name:** `bca_queue_db`
* **Username:** `postgres`
* **Password:** `postgres`
* **SSL Mode:** `Disable` (or `false` / `allow`)
* **Connection String (URI):** `postgresql://postgres:postgres@127.0.0.1:5432/bca_queue_db`

### 2. Available Tables in `bca_queue_db`
* `queue_management_queueobservation` (12,017 records)
* `queue_management_servicetype` (5 records)
* `datasets_datasetmetadata` (1 record)
* Standard Django auth/contenttypes tables.
