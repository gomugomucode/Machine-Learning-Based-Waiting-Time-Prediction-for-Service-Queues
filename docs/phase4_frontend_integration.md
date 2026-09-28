# Phase 4 — Frontend Integration & Real-Time Prediction UI Report

**Project:** Intelligent Queue Management and Waiting-Time Prediction System  
**Course:** Bachelor of Computer Applications (BCA) — 6th Semester Major Project  
**Author:** Anupam Baral  
**Status:** **Phase 4 COMPLETED & VERIFIED**  
**Date:** September 28, 2026  

---

## 1. Executive Summary

In Phase 4, the React 19 + TypeScript + Vite frontend was connected to the live Django REST Framework prediction API (`/api/predictions/predict/` and `/api/predictions/status/`). 

### Core Accomplishments
1. **Centralized & Modular API Client:**
   - Implemented [`frontend/src/services/predictionApi.ts`](../../frontend/src/services/predictionApi.ts) with strict TypeScript types (`PredictionRequest`, `PredictionResponse`, `ConfidenceInterval`, `CongestionInfo`, `EvaluatedFeatures`, `PredictionApiError`, `BackendStatus`).
   - Normalizes environment base URLs (`VITE_API_BASE_URL` supporting both `http://127.0.0.1:8000` and `http://127.0.0.1:8000/api`).
   - Re-exported through [`frontend/src/services/api.ts`](../../frontend/src/services/api.ts) for clean backward compatibility.

2. **Revamped User-Facing Prediction UI ([`frontend/src/pages/Prediction.tsx`](../../frontend/src/pages/Prediction.tsx)):**
   - **Queue Length Input:** Number input + interactive slider with real-time field-level validation (required, integer, $0 \le \text{queue} \le 1000$).
   - **Arrival Time:** User-friendly `datetime-local` input defaulting to local time, serialized to standard ISO-8601 (`YYYY-MM-DDTHH:mm:00`).
   - **Temporal Queue Dynamics:** Optional inputs for `lag1_queue_length` ("Previous observed queue length"), `arrivals_last_15m`, and `arrivals_last_30m`.
   - **Staffing & Capacity Simulation:** Number input for `active_counters` (baseline 4 tellers) with clear academic distinction that this operates as a multi-server velocity factor ($4 / c$), not a direct feature in the 10-feature ML model.
   - **Service Category:** Dynamically populated from `/api/service-types/` with backend complexity multipliers (Cash: 0.85x, Account: 1.00x, Support: 1.25x, Loans: 1.70x, Inquiries: 0.65x).

3. **Prominent Results Presentation:**
   - **Estimated Waiting Time:** Displayed prominently in decimal minutes (e.g. `21.9 minutes`) and human-readable format (`Approximately 21 min 52 sec`).
   - **Empirical Error Tolerance Interval:** Displays expected error span (e.g. `21.1 – 22.6 minutes`) with strictly accurate academic phrasing:
     > *"Expected error tolerance: approximately ±0.78 minutes based on held-out test MAE."*
     > *(Explicitly distinguished from an uncalibrated 95% Bayesian confidence interval).*
   - **Congestion Badge:** Renders backend-computed congestion level (`Low Delay`, `Moderate Wait`, `Substantial Congestion`, `Severe Congestion`) and badge color.
   - **Feature Transparency:** Collapsible section displaying all operational inputs evaluated at inference moment, with internal trigonometric encodings (`sin_time`, `cos_time`) neatly tucked inside an advanced debug toggle.
   - **Methodology & Leakage Guardrails:** Collapsible educational breakdown explaining the 10-feature causal pipeline and verification of zero target leakage.

4. **Testing & Verification:**
   - 15/15 Frontend tests passing in Vitest (`npm test -- --run`).
   - 0 TypeScript / ESLint errors; production build succeeded in 523ms (`npm run build`).
   - 17/17 Django tests passing (`python backend/manage.py test apps`).
   - 11/11 ML pipeline tests passing (`pytest backend/ml/tests/ -v`).
   - Browser subagent completed end-to-end user flow verification on `http://localhost:5173/prediction`.

---

## 2. API Integration Architecture

