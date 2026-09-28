# Comprehensive Project Status & Completed Tasks Summary

**Project:** Intelligent Queue Management & Machine Learning-Based Waiting Time Prediction System  
**Academic Degree:** Bachelor of Computer Applications (BCA) — 6th Semester Major Project  
**Author:** Anupam Baral  
**Report Date:** September 28, 2026  
**Project Status:** **Phase 1, Phase 2, and Phase 3 (Backend Inference) FULLY COMPLETED & VERIFIED**  

---

## 1. Executive Summary

This project implements an end-to-end, scientifically grounded waiting-time prediction platform for customer service queues (such as banks, utility offices, and hospitals).

The platform operates across three interconnected layers:
1. **Relational Database & Data Engineering:** PostgreSQL 17 database storing 12,017 verified queue observation records across 14 operational days.
2. **Reproducible Machine Learning Engine (`backend/ml/`):** A strict causal, leakage-free ML pipeline benchmarking classical queueing baselines against multiple regression algorithms. The selected **Random Forest Regressor** achieves an out-of-sample test MAE of **0.9166 minutes** (~55 seconds) and an $R^2$ of **0.9994** on 4,042 held-out test records.
3. **Full-Stack Web Application:**
   * **Backend:** Django 5 REST Framework service with modular apps (`queue_management`, `datasets`, `predictions`, `analytics`), loading the trained model as a memory-cached singleton and serving sub-5ms real-time inference via `POST /api/predictions/predict/`.
   * **Frontend:** React 19 + TypeScript + Vite SPA styled with Tailwind CSS v4, providing live queue dashboards, paginated data exploration, and waiting-time prediction interfaces.

---

## 2. Inventory of Completed Tasks by Phase

### Phase 1: Application Foundation & Data Engineering
- [x] **Monorepo Architecture:** Established decoupled structure (`backend/`, `frontend/`, `data/`, `docs/`).
- [x] **PostgreSQL 17 Database Provisioning:** Installed, configured, and running locally on port 5432 (`bca_queue_db`).
- [x] **Django Core & App Architecture:**
  - `config`: Django settings with PostgreSQL connection, CORS headers, environment variable isolation via `.env`.
  - `apps.queue_management`: Relational models for `ServiceType` and `QueueObservation` with indexed timestamp fields and automatic duration calculation.
  - `apps.datasets`: `DatasetMetadata` model tracking dataset ingestion history.
  - `apps.analytics`: Aggregations for branch summaries and hourly diurnal queue density.
  - `apps.predictions`: Decoupled prediction service interface.
- [x] **Dataset Ingestion Pipeline:** Implemented `python manage.py import_dataset` command with validation, batch insertion (batch size = 2,000), and UTC timezone localization. Successfully ingested 12,017 records from `verified_queue_waiting_time_dataset.csv`.
- [x] **React 19 Frontend SPA:** Initialized with Vite, Tailwind CSS v4, React Router v7, and Axios client. Built `Home`, `Dashboard`, `Data`, and `Prediction` pages with modular components (`Navbar`, `Footer`, `StatCard`, `Badge`, `EmptyState`).
- [x] **Initial Automated Tests:** 8 Django unit/integration tests and 5 frontend Vitest tests created and passing.

### Phase 2: Dataset Validation & Machine Learning Experiments
- [x] **20-Point Dataset Audit:** Executed full empirical audit covering completeness, missing values, duplicates, outliers, distributions, and correlations (saved in [`docs/phase2_dataset_validation.md`](phase2_dataset_validation.md)).
- [x] **Target Variable Independent Verification:**
  - Ground truth formula: $W = (t_{\text{start}} - t_{\text{arrival}})/60$.
  - Recomputed from raw timestamps and compared with CSV `wait_time`.
  - Measured MAE between calculated and recorded wait time: **0.005868 min** (max diff 0.02 min), 100% explained by 2-decimal second truncation.
- [x] **Prediction-Time Information Boundary ($t_0$):**
  - Explicitly defined $t_0 = t_{\text{arrival}}$ when customer enters queue and takes ticket.
  - Formulated strict allowlist and blocklist; prohibited `start_time`, `finish_time`, `wait_time`, `service_duration_minutes`, and future queue dynamics (saved in [`docs/phase2_leakage_audit.md`](phase2_leakage_audit.md)).
- [x] **Causal Feature Engineering Pipeline (`backend/ml/features.py`):**
  - Created 10 prediction-time features: `queue_length`, `minutes_since_opening`, `hour`, `minute`, `day_of_week`, `sin_time`, `cos_time`, `lag1_queue_length`, `arrivals_last_15m`, `arrivals_last_30m`.
  - Implemented automated `validate_feature_matrix()` assertion guardrail.
