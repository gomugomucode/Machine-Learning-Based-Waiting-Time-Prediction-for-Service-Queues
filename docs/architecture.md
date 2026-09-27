# Architecture Specification

## Project: Machine Learning-Based Waiting Time Prediction for Service Queues
**Academic Level:** BCA 6th-Semester Project  
**Author / Developer:** Anupam Baral  
**Architecture Version:** 1.0.0 (Phase 1: Foundation & Data Inspection)  

---

## 1. Project Purpose & Objectives

Service queues in banking and customer service centers often suffer from severe delays and high queue buildup during peak operating hours. When customers join a queue without visibility into expected waiting times, frustration increases and branch managers lack actionable operational foresight.

The objective of this project is to build an end-to-end, machine learning-driven web application that:
1. Tracks and models queue observations and waiting time dynamics.
2. Ingests and analyzes real-world queue datasets (e.g., bank customer service logs).
3. Provides predictive waiting time estimates based on real operational features (queue length, diurnal cycle, historical service patterns) without hardcoding or ungrounded assumptions.
4. Delivers a clean, modular, and responsive frontend dashboard for managers and clients.

---

## 2. Core Technology Stack

### Frontend
* **Framework:** React 18+ with TypeScript (strict mode enabled)
* **Build Tool:** Vite
* **Routing:** React Router v6
* **Styling:** Tailwind CSS (utility-first, responsive, accessible)
* **HTTP Client:** Axios (centralized client with response typing)
* **Icons & UI:** Lucide React

### Backend
* **Language & Runtime:** Python 3.12+ (type hints throughout)
* **Web Framework:** Django 5.x & Django REST Framework (DRF)
* **CORS Handling:** `django-cors-headers` (strict origin policy)
* **Database Driver:** `psycopg2-binary` (PostgreSQL adapter)
* **Data Processing:** Pandas (for dataset ingestion and transformation)
* **Environment Management:** `python-dotenv` via `.env` file

### Database
* **Engine:** PostgreSQL 17
* **ORM:** Django ORM with native migrations
* **Data Integrity:** Strict foreign keys, indexed timestamp fields, non-null constraints

---

## 3. Monorepo Directory Structure

```
bca-project/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   ├── config/                     # Django core project configuration
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── apps/                       # Modular Django applications
│       ├── queue_management/       # Queues, service types, observations
│       ├── datasets/               # Dataset metadata, inspection, ingestion
│       ├── predictions/            # ML inference service & versioning (scaffold)
│       └── analytics/              # Aggregations, statistics, KPIs (scaffold)
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── components/             # Reusable UI widgets (Navbar, StatCard, Badge)
│       ├── layouts/                # Root Layout with Navigation & Footer
│       ├── pages/                  # Home, Dashboard, Prediction, Data
│       ├── services/               # Centralized Axios API service layer
│       ├── hooks/                  # Custom React hooks (useHealth, useObservations)
│       ├── types/                  # TypeScript interface contracts
│       ├── utils/                  # Formatting and calculation helpers
│       ├── routes/                 # App router configuration
│       └── assets/                 # Static branding & graphics
├── data/                           # Kaggle source CSVs & documentation
│   ├── verified_queue_waiting_time_dataset.csv
│   ├── queue_data.csv
│   └── wait_times.csv
└── docs/                           # Academic & technical documentation
    ├── architecture.md             # This document
    └── data-dictionary.md          # Complete dataset field analysis
```

---

## 4. Backend Architecture & Django Apps

The backend follows clean separation of concerns:

### `apps.queue_management`
* **Purpose:** Handles operational domain entities.
* **Entities:**
  * `ServiceType`: Represents categorized banking operations (Cash Deposit, General Inquiries, Account Opening, Loan Services, Customer Support).
  * `QueueObservation`: Stores physical queue records:
    * `arrival_time`: Customer queue entry timestamp.
    * `service_start_time`: Time customer was summoned to a counter.
    * `service_end_time`: Time service finished.
    * `wait_time`: Exact waiting duration in minutes (`start_time - arrival_time`).
    * `queue_length`: Count of customers waiting ahead when customer arrived.
    * `service_duration`: Service processing time in minutes (`service_end_time - service_start_time`).
    * `service_type`: Optional foreign key to `ServiceType`.

### `apps.datasets`
* **Purpose:** Handles ingestion of raw CSV datasets into the database.
* **Entities:**
  * `DatasetMetadata`: Stores metadata of imported datasets (filename, record count, date ranges, import timestamp, source notes).