```
User Form Inputs (Queue Length, Arrival Time, Counters, Service Type)
                          │
                          ▼
            [frontend/src/pages/Prediction.tsx]
                          │ Form Validation (Field Errors)
                          ▼
     [frontend/src/services/predictionApi.ts]
                          │ POST /api/predictions/predict/
                          ▼
           [Django REST API: PredictWaitingTimeView]
                          │ Validation (Integer checks, ISO parse)
                          ▼
               [PredictionService (Singleton)]
                          │ Feature Construction (build_single_inference_vector)
                          ▼
           [Causal Feature Matrix X (10 features)]
                          │ Leakage Check (validate_feature_matrix)
                          ▼
        [Random Forest Regressor (best_waiting_time_model.joblib)]
                          │ Base wait time prediction
                          ▼
      [Capacity Scaling (4/c) & Service Multipliers]
                          │
                          ▼
[JSON Response: Predicted Wait, ±MAE Tolerance, Congestion, Features]
                          │
                          ▼
             [React Prediction Result UI]
```

---

## 3. Request & Response Schemas

### Request Schema (`POST /api/predictions/predict/`)

```json
{
  "queue_length": 25,
  "arrival_time": "2026-10-19T10:30:00",
  "lag1_queue_length": 23,
  "arrivals_last_15m": 8,
  "arrivals_last_30m": 17,
  "active_counters": 4,
  "service_type": 1
}
```

### Response Schema

```json
{
  "status": "success",
  "predicted_wait_minutes": 26.36,
  "predicted_wait_seconds": 1582,
  "model": "Random Forest Regressor",
  "model_name": "Random Forest Regressor",
  "model_version": "phase2-best-model",
  "confidence_interval": {
    "lower_minutes": 25.59,
    "upper_minutes": 27.14,
    "mae_tolerance": 0.78,
    "method": "Empirical ±MAE error tolerance interval from held-out test evaluation (test MAE = 0.92 min)."
  },
  "congestion": {
    "level": "Moderate Wait",
    "badge_color": "blue"
  },
  "features_evaluated": {
    "queue_length": 25.0,
    "minutes_since_opening": 90.0,
    "hour": 10.0,
    "minute": 30.0,
    "day_of_week": 0.0,
    "sin_time": 0.9238795325112867,
    "cos_time": 0.38268343236508984,
    "lag1_queue_length": 23.0,
    "arrivals_last_15m": 8.0,
    "arrivals_last_30m": 17.0,
    "active_counters": 4,
    "capacity_multiplier": 1.0,
    "service_type_name": "Cash Transactions",
    "service_complexity_multiplier": 0.85
  }
}
```

---

## 4. Verification & Test Matrix

| Test Suite | Commands Executed | Result | Notes |
| :--- | :--- | :---: | :--- |
| **Frontend Unit Tests** | `npm test -- --run` | **15 / 15 PASSED** | Mocks API, validates 10 scenarios including field validation, loading, errors, ±MAE tolerance phrasing, and online/offline status. |
| **Frontend Production Build** | `npm run build` | **PASSED (0 errors)** | Full TypeScript compilation (`tsc -b`) and Vite production bundle generated in 523ms. |
| **Backend Django Tests** | `python backend/manage.py test apps` | **17 / 17 PASSED** | All queue management, dataset, prediction, and analytics tests pass. |
| **ML Pipeline Tests** | `pytest backend/ml/tests/ -v` | **11 / 11 PASSED** | Temporal split, target verification, causal feature shapes, leakage detector, and model serialization checks pass. |
| **API Failure Cases** | Direct HTTP calls via `curl.exe` | **6 / 6 PASSED** | Verified Cases 1–6 (Valid, Zero queue, Negative queue 400, Missing queue 400, Invalid timestamp 400, Backend unavailable error UI). |
| **End-to-End Browser Flow** | Browser Subagent on `http://localhost:5173/prediction` | **PASSED** | Live parameter submission, result card rendering, collapsible features, and recorded artifact [`prediction_ui_flow_1790578203098.webp`](file:///C:/Users/Anupam%20Baral/.gemini/antigravity-ide/brain/0b3e0ad7-4818-4fcc-8122-de06c1c06103/prediction_ui_flow_1790578203098.webp). |
