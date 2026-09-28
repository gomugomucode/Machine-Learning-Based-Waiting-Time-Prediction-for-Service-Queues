# Intelligent Queue Management & Waiting-Time Prediction System

**Academic Degree:** Bachelor of Computer Applications (BCA) — 6th Semester Major Project  
**Author:** Anupam Baral  
**Current Status:** **Phase 2 Completed** (Dataset Validation, Rigorous Causal Leakage Audit, Chronological Train/Test Split, Baselines, and ML Experiments Verified)  

---

## 1. Project Overview

In busy customer service environments (such as retail banking branches, public service offices, and hospitals), unmanaged customer congestion, unpredictable arrival waves, and non-transparent wait times lead to prolonged delays, customer dissatisfaction, and staff burnout.

This project delivers an end-to-end, scientifically grounded queue management and waiting-time prediction platform. The architecture integrates:
1. **High-Performance Backend:** A Django REST Framework service backed by a local PostgreSQL 17 database storing 12,017 real-world queue observations.
2. **Reproducible Machine Learning Engine (`backend/ml/`):** A dedicated, leak-free regression pipeline implementing causal feature engineering, chronological train/test splitting, baseline benchmarks, and non-linear ensemble models.
3. **Interactive React 19 Frontend (`frontend/`):** A modern, responsive web application providing real-time queue telemetry dashboards, paginated dataset browsing, and dynamic waiting-time prediction interfaces.

### Core Architectural Principle: No Fabricated ML
In strict accordance with academic standards, **this project never manufactures synthetic predictions, simulated metrics, or black-box third-party AI APIs**. All reported metrics and saved model artifacts are derived directly from reproducible training and evaluation on the 12,017 verified observation records.

---

## 2. Technology Stack

### Frontend Architecture
* **React 19** with **TypeScript** (Strict type enforcement)
* **Vite** (Next-generation lightning-fast build tool)
* **Tailwind CSS v4** (Modern utility-first responsive styling)
* **React Router v7** (Declarative client-side routing)
* **Axios** (Centralized, typed HTTP client)
* **Lucide React** (Clean, professional SVG iconography)
* **Vitest & React Testing Library** (Unit and integration test harness)

### Backend Architecture
* **Python 3.12+**
* **Django 5.x** & **Django REST Framework (DRF)**
* **PostgreSQL 17** (Relational ACID database connected via `psycopg2-binary`)
* **scikit-learn 1.6+** (Machine learning algorithms: Linear Regression, Random Forest, Gradient Boosting)
* **Pandas & NumPy** (Vectorized data manipulation and feature engineering)
* **Matplotlib** (Automated generation of publication-quality diagnostic plots)
* **joblib** (Model serialization and artifact persistence)
* **pytest & pytest-django** (Comprehensive automated test suites)

---

## 3. Detailed Repository Structure & Module Functionality

The repository follows a clean, decoupled monorepo architecture separating the backend REST API, the machine learning experimentation pipeline, the React frontend, raw datasets, and comprehensive academic documentation:

