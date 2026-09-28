"""
Temporal Train/Test Split and Validation Strategy.

Strict rule:
Chronological split only. No random shuffling, no future observation leakage.
"""
from datetime import date
from typing import Tuple, List, Dict, Any
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit


def get_temporal_split(
    df: pd.DataFrame,
    train_ratio: float = 0.70
) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Splits the dataset chronologically by calendar dates.
    Ensures that days are kept intact (no mid-day split that leaks same-day afternoon patterns into morning train).

    Parameters:
    -----------
    df : pd.DataFrame
        Dataset with 'arrival_time'.
    train_ratio : float
        Target proportion of days in training set (e.g. 0.70 - 0.80).

    Returns:
    --------
    train_df : pd.DataFrame
    test_df : pd.DataFrame
    metadata : Dict[str, Any]
        Details on split boundary, date ranges, and row counts.
    """
    data = df.sort_values(by='arrival_time').reset_index(drop=True)
    dates = sorted(data['arrival_time'].dt.date.unique())
    total_days = len(dates)

    num_train_days = int(round(total_days * train_ratio))
    # Ensure at least 1 day in test and 2 in train
    num_train_days = max(2, min(total_days - 1, num_train_days))

    train_dates = dates[:num_train_days]
    test_dates = dates[num_train_days:]

    train_mask = data['arrival_time'].dt.date.isin(train_dates)
    test_mask = data['arrival_time'].dt.date.isin(test_dates)

    train_df = data[train_mask].copy().reset_index(drop=True)
    test_df = data[test_mask].copy().reset_index(drop=True)

    metadata = {
        "total_days": total_days,
        "num_train_days": len(train_dates),
        "num_test_days": len(test_dates),
        "train_dates": [d.isoformat() for d in train_dates],
        "test_dates": [d.isoformat() for d in test_dates],
        "train_date_range": (train_dates[0].isoformat(), train_dates[-1].isoformat()),
        "test_date_range": (test_dates[0].isoformat(), test_dates[-1].isoformat()),
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "train_row_pct": round(len(train_df) / len(data) * 100.0, 2),
        "test_row_pct": round(len(test_df) / len(data) * 100.0, 2),
    }

    return train_df, test_df, metadata


def get_time_series_cv(
    n_splits: int = 5
) -> TimeSeriesSplit:
    """
    Returns a TimeSeriesSplit cross-validator for temporal hyperparameter selection.
    """
    return TimeSeriesSplit(n_splits=n_splits)
