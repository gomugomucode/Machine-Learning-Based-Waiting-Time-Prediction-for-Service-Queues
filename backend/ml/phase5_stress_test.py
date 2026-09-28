"""
Phase 5 Comprehensive Stress Test & Academic Robustness Pipeline.
Executes dataset structure audit, high-R² investigation, feature ablations,
alternative split comparisons, residual diagnostics, temporal generalization,
and extreme edge-case stress testing.
"""
import os
import sys
import json
from pathlib import Path
import numpy as np
import pandas as pd
import scipy.stats as stats
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import KFold, GroupKFold
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.data_loader import load_clean_dataset
from ml.features import extract_features, EXTENDED_FEATURE_NAMES, CORE_FEATURE_NAMES, build_single_inference_vector
from ml.split import get_temporal_split
from ml.baselines import GlobalMeanBaseline, HourlyHistoricalMeanBaseline, QueueAwareProportionalBaseline


def run_phase5_stress_testing():
    print("=" * 80)
    print("PHASE 5: COMPREHENSIVE STRESS TESTING & ACADEMIC ROBUSTNESS AUDIT")
    print("=" * 80)

    base_dir = Path(__file__).resolve().parent.parent
    figures_dir = base_dir / "ml" / "phase5_figures"
    docs_figures_dir = base_dir.parent / "docs" / "phase5_figures"
    artifacts_dir = base_dir / "ml" / "artifacts"
    
    figures_dir.mkdir(parents=True, exist_ok=True)
    docs_figures_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # ---------------------------------------------------------
    # STEP 1: Full Dataset Structure Audit
    # ---------------------------------------------------------
    print("\n--- [STEP 1] DATASET STRUCTURE AUDIT ---")
    df = load_clean_dataset()
    total_records = len(df)
    
    # Dates and hours
    df['date_only'] = df['arrival_time'].dt.date
    df['arrival_hour'] = df['arrival_time'].dt.hour
    
    unique_days = sorted(df['date_only'].unique())
    num_unique_days = len(unique_days)
    records_per_day = df.groupby('date_only').size()
    records_per_hour = df.groupby('arrival_hour').size()

    # Numerical distributions
    def get_summary_stats(s: pd.Series) -> dict:
        return {
            'count': int(s.count()),
            'min': float(s.min()),
            'q25': float(s.quantile(0.25)),
            'median': float(s.median()),
            'mean': float(s.mean()),
            'q75': float(s.quantile(0.75)),
            'max': float(s.max()),
            'std': float(s.std()),
            'skew': float(s.skew()),
            'kurtosis': float(s.kurt()),
        }

    queue_stats = get_summary_stats(df['queue_length'])
    wait_stats = get_summary_stats(df['calculated_wait_minutes'])
    serv_stats = get_summary_stats(df['service_duration_minutes'])

    # Correlation analysis
    pearson_corr = float(df['queue_length'].corr(df['calculated_wait_minutes'], method='pearson'))
    spearman_corr = float(df['queue_length'].corr(df['calculated_wait_minutes'], method='spearman'))

    # Little's Law / Queueing proportionality test:
    # Ratio = wait_time / (queue_length + 1)
    df['wait_per_queue_unit'] = df['calculated_wait_minutes'] / (df['queue_length'] + 1e-5)
    nonzero_queue = df[df['queue_length'] > 0]
    mean_wait_per_person = float(nonzero_queue['wait_per_queue_unit'].mean())
    std_wait_per_person = float(nonzero_queue['wait_per_queue_unit'].std())

    # Sequential correlation (Lag autocorrelation of queue_length)
    queue_lag1_autocorr = float(df['queue_length'].autocorr(lag=1))
    wait_lag1_autocorr = float(df['calculated_wait_minutes'].autocorr(lag=1))

    # Inter-arrival time distribution
    df['inter_arrival_sec'] = df['arrival_time'].diff().dt.total_seconds().fillna(0)
    inter_arrival_mean = float(df['inter_arrival_sec'].mean())
    inter_arrival_median = float(df['inter_arrival_sec'].median())

    audit_metrics = {
        'total_records': total_records,
        'num_unique_days': num_unique_days,
        'unique_dates': [str(d) for d in unique_days],
        'records_per_day': {str(k): int(v) for k, v in records_per_day.items()},
        'records_per_hour': {int(k): int(v) for k, v in records_per_hour.items()},
        'queue_length_stats': queue_stats,
        'wait_time_stats': wait_stats,
        'service_duration_stats': serv_stats,
        'correlations': {
            'pearson_queue_vs_wait': pearson_corr,
            'spearman_queue_vs_wait': spearman_corr,
            'queue_lag1_autocorr': queue_lag1_autocorr,
            'wait_lag1_autocorr': wait_lag1_autocorr,
            'mean_wait_per_person_in_line': mean_wait_per_person,
            'std_wait_per_person_in_line': std_wait_per_person,
            'inter_arrival_mean_sec': inter_arrival_mean,
            'inter_arrival_median_sec': inter_arrival_median,
        }
    }

    print(f"Total observations: {total_records:,} across {num_unique_days} operating days.")
    print(f"Pearson Correlation (queue_length vs wait_time): {pearson_corr:.5f}")
    print(f"Spearman Rank Correlation: {spearman_corr:.5f}")
    print(f"Queue Length Lag-1 Autocorrelation: {queue_lag1_autocorr:.5f}")
    print(f"Wait Time Lag-1 Autocorrelation: {wait_lag1_autocorr:.5f}")
    print(f"Mean Wait per person in line: {mean_wait_per_person:.2f} min (std: {std_wait_per_person:.2f})")

    # ---------------------------------------------------------
    # STEP 2 & 3: Feature Extraction & Ablation Experiments
    # ---------------------------------------------------------
    print("\n--- [STEP 3] FEATURE ABLATION EXPERIMENTS ---")
    X_full, y = extract_features(df, feature_set='extended')
    train_df, test_df, split_meta = get_temporal_split(df, train_ratio=0.71)

    train_idx = train_df.index
    test_idx = test_df.index

    y_train = y.iloc[train_idx].copy().reset_index(drop=True)
    y_test = y.iloc[test_idx].copy().reset_index(drop=True)

    # Define ablation feature sets
    ablation_sets = {
        'Exp_A_Queue_Length_Only': ['queue_length'],
        'Exp_B_Queue_Plus_Opening_Time': ['queue_length', 'minutes_since_opening'],
        'Exp_C_All_10_Causal_Features': EXTENDED_FEATURE_NAMES,
        'Exp_D_No_Queue_Length': [c for c in EXTENDED_FEATURE_NAMES if c != 'queue_length'],
        'Exp_E_Only_Temporal_Features': ['minutes_since_opening', 'hour', 'minute', 'day_of_week', 'sin_time', 'cos_time'],
    }

    ablation_results = {}
    rf_params = dict(n_estimators=100, max_depth=12, min_samples_leaf=2, random_state=42, n_jobs=-1)

    for exp_name, feat_cols in ablation_sets.items():
        X_train_sub = X_full.iloc[train_idx][feat_cols].copy().reset_index(drop=True)
        X_test_sub = X_full.iloc[test_idx][feat_cols].copy().reset_index(drop=True)

        rf = RandomForestRegressor(**rf_params)
        rf.fit(X_train_sub, y_train)
        preds = rf.predict(X_test_sub)

        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(root_mean_squared_error(y_test, preds))
        r2 = float(r2_score(y_test, preds))

        ablation_results[exp_name] = {
            'features': feat_cols,
            'num_features': len(feat_cols),
            'test_mae': round(mae, 4),
            'test_rmse': round(rmse, 4),
            'test_r2': round(r2, 6),
        }
        print(f"[{exp_name}] Features: {len(feat_cols)} | MAE: {mae:.4f}m | RMSE: {rmse:.4f}m | R²: {r2:.6f}")

    # Save ablation results
    ablation_json_path = artifacts_dir / "ablation_results.json"
    with open(ablation_json_path, 'w', encoding='utf-8') as f:
        json.dump(ablation_results, f, indent=2)
    print(f"Saved ablation results to {ablation_json_path}")

    # ---------------------------------------------------------
    # STEP 4: Shuffled / Alternative Split Sanity Check
    # ---------------------------------------------------------
    print("\n--- [STEP 4] ALTERNATIVE SPLIT SANITY CHECK ---")
    
    # 1. Official Chronological
    official_r2 = ablation_results['Exp_C_All_10_Causal_Features']['test_r2']
    official_mae = ablation_results['Exp_C_All_10_Causal_Features']['test_mae']
    official_rmse = ablation_results['Exp_C_All_10_Causal_Features']['test_rmse']

    # 2. Random Shuffled 71/29 Split (Diagnostic only)
    np.random.seed(42)
    shuffled_indices = np.random.permutation(len(df))
    split_point = int(0.71 * len(df))
    rand_train_idx = shuffled_indices[:split_point]
    rand_test_idx = shuffled_indices[split_point:]

    X_train_rand = X_full.iloc[rand_train_idx][EXTENDED_FEATURE_NAMES].copy().reset_index(drop=True)
    y_train_rand = y.iloc[rand_train_idx].copy().reset_index(drop=True)
    X_test_rand = X_full.iloc[rand_test_idx][EXTENDED_FEATURE_NAMES].copy().reset_index(drop=True)
    y_test_rand = y.iloc[rand_test_idx].copy().reset_index(drop=True)

    rf_rand = RandomForestRegressor(**rf_params)
    rf_rand.fit(X_train_rand, y_train_rand)
    preds_rand = rf_rand.predict(X_test_rand)
    rand_mae = float(mean_absolute_error(y_test_rand, preds_rand))
    rand_rmse = float(root_mean_squared_error(y_test_rand, preds_rand))
    rand_r2 = float(r2_score(y_test_rand, preds_rand))

    # 3. Grouped-By-Day Cross-Validation (GroupKFold with 5 splits by date)
    gkf = GroupKFold(n_splits=min(5, num_unique_days))
    group_maes, group_rmses, group_r2s = [], [], []

    for fold_i, (g_train_idx, g_test_idx) in enumerate(gkf.split(X_full, y, groups=df['date_only'])):
        X_tr = X_full.iloc[g_train_idx][EXTENDED_FEATURE_NAMES].copy().reset_index(drop=True)
        y_tr = y.iloc[g_train_idx].copy().reset_index(drop=True)
        X_te = X_full.iloc[g_test_idx][EXTENDED_FEATURE_NAMES].copy().reset_index(drop=True)
        y_te = y.iloc[g_test_idx].copy().reset_index(drop=True)

        rf_g = RandomForestRegressor(**rf_params)
        rf_g.fit(X_tr, y_tr)
        p_g = rf_g.predict(X_te)

        group_maes.append(mean_absolute_error(y_te, p_g))
        group_rmses.append(root_mean_squared_error(y_te, p_g))
        group_r2s.append(r2_score(y_te, p_g))

    split_comparison = {
        'chronological_official': {'MAE': official_mae, 'RMSE': official_rmse, 'R²': official_r2},
        'random_shuffled_diagnostic': {'MAE': round(rand_mae, 4), 'RMSE': round(rand_rmse, 4), 'R²': round(rand_r2, 6)},
        'grouped_by_day_cv_mean': {
            'MAE': round(float(np.mean(group_maes)), 4),
            'RMSE': round(float(np.mean(group_rmses)), 4),
            'R²': round(float(np.mean(group_r2s)), 6),
            'std_MAE': round(float(np.std(group_maes)), 4),
            'std_R²': round(float(np.std(group_r2s)), 6),
        }
    }
    print(f"Chronological Split: MAE={official_mae:.4f}m | RMSE={official_rmse:.4f}m | R²={official_r2:.6f}")
    print(f"Random Shuffled Split: MAE={rand_mae:.4f}m | RMSE={rand_rmse:.4f}m | R²={rand_r2:.6f}")
    print(f"Grouped-By-Day CV Mean: MAE={np.mean(group_maes):.4f}m | R²={np.mean(group_r2s):.6f}")

    # ---------------------------------------------------------
    # STEP 5: Simple Baseline Investigation & Mathematical Physics
    # ---------------------------------------------------------
    print("\n--- [STEP 5] SIMPLE BASELINE INVESTIGATION ---")
    X_train_full = X_full.iloc[train_idx][EXTENDED_FEATURE_NAMES].copy().reset_index(drop=True)
    X_test_full = X_full.iloc[test_idx][EXTENDED_FEATURE_NAMES].copy().reset_index(drop=True)

    # Baselines
    b_global = GlobalMeanBaseline().fit(X_train_full, y_train)
    b_hourly = HourlyHistoricalMeanBaseline().fit(X_train_full, y_train)
    b_queue = QueueAwareProportionalBaseline().fit(X_train_full, y_train)

    # Linear Regression (1 feature: queue_length only)
    lr_1f = LinearRegression()
    lr_1f.fit(X_train_full[['queue_length']], y_train)
    p_lr_1f = lr_1f.predict(X_test_full[['queue_length']])
    lr_1f_slope = float(lr_1f.coef_[0])
    lr_1f_intercept = float(lr_1f.intercept_)

    # Linear Regression (all 10 features)
    lr_all = LinearRegression()
    lr_all.fit(X_train_full, y_train)
    p_lr_all = lr_all.predict(X_test_full)

    # Full Random Forest
    rf_best = RandomForestRegressor(**rf_params)
    rf_best.fit(X_train_full, y_train)
    p_rf = rf_best.predict(X_test_full)

    def eval_model(p, y_true):
        return {
            'MAE': round(float(mean_absolute_error(y_true, p)), 4),
            'RMSE': round(float(root_mean_squared_error(y_true, p)), 4),
            'R²': round(float(r2_score(y_true, p)), 6),
        }

    baseline_comparison = {
        'Global Historical Mean': eval_model(b_global.predict(X_test_full), y_test),
        'Hourly Historical Mean': eval_model(b_hourly.predict(X_test_full), y_test),
        'Queue-Aware Proportional Heuristic': eval_model(b_queue.predict(X_test_full), y_test),
        'Linear Regression (queue_length only)': eval_model(p_lr_1f, y_test),
        'Linear Regression (all 10 features)': eval_model(p_lr_all, y_test),
        'Random Forest Regressor (Selected)': eval_model(p_rf, y_test),
    }

    print("\nBASELINE BENCHMARK TABLE:")
    for k, v in baseline_comparison.items():
        print(f"  {k:38}: MAE={v['MAE']:6.2f}m | RMSE={v['RMSE']:6.2f}m | R²={v['R²']:8.5f}")

    print(f"\n1-Feature Linear Model: wait_time = {lr_1f_slope:.4f} * queue_length + ({lr_1f_intercept:.4f})")
    print(f"  Notice: Slope is ~{lr_1f_slope:.4f} min/person. In a multi-server bank with 4 counters and ~5 min avg service duration, clearing rate is ~1.25 min/person.")

    # ---------------------------------------------------------
    # STEP 6: Residual Analysis & Plot Generation
    # ---------------------------------------------------------
    print("\n--- [STEP 6] RESIDUAL ANALYSIS & FIGURE GENERATION ---")
    residuals = p_rf - y_test
    abs_errors = np.abs(residuals)
    sq_errors = residuals ** 2

    test_eval_df = test_df.copy().reset_index(drop=True)
    test_eval_df['actual_wait'] = y_test
    test_eval_df['predicted_wait'] = p_rf
    test_eval_df['residual'] = residuals
    test_eval_df['abs_error'] = abs_errors

    # Residuals by time of day
    test_eval_df['hour'] = test_eval_df['arrival_time'].dt.hour
    test_eval_df['period'] = pd.cut(
        test_eval_df['hour'],
        bins=[0, 11, 14, 24],
        labels=['Morning (9-11)', 'Midday Peak (11-14)', 'Afternoon (14-17)'],
        right=False
    )
    period_stats = test_eval_df.groupby('period', observed=False)['abs_error'].agg(['count', 'mean', 'max', 'std']).to_dict(orient='index')

    # Residuals by queue depth bucket
    test_eval_df['queue_bucket'] = pd.cut(
        test_eval_df['queue_length'],
        bins=[-1, 20, 50, 100, 400],
        labels=['Low (0-20)', 'Medium (21-50)', 'High (51-100)', 'Severe (>100)']
    )
    queue_bucket_stats = test_eval_df.groupby('queue_bucket', observed=False)['abs_error'].agg(['count', 'mean', 'max', 'std']).to_dict(orient='index')

    # Generate 5 Plots
    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
    
    # 1. Actual vs Predicted
    plt.figure(figsize=(7, 6), dpi=300)
    plt.scatter(y_test, p_rf, alpha=0.3, color='#2563eb', edgecolors='none', s=20)
    max_val = max(y_test.max(), p_rf.max())
    plt.plot([0, max_val], [0, max_val], color='#dc2626', linestyle='--', linewidth=2, label='Ideal 1:1 Line')
    plt.title('Actual vs Predicted Waiting Time (Chronological Test Set)', fontsize=12, fontweight='bold')
    plt.xlabel('Actual Wait Time (minutes)', fontsize=10)
    plt.ylabel('Predicted Wait Time (minutes)', fontsize=10)
    plt.legend(frameon=True)
    plt.tight_layout()
    p1 = figures_dir / "actual_vs_predicted.png"
    plt.savefig(p1)
    plt.savefig(docs_figures_dir / "actual_vs_predicted.png")
    plt.close()

    # 2. Residual vs Predicted
    plt.figure(figsize=(7, 5), dpi=300)
    plt.scatter(p_rf, residuals, alpha=0.3, color='#4f46e5', edgecolors='none', s=20)
    plt.axhline(0, color='#dc2626', linestyle='--', linewidth=2)
    plt.axhline(baseline_comparison['Random Forest Regressor (Selected)']['MAE'], color='#059669', linestyle=':', label='+MAE (0.92 min)')
    plt.axhline(-baseline_comparison['Random Forest Regressor (Selected)']['MAE'], color='#059669', linestyle=':', label='-MAE (0.92 min)')
    plt.title('Residuals vs Predicted Waiting Time', fontsize=12, fontweight='bold')
    plt.xlabel('Predicted Wait Time (minutes)', fontsize=10)
    plt.ylabel('Residual (Predicted - Actual, minutes)', fontsize=10)
    plt.legend(frameon=True)
    plt.tight_layout()
    p2 = figures_dir / "residual_vs_predicted.png"
    plt.savefig(p2)
    plt.savefig(docs_figures_dir / "residual_vs_predicted.png")
    plt.close()

    # 3. Absolute Error vs Queue Length
    plt.figure(figsize=(7, 5), dpi=300)
    plt.scatter(test_eval_df['queue_length'], abs_errors, alpha=0.3, color='#0891b2', edgecolors='none', s=20)
    plt.axhline(baseline_comparison['Random Forest Regressor (Selected)']['MAE'], color='#dc2626', linestyle='--', label='Mean Test MAE (0.92m)')
    plt.title('Absolute Error vs Queue Length', fontsize=12, fontweight='bold')
    plt.xlabel('Queue Length (people)', fontsize=10)
    plt.ylabel('Absolute Error |Predicted - Actual| (minutes)', fontsize=10)
    plt.legend(frameon=True)
    plt.tight_layout()
    p3 = figures_dir / "abs_error_vs_queue_length.png"
    plt.savefig(p3)
    plt.savefig(docs_figures_dir / "abs_error_vs_queue_length.png")
    plt.close()

    # 4. Error Distribution
    plt.figure(figsize=(7, 5), dpi=300)
    plt.hist(residuals, bins=50, color='#0284c7', edgecolor='black', alpha=0.7, density=True)
    mu, std = stats.norm.fit(residuals)
    xmin, xmax = plt.xlim()
    x_axis = np.linspace(xmin, xmax, 100)
    plt.plot(x_axis, stats.norm.pdf(x_axis, mu, std), 'r-', linewidth=2, label=f'Norm Fit (μ={mu:.2f}, σ={std:.2f})')
    plt.title('Prediction Error Distribution (Residuals)', fontsize=12, fontweight='bold')
    plt.xlabel('Residual Error (minutes)', fontsize=10)
    plt.ylabel('Density', fontsize=10)
    plt.legend(frameon=True)
    plt.tight_layout()
    p4 = figures_dir / "error_distribution.png"
    plt.savefig(p4)
    plt.savefig(docs_figures_dir / "error_distribution.png")
    plt.close()

    # 5. Actual Waiting Time vs Queue Length
    plt.figure(figsize=(7, 5), dpi=300)
    plt.scatter(df['queue_length'], df['calculated_wait_minutes'], alpha=0.2, color='#6366f1', edgecolors='none', s=15)
    sorted_q = test_eval_df[['queue_length']].sort_values(by='queue_length')
    plt.plot(sorted_q['queue_length'], lr_1f.predict(sorted_q), color='#dc2626', linewidth=2, label='Linear Fit')
    plt.title('Empirical Physical Relationship: Waiting Time vs Queue Length', fontsize=12, fontweight='bold')
    plt.xlabel('Observed Queue Length (people)', fontsize=10)
    plt.ylabel('Actual Wait Time (minutes)', fontsize=10)
    plt.legend(frameon=True)
    plt.tight_layout()
    p5 = figures_dir / "actual_waiting_time_vs_queue_length.png"
    plt.savefig(p5)
    plt.savefig(docs_figures_dir / "actual_waiting_time_vs_queue_length.png")
    plt.close()

    print("Successfully generated all 5 Phase 5 diagnostic figures!")

    # ---------------------------------------------------------
    # STEP 8: Temporal Generalization (Day-by-Day Evaluation)
    # ---------------------------------------------------------
    print("\n--- [STEP 8] TEMPORAL GENERALIZATION TEST ---")
    test_days = sorted(test_df['arrival_time'].dt.date.unique())
    day_generalization = []

    for d in test_days:
        day_mask = (test_df['arrival_time'].dt.date == d).values
        y_d_true = y_test[day_mask]
        y_d_pred = p_rf[day_mask]
        d_mae = float(mean_absolute_error(y_d_true, y_d_pred))
        d_rmse = float(root_mean_squared_error(y_d_true, y_d_pred))
        d_r2 = float(r2_score(y_d_true, y_d_pred))

        day_generalization.append({
            'date': str(d),
            'records': int(np.sum(day_mask)),
            'MAE': round(d_mae, 4),
            'RMSE': round(d_rmse, 4),
            'R²': round(d_r2, 6),
        })
        print(f"  Date {d} ({np.sum(day_mask):,} rows): MAE={d_mae:.4f}m | RMSE={d_rmse:.4f}m | R²={d_r2:.6f}")

    # ---------------------------------------------------------
    # STEP 9: Extreme Case Testing & Monotonicity
    # ---------------------------------------------------------
    print("\n--- [STEP 9] EXTREME CASE TESTING ---")
    test_queue_values = [0, 1, 10, 25, 50, 100, 150, 200, 300, 340]
    canonical_time = '2026-10-19T10:30:00'
    extreme_results = []
    prev_pred = -1.0
    monotonic = True

    for q in test_queue_values:
        vec = build_single_inference_vector(
            queue_length=q,
            arrival_time_str=canonical_time,
            lag1_queue_length=max(0, q - 2),
            arrivals_last_15m=8.0,
            arrivals_last_30m=17.0,
            feature_set='extended'
        )
        pred_val = float(rf_best.predict(vec)[0])
        is_non_neg = pred_val >= 0
        if prev_pred >= 0 and pred_val < prev_pred:
            monotonic = False

        extreme_results.append({
            'queue_length': q,
            'predicted_wait_minutes': round(pred_val, 2),
            'non_negative': is_non_neg,
            'monotonic_step': (pred_val >= prev_pred) if prev_pred >= 0 else True
        })
        print(f"  Queue={q:3d} -> Predicted Wait: {pred_val:6.2f} min (Non-neg: {is_non_neg})")
        prev_pred = pred_val

    print(f"Monotonicity across tested queue range: {monotonic}")

    # ---------------------------------------------------------
    # STEP 10: Production Distribution Ranges
    # ---------------------------------------------------------
    print("\n--- [STEP 10] PRODUCTION DISTRIBUTION AUDIT ---")
    prod_distribution = {
        'training_queue_length_range': [int(df['queue_length'].min()), int(df['queue_length'].max())],
        'api_allowed_queue_length_range': [0, 10000],
        'frontend_slider_range': [0, 200],
        'frontend_input_range': [0, 1000],
        'training_arrival_hours': [int(df['arrival_hour'].min()), int(df['arrival_hour'].max())],
        'api_accepted_arrival_hours': 'Any ISO-8601 (00:00 to 23:59)',
        'training_days_of_week': sorted(list(set(df['arrival_time'].dt.dayofweek.tolist()))),
        'out_of_distribution_risk_note': 'Submitting queue_length > 250 or arrival times outside 09:00–17:00 extrapolates beyond observed data.'
    }

    # Assemble complete Phase 5 audit payload
    complete_audit_payload = {
        'audit_metrics': audit_metrics,
        'ablation_results': ablation_results,
        'split_comparison': split_comparison,
        'baseline_comparison': baseline_comparison,
        'linear_model_params': {'slope': lr_1f_slope, 'intercept': lr_1f_intercept},
        'period_error_stats': period_stats,
        'queue_bucket_error_stats': queue_bucket_stats,
        'day_generalization': day_generalization,
        'extreme_case_results': extreme_results,
        'monotonicity': monotonic,
        'production_distribution': prod_distribution
    }

    summary_json_path = artifacts_dir / "phase5_audit_summary.json"
    with open(summary_json_path, 'w', encoding='utf-8') as f:
        json.dump(complete_audit_payload, f, indent=2)
    print(f"\nAll Phase 5 audits completed! Summary saved to {summary_json_path}")
    return complete_audit_payload


if __name__ == '__main__':
    run_phase5_stress_testing()