```text
bca-project/
├── backend/                                  # Django REST API & Machine Learning Module
│   ├── manage.py                             # Django CLI administrative entry point
│   ├── requirements.txt                      # Python dependencies (Django, DRF, sklearn, pandas, etc.)
│   ├── .env                                  # Active environment credentials (DB connection, secret key)
│   ├── .env.example                          # Template for environment configuration
│   ├── config/                               # Core Django project configuration
│   │   ├── __init__.py                       # Package initializer
│   │   ├── asgi.py                           # ASGI application definition for async support
│   │   ├── wsgi.py                           # WSGI entry point for production deployment
│   │   ├── settings.py                       # Global settings (DB config, CORS, installed apps)
│   │   └── urls.py                           # Root URL router mapping /api/* endpoints
│   ├── apps/                                 # Modular Django applications
│   │   ├── queue_management/                 # Domain logic for queues and services
│   │   │   ├── models.py                     # ServiceType and QueueObservation database models
│   │   │   ├── serializers.py                # Model serializers for DRF views
│   │   │   ├── views.py                      # Viewsets for service types and observations
│   │   │   ├── urls.py                       # URL routing for queue management endpoints
│   │   │   └── tests.py                      # Unit tests for models and REST endpoints
│   │   ├── datasets/                         # Dataset ingestion and audit tracking
│   │   │   ├── models.py                     # DatasetMetadata tracking imported CSV batches
│   │   │   ├── serializers.py                # Serializer for dataset summaries
│   │   │   ├── views.py                      # Dataset summary and health views
│   │   │   ├── urls.py                       # URL routing for dataset endpoints
│   │   │   └── management/commands/
│   │   │       └── import_dataset.py         # CLI command to batch-import CSV to PostgreSQL
│   │   ├── predictions/                      # Machine learning inference boundary
│   │   │   ├── models/                       # Directory for serialized joblib model artifacts
│   │   │   ├── services.py                   # PredictionService loading models & computing estimates
│   │   │   ├── views.py                      # /api/predictions/status/ & /predict/ endpoints
│   │   │   ├── urls.py                       # URL routing for prediction endpoints
│   │   │   └── management/commands/
│   │   │       └── train_prediction_model.py # CLI command to run in-app training
│   │   └── analytics/                        # Aggregations and historical metrics
│   │       ├── views.py                      # AnalyticsOverviewView & HourlyQueueAnalyticsView
│   │       └── urls.py                       # URL routing for telemetry endpoints
│   └── ml/                                   # Dedicated Reproducible ML Pipeline (Phase 2)
│       ├── __init__.py                       # Package initializer
│       ├── data_loader.py                    # Loads, cleans, and parses timestamps from CSV
│       ├── validation.py                     # 20-point validation suite & target verification
│       ├── features.py                       # Causal feature extraction & leakage validator
│       ├── split.py                          # Chronological temporal splitting preserving intact days
│       ├── baselines.py                      # Global Mean, Queue Proportional, & Hourly Mean baselines
│       ├── train.py                          # Candidate model training (Linear, RF, Gradient Boosting)
│       ├── evaluate.py                       # Out-of-sample benchmark evaluation harness (MAE, RMSE, R²)
│       ├── explain.py                        # Sliced error analysis & permutation feature importance
│       ├── plots.py                          # Matplotlib plotting routines for dataset & residuals
│       ├── run_experiments.py                # End-to-end reproducible experiment runner
│       ├── artifacts/                        # Persisted model outputs
│       │   ├── best_waiting_time_model.joblib# Serialized Random Forest model artifact
│       │   └── model_metrics.json            # Full benchmark metrics and slice error records
│       └── tests/                            # Automated test suite for ML pipeline
│           ├── __init__.py                   # Package initializer
│           └── test_ml_pipeline.py           # 11 unit & integration tests (leakage, split, models)
├── frontend/                                 # React 19 + TypeScript + Vite Single Page Application
│   ├── package.json                          # Node dependencies and scripts (dev, build, test)
│   ├── vite.config.ts                        # Vite build configuration with Tailwind CSS & Vitest
│   ├── tsconfig.json                         # TypeScript compiler configuration
│   ├── index.html                            # HTML entry point with modern typography
│   ├── .env                                  # Frontend environment variables (VITE_API_URL)
│   ├── .env.example                          # Template for frontend environment settings
│   └── src/
│       ├── main.tsx                          # React application bootstrap
│       ├── App.tsx                           # App shell wrapping router
│       ├── index.css                         # Tailwind CSS and root styling tokens
│       ├── components/                       # Modular reusable UI components
│       │   ├── Navbar.tsx                    # Header with live system navigation and status badge
│       │   ├── Footer.tsx                    # Application footer with academic credit
│       │   ├── StatCard.tsx                  # Metric highlight card with icons and trends
│       │   ├── Badge.tsx                     # Status badge (success, warning, error, info)
│       │   └── EmptyState.tsx                # Reusable empty data placeholder
│       ├── layouts/
│       │   └── MainLayout.tsx                # Base layout containing Navbar, main outlet, and Footer
│       ├── pages/                            # Route-level view components
│       │   ├── Home.tsx                      # Landing page introducing queue architecture & metrics
│       │   ├── Dashboard.tsx                 # Live analytics dashboard with hourly congestion charts
│       │   ├── Data.tsx                      # Paginated data table browsing 12,017 PostgreSQL records
│       │   └── Prediction.tsx                # Waiting-time prediction interface with scenario controls
│       ├── routes/
│       │   └── AppRoutes.tsx                 # Declarative client-side routing definitions
│       ├── services/
│       │   └── api.ts                        # Typed Axios API client for all backend endpoints
│       ├── types/
│       │   └── index.ts                      # TypeScript interfaces (QueueObservation, PredictionResult)
│       └── test/
│           ├── setup.ts                      # Vitest testing environment configuration
│           └── App.test.tsx                  # Component and rendering test suite
├── data/                                     # Raw verified dataset store
│   └── verified_queue_waiting_time_dataset.csv # 12,017 verified queue observation records
├── docs/                                     # Academic documentation & research reports
│   ├── architecture.md                       # High-level architecture, contracts, and boundaries
│   ├── data-dictionary.md                    # Column specifications, types, and missing feature log
│   ├── phase2_dataset_validation.md          # 20-point empirical data audit report
│   ├── phase2_leakage_audit.md               # Prediction-time boundary ($t_0$) & leakage audit
│   ├── phase2_ml_report.md                   # Formal Phase 2 academic report answering all 11 questions
│   ├── project-roadmap.md                    # Multi-phase progression roadmap
│   ├── work-log.md                           # Chronological engineering ledger of all changes
│   └── phase2_figures/                       # 10 publication-quality diagnostic plots
│       ├── waiting_time_distribution.png     # Target variable histogram and KDE
│       ├── queue_length_distribution.png     # Customer backlog distribution
│       ├── waiting_time_by_hour.png          # Diurnal waiting-time progression
│       ├── queue_length_by_hour.png          # Diurnal queue congestion patterns
│       ├── waiting_time_by_date.png          # Daily variation across the 14 operational days
│       ├── service_duration_distribution.png # Service duration distribution (mean = 2.38 min)
│       ├── queue_vs_waiting_time.png         # Scatter plot showing strong linear relationship (r=0.964)
│       ├── random_forest_actual_vs_predicted.png # Test set actual vs predicted scatter plot
│       ├── random_forest_residuals.png       # Residual error distribution (centered at zero)
│       └── random_forest_feature_importance.png  # Permutation feature importance on held-out test data
├── .gitignore                                # Git ignore file for secrets, venv, and build artifacts
└── README.md                                 # Comprehensive project documentation (this file)
```