- [x] **Chronological Train/Test Partition (`backend/ml/split.py`):**
  - Enforced strict chronological split by calendar date preserving intact operational days.
  - Train: 10 business days (Oct 5 - Oct 16) $\rightarrow$ 7,975 records (66.36%).
  - Test: 4 business days (Oct 19 - Oct 22) $\rightarrow$ 4,042 records (33.64%).
- [x] **Baseline Evaluation (`backend/ml/baselines.py`):**
  - Baseline 1 (Global Mean): MAE = 57.49 min, RMSE = 70.31 min, $R^2 = -0.0001$.
  - Baseline 2 (Queue Proportional): MAE = 12.57 min, RMSE = 16.79 min, $R^2 = 0.9430$.
  - Baseline 3 (Hourly Mean): MAE = 21.29 min, RMSE = 28.50 min, $R^2 = 0.8356$.
- [x] **Candidate ML Models Benchmark (`backend/ml/train.py`, `backend/ml/evaluate.py`):**
  - Linear Regression: MAE = 10.76 min, RMSE = 14.62 min, $R^2 = 0.9568$.
  - Gradient Boosting: MAE = 2.79 min, RMSE = 4.14 min, $R^2 = 0.9965$.
  - **Random Forest (Best):** MAE = **0.9166 min** (~55 seconds), RMSE = **1.7678 min**, $R^2 = \mathbf{0.9994}$.
- [x] **Slice-Based Error Analysis (`backend/ml/explain.py`):** Evaluated error across queue depth bins (short, medium, long), diurnal periods (morning, midday, afternoon), and individual test dates.
- [x] **Feature Interpretability:** Computed permutation importance on held-out test data (`queue_length`: 0.5695, `lag1_queue_length`: 0.2345, `minutes_since_opening`: 0.0514).
- [x] **Diagnostic Figures Generation (`backend/ml/plots.py`):** 10 publication plots generated in [`docs/phase2_figures/`](phase2_figures/).
- [x] **Model Artifact Persistence:** Serialized model to [`backend/ml/artifacts/best_waiting_time_model.joblib`](../backend/ml/artifacts/best_waiting_time_model.joblib) with metrics in [`backend/ml/artifacts/model_metrics.json`](../backend/ml/artifacts/model_metrics.json).
- [x] **ML Automated Tests:** 11 unit/integration tests created in [`backend/ml/tests/test_ml_pipeline.py`](../backend/ml/tests/test_ml_pipeline.py).
- [x] **Comprehensive Academic Report:** Authored [`docs/phase2_ml_report.md`](phase2_ml_report.md) answering all 11 core research questions.

### Phase 3: Model Deployment & Backend API Integration
- [x] **Singleton Model Loader (`backend/apps/predictions/services.py`):**
  - Updated `PredictionService` to load the verified `.joblib` model once into memory upon server startup.
  - Zero disk I/O on inference requests.
  - Automatic graceful degradation to `status: "offline"` (HTTP 503) if artifacts are absent.
- [x] **Causal Feature Extraction at Inference:**
  - Integrated `build_single_inference_vector` from `backend/ml/features.py` as single source of truth for inference features.
  - Guaranteed exact 10-feature schema ordering identical to training set.
- [x] **Inference Endpoint (`POST /api/predictions/predict/`):**
  - Real-time waiting time estimation from operational inputs.
  - Supports multi-server capacity scaling (active tellers) and banking service category multipliers.
  - Calculates empirical $\pm\text{MAE}$ error tolerance interval based on verified test evaluation (MAE = 0.92 min).
  - Categorizes operational congestion level (Low Delay, Moderate Wait, Substantial Congestion, Severe Congestion).
- [x] **Status Endpoint (`GET /api/predictions/status/`):** Returns live engine status, model metadata, and benchmark comparison table.
- [x] **Strict Input Validation (`backend/apps/predictions/views.py`):**
  - Enforced required `queue_length` ($\ge 0$).
  - Validated ISO datetime parsing for `arrival_time`.
  - Validated non-negative bounds for `lag1_queue_length`, `arrivals_last_15m`, and `arrivals_last_30m`.
  - Returns descriptive `HTTP 400 Bad Request` on invalid inputs.
- [x] **Prediction Test Suite (`backend/apps/predictions/tests.py`):**
  - 9 automated tests verifying successful prediction, missing fields, negative values, malformed timestamps, model artifact loading, exact 10-feature ordering, and rejection of post-$t_0$ leakage attributes.
- [x] **CLI Smoke Test Utility (`backend/ml/smoke_test_inference.py`):** End-to-end command-line verification script.
- [x] **Live HTTP Verification:** Executed live HTTP calls against running Django server on port 8000, confirming both successful inference and robust error rejection.
- [x] **Documentation:** Authored [`docs/phase3_model_integration.md`](phase3_model_integration.md).

