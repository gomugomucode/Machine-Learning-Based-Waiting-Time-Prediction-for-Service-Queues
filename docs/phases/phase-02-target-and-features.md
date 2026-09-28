# Phase 2: Dataset Validation, Feature Engineering & Machine Learning Experiments

**Project:** Intelligent Queue Management and Waiting-Time Prediction System  
**Academic Degree:** Bachelor of Computer Applications (BCA) — 6th Semester Major Project  
**Author:** Anupam Baral  
**Status:** **Completed & Verified**  
**Execution Timestamp:** September 28, 2026  

---

## 1. Overview & Research Goal

The objective of Phase 2 was to determine whether the 12,017 verified queue observation records can support a scientifically defensible waiting-time prediction model, establish a strictly causal feature engineering pipeline, and benchmark multiple regressors against classical queueing baselines.

---

## 2. Dataset Verification & 20-Point Audit Summary

Detailed audit saved under: [`docs/phase2_dataset_validation.md`](../phase2_dataset_validation.md)

* **Record Count:** Exactly 12,017 rows; 0 missing values; 0 duplicates.
* **Date Span:** 14 business days (2026-10-05 to 2026-10-22, Monday–Friday, 09:00:00 to 16:59:59).
* **Target Integrity:** Target waiting time $W = (t_{\text{start}} - t_{\text{arrival}})/60$ was independently recalculated and compared with `wait_time`. The MAE between the two is $0.005868$ minutes (max difference $0.0200$ min), perfectly explained by 2-decimal truncation of seconds.
* **Chronological Consistency:** $t_{\text{arrival}} \le t_{\text{start}} \le t_{\text{finish}}$ holds for 100% of observations. 0 negative wait times, 0 negative service durations.

---

## 3. Prediction-Time Information Boundary ($t_0$) & Leakage Prevention

Detailed audit saved under: [`docs/phase2_leakage_audit.md`](../phase2_leakage_audit.md)

* **Prediction Moment:** $t_0 = t_{\text{arrival}}$ (when the customer joins the queue and takes a ticket).
* **Strictly Prohibited Features (Post-$t_0$ Leakage):**
  * `start_time` (directly defines the start of service)
  * `finish_time` (future completion event)
  * `wait_time` / `calculated_wait_minutes` (target variable)
  * `service_duration_minutes` of current or subsequent customers
  * Future customer queue lengths or arrivals
* **The Exact 10 Causal Prediction Features:**
  1. `queue_length`: Observed customer backlog ahead in line at $t_0$.
  2. `minutes_since_opening`: Continuous elapsed minutes since 09:00 opening ($[0, 480]$).
  3. `hour`: Arrival hour ($[9, 16]$).
  4. `minute`: Arrival minute ($[0, 59]$).
  5. `day_of_week`: Monday through Friday ($[0, 4]$).
  6. `sin_time`: $\sin(2\pi \cdot \text{minutes\_since\_opening} / 480)$.
  7. `cos_time`: $\cos(2\pi \cdot \text{minutes\_since\_opening} / 480)$.
  8. `lag1_queue_length`: Queue length observed by immediate predecessor.
  9. `arrivals_last_15m`: Customer arrivals in the 15 minutes strictly before $t_0$.
  10. `arrivals_last_30m`: Customer arrivals in the 30 minutes strictly before $t_0$.

---

## 4. Chronological Train/Test Partition

* **Splitting Protocol:** Strict chronological date split (no random shuffling).
* **Training Set:** 10 full business days (Weeks 1 & 2: Oct 5 to Oct 16, 2026) $\rightarrow$ **7,975 records (66.36%)**.
* **Held-out Test Set:** 4 full business days (Week 3: Oct 19 to Oct 22, 2026) $\rightarrow$ **4,042 records (33.64%)**.

---

## 5. Measured Benchmark Results (Test Set: 4,042 records)

Full experimental report saved under: [`docs/phase2_ml_report.md`](../phase2_ml_report.md)

| Model | Model Class | Test MAE (min) | Test RMSE (min) | Test R² | Error vs Global Baseline |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Random Forest Regressor** | **Non-Linear Ensemble** | **0.9166** | **1.7678** | **0.9994** | **-98.40%** |
| Gradient Boosting Regressor | Boosted Trees | 2.7864 | 4.1357 | 0.9965 | -95.15% |
| Linear Regression (Standardized) | Multiple Linear OLS | 10.7616 | 14.6183 | 0.9568 | -81.28% |
| Queue-Aware Proportional Heuristic | Baseline 2 | 12.5694 | 16.7890 | 0.9430 | -78.14% |
| Hourly Historical Mean | Baseline 3 | 21.2898 | 28.5036 | 0.8356 | -62.97% |
| Global Historical Mean | Baseline 1 | 57.4948 | 70.3097 | -0.0001 | 0.00% |

### Selected Model: Random Forest Regressor
* **Hyperparameters:** `n_estimators=100`, `max_depth=12`, `min_samples_leaf=2`, `min_samples_split=5`, `random_state=42`.
* **Accuracy:** Test MAE of **0.9166 minutes** (~55 seconds) across queues with an average wait time of 102.40 minutes, reducing error by **92.71%** compared to the best analytical baseline.
* **Persisted Artifacts:**
  * Model binary: [`backend/ml/artifacts/best_waiting_time_model.joblib`](../../backend/ml/artifacts/best_waiting_time_model.joblib)
  * Metadata JSON: [`backend/ml/artifacts/model_metrics.json`](../../backend/ml/artifacts/model_metrics.json)

---

## 6. Generated Publication Figures

Saved under [`docs/phase2_figures/`](../phase2_figures/):
1. `waiting_time_distribution.png`: Histogram & KDE of wait time.
2. `queue_length_distribution.png`: Histogram of queue depth.
3. `waiting_time_by_hour.png`: Diurnal wait-time progression.
4. `queue_length_by_hour.png`: Diurnal queue volume buildup.
5. `waiting_time_by_date.png`: Daily average wait times across the 14 days.
6. `service_duration_distribution.png`: Service duration distribution (mean = 2.38 min).
7. `queue_vs_waiting_time.png`: Scatter plot confirming strong correlation ($r = 0.964$).
8. `random_forest_actual_vs_predicted.png`: Out-of-sample actual vs predicted plot.
9. `random_forest_residuals.png`: Residual distribution centered at zero error.
10. `random_forest_feature_importance.png`: Permutation feature importance chart.
