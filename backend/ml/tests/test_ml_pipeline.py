"""
Unit and Integration Tests for Phase 2 Machine Learning Pipeline.

Tests:
1. Target calculation & timestamp logical ordering (t_arrival <= t_start <= t_finish).
2. Prediction-time feature generation & strictly causal shapes.
3. Strict absence of target leakage in feature matrices.
4. Temporal chronological splitting preserving intact days and no future data leakage.
5. Baseline model fitting, predict shapes, and non-negative outputs.
6. Candidate ML model training, serialization, and prediction validity.
"""
import pytest
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

from ml.data_loader import load_clean_dataset
from ml.features import (
    extract_features,
    build_single_inference_vector,
    validate_feature_matrix,
    PROHIBITED_LEAKAGE_COLUMNS,
    CORE_FEATURE_NAMES,
    EXTENDED_FEATURE_NAMES,
)
from ml.split import get_temporal_split
from ml.baselines import (
    GlobalMeanBaseline,
    QueueAwareProportionalBaseline,
    HourlyHistoricalMeanBaseline,
    calculate_metrics
)
from ml.train import get_candidate_models
import joblib


@pytest.fixture(scope="module")
def clean_data():
    """Loads clean verified dataset fixture."""
    return load_clean_dataset()


class TestTargetAndTimestamps:
    """Verifies target calculation and chronological ordering."""

    def test_target_matches_wait_time(self, clean_data):
        df = clean_data
        calculated_wait = (df['start_time'] - df['arrival_time']).dt.total_seconds() / 60.0
        diff = (calculated_wait - df['wait_time']).abs()
        # Differences must be strictly within 2-decimal rounding tolerance (~0.02 minutes)
        assert diff.max() <= 0.0201
        assert diff.mean() < 0.01

    def test_timestamp_chronological_ordering(self, clean_data):
        df = clean_data
        assert (df['arrival_time'] <= df['start_time']).all(), "Found arrival after start time"
        assert (df['start_time'] <= df['finish_time']).all(), "Found start after finish time"

    def test_no_negative_values(self, clean_data):
        df = clean_data
        assert (df['wait_time'] >= 0.0).all()
        assert (df['service_duration_minutes'] >= 0.0).all()
        assert (df['queue_length'] >= 0).all()


class TestFeatureEngineeringAndLeakage:
    """Verifies feature extraction adheres strictly to prediction-time boundaries."""

    def test_feature_matrix_shapes(self, clean_data):
        df = clean_data
        X_core, y = extract_features(df, feature_set='core')
        assert list(X_core.columns) == CORE_FEATURE_NAMES
        assert len(X_core) == len(df)
        assert len(y) == len(df)

        X_ext, y_ext = extract_features(df, feature_set='extended')
        assert list(X_ext.columns) == EXTENDED_FEATURE_NAMES
        assert len(X_ext) == len(df)

    def test_leakage_detector_rejects_forbidden_columns(self):
        df_bad = pd.DataFrame({
            'queue_length': [10],
            'wait_time': [15.0]  # Leakage!
        })
        with pytest.raises(ValueError, match="DATA LEAKAGE DETECTED"):
            validate_feature_matrix(df_bad)

        df_bad2 = pd.DataFrame({
            'queue_length': [10],
            'finish_time': [datetime.now()]  # Leakage!
        })
        with pytest.raises(ValueError, match="DATA LEAKAGE DETECTED"):
            validate_feature_matrix(df_bad2)

    def test_feature_matrix_has_no_leakage_columns(self, clean_data):
        X, _ = extract_features(clean_data, feature_set='extended')
        for col in PROHIBITED_LEAKAGE_COLUMNS:
            assert col not in X.columns, f"Prohibited column {col} found in feature matrix!"

    def test_single_inference_vector(self):
        vec = build_single_inference_vector(
            queue_length=25,
            arrival_time_str="2026-10-05 11:30:00",
            feature_set='extended'
        )
        assert vec.shape == (1, 10)
        assert vec.iloc[0]['queue_length'] == 25.0
        assert vec.iloc[0]['hour'] == 11.0
        assert vec.iloc[0]['minute'] == 30.0
        assert vec.iloc[0]['minutes_since_opening'] == 150.0


class TestTemporalSplit:
    """Verifies chronological train/test split preserves time order."""

    def test_chronological_split(self, clean_data):
        train_df, test_df, meta = get_temporal_split(clean_data, train_ratio=0.71)
        assert len(train_df) + len(test_df) == len(clean_data)
        assert meta['num_train_days'] == 10
        assert meta['num_test_days'] == 4
        # Assert strictly disjoint date sets
        assert set(meta['train_dates']).isdisjoint(set(meta['test_dates']))
        # Assert all test dates are strictly after all train dates
        max_train_date = max(meta['train_dates'])
        min_test_date = min(meta['test_dates'])
        assert max_train_date < min_test_date


class TestBaselinesAndModels:
    """Verifies baseline and ML model predictions."""

    def test_baselines(self, clean_data):
        train_df, test_df, _ = get_temporal_split(clean_data, train_ratio=0.71)
        X_train, y_train = extract_features(train_df, feature_set='extended')
        X_test, y_test = extract_features(test_df, feature_set='extended')

        # Global Mean Baseline
        b_mean = GlobalMeanBaseline().fit(X_train, y_train)
        p_mean = b_mean.predict(X_test)
        assert len(p_mean) == len(X_test)
        assert np.isclose(p_mean[0], y_train.mean())

        # Queue-Aware Proportional Baseline
        b_queue = QueueAwareProportionalBaseline().fit(X_train, y_train)
        p_queue = b_queue.predict(X_test)
        assert len(p_queue) == len(X_test)
        assert (p_queue >= 0).all()

        # Hourly Historical Mean Baseline
        b_hour = HourlyHistoricalMeanBaseline().fit(X_train, y_train)
        p_hour = b_hour.predict(X_test)
        assert len(p_hour) == len(X_test)
        assert (p_hour >= 0).all()

    def test_candidate_models_fit_and_predict(self, clean_data):
        # Test on small sample for speed
        sample_df = clean_data.iloc[:500]
        X, y = extract_features(sample_df, feature_set='extended')

        models = get_candidate_models(random_state=42)
        for name, model in models.items():
            model.fit(X, y)
            preds = model.predict(X)
            assert len(preds) == len(X)
            assert not np.isnan(preds).any()
            metrics = calculate_metrics(y.values, preds)
            assert metrics['mae'] >= 0.0
            assert metrics['r2'] <= 1.0

    def test_saved_model_artifact_loads_and_infers(self):
        artifact_path = Path(__file__).resolve().parent.parent / "artifacts" / "best_waiting_time_model.joblib"
        assert artifact_path.exists(), "Model artifact not found"
        loaded_model = joblib.load(artifact_path)
        vec = build_single_inference_vector(
            queue_length=30,
            arrival_time_str="2026-10-05 12:00:00",
            feature_set='extended'
        )
        pred = loaded_model.predict(vec)
        assert len(pred) == 1
        assert pred[0] > 0.0
