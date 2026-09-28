"""
Model Explanation, Error Analysis, and Interpretability Module.

Provides:
- Slice-based error analysis (Queue depth, diurnal period, calendar dates, target tiers)
- Permutation feature importance on test set
- Tree MDI importance & Linear Regression standardized coefficients
- Diagnostic plots for residual analysis
"""
from typing import Dict, Any, List, Optional
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.inspection import permutation_importance


def analyze_residuals_by_slice(
    model: Any,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    test_df: pd.DataFrame
) -> Dict[str, pd.DataFrame]:
    """
    Computes sliced MAE, RMSE, and mean residuals across operational segments.
    """
    preds = model.predict(X_test)
    df_eval = pd.DataFrame({
        'actual': y_test.values,
        'predicted': preds,
        'error': preds - y_test.values,
        'abs_error': np.abs(preds - y_test.values),
        'queue_length': X_test['queue_length'].values,
        'hour': X_test['hour'].values,
        'date': test_df['arrival_time'].dt.date.values
    })

    # 1. Queue Length Bins
    df_eval['queue_bin'] = pd.cut(
        df_eval['queue_length'],
        bins=[-1, 50, 150, 999],
        labels=['Short (<=50)', 'Medium (51-150)', 'Long (>150)']
    )
    queue_slice = df_eval.groupby('queue_bin', observed=False).agg(
        Count=('actual', 'count'),
        MAE=('abs_error', 'mean'),
        RMSE=('error', lambda x: np.sqrt(np.mean(x**2))),
        Mean_Error=('error', 'mean'),
        Min_Error=('error', 'min'),
        Max_Error=('error', 'max')
    ).reset_index()

    # 2. Diurnal Period
    def get_period(hour):
        if hour < 12:
            return 'Morning (09:00-11:59)'
        elif hour < 14:
            return 'Midday (12:00-13:59)'
        else:
            return 'Afternoon (14:00-17:00)'

    df_eval['time_period'] = df_eval['hour'].apply(get_period)
    time_slice = df_eval.groupby('time_period').agg(
        Count=('actual', 'count'),
        MAE=('abs_error', 'mean'),
        RMSE=('error', lambda x: np.sqrt(np.mean(x**2))),
        Mean_Error=('error', 'mean')
    ).reset_index()

    # 3. Test Date Breakdown
    date_slice = df_eval.groupby('date').agg(
        Count=('actual', 'count'),
        MAE=('abs_error', 'mean'),
        RMSE=('error', lambda x: np.sqrt(np.mean(x**2))),
        Mean_Error=('error', 'mean')
    ).reset_index()

    # 4. Target Wait Time Tiers
    df_eval['wait_tier'] = pd.cut(
        df_eval['actual'],
        bins=[-1, 30, 100, 999],
        labels=['Low (<30 min)', 'Moderate (30-100 min)', 'High (>100 min)']
    )
    tier_slice = df_eval.groupby('wait_tier', observed=False).agg(
        Count=('actual', 'count'),
        MAE=('abs_error', 'mean'),
        RMSE=('error', lambda x: np.sqrt(np.mean(x**2))),
        Mean_Error=('error', 'mean')
    ).reset_index()

    return {
        "queue_slice": queue_slice,
        "time_slice": time_slice,
        "date_slice": date_slice,
        "tier_slice": tier_slice,
        "eval_df": df_eval
    }


def compute_feature_importance(
    model: Any,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    feature_names: List[str],
    random_state: int = 42
) -> pd.DataFrame:
    """
    Computes permutation importance on the test set for consistent model comparison.
    """
    perm = permutation_importance(
        model, X_test, y_test,
        n_repeats=10,
        random_state=random_state,
        n_jobs=-1
    )

    df_imp = pd.DataFrame({
        'Feature': feature_names,
        'Permutation_Importance_Mean': perm.importances_mean,
        'Permutation_Importance_Std': perm.importances_std
    }).sort_values(by='Permutation_Importance_Mean', ascending=False).reset_index(drop=True)

    return df_imp


def plot_error_diagnostics(
    eval_df: pd.DataFrame,
    df_imp: pd.DataFrame,
    model_name: str,
    output_dir: Path
) -> List[Path]:
    """
    Generates and saves error analysis figures.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    generated = []

    # 1. Actual vs Predicted Scatter
    fig, ax = plt.subplots(figsize=(8, 6), dpi=150)
    ax.scatter(eval_df['actual'], eval_df['predicted'], alpha=0.3, color='#1e3a8a', edgecolors='none', s=15)
    max_val = max(eval_df['actual'].max(), eval_df['predicted'].max())
    ax.plot([0, max_val], [0, max_val], 'r--', lw=2, label='Perfect Prediction (y=x)')
    ax.set_title(f'Actual vs Predicted Waiting Time ({model_name})', fontsize=13, fontweight='bold')
    ax.set_xlabel('Actual Waiting Time (minutes)', fontsize=11)
    ax.set_ylabel('Predicted Waiting Time (minutes)', fontsize=11)
    ax.legend(frameon=True)
    ax.grid(True, linestyle='--', alpha=0.5)
    p1 = output_dir / f"{model_name.lower().replace(' ', '_')}_actual_vs_predicted.png"
    plt.tight_layout()
    plt.savefig(p1)
    plt.close()
    generated.append(p1)

    # 2. Residual Distribution
    fig, ax = plt.subplots(figsize=(8, 5), dpi=150)
    ax.hist(eval_df['error'], bins=50, color='#0284c7', edgecolor='black', alpha=0.7)
    ax.axvline(0, color='red', linestyle='--', lw=2, label='Zero Error')
    ax.axvline(eval_df['error'].mean(), color='orange', linestyle='-', lw=2, label=f"Mean Error: {eval_df['error'].mean():.2f}m")
    ax.set_title(f'Residual Error Distribution ({model_name})', fontsize=13, fontweight='bold')
    ax.set_xlabel('Prediction Error (Predicted - Actual in minutes)', fontsize=11)
    ax.set_ylabel('Frequency', fontsize=11)
    ax.legend(frameon=True)
    ax.grid(True, linestyle='--', alpha=0.5)
    p2 = output_dir / f"{model_name.lower().replace(' ', '_')}_residuals.png"
    plt.tight_layout()
    plt.savefig(p2)
    plt.close()
    generated.append(p2)

    # 3. Permutation Feature Importance Bar Chart
    fig, ax = plt.subplots(figsize=(9, 5), dpi=150)
    df_sorted = df_imp.sort_values(by='Permutation_Importance_Mean', ascending=True)
    ax.barh(df_sorted['Feature'], df_sorted['Permutation_Importance_Mean'], xerr=df_sorted['Permutation_Importance_Std'],
            color='#0d9488', edgecolor='black', alpha=0.85, capsize=4)
    ax.set_title(f'Permutation Feature Importance on Test Set ({model_name})', fontsize=13, fontweight='bold')
    ax.set_xlabel('Decrease in Test R² Score When Shuffled', fontsize=11)
    ax.grid(True, linestyle='--', alpha=0.5)
    p3 = output_dir / f"{model_name.lower().replace(' ', '_')}_feature_importance.png"
    plt.tight_layout()
    plt.savefig(p3)
    plt.close()
    generated.append(p3)

    return generated