---

## 3. Current Live Processes & System Health

All three system processes are active, healthy, and running without errors:

| Service | Runtime / Engine | Port / Address | Health Status | Verification Command |
| :--- | :--- | :--- | :---: | :--- |
| **Relational Database** | PostgreSQL 17.2 | `127.0.0.1:5432` (`bca_queue_db`) | 🟢 **ACTIVE** | Local PostgreSQL daemon running |
| **Backend REST API** | Django 5.2.17 + DRF | `http://127.0.0.1:8000/` | 🟢 **ACTIVE** | `python manage.py runserver` (0 issues silenced) |
| **Frontend SPA** | Vite v8.3.1 + React 19 | `http://127.0.0.1:5173/` | 🟢 **ACTIVE** | `npm run dev` (ready in 570ms) |

---

## 4. Complete Automated Test Suite Status

Every layer of the application is covered by automated unit and integration tests:

| Test Suite | Framework / Tool | Test File | Tests Run | Result | Duration |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Django Queue Management** | Django Test Runner | `apps/queue_management/tests.py` | 8 | 🟢 **8/8 PASSED** | 0.99s |
| **Django Predictions API** | Django Test Runner | `apps/predictions/tests.py` | 9 | 🟢 **9/9 PASSED** | 1.12s |
| **Total Django Backend** | `python manage.py test apps` | *Combined* | **17** | 🟢 **17/17 PASSED** | **1.15s** |
| **ML Pipeline & Leakage** | Pytest (`pytest-django`) | `ml/tests/test_ml_pipeline.py` | **11** | 🟢 **11/11 PASSED** | **1.85s** |
| **Frontend UI Components** | Vitest + React Testing Library | `frontend/src/test/App.test.tsx`| **5** | 🟢 **5/5 PASSED** | **2.60s** |
| **Total Automated Coverage** | — | — | **33** | 🟢 **33/33 PASSED** | — |

---

## 5. Live REST API Endpoints Overview

| Method | URL | Description | Auth | Status |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/health/` | System, backend, and PostgreSQL health check | None | 🟢 200 OK |
| `GET` | `/api/service-types/` | Available banking service categories & duration multipliers | None | 🟢 200 OK |
| `GET` | `/api/queue-observations/` | Paginated queue observation records (12,017 rows) | None | 🟢 200 OK |
| `GET` | `/api/datasets/summary/` | Aggregate database counts, date bounds, and averages | None | 🟢 200 OK |
| `GET` | `/api/analytics/overview/` | Summary metrics (average wait, queue length, service duration) | None | 🟢 200 OK |
| `GET` | `/api/analytics/hourly/` | Hourly diurnal queue density and wait time distribution | None | 🟢 200 OK |
| `GET` | `/api/predictions/status/` | Prediction engine status, loaded model type, and benchmarks | None | 🟢 200 OK |
| `POST` | `/api/predictions/predict/` | Real-time waiting time inference from queue observations | None | 🟢 200 OK |

---

## 6. Complete Documentation Directory Index

All technical reports and architectural specifications in `docs/`:

1. [`docs/README.md`](../README.md): Master project README with complete folder breakdown and local setup guide.
2. [`docs/architecture.md`](architecture.md): Monorepo system architecture, database schema, and component contracts.
3. [`docs/data-dictionary.md`](data-dictionary.md): Attribute-level catalog, data types, and missing feature documentation.
4. [`docs/phase2_dataset_validation.md`](phase2_dataset_validation.md): 20-point empirical data validation audit.
5. [`docs/phase2_leakage_audit.md`](phase2_leakage_audit.md): Prediction-time boundary ($t_0$) definition and leakage prevention audit.
6. [`docs/phase2_ml_report.md`](phase2_ml_report.md): Formal Phase 2 machine learning experimentation report.
7. [`docs/phase3_model_integration.md`](phase3_model_integration.md): Model deployment and Django backend integration report.
8. [`docs/project-roadmap.md`](project-roadmap.md): Multi-phase engineering roadmap and milestone checklists.
9. [`docs/work-log.md`](work-log.md): Chronological ledger of all engineering entries (Entries 001 through 011).
10. [`docs/phases/phase-01-foundation-and-inspection.md`](phases/phase-01-foundation-and-inspection.md): Phase 1 milestone report.
11. [`docs/phases/phase-02-target-and-features.md`](phases/phase-02-target-and-features.md): Phase 2 milestone report.
12. [`docs/phases/phase-03-model-deployment-and-api.md`](phases/phase-03-model-deployment-and-api.md): Phase 3 milestone report.
13. [`docs/phase2_figures/`](phase2_figures/): 10 publication-quality diagnostic plots.
