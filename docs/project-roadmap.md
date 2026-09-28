# BCA Major Project: Engineering & Research Roadmap

**Project:** Intelligent Queue Management & Machine Learning-Based Waiting Time Prediction System  
**Course:** Bachelor of Computer Applications (BCA) — 6th Semester Major Project  
**Student Developer:** Anupam Baral  
**Current Status:** **Phase 1, Phase 2, and Phase 3 (Backend Inference) COMPLETED**  

---

## Phase Status Summary

| Phase | Phase Name | Focus Area | Status | Documentation Link |
| :---: | :--- | :--- | :---: | :--- |
| **Phase 1** | **Application Foundation & Data Engineering** | Monorepo layout, PostgreSQL 17 setup, Django REST Framework backend, React 19 + TypeScript + Vite frontend, 12,017 Kaggle queue observations ingestion. | <span style="color:green;font-weight:bold;">🟢 COMPLETED</span> | [`docs/phases/phase-01-foundation-and-inspection.md`](phases/phase-01-foundation-and-inspection.md) |
| **Phase 2** | **Dataset Validation & Machine Learning Experiments** | 20-point validation audit, independent target verification, prediction-time information boundary ($t_0$), causal 10-feature engineering, chronological train/test split, baselines, and candidate ML models benchmark. | <span style="color:green;font-weight:bold;">🟢 COMPLETED</span> | [`docs/phase2_ml_report.md`](phase2_ml_report.md) & [`docs/phase2_dataset_validation.md`](phase2_dataset_validation.md) |
| **Phase 3** | **Model Deployment & Backend API Integration** | In-memory singleton `PredictionService`, `POST /api/predictions/predict/`, strict input validation, exact 10-feature schema enforcement, absence of leakage assertions, and smoke test utility. | <span style="color:green;font-weight:bold;">🟢 COMPLETED</span> | [`docs/phase3_model_integration.md`](phase3_model_integration.md) |
| **Phase 4** | **Interactive UI Integration & Visual Telemetry** | Connect React prediction view to live backend inference, dynamic counter simulation sliders, empirical tolerance bounds, and congestion alert cards. | <span style="color:green;font-weight:bold;">🟢 COMPLETED</span> | [`docs/phase4_frontend_integration.md`](phase4_frontend_integration.md) |
| **Phase 5** | **System Hardening & End-to-End Testing** | Production readiness, comprehensive integration test suite, cross-browser validation, and stress-testing. | <span style="color:blue;font-weight:bold;">🔵 NEXT PHASE</span> | Planned |
| **Phase 6** | **Academic Report & Defense Preparation** | Final thesis documentation, literature review, methodology chapter, comparative experimental tables, viva defense presentation. | <span style="color:gray;">⚪ PENDING</span> | Planned |

---

## Detailed Milestone Verification Checklist

### Phase 1: Foundation & Data Engineering
- [x] Monorepo layout (`backend/`, `frontend/`, `data/`, `docs/`)
- [x] PostgreSQL 17 database `bca_queue_db` initialized on port 5432
- [x] Django apps created: `queue_management`, `datasets`, `predictions`, `analytics`
- [x] Dataset importer CLI `python manage.py import_dataset` executed (12,017 records imported)
- [x] React 19 + TypeScript + Vite frontend operational with Tailwind CSS v4
- [x] All 8 Django foundation tests passing; 5 Vitest frontend tests passing

### Phase 2: Dataset Validation & Machine Learning Experiments
- [x] 20-point data audit completed in [`docs/phase2_dataset_validation.md`](phase2_dataset_validation.md)
- [x] Target independently verified ($W = (t_{\text{start}} - t_{\text{arrival}})/60$, MAE = 0.0058 min due to rounding)
- [x] Prediction-Time Information Boundary established at $t_0 = t_{\text{arrival}}$ in [`docs/phase2_leakage_audit.md`](phase2_leakage_audit.md)
- [x] 10 strictly causal prediction-time features engineered in [`backend/ml/features.py`](../backend/ml/features.py)
- [x] Chronological train/test split established (10 days train: 7,975 rows / 4 days test: 4,042 rows)
- [x] Baselines evaluated on held-out test data (Global Mean: 57.49 min, Queue Proportional: 12.57 min, Hourly Mean: 21.29 min)
- [x] Candidate models evaluated on held-out test data:
  - Linear Regression: MAE = 10.76 min, RMSE = 14.62 min, $R^2 = 0.9568$
  - Gradient Boosting: MAE = 2.79 min, RMSE = 4.14 min, $R^2 = 0.9965$
  - **Random Forest (Selected):** MAE = **0.9166 min**, RMSE = **1.7678 min**, $R^2 = \mathbf{0.9994}$
- [x] Slice-based error analysis by queue depth, diurnal period, and test dates
- [x] Permutation feature importance computed on held-out test set
- [x] 10 publication figures saved in [`docs/phase2_figures/`](phase2_figures/)
- [x] 11 unit & integration tests passing in [`backend/ml/tests/`](../backend/ml/tests/)
- [x] Best model persisted to [`backend/ml/artifacts/best_waiting_time_model.joblib`](../backend/ml/artifacts/best_waiting_time_model.joblib)

### Phase 3: Model Deployment & Django Backend Integration
- [x] Memory-cached singleton `PredictionService` implemented in [`backend/apps/predictions/services.py`](../backend/apps/predictions/services.py)
- [x] Model loaded once on startup from `backend/ml/artifacts/best_waiting_time_model.joblib`
- [x] Real-time inference endpoint `POST /api/predictions/predict/` active and operational
- [x] Status endpoint `GET /api/predictions/status/` returning live model metadata
- [x] Strict input validation for non-negative queue length, valid ISO timestamps, and bounds
- [x] Empirical $\pm\text{MAE}$ error tolerance interval transparently documented
- [x] 9 Django tests passing in [`backend/apps/predictions/tests.py`](../backend/apps/predictions/tests.py) (17 total Django tests)
- [x] CLI smoke test utility [`backend/ml/smoke_test_inference.py`](../backend/ml/smoke_test_inference.py) verifying end-to-end inference
- [x] Comprehensive documentation in [`docs/phase3_model_integration.md`](phase3_model_integration.md)

### Phase 4: Frontend Integration & Real-Time Prediction UI
- [x] Centralized typed API client created in [`frontend/src/services/predictionApi.ts`](../frontend/src/services/predictionApi.ts)
- [x] Base URL normalization for `VITE_API_BASE_URL` supporting `/api` routing
- [x] Interactive prediction page with required/optional field validation in [`frontend/src/pages/Prediction.tsx`](../frontend/src/pages/Prediction.tsx)
- [x] Prominent estimated waiting time display (minutes and "Approximately X min Y sec")
- [x] Empirical $\pm\text{MAE}$ error tolerance interval accurately labeled (distinct from 95% confidence interval)
- [x] Congestion badge rendered from backend response
- [x] Technical model info and collapsible causal feature transparency
- [x] Complete Vitest test suite with 10 integration scenarios passing (`npm test -- --run`, 15/15 tests)
- [x] End-to-end browser verification on `http://localhost:5173/prediction`
- [x] Comprehensive Phase 4 report created in [`docs/phase4_frontend_integration.md`](phase4_frontend_integration.md)
