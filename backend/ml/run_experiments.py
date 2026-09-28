"""
End-to-End Machine Learning Experiment Pipeline for BCA Phase 2.

Executes:
1. Data loading & timestamp verification
2. Feature extraction (Strict Prediction-Time Boundary)
3. Chronological train/test split
4. Baseline evaluations (Global Mean, Queue-aware, Hourly Mean)
5. ML Model training & validation (Linear Regression, Random Forest, Gradient Boosting)
6. Out-of-sample test evaluation (MAE, RMSE, R²)
7. Error analysis by queue slice, diurnal phase, and date
8. Permutation feature importance
9. Diagnostic plot generation
10. Model artifact serialization
"""
import os
import sys
import json
from pathlib import Path
import numpy as np
import pandas as pd

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.data_loader import load_clean_dataset
from ml.features import extract_features, EXTENDED_FEATURE_NAMES, CORE_FEATURE_NAMES
from ml.split import get_temporal_split
from ml.baselines import (
    GlobalMeanBaseline,
    QueueAwareProportionalBaseline,
    HourlyHistoricalMeanBaseline,
)
from ml.train import train_models, save_model_artifact
from ml.evaluate import evaluate_all, format_markdown_table
from ml.explain import (
    analyze_residuals_by_slice,
    compute_feature_importance,
    plot_error_diagnostics,
)


def run_pipeline():
    print("=" * 70)
    print("PHASE 2: MACHINE LEARNING EXPERIMENTAL PIPELINE")
    print("=" * 70)

    # 1. Load Data
    print("\n[Step 1 & 2] Loading verified dataset...")
    df = load_clean_dataset()
    print(f"Loaded {len(df):,} records with columns: {list(df.columns)}")

    # 2. Extract Features
    print("\n[Step 5] Extracting prediction-time features...")
    X, y = extract_features(df, feature_set='extended')
    print(f"Feature matrix shape: {X.shape}, Target shape: {y.shape}")
    print(f"Features: {list(X.columns)}")

    # 3. Temporal Train/Test Split
    print("\n[Step 7] Establishing Chronological Train/Test Split...")
    # Using 10 days train (Weeks 1 & 2) vs 4 days test (Week 3)
    train_df, test_df, split_meta = get_temporal_split(df, train_ratio=0.71)
    
    train_idx = train_df.index
    test_idx = test_df.index
    
    X_train, y_train = X.iloc[train_idx].copy().reset_index(drop=True), y.iloc[train_idx].copy().reset_index(drop=True)
    X_test, y_test = X.iloc[test_idx].copy().reset_index(drop=True), y.iloc[test_idx].copy().reset_index(drop=True)

    print(f"TRAIN Set ({split_meta['num_train_days']} days): {split_meta['train_date_range'][0]} to {split_meta['train_date_range'][1]} | {len(X_train):,} rows ({split_meta['train_row_pct']}%)")
    print(f"TEST Set  ({split_meta['num_test_days']} days): {split_meta['test_date_range'][0]} to {split_meta['test_date_range'][1]} | {len(X_test):,} rows ({split_meta['test_row_pct']}%)")
    print("Train dates:", split_meta['train_dates'])
    print("Test dates:", split_meta['test_dates'])

    # 4. Baselines
    print("\n[Step 8] Fitting Baselines on Training Set...")
    baselines = {
        "Global Historical Mean": GlobalMeanBaseline().fit(X_train, y_train),
        "Queue-Aware Proportional Heuristic": QueueAwareProportionalBaseline().fit(X_train, y_train),
        "Hourly Historical Mean": HourlyHistoricalMeanBaseline().fit(X_train, y_train),
    }

    # 5. Train Machine Learning Models
    print("\n[Step 9] Training ML Models...")
    models = train_models(X_train, y_train, random_state=42)

    # 6. Evaluate All on Untouched Test Set
    print("\n[Step 11] Evaluating All Models on Untouched Chronological Test Set...")
    results_df = evaluate_all(models, baselines, X_test, y_test)
    print("\nMODEL BENCHMARK RESULTS (TEST SET):")
    print(format_markdown_table(results_df))

    best_model_name = results_df.iloc[0]['Model']
    best_model = models.get(best_model_name)
    print(f"\nBest Performing Model: {best_model_name}")

    # 7. Error Analysis & Diagnostics
    print(f"\n[Step 12] Performing Slice-Based Error Analysis for '{best_model_name}'...")
    error_analysis = analyze_residuals_by_slice(best_model, X_test, y_test, test_df)
    
    print("\n--- Error Breakdown by Queue Depth ---")
    print(error_analysis["queue_slice"].to_string(index=False))

    print("\n--- Error Breakdown by Diurnal Period ---")
    print(error_analysis["time_slice"].to_string(index=False))

    print("\n--- Error Breakdown by Test Date ---")
    print(error_analysis["date_slice"].to_string(index=False))

    print("\n--- Error Breakdown by Target Waiting Time Tier ---")
    print(error_analysis["tier_slice"].to_string(index=False))

    # 8. Feature Importance
    print(f"\n[Step 13] Computing Permutation Feature Importance for '{best_model_name}' on Test Set...")
    df_imp = compute_feature_importance(best_model, X_test, y_test, list(X_test.columns), random_state=42)
    print(df_imp.to_string(index=False))

    # 9. Plot Diagnostics
    figures_dir = Path(__file__).resolve().parent.parent.parent / "docs" / "phase2_figures"
    print(f"\nSaving diagnostic figures to {figures_dir}...")
    plot_paths = plot_error_diagnostics(error_analysis["eval_df"], df_imp, best_model_name, figures_dir)
    for p in plot_paths:
        print(f"Generated: {p.name}")

    # 10. Save Best Model Artifact & Metrics
    artifacts_dir = Path(__file__).resolve().parent / "artifacts"
    saved_model_path = save_model_artifact(best_model, "best_waiting_time_model", artifacts_dir)

    metrics_payload = {
        "best_model_name": best_model_name,
        "features": list(X.columns),
        "split_metadata": split_meta,
        "benchmark_results": results_df.to_dict(orient="records"),
        "best_model_metrics": results_df[results_df['Model'] == best_model_name].iloc[0].to_dict(),
        "queue_slice_metrics": error_analysis["queue_slice"].to_dict(orient="records"),
        "time_slice_metrics": error_analysis["time_slice"].to_dict(orient="records"),
        "date_slice_metrics": error_analysis["date_slice"].to_dict(orient="records"),
        "feature_importance": df_imp.to_dict(orient="records")
    }

    metrics_json_path = artifacts_dir / "model_metrics.json"
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2, default=str)
    print(f"Metrics saved to {metrics_json_path}")

    print("\n" + "=" * 70)
    print("PHASE 2 EXPERIMENT COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    return results_df, best_model_name, error_analysis, df_imp


if __name__ == "__main__":
    run_pipeline()
