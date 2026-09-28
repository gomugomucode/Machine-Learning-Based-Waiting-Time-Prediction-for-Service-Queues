"""
Model Evaluation and Benchmark Comparison Suite.

Evaluates baselines and ML regressors against the untouched chronological test set.
Computes real, measured metrics: MAE, RMSE, R².
"""
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

try:
    from ml.baselines import (
        GlobalMeanBaseline,
        QueueAwareProportionalBaseline,
        HourlyHistoricalMeanBaseline,
        calculate_metrics
    )
except ImportError:
    from backend.ml.baselines import (
        GlobalMeanBaseline,
        QueueAwareProportionalBaseline,
        HourlyHistoricalMeanBaseline,
        calculate_metrics
    )


def evaluate_all(
    models: Dict[str, Any],
    baselines: Dict[str, Any],
    X_test: pd.DataFrame,
    y_test: pd.Series
) -> pd.DataFrame:
    """
    Evaluates all baselines and ML models on the test set.

    Returns:
    --------
    results_df : pd.DataFrame
        Table with Model, MAE, RMSE, R².
    """
    records = []

    # 1. Evaluate Baselines
    for name, b_model in baselines.items():
        preds = b_model.predict(X_test)
        metrics = calculate_metrics(y_test.values, preds)
        records.append({
            "Model": name,
            "Type": "Baseline",
            "MAE": metrics["mae"],
            "RMSE": metrics["rmse"],
            "R²": metrics["r2"]
        })

    # 2. Evaluate ML Models
    for name, ml_model in models.items():
        preds = ml_model.predict(X_test)
        metrics = calculate_metrics(y_test.values, preds)
        records.append({
            "Model": name,
            "Type": "Machine Learning",
            "MAE": metrics["mae"],
            "RMSE": metrics["rmse"],
            "R²": metrics["r2"]
        })

    results_df = pd.DataFrame(records).sort_values(by="MAE").reset_index(drop=True)
    return results_df


def format_markdown_table(results_df: pd.DataFrame) -> str:
    """Formats benchmark results as Markdown table."""
    lines = [
        "| Model | Type | MAE (min) | RMSE (min) | R² |",
        "| :--- | :--- | :---: | :---: | :---: |"
    ]
    for _, row in results_df.iterrows():
        lines.append(f"| {row['Model']} | {row['Type']} | {row['MAE']:.4f} | {row['RMSE']:.4f} | {row['R²']:.4f} |")
    return "\n".join(lines)
