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
| **Phase 5** | **Real-World Validation, Model Stress Testing & Academic Robustness** | Full dataset structure audit, rigorous $R^2 \approx 0.9994$ investigation, feature ablations (Exp A–E), temporal generalization, monotonicity & edge case testing, and academic defensibility. | <span style="color:green;font-weight:bold;">🟢 COMPLETED</span> | [`docs/phase5_high_r2_investigation.md`](phase5_high_r2_investigation.md) & [`docs/phase5_dataset_structure_audit.md`](phase5_dataset_structure_audit.md) |
| **Phase 6** | **Academic Report & Defense Preparation** | Final thesis documentation, literature review, methodology chapter, comparative experimental tables, viva defense presentation. | <span style="color:blue;font-weight:bold;">🔵 NEXT PHASE</span> | Planned |

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

### Phase 5: Real-World Validation, Model Stress Testing & Academic Robustness
- [x] Dataset structure audit in [`docs/phase5_dataset_structure_audit.md`](phase5_dataset_structure_audit.md) (12,017 records, 14 days, $r = 0.96435$, lag-1 autocorr = 0.9953)
- [x] Scientific investigation of $R^2 = 0.9994$ in [`docs/phase5_high_r2_investigation.md`](phase5_high_r2_investigation.md) (M/M/4 queuing physics, Little's Law slope match $0.7739 \approx 0.7750$, discrete-event simulation determinism)
- [x] Controlled 5-experiment feature ablation in [`docs/phase5_feature_ablation.md`](phase5_feature_ablation.md) and [`backend/ml/artifacts/ablation_results.json`](../backend/ml/artifacts/ablation_results.json):
  - Exp A (`queue_length` only): $R^2 = 0.9442$, MAE = 11.95 min
  - Exp B (`queue_length` + `minutes_since_opening`): $R^2 = 0.9939$, MAE = 3.36 min
  - Exp C (All 10 causal features): $R^2 = 0.9994$, MAE = 0.89 min
  - Exp D (No `queue_length`, 9 remaining): $R^2 = 0.9994$, MAE = 0.91 min (`lag1` surrogate)
  - Exp E (Only 6 temporal features): $R^2 = 0.9216$, MAE = 13.31 min
- [x] Temporal generalization and day-by-day stability in [`docs/phase5_temporal_generalization.md`](phase5_temporal_generalization.md) (Days 11–14 held-out MAE: 0.64 to 1.16 min)
- [x] Target proxy audit and extreme-case monotonicity analysis in [`docs/phase5_edge_case_analysis.md`](phase5_edge_case_analysis.md):
  - Proved all 10 features strictly causal and available at $t_0$
  - Discovered and explained non-monotonicity at $Q=100$ (10:30 AM) due to unconstrained decision tree boundary splits
- [x] High-resolution academic figures generated in [`backend/ml/phase5_figures/`](../backend/ml/phase5_figures/) and [`docs/phase5_figures/`](phase5_figures/)
- [x] 100% full regression pass: 17 Django tests, 11 ML tests, 15 Frontend tests, and production build