---

## 4. Phase 2 Machine Learning Findings & Model Benchmark

### 4.1 Prediction-Time Boundary ($t_0$)
Predictions are generated at the exact moment a customer enters the queue ($t_0 = t_{\text{arrival}}$). All variables determined after $t_0$ (`start_time`, `finish_time`, `wait_time`, `service_duration_minutes`) are strictly excluded to eliminate target leakage.

### 4.2 Chronological Train/Test Partition
To prevent temporal leakage, a chronological split by calendar date was established:
* **Train Set:** First 10 days (October 5 to October 16, 2026) $\rightarrow$ **7,975 records (66.36%)**
* **Test Set:** Final 4 days (October 19 to October 22, 2026) $\rightarrow$ **4,042 records (33.64%)**

### 4.3 Empirical Benchmark Results (Test Set: 4,042 records)

All baseline and ML models were evaluated on the untouched out-of-sample chronological test set:

| Model | Model Type | MAE (min) | RMSE (min) | R² | Error vs Global Baseline |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Random Forest Regressor** | **Non-Linear Ensemble** | **0.9166** | **1.7678** | **0.9994** | **-98.40%** |
| Gradient Boosting Regressor | Boosted Trees | 2.7864 | 4.1357 | 0.9965 | -95.15% |
| Linear Regression (Standardized) | Multiple Linear OLS | 10.7616 | 14.6183 | 0.9568 | -81.28% |
| Queue-Aware Proportional Heuristic | Baseline 2 | 12.5694 | 16.7890 | 0.9430 | -78.14% |
| Hourly Historical Mean | Baseline 3 | 21.2898 | 28.5036 | 0.8356 | -62.97% |
| Global Historical Mean | Baseline 1 | 57.4948 | 70.3097 | -0.0001 | 0.00% |

