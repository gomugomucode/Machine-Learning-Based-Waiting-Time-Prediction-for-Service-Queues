"""
Baseline Models for Waiting-Time Prediction.

Defines simple, defensible benchmark models evaluated prior to any complex ML.
All baselines fit strictly on the training set.
"""
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Computes standardized regression evaluation metrics."""
    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_true, y_pred))
    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
    }


class GlobalMeanBaseline:
    """
    Baseline 1: Predicts the global training mean waiting time for all instances.
    """
    def __init__(self):
        self.mean_wait_time: Optional[float] = None

    def fit(self, X: pd.DataFrame, y: pd.Series) -> 'GlobalMeanBaseline':
        self.mean_wait_time = float(y.mean())
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if self.mean_wait_time is None:
            raise RuntimeError("Baseline has not been fitted.")
        return np.full(len(X), self.mean_wait_time)


class QueueAwareProportionalBaseline:
    """
    Baseline 2a: Predicts waiting time as queue_length * empirical_service_rate.
    Derived from Little's Law / single-queue clearing dynamics:
    estimated_rate = sum(y_train) / sum(queue_length_train).
    When queue_length = 0, predicted wait = 0.
    """
    def __init__(self):
        self.rate: Optional[float] = None

    def fit(self, X: pd.DataFrame, y: pd.Series) -> 'QueueAwareProportionalBaseline':
        q_sum = float(X['queue_length'].sum())
        if q_sum > 0:
            self.rate = float(y.sum() / q_sum)
        else:
            self.rate = float(y.mean())
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if self.rate is None:
            raise RuntimeError("Baseline has not been fitted.")
        q = X['queue_length'].values
        return q * self.rate


class HourlyHistoricalMeanBaseline:
    """
    Baseline 3: Predicts the historical average waiting time for the customer's arrival hour.
    """
    def __init__(self):
        self.hourly_means: Dict[int, float] = {}
        self.global_mean: Optional[float] = None

    def fit(self, X: pd.DataFrame, y: pd.Series) -> 'HourlyHistoricalMeanBaseline':
        self.global_mean = float(y.mean())
        df = pd.DataFrame({'hour': X['hour'], 'target': y})
        grouped = df.groupby('hour')['target'].mean().to_dict()
        self.hourly_means = {int(k): float(v) for k, v in grouped.items()}
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if self.global_mean is None:
            raise RuntimeError("Baseline has not been fitted.")
        hours = X['hour'].values
        return np.array([self.hourly_means.get(int(h), self.global_mean) for h in hours])
