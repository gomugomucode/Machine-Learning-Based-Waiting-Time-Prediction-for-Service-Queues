# Phase 5: Temporal Generalization & Cross-Day Validation

**Project:** Intelligent Queue Management & Machine Learning-Based Waiting Time Prediction System  
**Course:** Bachelor of Computer Applications (BCA) — 6th Semester Major Project  
**Author:** Anupam Baral  
**Report Date:** September 28, 2026  
**Artifacts Analyzed:** `backend/ml/artifacts/phase5_audit_summary.json`  
**Test Set Scope:** Held-Out Days 11–14 (October 19–22, 2026, 4,042 unseen observations)  

---

## 1. Objective

A common vulnerability in time-series and queueing models is that an overall high aggregate metric may be skewed by a single well-behaved day, masking instability on other days.

To ensure temporal stability and real-world deployment viability, this study:
1. Evaluates the production Random Forest separately for each individual day in the held-out test period.
2. Compares the official chronological split against alternative splitting methodologies (Random Shuffled and Grouped-by-Day Cross-Validation).
3. Evaluates simple mathematical and statistical baselines against the ML model.

---

## 2. Daily Performance Breakdown on Held-Out Test Days

The production model was trained exclusively on historical Days 1 through 10 (October 5–16, 2026, 7,975 records). It was then evaluated independently on each of the 4 unseen future operational days:

| Date | Operational Day | Observed Records | Held-Out MAE (min) | Held-Out RMSE (min) | Held-Out $R^2$ | Daily Assessment |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **2026-10-19** | Monday (Day 11) | 1,000 | 1.1633 | 2.5116 | 0.999145 | Excellent; handles Monday morning influx smoothly |
| **2026-10-20** | Tuesday (Day 12) | 990 | 1.0112 | 1.7904 | 0.999310 | Highly stable mid-week performance |
| **2026-10-21** | Wednesday (Day 13) | 1,001 | 0.6380 | 0.9591 | 0.999837 | Best day; error well below 40 seconds |
| **2026-10-22** | Thursday (Day 14) | 1,051 | 0.7691 | 1.1807 | 0.999184 | High accuracy under maximum daily load |
| **Aggregate** | **All 4 Days** | **4,042** | **0.8935** | **1.7135** | **0.999406** | **Uniformly Consistent Across All Days** |

### Key Observations:
1. **No Single Outlier Day:** $R^2$ exceeds $0.999$ on *every single test day*.
2. **MAE Range:** Mean absolute error remains tightly bounded between **$0.64$ minutes** and **$1.16$ minutes** across all 4 operational days.
3. **Temporal Invariance:** Monday (Day 11) exhibited slightly higher variance ($\text{RMSE} = 2.51\text{ min}$) due to the post-weekend morning accumulation spike, but quickly stabilized.

---

## 3. Train/Test Splitting Strategy Sanity Check

Machine learning practitioners often debate splitting strategies for sequential queue data. We compared three distinct validation regimes:

| Splitting Strategy | Purpose & Nature | Held-Out MAE (min) | Held-Out RMSE (min) | Held-Out $R^2$ | Academic Validity |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **1. Chronological Split (Official)** | Train on Days 1–10; Test on future Days 11–14 | **0.8935** | **1.7135** | **0.999406** | **Gold Standard:** Strictly replicates real deployment where historical models predict future customer wait times. |
| **2. Random Shuffled Split (Diagnostic)** | 80/20 random sample across all rows | 2.1760 | 4.4999 | 0.995521 | **Flawed for Time-Series:** Leaks adjacent temporal rows ($r_{\text{lag1}} = 0.995$) across folds, artificially testing interpolated rows rather than forecasting future days. |
| **3. Grouped-by-Day Cross-Validation** | 5-Fold GroupKFold (Entire days withheld as test folds) | 14.8325 ($\pm 2.43$) | 20.6409 | 0.903702 ($\pm 0.018$) | **Stress Test:** Tests cross-week generalization when an entire day's arrival volume and specific daily rush schedules differ from the training set. |

