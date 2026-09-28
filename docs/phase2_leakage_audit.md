# Phase 2: Data Leakage Prevention & Prediction-Time Boundary Audit

**Project:** Intelligent Queue Management and Waiting-Time Prediction System  
**Academic Level:** BCA 6th-Semester Major Project  
**Author:** Anupam Baral  
**Document Status:** Formal Architecture & Machine Learning Boundary Audit  

---

## 1. Definition of the Prediction Moment

In service queue systems, a waiting-time prediction is operationally actionable only if it is delivered to the customer at the exact moment of queue entry or when a branch queue status display refreshes.

> **Operational Prediction Moment ($t_0$):**  
> The timestamp $t_0 = \text{arrival\_time}$ when an individual customer arrives, takes a queue ticket, and observes the queue state (line depth).

Any variable whose value is determined, recorded, or updated **after** $t_0$ is strictly prohibited from the feature matrix $X$. Including post-$t_0$ information constitutes **target leakage** and invalidates the scientific validity of the model.

---

## 2. Prediction-Time Information Boundary

The table below audits every column in the dataset and derived features against the Prediction-Time Information Boundary:

| Feature / Field Name | Classification | Availability Rationale | Action for Model Pipeline |
| :--- | :--- | :--- | :--- |
| `arrival_time` | **AVAILABLE AT PREDICTION TIME** | Known at moment $t_0$. Used to extract calendar & diurnal features (`hour`, `minute`, `day_of_week`). | **INCLUDED (Engineered)** |
| `queue_length` | **AVAILABLE AT PREDICTION TIME** | Known at moment $t_0$ (number of people currently standing in line or tickets ahead). | **INCLUDED (Primary Feature)** |
| `hour_of_day` | **AVAILABLE AT PREDICTION TIME** | Extracted from `arrival_time`. Captures diurnal rush-hour cycle ($r = 0.911$). | **INCLUDED (Direct)** |
| `minute_of_day` | **AVAILABLE AT PREDICTION TIME** | Extracted from `arrival_time` ($60 \times \text{hour} + \text{minute}$). | **INCLUDED (Direct)** |
| `minutes_since_opening` | **AVAILABLE AT PREDICTION TIME** | Extracted from `arrival_time` relative to 09:00 branch opening. | **INCLUDED (Direct)** |
| `day_of_week` | **AVAILABLE AT PREDICTION TIME** | Extracted from `arrival_time` (Monday = 0, Friday = 4). | **INCLUDED (Direct)** |
| `hour_sin` / `hour_cos` | **AVAILABLE AT PREDICTION TIME** | Trigonometric encoding of diurnal cycle. | **INCLUDED (Engineered)** |
| `historical_service_rate_lag` | **AVAILABLE AT PREDICTION TIME** | Rolling mean service duration of customers who completed service **strictly before** $t_0$. | **INCLUDED (Causally Valid)** |
| `start_time` | **NOT AVAILABLE AT PREDICTION TIME** | Determined only when the customer is summoned to a counter. Directly defines the target! | **EXCLUDED (Target Leakage)** |
| `finish_time` | **NOT AVAILABLE AT PREDICTION TIME** | Determined only when the transaction finishes in the future. | **EXCLUDED (Future Information)** |
| `wait_time` | **NOT AVAILABLE AT PREDICTION TIME** | Ground-truth target variable $y = (\text{start\_time} - \text{arrival\_time}) / 60$. | **EXCLUDED (Target Variable)** |
| `calculated_wait_minutes`| **NOT AVAILABLE AT PREDICTION TIME** | Independent verification of ground truth target $y$. | **EXCLUDED (Target Variable)** |
| `service_duration_current`| **NOT AVAILABLE AT PREDICTION TIME**| Duration of the current customer's transaction, unknown until finish. | **EXCLUDED (Future Information)** |
| `future_queue_length` | **NOT AVAILABLE AT PREDICTION TIME** | Queue length of subsequently arriving customers. | **EXCLUDED (Future Information)** |

---

## 3. Explicit Feature Sets

### FEATURES USED FOR MODEL ($X$)
1. `queue_length` (Integer: Customers in line ahead of arrival)
2. `hour` (Integer: 9 to 16)
3. `minute_of_day` (Integer: 540 to 1020)
4. `minutes_since_0900` (Integer: Minutes elapsed past 09:00 opening)
5. `day_of_week` (Integer: 0=Monday to 4=Friday)
6. `hour_sin` (Float: Diurnal sine wave)
7. `hour_cos` (Float: Diurnal cosine wave)
8. `recent_completed_service_duration` (Float: Average duration of completed tickets prior to $t_0$)

### FEATURES EXCLUDED BECAUSE OF DATA LEAKAGE
1. `start_time` (Contains the arrival-to-start transition timestamp)
2. `finish_time` (Contains transaction completion timestamp)
3. `wait_time` (Primary target variable $y$)
4. `calculated_wait_minutes` (Mathematical target formulation)
5. `service_duration_minutes` of current or subsequent records (Future operational duration)

---

## 4. Verification Check Before Training

Before any training epoch or model evaluation, the feature matrix columns are asserted against an allowlist:
```python
ALLOWLIST = {
    'queue_length', 'hour', 'minute_of_day', 'minutes_since_0900',
    'day_of_week', 'hour_sin', 'hour_cos', 'recent_completed_service_duration'
}
FORBIDDEN = {'start_time', 'finish_time', 'wait_time', 'calculated_wait_minutes', 'service_duration_minutes'}

assert FORBIDDEN.isdisjoint(set(X.columns)), "DATA LEAKAGE DETECTED! Aborting training."
```

This guarantees 100% causal separation between prediction-time predictors and future event outcomes.
