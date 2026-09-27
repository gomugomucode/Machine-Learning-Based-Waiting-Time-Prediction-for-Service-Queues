# Phase 1: Application Foundation & Dataset Inspection

**Project:** Machine Learning-Based Waiting Time Prediction for Service Queues  
**Academic Degree:** BCA 6th Semester Major Project  
**Date Completed:** 2026-09-27  
**Status:** **COMPLETED & VERIFIED**  

---

## 1. Objectives of Phase 1
* Establish a clean, scalable monorepo structure (`backend/`, `frontend/`, `data/`, `docs/`).
* Inspect and statistically audit the local Kaggle queue dataset without assumptions.
* Formulate and verify the waiting time prediction target mathematically.
* Set up a PostgreSQL database and configure environment variables safely.
* Create a minimal extensible Django REST Framework backend with clean modular apps.
* Implement a modern, responsive React + TypeScript + Vite frontend.
* Establish strict anti-hallucination protocols (no fake AI, no mock predictions).
* Write and run automated tests for both backend and frontend.

---

## 2. Dataset Inspection & Findings

The primary dataset file analyzed was `data/verified_queue_waiting_time_dataset.csv`.

### Key Metrics
* **Total Rows:** 12,017
* **Total Columns:** 5
* **Missing Values:** 0 across all fields (100% complete)
* **Duplicate Rows:** 0
* **Date Range:** `2026-10-05 09:00:18` to `2026-10-22 16:59:16` (14 business days, Monday to Friday)
* **Operating Hours:** Customer arrivals between 09:00 and 16:59; service conclude up to ~20:06.

### Attributes Audited

| Column Name | Inferred Type | Database Type | Description |
| :--- | :--- | :--- | :--- |
| `arrival_time` | Timestamp | `DateTimeField(db_index=True)` | Customer queue arrival time |
| `start_time` | Timestamp | `DateTimeField(db_index=True)` | Time summoned to service counter |
| `finish_time` | Timestamp | `DateTimeField` | Time counter service concluded |
| `wait_time` | Float64 | `FloatField` | Waiting time in minutes |
| `queue_length` | Int64 | `PositiveIntegerField` | Customers waiting ahead at arrival |

### Missing Attributes (`NOT AVAILABLE IN DATASET`)
* `service_type` / category: **NOT AVAILABLE IN DATASET**
* `counter_id` / teller ID: **NOT AVAILABLE IN DATASET**
* `active_counters` count: **NOT AVAILABLE IN DATASET**
* Customer PII (name, account number, phone): **NOT AVAILABLE IN DATASET** (Preserves privacy)

### Target Verification
$$\text{wait\_time} \approx \frac{\text{start\_time} - \text{arrival\_time}}{60}$$
The native `wait_time` column corresponds to elapsed minutes with a maximum deviation of $\le 0.02$ minutes ($1.2\text{ seconds}$), confirming mathematical validity as our continuous regression target.

### Statistical Correlations
* Correlation between `queue_length` and `wait_time`: **$r = 0.9643$**
* Correlation between arrival `hour` and `wait_time`: **$r = 0.9112$**

---

## 3. Backend Architecture (`backend/`)

### Core Apps Created
1. **`config`**: Core Django project settings, WSGI/ASGI configurations, global URL router, and `/api/health/` endpoint.
2. **`apps.queue_management`**: Operational domain models:
   * `ServiceType`: Categorization for future expansion (5 initial types seeded).
   * `QueueObservation`: Maps to queue observation records with auto-calculated duration fallback.
3. **`apps.datasets`**:
   * `DatasetMetadata`: Audit log of imported datasets.
   * `import_dataset.py`: Reusable management command supporting `--limit`, `--dry-run`, and `--clear`.
4. **`apps.predictions`**:
   * `PredictionService`: Model boundary interface.
   * `PredictionStatusView`: Reports model offline status.
   * `PredictWaitingTimeView`: Returns HTTP 503 refusal to prevent fake prediction generation.
5. **`apps.analytics`**:
   * `AnalyticsOverviewView`: High-level summary metrics.
   * `HourlyQueueAnalyticsView`: Grouped hourly diurnal congestion metrics.

### Database Configuration
* **Engine:** PostgreSQL 17.2 running on `127.0.0.1:5432`.
* **Database Name:** `bca_queue_db`.
* **Security:** Isolated via `backend/.env` with `backend/.env.example` committed.

---

## 4. Frontend Architecture (`frontend/`)

### Technology & Libraries
* **React 19** + **TypeScript** (Strict mode) + **Vite 8** + **Tailwind CSS v4** + **React Router v7** + **Axios** + **Lucide React**.

### Views & Pages Implemented
* **Home (`/`)**: Project hero, BCA academic badges, system workflow, quick links.
* **Dashboard (`/dashboard`)**: Live PostgreSQL telemetry cards (12,017 records, 102.40m avg wait, 132.4 avg queue length), hourly congestion table, and future ML placeholders.
* **Data Browser (`/data`)**: Interactive paginated table of queue observations with sorting by arrival, wait time, or queue length.
* **Prediction (`/prediction`)**: Parameter input controls with prominent disclaimer: *"Prediction module — model not yet connected"* and informational denial notice upon request.

### Centralized API Service (`src/services/api.ts`)
* `getHealth()`
* `getServiceTypes()`
* `getQueueObservations()`
* `getDatasetSummary()`
* `getPredictionStatus()`
* `getHourlyAnalytics()`

---

## 5. Verification & Testing

### Backend Test Suite
Executed via `python manage.py test apps.queue_management`:
* `HealthCheckApiTests`: Status 200 and healthy DB response.
* `QueueManagementModelAndApiTests`: Model string representations, auto-calculation, list view pagination, single record lookup.
* `PredictionApiTests`: Confirmed model status offline and 503 inference rejection.
* **Result:** **8/8 tests passed (0.114s)**.

### Frontend Test Suite
Executed via `npm run test` (Vitest + React Testing Library):
* Home page rendering of headers and links.
* Prediction page mandatory disclaimer rendering.
* Prediction submit refusal interaction.
* EmptyState component rendering.
* Badge component variant styling.
* **Result:** **5/5 tests passed (0.255s)**.

---

## 6. Issues Encountered & Resolved

1. **PostgreSQL Installation in Restricted Environment:**
   * *Issue:* EnterpriseDB MSI/EXE required interactive administrator privileges.
   * *Resolution:* Downloaded and extracted official PostgreSQL 17.2 portable binaries, initialized data cluster via `initdb`, and started server via `postgres.exe` daemon.
2. **Vitest `test` Config in `vite.config.ts`:**
   * *Issue:* TypeScript flagged `'test' does not exist in type 'UserConfigExport'`.
   * *Resolution:* Changed `import { defineConfig } from 'vite'` to `import { defineConfig } from 'vitest/config'`.
3. **Jest-DOM Matchers Missing in Vitest:**
   * *Issue:* `Property 'toBeInTheDocument' does not exist on type 'Assertion<void, HTMLElement>'`.
   * *Resolution:* Added `@testing-library/jest-dom/vitest` to `tsconfig.app.json` types and imported `@testing-library/jest-dom/vitest` in `setup.ts` and `App.test.tsx`.

---

## 7. Artifacts & Deliverables Created
* Documentation: [`docs/architecture.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/architecture.md), [`docs/data-dictionary.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/docs/data-dictionary.md), [`README.md`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/README.md), [`.gitignore`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/.gitignore).
* Full working backend in [`backend/`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend).
* Full working frontend in [`frontend/`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/frontend).
* 12,017 records imported into PostgreSQL `bca_queue_db`.