**Key Research Conclusion:** Machine learning fundamentally improves prediction accuracy. The **Random Forest Regressor** reduced MAE from **57.49 minutes** (Global Mean) and **12.57 minutes** (Queue-Aware Heuristic) down to **0.9166 minutes** (~55 seconds), representing a **92.71% error reduction** over analytical heuristics.

Detailed error breakdowns by queue depth, diurnal period, and permutation importance are documented in [`docs/phase2_ml_report.md`](docs/phase2_ml_report.md).

---

## 5. Local Setup Instructions

### Prerequisites
* **Python 3.12+**
* **Node.js v20+ & npm**
* **PostgreSQL 17** running locally on port `5432`

### 1. Database Provisioning
Ensure PostgreSQL is active and initialize the application database:
```bash
# Connect to PostgreSQL CLI
psql -h 127.0.0.1 -U postgres

# Create database
CREATE DATABASE bca_queue_db;
\q
```

### 2. Backend Setup & Ingestion
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate   # Windows PowerShell
# or: source .venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Apply database migrations
python manage.py migrate

# Ingest verified Kaggle dataset (12,017 records)
python manage.py import_dataset ../data/verified_queue_waiting_time_dataset.csv

# Execute reproducible Phase 2 ML experiment pipeline
python ml/run_experiments.py
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 6. Automated Testing & Verification

The project includes automated test coverage across both backend and frontend layers:

```bash
# 1. Run Django API and Model tests (8 tests)
cd backend
python manage.py test apps

# 2. Run Machine Learning Pipeline tests (11 tests)
pytest ml/tests/ -v

# 3. Run Frontend Vitest component tests (5 tests)
cd ../frontend
npm test -- --run
```

All 24 automated unit and integration tests currently pass.

---

## 7. Key REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health/` | System & PostgreSQL health check |
| `GET` | `/api/service-types/` | Banking service categories and durations |
| `GET` | `/api/queue-observations/` | Paginated queue observation records (supports filtering/sorting) |
| `GET` | `/api/datasets/summary/` | Aggregate database statistics and date boundaries |
| `GET` | `/api/analytics/overview/` | Summary metrics (average wait time, service duration, queue length) |
| `GET` | `/api/analytics/hourly/` | Hourly diurnal queue density and waiting time averages |
| `GET` | `/api/predictions/status/` | Prediction engine status, loaded model architecture, and version |
| `POST` | `/api/predictions/predict/` | Inference endpoint for real-time waiting-time estimates |

---

## 8. Academic Project Roadmap

* [x] **Phase 1 — System Foundation & Data Engineering:** Architecture design, PostgreSQL schema, Django REST API, React 19 UI, dataset ingestion.
* [x] **Phase 2 — Dataset Validation & Machine Learning Experiments:** Independent target verification, leakage audit, chronological train/test split, baseline models, candidate regressors benchmark, slice error analysis, and publication figures.
* [ ] **Phase 3 — Model Deployment & Production Inference:** Connect serialized `best_waiting_time_model.joblib` to live `PredictionService`, expose confidence bounds, and enable real-time interactive simulation controls in the React frontend.