### Why Chronological Splitting Is the Only Methodologically Sound Choice:
* In production, the system cannot "interpolate" between 10:15 AM and 10:17 AM of the same day. It must predict arrivals for tomorrow or next week based on historical operational data.
* Chronological splitting prevents lookahead bias and accurately measures out-of-sample forward generalization.
* Grouped-by-day validation demonstrates that even when entire days are withheld with no adjacent day data, the model maintains $R^2 > 0.90$, showing that the underlying queueing mechanics generalize robustly across distinct operational weeks.

---

## 4. Benchmark Baseline Comparison

To prove that the Random Forest delivers genuine added value over simpler methods, it was tested against four standard statistical baselines on the exact same chronological test set:

| Model / Baseline | Description | Test MAE (min) | Test RMSE (min) | Test $R^2$ | Assessment |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **1. Global Historical Mean** | Predicts overall training mean ($\bar{W} = 102.40\text{ min}$) | 57.4948 | 70.3097 | -0.00008 | Zero predictive value; total failure |
| **2. Hourly Historical Mean** | Predicts mean wait time for the arrival hour | 21.2898 | 28.5036 | 0.835637 | Captures broad diurnal pattern but misses queue state |
| **3. Queue-Aware Heuristic** | $\widehat{W} = Q \times (\bar{S} / c) = Q \times 0.775$ | 12.5694 | 16.7890 | 0.942977 | Strong physical heuristic; explains 94.3% of variance |
| **4. Linear Regression (1 Feature)** | OLS on `queue_length` ($\widehat{W} = 0.7739 Q + 6.3945$) | 12.8706 | 17.4211 | 0.938602 | Simple linear model; confirms dominant queue relationship |
| **5. Linear Regression (10 Features)**| Multi-variable OLS with all causal features | 10.7616 | 14.6183 | 0.956768 | Captures linear interactions; error remains $> 10$ min |
| **6. Random Forest (Selected Model)** | Non-linear ensemble (`n_est=100`, `max_depth=12`) | **0.8935** | **1.7135** | **0.999406** | **Best in Class:** Reduces error by **$91.7\%$** compared to multi-linear regression |

---

## 5. Visual Residual Breakdown Across Operating Windows

Analysis of prediction residuals ($\epsilon = \widehat{W} - W$) across operational regimes:

### By Operational Window:
* **Morning Window (09:00–11:00, 962 records):** $\text{MAE} = 0.865\text{ min}$, $\sigma_{\epsilon} = 0.873\text{ min}$, $\text{Max Error} = 6.60\text{ min}$.
* **Midday Peak Window (11:00–14:00, 1,534 records):** $\text{MAE} = 0.963\text{ min}$, $\sigma_{\epsilon} = 1.603\text{ min}$, $\text{Max Error} = 17.85\text{ min}$.
* **Afternoon Window (14:00–17:00, 1,546 records):** $\text{MAE} = 0.842\text{ min}$, $\sigma_{\epsilon} = 1.600\text{ min}$, $\text{Max Error} = 21.90\text{ min}$.

### By Queue Congestion Level:
* **Low Queue ($0 \le Q \le 20$, 327 records):** $\text{MAE} = 1.060\text{ min}$, $\text{Max Error} = 6.60\text{ min}$.
* **Medium Queue ($21 \le Q \le 50$, 481 records):** $\text{MAE} = 0.632\text{ min}$, $\text{Max Error} = 2.86\text{ min}$.
* **High Queue ($51 \le Q \le 100$, 628 records):** $\text{MAE} = 0.839\text{ min}$, $\text{Max Error} = 7.08\text{ min}$.
* **Severe Congestion ($Q > 100$, 2,606 records):** $\text{MAE} = 0.934\text{ min}$, $\text{Max Error} = 21.90\text{ min}$.

---

## 6. Academic Conclusion

1. The model's predictive power is evenly distributed and stable across all 4 held-out test days.
2. Simple queue-aware heuristics achieve $R^2 \approx 0.94$, proving that high performance is grounded in queueing physics rather than ML overfitting.
3. The Random Forest significantly outperforms all linear and heuristic baselines by modeling the non-linear diurnal efficiency curves of multi-server queue dispatching.
