# Phase 5: Controlled Feature Ablation Study

**Project:** Intelligent Queue Management & Machine Learning-Based Waiting Time Prediction System  
**Course:** Bachelor of Computer Applications (BCA) — 6th Semester Major Project  
**Author:** Anupam Baral  
**Report Date:** September 28, 2026  
**Artifacts Generated:** `backend/ml/artifacts/ablation_results.json`  
**Train/Test Split:** Identical Chronological Split (Days 1–10 Train [7,975 rows], Days 11–14 Test [4,042 rows])  
**Model Architecture:** Random Forest Regressor (`n_estimators=100`, `max_depth=12`, `min_samples_leaf=2`, `random_state=42`)  

---

## 1. Objective

The feature ablation experiment isolates individual feature sets to determine the exact origin of predictive power within the queue prediction system. By systematically training and evaluating models with controlled subsets of features on the exact same chronological split, we empirically establish:
1. The predictive contribution of line depth (`queue_length`).
2. The incremental gain of diurnal progress (`minutes_since_opening`).
3. The redundancy and surrogate behavior of historical signals (`lag1_queue_length`).
4. The standalone baseline power of temporal features alone.

---

## 2. Experimental Setup

Five controlled experiments were executed under strict ceteris paribus conditions:

* **Experiment A:** Minimal physical model — `queue_length` alone (1 feature).
* **Experiment B:** Physical queue + Diurnal time — `queue_length` + `minutes_since_opening` (2 features).
* **Experiment C:** Full production model — All 10 causal features.
* **Experiment D:** Ablated queue length — All features *excluding* `queue_length` (9 features).
* **Experiment E:** Pure temporal model — Only time-of-day features (6 features).

All models were evaluated on the held-out 4-day chronological test set (October 19–22, 2026, 4,042 records).

---

## 3. Empirical Results

| Experiment | Feature Set Included | Feature Count | Held-out MAE (min) | Held-out RMSE (min) | Held-out $R^2$ | Variance Explained |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Exp A** | `queue_length` | 1 | 11.9516 | 16.6025 | **0.944236** | 94.42% |
| **Exp B** | `queue_length`, `minutes_since_opening` | 2 | 3.3569 | 5.4714 | **0.993944** | 99.39% |
| **Exp C** | All 10 Causal Features | 10 | **0.8935** | **1.7135** | **0.999406** | **99.94%** |
| **Exp D** | All Features *except* `queue_length` | 9 | 0.9103 | 1.7520 | **0.999379** | 99.94% |
| **Exp E** | Only Temporal Features | 6 | 13.3095 | 19.6892 | **0.921574** | 92.16% |

---

## 4. In-Depth Analysis of Individual Experiments

### Experiment A: `queue_length` Alone (1 Feature)
* **Performance:** $\text{MAE} = 11.95\text{ min}$, $\text{RMSE} = 16.60\text{ min}$, $R^2 = 0.9442$.
* **Analysis:** With only a single integer representing the number of people waiting ahead in line, the model already accounts for **$94.42\%$** of all variance in waiting times.
* **Physical Implication:** This confirms Little's Law and FIFO queue physics. In a multi-counter queue, waiting time is first and foremost a linear function of backlog depth.

### Experiment B: `queue_length` + `minutes_since_opening` (2 Features)
* **Performance:** $\text{MAE} = 3.36\text{ min}$, $\text{RMSE} = 5.47\text{ min}$, $R^2 = 0.9939$.
* **Analysis:** Adding a single time indicator—minutes elapsed since branch opening at 09:00 AM—reduces MAE from $11.95$ to $3.36$ minutes and boosts $R^2$ to **$99.39\%$**.
* **Physical Implication:** Queues do not clear at a constant velocity throughout the entire day. Early morning queues face empty counters and clear rapidly, whereas mid-day queues face fully utilized counters and accumulated transaction overhead. Coupling queue depth with time of day models this non-linear diurnal efficiency curve almost completely.

### Experiment C: Full Production Feature Set (10 Features)
* **Performance:** $\text{MAE} = 0.89\text{ min}$, $\text{RMSE} = 1.71\text{ min}$, $R^2 = 0.9994$.
* **Analysis:** Incorporating cyclical time encodings (`sin_time`, `cos_time`), recent arrival velocity (`arrivals_last_15m`, `arrivals_last_30m`), and previous customer state (`lag1_queue_length`) captures short-term arrival surges, squeezing residual error down to **$0.89$ minutes** (~53.6 seconds).

### Experiment D: Removing `queue_length` (9 Features)
* **Performance:** $\text{MAE} = 0.91\text{ min}$, $\text{RMSE} = 1.75\text{ min}$, $R^2 = 0.9994$.
* **Analysis:** Removing the primary feature `queue_length` causes virtually **zero degradation** in model accuracy ($R^2$ remains $0.999379$, MAE rises by only 1 second to $0.9103\text{ min}$).
* **Why did this happen?**
  In Section 5 of our dataset audit, we discovered that the lag-1 autocorrelation of queue length is **$0.99527$**. Because customers arrive every 23 to 120 seconds, `lag1_queue_length` serves as an almost identical surrogate for `queue_length`. When the primary feature is dropped, the decision trees smoothly substitute the lag-1 feature without loss of predictive power.

### Experiment E: Only Temporal Features (6 Features)
* **Performance:** $\text{MAE} = 13.31\text{ min}$, $\text{RMSE} = 19.69\text{ min}$, $R^2 = 0.9216$.
* **Analysis:** A model with zero real-time queue information (knowing only the time of day, minute, and day of week) achieves $R^2 = 0.9216$, but its MAE is relatively high ($13.31\text{ minutes}$).
* **Physical Implication:** The recurring daily influx patterns in the simulation mean that time of day alone can approximate average historical rush-hour queues. However, temporal features cannot account for stochastic burstiness, resulting in substantial errors ($\text{RMSE} \approx 19.69\text{ min}$). Real-time queue observation is strictly necessary for operational sub-minute precision.

---

## 5. Comparative Visual Progression

```
Experiment A: [queue_length]                               ==> R²: 0.9442 | MAE: 11.95 min
Experiment B: [queue_length + opening_time]                ==> R²: 0.9939 | MAE:  3.36 min
Experiment E: [temporal features only]                     ==> R²: 0.9216 | MAE: 13.31 min
Experiment D: [all features EXCEPT queue_length]           ==> R²: 0.9994 | MAE:  0.91 min
Experiment C: [all 10 causal features - PRODUCTION]        ==> R²: 0.9994 | MAE:  0.89 min
```

---

## 6. Academic Conclusions for Major Project Viva

1. **Source of Predictive Power:** Over **$94\%$** of predictive capability stems from the queue depth alone, and **$99.39\%$** is captured by combining queue depth with diurnal opening time.
2. **Surrogate Robustness:** The system possesses high redundancy: if a sensor fails to deliver `queue_length`, historical lag-1 data (`lag1_queue_length`) can maintain full prediction fidelity.
3. **Defense Against "Fabricated Accuracy":** The ablation proves that the model is not fitting noise or hallucinating precision: it is learning the exact physical relationship between service backlog and counter throughput.
