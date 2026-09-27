# Data Dictionary: Queue Waiting Time Dataset

## 1. Overview
* **Dataset File:** `data/verified_queue_waiting_time_dataset.csv`
* **Total Records:** 12,017
* **Total Fields:** 5
* **Missing Values:** 0 across all records (100% complete)
* **Date Range:** 2026-10-05 09:00:18 to 2026-10-22 16:59:16 (14 business days, Monday to Friday)
* **Domain:** Service queue observations (bank / customer service facility)

---

## 2. Actual Dataset Fields

| Field Name | Data Type | Description & Meaning | Example Value | Missing % | Can Be Used for ML Input? | Can Be Used as Target? | Engineering & Leakage Concerns |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `arrival_time` | String (Timestamp `YYYY-MM-DD HH:MM:SS`) | Timestamp when the customer arrived and entered the queue | `2026-10-05 09:00:18` | 0.0% | **Yes (Engineered)**: Hour of day, day of week, minute, time of day. | No | Raw timestamp cannot be fed directly; cyclical or numeric transformation required. |
| `start_time` | String (Timestamp `YYYY-MM-DD HH:MM:SS`) | Timestamp when the customer was called to the service counter and service began | `2026-10-05 09:02:21` | 0.0% | **NO (Data Leakage)**: Not available when customer arrives. | **Derived Target**: Used to verify/derive `wait_time = (start_time - arrival_time)`. | Including current record's `start_time` in training features causes target leakage. |
| `finish_time` | String (Timestamp `YYYY-MM-DD HH:MM:SS`) | Timestamp when the transaction/service ended | `2026-10-05 09:04:30` | 0.0% | **NO for current record (Data Leakage)**: Available only after service completion. Historical lag features can be derived. | No | Future information relative to queue entry. |
| `wait_time` | Float64 (Minutes) | Elapsed duration in minutes from arrival to service start | `12.68` | 0.0% | No (Ground truth) | **YES (Primary Target Variable)** | Continuous target variable. Mean: 102.40 min, Std: 66.81 min, Min: 0.0 min, Max: 275.82 min. |
| `queue_length` | Int64 | Number of people in queue when customer arrived | `28` | 0.0% | **YES (Primary Feature)** | No | Strongest predictor ($r = 0.964$). In live production, must be provided by queue counter. |

---

## 3. Derived Analytical Fields (Computed from Observations)

| Field Name | Derived From | Formula | Mean | Min / Max | ML Utility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `service_duration` | `finish_time - start_time` | `(finish - start) in minutes` | 2.38 min | 0.0 min / 20.75 min | Historical rolling mean service rate as a feature |
| `hour_of_day` | `arrival_time` | `arrival_time.hour` | 12.5 (9–16) | 9 / 16 | Diurnal traffic cycle feature ($r = 0.911$ with wait time) |
| `day_of_week` | `arrival_time` | `arrival_time.day_name` | Mon–Fri | Mon / Fri | Weekly seasonality |
| `time_since_opening` | `arrival_time` | Minutes past 09:00:00 | 210 min | 0.3 min / 479.3 min | Continuous linear/polynomial time trend |

---

## 4. Fields NOT AVAILABLE IN DATASET

The following attributes are **NOT AVAILABLE IN DATASET**:

1. `service_type` / `transaction_type`: **NOT AVAILABLE IN DATASET** (No categorization into deposits, withdrawals, loans, advisory, etc.).
2. `counter_id` / `staff_id`: **NOT AVAILABLE IN DATASET** (No identifier of which counter or teller served the client).
3. `active_counters`: **NOT AVAILABLE IN DATASET** (Number of open/staffed counters is unrecorded).
4. `customer_id` / `account_number`: **NOT AVAILABLE IN DATASET** (No personally identifiable information; customer privacy preserved).
5. `customer_priority` / `vip_status`: **NOT AVAILABLE IN DATASET** (FIFO queue assumed).
6. `customer_satisfaction_rating`: **NOT AVAILABLE IN DATASET**.

---

## 5. Summary of Target Feasibility

* **Target Variable:** `wait_time` (minutes) is **verified and present**.
* **Integrity Check:** The column `wait_time` in the dataset matches `(start_time - arrival_time)` in minutes within floating point rounding precision ($|\text{diff}| \le 0.02$ minutes).
* **Feasibility:** Mathematically sound and suitable for regression modeling (MAE, RMSE, $R^2$).