* **Management Commands:**
  * `python manage.py import_dataset <filepath>`: Validates and loads records into `QueueObservation` with batch processing.

### `apps.predictions`
* **Purpose:** Serves as the abstraction boundary for ML models.
* **Current Phase Status:** Foundation only. **No hardcoded prediction values and no fake ML.**
* **Future Implementation:**
  * Model registry & artifact loader (joblib / pickle).
  * Feature preprocessor pipeline.
  * Real-time inference endpoint `POST /api/predictions/predict/`.

### `apps.analytics`
* **Purpose:** Read-only aggregations and statistical endpoints.
* **Current Phase Status:** Placeholder endpoints and schema readiness.
* **Future Implementation:**
  * Average waiting time by hour of day and day of week.
  * Queue length percentiles and peak congestion windows.

---

## 5. REST API Specification

All API endpoints return JSON with standard HTTP status codes.

| Method | Endpoint | Description | Response Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health/` | System status, database health, service name | 200 OK |
| `GET` | `/api/service-types/` | List all configured service categories | 200 OK |
| `POST`| `/api/service-types/` | Create a new service type | 201 Created |
| `GET` | `/api/queue-observations/` | List observations (with pagination and filtering) | 200 OK |
| `GET` | `/api/queue-observations/<id>/`| Retrieve a specific queue observation record | 200 OK |
| `GET` | `/api/datasets/summary/` | Summary of imported datasets and record counts | 200 OK |
| `GET` | `/api/predictions/status/` | Current status of prediction engine (indicates model offline) | 200 OK |

---

## 6. Frontend Architecture

### State & Data Flow
* Component-level data fetching via custom hooks (`useHealth`, `useObservations`).
* Single source of truth API client (`src/services/api.ts`) with typed Axios promises.
* Clean separation between presentation components and API integration.

### Page Views
1. **Home (`/`):** Project title, problem description, operational workflow, quick navigation links, system status indicators.
2. **Dashboard (`/dashboard`):** Real metrics from database (total observations, average wait time, average queue length, min/max times), empty state handling when no data is loaded.
3. **Data (`/data`):** Interactive data grid of queue observation records with pagination and metadata.
4. **Prediction (`/prediction`):** Operational input form (queue length, arrival time, service type) with explicit disclaimer: **"Prediction module — model not yet connected. Grounded ML training in progress."**

---

## 7. Dataset Summary & Inspection Findings

* **Source File:** `data/verified_queue_waiting_time_dataset.csv`
* **Total Observations:** 12,017
* **Columns (5):** `arrival_time`, `start_time`, `finish_time`, `wait_time`, `queue_length`
* **Date Range:** 2026-10-05 to 2026-10-22 (14 business days, 09:00 to 17:00 arrival hours)
* **Target Integrity:** `wait_time` in minutes perfectly corresponds to `start_time - arrival_time` ($|\text{diff}| \le 0.02$ min).
* **Correlation:** Pearson correlation between `queue_length` and `wait_time` is $0.964$; correlation between `hour` and `wait_time` is $0.911$.
* **Missing Fields (Reported Clearly):**
  * Counter ID / Staff ID: `NOT AVAILABLE IN DATASET`
  * Active Counters Count: `NOT AVAILABLE IN DATASET`
  * Service Type Category: `NOT AVAILABLE IN DATASET`
  * Customer Demographics / PII: `NOT AVAILABLE IN DATASET`

---

## 8. Future Machine Learning Architecture

Once Phase 1 is accepted, the ML lifecycle will proceed through:
1. **Target Formulation:** Continuous regression target $Y = \text{wait\_time (minutes)}$.
2. **Feature Engineering:**
   * Temporal: Hour of arrival (continuous & cyclical sine/cosine), minute of day, day of week.
   * Queue Dynamics: Current queue length, rolling arrival density in previous 15/30/60 minutes.
   * Service Speed: Rolling average service duration from recent completed tickets.
3. **Baseline & Candidate Models:**
   * Dummy/Mean Regressor (Baseline)
   * Multiple Linear / Ridge Regression
   * Random Forest Regressor
   * Gradient Boosting (XGBoost / LightGBM)
4. **Evaluation Metrics:** Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), $R^2$ Score.
5. **Serialization:** Trained pipeline exported via `joblib` into `backend/apps/predictions/models/`.
