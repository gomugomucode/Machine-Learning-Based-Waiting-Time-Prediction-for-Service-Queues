# Phase 3: Model Deployment & Backend API Integration

**Project:** Intelligent Queue Management and Waiting-Time Prediction System  
**Academic Degree:** Bachelor of Computer Applications (BCA) — 6th Semester Major Project  
**Author:** Anupam Baral  
**Status:** **Completed & Verified**  
**Execution Timestamp:** September 28, 2026  

---

## 1. Objective & Architecture

Phase 3 connects the Phase 2 trained and verified **Random Forest Regressor** to the live Django REST Framework backend service.

```text
React Client / Mobile Client
  │  HTTP POST (JSON: queue_length, arrival_time, lags)
  ▼
Django PredictWaitingTimeView (/api/predictions/predict/)
  │  Input Validation (type, non-negative, bounds, ISO-8601)
  ▼
PredictionService (Singleton in memory)
  │  build_single_inference_vector() -> validate_feature_matrix()
  ▼
Random Forest Regressor (best_waiting_time_model.joblib)
  │  Inference: raw_prediction (minutes)
  │  Scaling: active counters (capacity factor) & service category multiplier
  ▼
JSON Response (predicted_wait_minutes, predicted_wait_seconds, congestion, tolerance range)
```

---

## 2. Model Loading Strategy: Singleton Pattern

* **Zero Disk I/O Per Request:** The model artifact is loaded once using `joblib.load()` when the `PredictionService` is first initialized and retained in memory.
* **Artifact Path:** [`backend/ml/artifacts/best_waiting_time_model.joblib`](../../backend/ml/artifacts/best_waiting_time_model.joblib)
* **Metadata Path:** [`backend/ml/artifacts/model_metrics.json`](../../backend/ml/artifacts/model_metrics.json)
* **Graceful Degradation:** If the model binary is unavailable, the service transitions to `status: "offline"`, and the endpoint responds with `HTTP 503 Service Unavailable`.

---

## 3. The 10-Feature Schema

Features are formulated through [`backend/ml/features.py`](../../backend/ml/features.py) via `build_single_inference_vector()`, ensuring exact column ordering:
1. `queue_length` (Float)
2. `minutes_since_opening` (Float)
3. `hour` (Float)
4. `minute` (Float)
5. `day_of_week` (Float)
6. `sin_time` (Float)
7. `cos_time` (Float)
8. `lag1_queue_length` (Float)
9. `arrivals_last_15m` (Float)
10. `arrivals_last_30m` (Float)

---

## 4. API Endpoints

### 4.1 Real-Time Prediction (`POST /api/predictions/predict/`)
* **Request Payload:**
  ```json
  {
    "queue_length": 25,
    "lag1_queue_length": 23,
    "arrivals_last_15m": 8,
    "arrivals_last_30m": 17,
    "arrival_time": "2026-10-19T10:30:00",
    "active_counters": 4,
    "service_type": 1
  }
  ```
* **Response Payload:**
  ```json
  {
    "status": "success",
    "predicted_wait_minutes": 31.02,
    "predicted_wait_seconds": 1861,
    "model": "Random Forest Regressor",
    "model_name": "Random Forest Regressor",
    "model_version": "phase2-best-model",
    "confidence_interval": {
      "lower_minutes": 30.1,
      "upper_minutes": 31.93,
      "mae_tolerance": 0.92,
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

### 4.2 Prediction Engine Status (`GET /api/predictions/status/`)
* Returns engine connectivity (`model_connected: true`), active model name, version, and training evaluation metrics (MAE = 0.9166, RMSE = 1.7678, $R^2$ = 0.9994).

---

## 5. Input Validation Rules

* `queue_length`: Must be present, numeric, and $\ge 0$.
* `arrival_time`: Must be parseable datetime string.
* `lag1_queue_length`, `arrivals_last_15m`, `arrivals_last_30m`: Must be non-negative if provided.
* `active_counters`: Must be integer between 1 and 50 (defaults to 4).
* Invalid payloads immediately return `HTTP 400 Bad Request` with descriptive messages.

---

## 6. Verification Status

* **Django Tests:** `python backend/manage.py test apps` $\rightarrow$ **17/17 passed** (including 9 dedicated prediction tests).
* **ML Tests:** `pytest backend/ml/tests/ -v` $\rightarrow$ **11/11 passed**.
* **Frontend Tests:** `npm test -- --run` $\rightarrow$ **5/5 passed**.
* **Live Smoke Test:** `python backend/ml/smoke_test_inference.py` $\rightarrow$ **Passed cleanly**.
* **Live HTTP Endpoint Test:** Verified with active Django dev server on port 8000.
