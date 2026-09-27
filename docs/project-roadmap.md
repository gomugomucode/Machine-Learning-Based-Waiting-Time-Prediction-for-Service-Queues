# BCA Major Project: Engineering & Research Roadmap

**Project:** Machine Learning-Based Waiting Time Prediction for Service Queues  
**Course:** Bachelor of Computer Applications (BCA) — 6th Semester  
**Student Developer:** Anupam Baral  

---

## Phase Status Summary

| Phase | Phase Name | Focus Area | Status | Documentation Link |
| :---: | :--- | :--- | :---: | :--- |
| **Phase 1** | **Application Foundation & Data Inspection** | Project structure, PostgreSQL, Django DRF, React Vite SPA, Kaggle dataset verification | <span style="color:green;font-weight:bold;">🟢 COMPLETED</span> | [`docs/phases/phase-01-foundation-and-inspection.md`](phases/phase-01-foundation-and-inspection.md) |
| **Phase 2** | **Target Definition, Feature Engineering & ML Pipeline** | Mathematical target formulation, temporal train/test split, candidate benchmarking, Ridge model deployment | <span style="color:green;font-weight:bold;">🟢 COMPLETED</span> | [`docs/phases/phase-02-target-and-features.md`](phases/phase-02-target-and-features.md) |
| **Phase 3** | **Advanced Non-Linear Models & Hyperparameter Tuning** | Decision trees, Gradient Boosting hyperparameter optimization, LightGBM/XGBoost comparison | <span style="color:blue;font-weight:bold;">🔵 NEXT PHASE</span> | Planned |
| **Phase 4** | **Model Evaluation & Residual Analysis** | MAE, RMSE, R² comparison, time-series cross-validation, feature importance | <span style="color:gray;">⚪ PENDING</span> | Planned |
| **Phase 5** | **ML Model Pipeline Serialization & Serving** | Model export (`joblib`), pipeline integration into `apps/predictions/` | <span style="color:gray;">⚪ PENDING</span> | Planned |
| **Phase 6** | **Prediction Engine API Integration** | Real-time prediction endpoint `/api/predictions/predict/`, error bounds | <span style="color:gray;">⚪ PENDING</span> | Planned |
| **Phase 7** | **Interactive Prediction UI & Dashboard Charts** | Live prediction simulator, historical comparison charts (Recharts) | <span style="color:gray;">⚪ PENDING</span> | Planned |
| **Phase 8** | **Comprehensive Testing & Validation** | End-to-end integration tests, regression tests, edge-case coverage | <span style="color:gray;">⚪ PENDING</span> | Planned |
| **Phase 9** | **Academic Report & Defense Preparation** | Literature review, methodology, results chapter, viva defense deck | <span style="color:gray;">⚪ PENDING</span> | Planned |

---

## Documentation Protocol

After completing work for any phase or prompt, the developer must:
1. Update [`docs/work-log.md`](work-log.md) with chronological entries of code additions, modifications, and verifications.
2. Update or create the corresponding phase document in [`docs/phases/`](phases/).
3. Synchronize [`docs/architecture.md`](architecture.md) and [`README.md`](../README.md) if design patterns or API contracts change.
