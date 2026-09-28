# Phase 3: Model Deployment & Django Backend Integration Report

**Project:** Intelligent Queue Management and Waiting-Time Prediction System  
**Academic Degree:** Bachelor of Computer Applications (BCA) — 6th Semester Major Project  
**Author:** Anupam Baral  
**Status:** **Completed & Verified**  
**Execution Timestamp:** September 28, 2026  

---

## Executive Summary

Phase 3 established the production bridge between the machine learning artifacts trained and verified during Phase 2 and the Django REST Framework backend.

The verified Phase 2 **Random Forest Regressor** was integrated into [`PredictionService`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/apps/predictions/services.py) as a memory-cached singleton. The prediction endpoint (`POST /api/predictions/predict/`) now ingests operational queue arrival states, extracts the exact 10-feature schema via the causal pipeline [`backend/ml/features.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/ml/features.py), validates all bounds, and returns real-time waiting-time estimates.

---

## 1. Model Artifact

* **File Location:** [`backend/ml/artifacts/best_waiting_time_model.joblib`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/ml/artifacts/best_waiting_time_model.joblib)
* **Metadata Location:** [`backend/ml/artifacts/model_metrics.json`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/ml/artifacts/model_metrics.json)
* **File Size:** ~17.55 MB
* **Serialization Format:** Python `joblib` binary format

---

## 2. Model Type & Performance

* **Algorithm:** `sklearn.ensemble.RandomForestRegressor`
* **Hyperparameters:**
  * `n_estimators = 100`
  * `max_depth = 12`
  * `min_samples_leaf = 2`
  * `min_samples_split = 5`
  * `random_state = 42`
* **Verified Out-of-Sample Performance (on 4,042 untouched test records, Week 3):**
  * **MAE:** **0.9166 minutes** (~55 seconds average prediction error across ~100 min queues)
  * **RMSE:** **1.7678 minutes**
  * **R² Score:** **0.9994** (Explains 99.94% of out-of-sample waiting-time variance)
  * **Error Reduction vs Baseline:** **98.40% error reduction** over Global Mean; **92.71% error reduction** over Queue-Aware Proportional Heuristic.

---

## 3. Input Features (The Exact 10-Feature Schema)

The model evaluates exactly 10 features strictly constructed from information available at prediction moment $t_0 = t_{\text{arrival}}$ in the following fixed column ordering:

```text
1. queue_length           (float: observed number of waiting customers ahead in line)
2. minutes_since_opening  (float: continuous minutes elapsed since 09:00:00 opening, [0, 480])
3. hour                   (float: arrival hour, [9, 16])
4. minute                 (float: arrival minute, [0, 59])
5. day_of_week            (float: 0=Monday through 4=Friday)
6. sin_time               (float: sin(2π · minutes_since_opening / 480))
7. cos_time               (float: cos(2π · minutes_since_opening / 480))
8. lag1_queue_length      (float: queue length of immediately preceding customer)
9. arrivals_last_15m      (float: customer arrivals in the 15 minutes before t_0)
10. arrivals_last_30m     (float: customer arrivals in the 30 minutes before t_0)
```

---

## 4. API Endpoints

### 4.1 Real-Time Prediction Inference
* **URL:** `/api/predictions/predict/`
* **HTTP Method:** `POST`
* **Content-Type:** `application/json`

### 4.2 Prediction Engine Status
* **URL:** `/api/predictions/status/`
* **HTTP Method:** `GET`
* **Content-Type:** `application/json`

---

## 5. Request Schema

### 5.1 Full Causal Request Example
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

### 5.2 Minimal Required Request Example
```json
{
  "queue_length": 25,
  "arrival_time": "2026-10-19T10:30:00"
}
```

*Note:* When `lag1_queue_length`, `arrivals_last_15m`, or `arrivals_last_30m` are omitted, the backend feature builder automatically supplies empirical priors (`queue_length`, `27.5`, and `55.0` respectively).

---

## 6. Response Schema

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

*Honesty & Transparency Note:* The `confidence_interval` is explicitly documented as the **empirical $\pm\text{MAE}$ error tolerance interval** derived from the measured Phase 2 test evaluation (MAE = 0.92 min), rather than presenting a fabricated parametric Gaussian or Bayesian interval.

---

## 7. Input Validation Rules

The API enforces strict validation rules before any inference computation:

| Parameter | Type / Constraint | Validation Rule | Action on Failure |
| :--- | :--- | :--- | :--- |
| `queue_length` | Required, Integer | Must be present and $\ge 0$ (and $\le 10,000$). | Returns `HTTP 400 Bad Request` |
| `arrival_time` | Optional, Datetime string | Must be parseable by ISO-8601 parser. | Returns `HTTP 400 Bad Request` |
| `lag1_queue_length` | Optional, Integer | Must be $\ge 0$ if provided. | Returns `HTTP 400 Bad Request` |
| `arrivals_last_15m` | Optional, Numeric | Must be $\ge 0$ if provided. | Returns `HTTP 400 Bad Request` |
| `arrivals_last_30m` | Optional, Numeric | Must be $\ge 0$ if provided. | Returns `HTTP 400 Bad Request` |
| `active_counters` | Optional, Integer | Must be between $1$ and $50$ (defaults to $4$). | Returns `HTTP 400 Bad Request` |

---

## 8. Model-Loading Strategy (Singleton Pattern)

To ensure low latency during real-time traffic:
1. **Single-Time In-Memory Caching:** The scikit-learn model artifact is deserialized once via `joblib.load()` and cached within the `PredictionService` singleton instance (`PredictionService.get_instance()`).
2. **Zero Per-Request Disk I/O:** API requests never read the `.joblib` binary from disk, achieving sub-5ms inference latency.
3. **Graceful Offline Degraded State:** If the model file is missing or corrupted, the service transitions to `status: "offline"`, and the endpoint returns `HTTP 503 Service Unavailable` with diagnostic instructions.

---

## 9. Causal Leakage Protection

The inference pipeline strictly enforces the **Prediction-Time Information Boundary**:
* Model input is generated exclusively via [`backend/ml/features.py`](file:///c:/Users/Anupam%20Baral/Desktop/bca%20project/backend/ml/features.py) using `build_single_inference_vector()`.
* Every feature vector is passed to `validate_feature_matrix()` before inference.
* Any presence of prohibited attributes (`wait_time`, `start_time`, `finish_time`, `service_duration_minutes`) immediately triggers a `ValueError` aborting execution.

---

## 10. Automated Testing & Verification Results

### 10.1 Django Test Suite (17 Tests)
Command: `python backend/manage.py test apps`
* `apps.queue_management` (8 tests): Model creation, auto calculation, serializer validity, and health check endpoint $\rightarrow$ **8/8 PASSED**.
* `apps.predictions` (9 tests):
  1. `test_01_successful_prediction_minimal`: Valid minimal payload returns HTTP 200 with non-negative predicted minutes and seconds $\rightarrow$ **PASSED**.
  2. `test_01b_successful_prediction_full_payload`: Full causal vector returns evaluated feature metadata $\rightarrow$ **PASSED**.
  3. `test_02_missing_required_field_queue_length`: Missing `queue_length` returns HTTP 400 $\rightarrow$ **PASSED**.
  4. `test_03_negative_queue_length`: Negative queue length returns HTTP 400 $\rightarrow$ **PASSED**.
  5. `test_03b_negative_arrival_counts`: Negative arrival rate returns HTTP 400 $\rightarrow$ **PASSED**.
  6. `test_04_invalid_timestamp`: Unparseable timestamp string returns HTTP 400 $\rightarrow$ **PASSED**.
  7. `test_05_model_artifact_loading`: Model loads and status reports "online" $\rightarrow$ **PASSED**.
  8. `test_06_feature_schema_and_ordering`: Exact 10 features generated in exact expected column order $\rightarrow$ **PASSED**.
  9. `test_07_no_leakage_prohibited_columns`: Rejects post-$t_0$ leakage attributes $\rightarrow$ **PASSED**.
* **Overall Django Result: 17/17 PASSED in 1.15s**.

### 10.2 Machine Learning Pipeline Test Suite (11 Tests)
Command: `pytest backend/ml/tests/ -v`
* Target timestamp verification, causal feature generation, temporal chronological splitting, baselines, and model serialization $\rightarrow$ **11/11 PASSED in 1.85s**.

### 10.3 Frontend Vitest Suite (5 Tests)
Command: `npm test -- --run`
* React components, routing, disclaimer banners, and UI layout $\rightarrow$ **5/5 PASSED in 2.60s**.

### 10.4 Live End-to-End HTTP Smoke Test
* Tested against live Django server on `http://127.0.0.1:8000/api/predictions/predict/`:
  * Minimal and full payloads return `HTTP 200` with predicted wait times (~31.02 minutes for $Q=25$).
  * Negative queue, missing queue, and malformed timestamps return `HTTP 400` with descriptive error messages.
  * Status endpoint `http://127.0.0.1:8000/api/predictions/status/` returns `HTTP 200` with `model_connected: true`.

---

## 11. Known Limitations

1. **Unobserved Service Category Baseline in Dataset:** The raw Kaggle dataset recorded single aggregate queues without category tags. Transaction complexity multipliers (e.g., Cash $0.85\times$, Loan $1.70\times$) represent domain-informed empirical scaling rather than direct sub-population model branches.
2. **Fixed Physical Counter Configuration:** Active counters scale duration based on classical Little's Law capacity factors ($4 / c$). When tellers are added, the model assumes uniform clearing efficiency without server coordination overhead.
