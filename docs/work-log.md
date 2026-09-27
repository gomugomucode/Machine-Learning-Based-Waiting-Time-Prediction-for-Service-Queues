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

---

## Entry 005: 2026-09-27 — Backend Root API Index Implementation (`/`)

### Objective
Resolve Django 404 on root path `http://127.0.0.1:8000/` by implementing an informative `api_root` endpoint that provides project metadata, service status, and direct URLs to all API resources and the React frontend.

### 1. Code Changes
* [`backend/config/urls.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/config/urls.py):
  * Added `api_root` view decorated with `@api_view(['GET'])`.
  * Routed `path('', api_root, name='api-root')`.
  * Returns JSON directory with absolute URIs to all operational endpoints (`/api/health/`, `/api/service-types/`, `/api/queue-observations/`, `/api/datasets/summary/`, `/api/analytics/hourly/`, `/api/predictions/status/`, `/admin/`) and frontend URL (`http://localhost:5173/`).

### 2. Verification
* Query `http://127.0.0.1:8000/`: **HTTP 200 OK** with structured JSON response.
* Django test suite `python manage.py test apps.queue_management`: **8/8 tests passed**.

---

## Entry 006: 2026-09-27 — Phase 2 Machine Learning Training, Benchmark Evaluation & Full-Stack Inference Deployment

### Objective
Transition from Phase 1 architectural protocol (where prediction inference was intentionally denied with HTTP 503) to an active, operational Phase 2 machine learning pipeline. Train multiple candidate regressors using a strict chronological train/test split on the 12,017 verified queue observations, select the best generalizing model (Ridge Regression), serialize it, expose live inference endpoints in Django REST Framework, and connect the React frontend interface with real-time predictions, confidence intervals, and benchmark evaluation metrics.

### 1. Files Created & Modified
* **Machine Learning Pipeline & Artifacts:**
  * [`backend/apps/predictions/management/commands/train_model.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/predictions/management/commands/train_model.py): Implements chronological train/test split (7,975 train / 4,042 test), feature extraction (`queue_length`, `minutes_since_0900`, `is_peak_window`), and benchmarking of 5 algorithms.
  * [`backend/apps/predictions/models/best_waiting_time_model.joblib`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/predictions/models/best_waiting_time_model.joblib): Serialized winning scikit-learn Ridge Regression pipeline with standard scaler.
  * [`backend/apps/predictions/models/model_metrics.json`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/predictions/models/model_metrics.json): Model metadata and complete benchmark evaluation table.
* **Backend Services & API:**
  * [`backend/apps/predictions/services.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/predictions/services.py): Dynamic model loader with singleton caching, inference feature vector generation, and prediction computation with confidence bounds ($\pm \text{MAE}$).
  * [`backend/apps/predictions/views.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/predictions/views.py): Implemented live `POST /api/predictions/predict/` and `GET /api/predictions/status/`.
* **Frontend UI & API Layer:**
  * [`frontend/src/types/index.ts`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/types/index.ts): Added `PredictionRequest`, `PredictionResult`, and `ModelBenchmark` interfaces.
  * [`frontend/src/services/api.ts`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/services/api.ts): Exported `predictWaitingTime(data: PredictionRequest): Promise<PredictionResult>`.
  * [`frontend/src/pages/Prediction.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/pages/Prediction.tsx): Connected operational form to live DRF inference, rendered real-time prediction card, confidence interval bar, feature evaluation breakdown, and candidate models comparison table.
  * [`frontend/src/test/App.test.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/test/App.test.tsx): Updated test suite for live prediction flow.
* **Phase Documentation:**
  * [`docs/phases/phase-02-target-and-features.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/phases/phase-02-target-and-features.md): Detailed Phase 2 dossier with target formulation, mathematical definitions, feature engineering, and model comparison table.
  * [`docs/project-roadmap.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/project-roadmap.md): Marked Phase 2 as completed.

### 2. Candidate Model Evaluation Results (Held-Out Test Set)
* **Naive Mean Baseline:** Test MAE = 55.74 min | $R^2$ = -0.0066
* **Multiple Linear Regression:** Test MAE = 15.21 min | $R^2$ = 0.9066
* **Ridge Regression (Selected):** Test MAE = **15.16 min** | $R^2$ = **0.9073** (**72.8% error reduction**)
* **Random Forest Regressor:** Test MAE = 16.95 min | $R^2$ = 0.8845
* **Gradient Boosting Regressor:** Test MAE = 16.80 min | $R^2$ = 0.8858

### 3. Verification Commands & Results
* `python manage.py test`: **8/8 tests passed**.
* `npm run test`: **5/5 tests passed**.
* `npm run build`: **0 errors, build generated cleanly**.
* Browser Subagent Verification: Verified live inference on `http://localhost:5173/prediction` (screenshot `prediction_result_1790523010697.png`).

---

## Entry 007: 2026-09-27 — Multi-Port CORS Configuration, IDE Linter Resolution & Counter Capacity Dynamic Inference

### Objective
Resolve the web server connection error on alternate dev ports (`http://localhost:5174`), eliminate IDE import resolution errors in [`backend/apps/datasets/views.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/datasets/views.py), and incorporate dynamic active service counter throughput scaling into the waiting time inference pipeline and prediction interface.

### 1. Root Cause Analysis
1. **Connection Error on Port 5174:** When a second `npm run dev` was launched in terminal `26324`, Vite bound to fallback port `5174` because port `5173` was already active in the background. Django's `CORS_ALLOWED_ORIGINS` was restricted strictly to `5173`, causing browser CORS preflight rejection ("Backend Offline").
2. **IDE Diagnostics Problem:** The IDE Python linter flagged `Cannot find module apps.queue_management.models` because the workspace root is at the project parent level rather than inside `backend/`.
3. **Static Prediction Output Feedback:** The backend inference view originally discarded `active_counters`, so adjusting the open teller count from 4 to 1 did not dynamically scale waiting time. Additionally, the queue input was slider-only without a direct numeric text box.

### 2. Code Changes
* **Backend CORS & Configuration:**
  * [`backend/config/settings.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/config/settings.py): Added `http://localhost:5174`, `http://127.0.0.1:5174`, and regex pattern `r"^http://localhost:\d+$"` to `CORS_ALLOWED_ORIGINS` and `CORS_ALLOWED_ORIGIN_REGEXES`.
  * [`.vscode/settings.json`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/.vscode/settings.json): Added `backend` to `python.analysis.extraPaths` and `python.autoComplete.extraPaths`.
* **Dynamic Capacity Inference:**
  * [`backend/apps/predictions/services.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/predictions/services.py): Implemented multi-server queue capacity scaling based on Little's Law ($c_{\text{baseline}} / c_{\text{active}}$, baseline $c_0 = 4$ counters). Dynamically scales base regression output and MAE error bounds.
  * [`backend/apps/predictions/views.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/predictions/views.py): Extracted `active_counters` from request payload and forwarded to service layer.
* **Frontend UI & Type Enhancements:**
  * [`frontend/src/types/index.ts`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/types/index.ts): Updated `PredictionResult.features_evaluated` to include `active_counters` and `capacity_multiplier`.
  * [`frontend/src/pages/Prediction.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend/src/pages/Prediction.tsx):
    * Added numeric input field synced bidirectionally with the queue length slider.
    * Updated Active Counters note explaining operational capacity scaling.
    * Expanded model feature vector display to 4 cards showing queue depth, active tellers with capacity factor, arrival window, and diurnal progress.

### 3. Verification Commands & Results
* `python manage.py test`: **8/8 tests passed**.
* `npm run test`: **5/5 tests passed**.
* `npm run build`: **0 errors**.
* Subagent Browser Verification on `http://localhost:5174/prediction`:
  * Scenario 1 (50 queue, 1 counter): Estimated wait time = **183.5 min** (**Severe Congestion**, 4.0x load multiplier).
  * Scenario 2 (15 queue, 4 counters): Estimated wait time = **24.6 min** (**Moderate Wait**, 1.0x baseline).
  * Screenshot verified: `dynamic_prediction_result_1790523724136.png`.


