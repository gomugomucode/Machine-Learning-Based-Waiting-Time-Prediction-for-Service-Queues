"""
Feature Engineering Pipeline for Queue Waiting-Time Prediction.

CRITICAL INFORMATION BOUNDARY:
All features must be available at prediction time t_0 (arrival_time).
Strictly prohibited: start_time, finish_time, actual wait_time, future arrivals,
future queue lengths, future service durations.
"""
import numpy as np
import pandas as pd
from typing import List, Tuple, Optional, Dict, Any


PROHIBITED_LEAKAGE_COLUMNS = [
    'start_time',
    'finish_time',
    'wait_time',
    'calculated_wait_minutes',
    'service_duration_minutes',
]

CORE_FEATURE_NAMES = [
    'queue_length',
    'minutes_since_opening',
    'hour',
    'minute',
    'day_of_week',
    'sin_time',
    'cos_time',
]

EXTENDED_FEATURE_NAMES = CORE_FEATURE_NAMES + [
    'lag1_queue_length',
    'arrivals_last_15m',
    'arrivals_last_30m',
]


def validate_feature_matrix(X: pd.DataFrame) -> None:
    """
    Enforces the Prediction-Time Information Boundary.
    Raises ValueError if any prohibited column or leakage risk is detected.
    """
    for col in PROHIBITED_LEAKAGE_COLUMNS:
        if col in X.columns:
            raise ValueError(
                f"DATA LEAKAGE DETECTED: Column '{col}' is strictly forbidden in feature matrix. "
                "It contains information only known AFTER service commencement or completion."
            )
    # Check for NaN / infinite values
    if X.isnull().values.any():
        raise ValueError("Feature matrix contains NaN values. All features must be properly imputed.")
    if np.isinf(X.values).any():
        raise ValueError("Feature matrix contains infinite values.")


def extract_features(
    df: pd.DataFrame,
    feature_set: str = 'extended',
    target_col: str = 'calculated_wait_minutes'
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Extracts prediction-time features and target variable from the clean dataset.

    Parameters:
    -----------
    df : pd.DataFrame
        DataFrame containing at minimum 'arrival_time' and 'queue_length'.
    feature_set : str
        'core' (queue_length, time features) or 'extended' (+ causal lags & arrival rates).
    target_col : str
        Target column name (default: 'calculated_wait_minutes').

    Returns:
    --------
    X : pd.DataFrame
        Validated feature matrix strictly available at t_0.
    y : pd.Series
        Target waiting time in minutes.
    """
    data = df.copy()

    # Ensure arrival_time is datetime
    if not pd.api.types.is_datetime64_any_dtype(data['arrival_time']):
        data['arrival_time'] = pd.to_datetime(data['arrival_time'])

    # Direct prediction-time features
    data['hour'] = data['arrival_time'].dt.hour
    data['minute'] = data['arrival_time'].dt.minute
    data['day_of_week'] = data['arrival_time'].dt.dayofweek

    # Minutes since daily opening (09:00:00)
    # Opening hour = 9. Shift length = 8 hours (480 minutes)
    opening_minute = (data['hour'] - 9) * 60 + data['minute'] + (data['arrival_time'].dt.second / 60.0)
    data['minutes_since_opening'] = opening_minute.clip(lower=0.0, upper=480.0)

    # Cyclical time encodings over the 480-minute operational window
    theta = 2.0 * np.pi * data['minutes_since_opening'] / 480.0
    data['sin_time'] = np.sin(theta)
    data['cos_time'] = np.cos(theta)

    if feature_set == 'extended':
        data['date'] = data['arrival_time'].dt.date

        # Lag 1 queue length within same day
        data['lag1_queue_length'] = data.groupby('date')['queue_length'].shift(1).fillna(data['queue_length'])

        # Causal arrival counts in past 15m and 30m prior to current arrival
        arr_times = data['arrival_time'].values
        fifteen_min = np.timedelta64(15, 'm')
        thirty_min = np.timedelta64(30, 'm')

        idx_15 = np.searchsorted(arr_times, arr_times - fifteen_min, side='left')
        idx_30 = np.searchsorted(arr_times, arr_times - thirty_min, side='left')

        day_start_idx = data.groupby('date').cumcount().values
        data['arrivals_last_15m'] = np.minimum(np.arange(len(data)) - idx_15, day_start_idx).astype(float)
        data['arrivals_last_30m'] = np.minimum(np.arange(len(data)) - idx_30, day_start_idx).astype(float)

        selected_cols = EXTENDED_FEATURE_NAMES
    else:
        selected_cols = CORE_FEATURE_NAMES

    X = data[selected_cols].copy()
    validate_feature_matrix(X)

    if target_col in data.columns:
        y = data[target_col].astype(float)
    else:
        y = pd.Series(np.nan, index=data.index)

    return X, y


def build_single_inference_vector(
    queue_length: int,
    arrival_time_str: str,
    feature_set: str = 'extended',
    historical_priors: Optional[Dict[str, float]] = None
) -> pd.DataFrame:
    """
    Constructs a 1-row feature DataFrame for real-time inference at prediction moment.
    """
    arr_dt = pd.to_datetime(arrival_time_str)
    hour = arr_dt.hour
    minute = arr_dt.minute
    day_of_week = arr_dt.dayofweek

    minutes_since_opening = max(0.0, min(480.0, (hour - 9) * 60 + minute + arr_dt.second / 60.0))
    theta = 2.0 * np.pi * minutes_since_opening / 480.0
    sin_time = float(np.sin(theta))
    cos_time = float(np.cos(theta))

    row = {
        'queue_length': float(queue_length),
        'minutes_since_opening': float(minutes_since_opening),
        'hour': float(hour),
        'minute': float(minute),
        'day_of_week': float(day_of_week),
        'sin_time': sin_time,
        'cos_time': cos_time,
    }

    if feature_set == 'extended':
        priors = historical_priors or {}
        # Default causal lag fallbacks if operational queue stream is unavailable
        row['lag1_queue_length'] = float(priors.get('lag1_queue_length', queue_length))
        row['arrivals_last_15m'] = float(priors.get('arrivals_last_15m', 27.5))
        row['arrivals_last_30m'] = float(priors.get('arrivals_last_30m', 55.0))
        cols = EXTENDED_FEATURE_NAMES
    else:
        cols = CORE_FEATURE_NAMES

    df_row = pd.DataFrame([row])[cols]
    validate_feature_matrix(df_row)
    return df_row
