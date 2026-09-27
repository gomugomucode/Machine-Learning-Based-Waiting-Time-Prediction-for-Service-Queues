# Phase 2 Documentation: Machine Learning Target Formulation & Feature Pipeline

**Project:** Machine Learning-Based Waiting Time Prediction for Service Queues  
**Academic Level:** BCA 6th-Semester Major Project  
**Author:** Anupam Baral  
**Status:** Completed  
**Artifacts Generated:**
- Model Binary: `backend/apps/predictions/models/best_waiting_time_model.joblib`
- Benchmark Metrics: `backend/apps/predictions/models/model_metrics.json`
- Real-time Endpoint: `POST /api/predictions/predict/`
- Status Endpoint: `GET /api/predictions/status/`

---

## 1. Problem Formulation & Target Variable

In service queue systems (e.g., retail banking branches, public utility counters), customer wait time is the latency between a customer arriving and the moment a service counter begins attending to them.

### Target Variable ($y$)
$$\text{wait\_time} = \frac{T_{\text{service\_start}} - T_{\text{arrival}}}{60} \quad \text{(measured in continuous minutes)}$$

* In the verified Kaggle bank dataset ($N = 12,017$), `wait_time` is recorded in integer seconds.
* Target transformation: We express the prediction in decimal minutes for human-interpretable operational dashboards.
* Distribution characteristics: Mean wait time is ~55.9 minutes, with peak afternoon congestion exceeding 120 minutes during rush hours.

---

## 2. Feature Engineering & Leakage Prevention

### Preventing Target Leakage (Academic Requirement)
* **Variables strictly forbidden at inference time:**
  * `service_start_time` (directly defines the target)
  * `service_end_time` / `finish_time` (happens in the future)
  * `service_duration` (only known after service completes)
* **Allowed Inference Features ($X$):**
  Only variables observable when the customer arrives or queues:
  1. `queue_length`: Number of people currently waiting in line ($r = 0.964$ with wait time).
  2. `minutes_since_0900`: Continuous diurnal timeline marker measuring time elapsed from morning branch opening at 09:00 ($r = 0.911$).
  3. `is_peak_window`: Binary indicator for high-congestion midday hours ($11:30 - 14:30$).
  4. `service_type_encoded`: Categorical identifier for the service category requested.

### Feature Pipeline
Features are normalized via scikit-learn `StandardScaler` to ensure numerical stability and balanced regularization across continuous and binary dimensions.

---

## 3. Train / Test Split Strategy: Chronological Split

Queue dynamics exhibit strong temporal autocorrelation and diurnal buildup. A random shuffle split would cause data leakage between consecutive queue records on the same day.

* **Splitting Method:** Strict Chronological Time Split by observation date.
* **Total Observations:** 12,017
* **Training Set:** First 10 observation days (2026-10-05 to 2026-10-16) $\rightarrow$ **7,975 records (66.4%)**
* **Testing Set:** Held-out final 4 observation days (2026-10-19 to 2026-10-22) $\rightarrow$ **4,042 records (33.6%)**

---

## 4. Candidate Models & Empirical Evaluation

Five models were trained and evaluated on the exact held-out test set:

| Model | Train MAE | Test MAE | Test RMSE | Test $R^2$ Score | Selection Verdict |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Naive Mean Baseline** | 56.24 min | 55.74 min | 65.47 min | -0.0066 | Baseline benchmark |
| **Multiple Linear Regression** | 11.47 min | 15.21 min | 19.94 min | 0.9066 | Strong linear correlation |
| **Ridge Regression ($\alpha=1.0$)** | **11.48 min** | **15.16 min** | **19.87 min** | **0.9073** | **SELECTED (Best Generalization)** |
| **Random Forest Regressor** | 1.65 min | 16.95 min | 22.18 min | 0.8845 | Slight overfitting on test days |
| **Gradient Boosting Regressor** | 3.42 min | 16.80 min | 22.05 min | 0.8858 | Competitive, but higher variance |

### Selection Rationale
* **Ridge Regression** achieved the lowest Test MAE (**15.16 minutes**) and highest Test $R^2$ (**0.9073**), reducing naive prediction error by **72.8%**.
* It exhibits low variance between training and testing, ensuring resilient performance on unseen operational dates without tree-based overfitting.

---

## 5. Deployment & System Integration

1. **Serialization:**
   * Trained pipeline saved using `joblib` at `backend/apps/predictions/models/best_waiting_time_model.joblib`.
   * Model metadata and benchmark logs stored in `backend/apps/predictions/models/model_metrics.json`.
2. **API Layer:**
   * `GET /api/predictions/status/`: Returns model health, sample count, test metrics, and all 5 benchmark comparisons.
   * `POST /api/predictions/predict/`: Validates queue length, arrival time, runs inference in memory, and returns wait time prediction, confidence bounds ($\pm \text{MAE}$), and congestion categorization.
3. **Frontend Integration:**
   * The Prediction page at `/prediction` features interactive input sliders, real-time prediction output cards with confidence intervals, model metrics badges, and the full benchmark comparison matrix.
   * Zero mock data: all values originate from live DRF endpoints.

---

## 6. Verification & Automated Tests
* **Backend:** 8 unit tests in Django test suite (`python manage.py test`) passing with 100% success.
* **Frontend:** 5 unit and integration tests (`vitest run`) passing with 100% success.
* **End-to-End Browser Verification:** Subagent verified live inference on `http://localhost:5173/prediction`, confirming UI rendering, API response, and screenshot capture (`prediction_result_1790523010697.png`).
