"""
Unit and Integration Tests for Phase 3 Prediction API & Service.

Verifies:
1. Successful prediction (HTTP 200, numeric, non-negative, proper keys).
2. Missing required field 'queue_length' returns HTTP 400.
3. Negative queue length returns HTTP 400.
4. Invalid timestamp returns HTTP 400.
5. Model artifact loading from 'backend/ml/artifacts/best_waiting_time_model.joblib'.
6. Exact 10-feature schema & ordering preservation.
7. Absence of leakage: ensuring prohibited post-t_0 columns cannot contaminate features.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from pathlib import Path
import pandas as pd
import numpy as np

from apps.predictions.services import PredictionService
from ml.features import (
    build_single_inference_vector,
    validate_feature_matrix,
    EXTENDED_FEATURE_NAMES,
    PROHIBITED_LEAKAGE_COLUMNS,
)


class PredictionApiAndServiceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.service = PredictionService.get_instance()

    def test_01_successful_prediction_minimal(self):
        """Test 1: Send valid input and verify HTTP 200, prediction exists, is numeric and non-negative."""
        payload = {
            "queue_length": 25,
            "arrival_time": "2026-10-19T10:30:00"
        }
        response = self.client.post('/api/predictions/predict/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIn("predicted_wait_minutes", data)
        self.assertIn("predicted_wait_seconds", data)
        self.assertIn("model", data)
        self.assertIn("model_version", data)

        wait_min = data["predicted_wait_minutes"]
        self.assertIsInstance(wait_min, (int, float))
        self.assertGreaterEqual(wait_min, 0.0)

        wait_sec = data["predicted_wait_seconds"]
        self.assertIsInstance(wait_sec, int)
        self.assertGreaterEqual(wait_sec, 0)

        self.assertEqual(data["model"], "Random Forest Regressor")
        self.assertEqual(data["model_version"], "phase2-best-model")

    def test_01b_successful_prediction_full_payload(self):
        """Test 1b: Send complete realistic payload with lag and arrival rates."""
        payload = {
            "queue_length": 25,
            "lag1_queue_length": 23,
            "arrivals_last_15m": 8,
            "arrivals_last_30m": 17,
            "arrival_time": "2026-10-19T10:30:00",
            "active_counters": 4
        }
        response = self.client.post('/api/predictions/predict/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertGreater(data["predicted_wait_minutes"], 0.0)
        self.assertEqual(data["features_evaluated"]["lag1_queue_length"], 23.0)
        self.assertEqual(data["features_evaluated"]["arrivals_last_15m"], 8.0)
        self.assertEqual(data["features_evaluated"]["arrivals_last_30m"], 17.0)

    def test_02_missing_required_field_queue_length(self):
        """Test 2: Missing required field 'queue_length' returns HTTP 400."""
        payload = {
            "arrival_time": "2026-10-19T10:30:00"
        }
        response = self.client.post('/api/predictions/predict/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("error", data)
        self.assertIn("queue_length is a required field", data["error"])

    def test_03_negative_queue_length(self):
        """Test 3: Negative queue length returns HTTP 400."""
        payload = {
            "queue_length": -5,
            "arrival_time": "2026-10-19T10:30:00"
        }
        response = self.client.post('/api/predictions/predict/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("error", data)
        self.assertIn("non-negative", data["error"].lower())

    def test_03b_negative_arrival_counts(self):
        """Test 3b: Negative arrival counts return HTTP 400."""
        payload = {
            "queue_length": 10,
            "arrivals_last_15m": -2,
            "arrival_time": "2026-10-19T10:30:00"
        }
        response = self.client.post('/api/predictions/predict/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_04_invalid_timestamp(self):
        """Test 4: Invalid timestamp string returns HTTP 400."""
        payload = {
            "queue_length": 10,
            "arrival_time": "invalid-datetime-string-xyz"
        }
        response = self.client.post('/api/predictions/predict/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("error", data)
        self.assertIn("invalid arrival_time", data["error"].lower())

    def test_05_model_artifact_loading(self):
        """Test 5: Verify the service loads 'best_waiting_time_model.joblib' from artifacts."""
        self.assertTrue(self.service.is_available(), "PredictionService model failed to load into memory.")
        status_info = self.service.get_status()
        self.assertEqual(status_info["status"], "online")
        self.assertTrue(status_info["model_connected"])
        self.assertEqual(status_info["model"], "Random Forest Regressor")

    def test_06_feature_schema_and_ordering(self):
        """Test 6: Verify the exact 10 features are passed to the model in the expected order."""
        vec = build_single_inference_vector(
            queue_length=25,
            arrival_time_str="2026-10-19T10:30:00",
            lag1_queue_length=23,
            arrivals_last_15m=8.0,
            arrivals_last_30m=17.0,
            feature_set='extended'
        )

        expected_order = [
            'queue_length',
            'minutes_since_opening',
            'hour',
            'minute',
            'day_of_week',
            'sin_time',
            'cos_time',
            'lag1_queue_length',
            'arrivals_last_15m',
            'arrivals_last_30m',
        ]

        self.assertEqual(list(vec.columns), expected_order)
        self.assertEqual(list(vec.columns), EXTENDED_FEATURE_NAMES)
        self.assertEqual(vec.shape, (1, 10))

    def test_07_no_leakage_prohibited_columns(self):
        """Test 7: Ensure feature matrix validator rejects prohibited post-arrival attributes."""
        vec = build_single_inference_vector(
            queue_length=15,
            arrival_time_str="2026-10-19T10:30:00",
            feature_set='extended'
        )

        for col in PROHIBITED_LEAKAGE_COLUMNS:
            self.assertNotIn(col, vec.columns)

        # Attempting to inject a post-t_0 leakage column must raise ValueError
        bad_df = vec.copy()
        bad_df['wait_time'] = 12.5
        with self.assertRaises(ValueError) as cm:
            validate_feature_matrix(bad_df)
        self.assertIn("DATA LEAKAGE DETECTED", str(cm.exception))

        bad_df2 = vec.copy()
        bad_df2['start_time'] = "2026-10-19 10:45:00"
        with self.assertRaises(ValueError):
            validate_feature_matrix(bad_df2)

        bad_df3 = vec.copy()
        bad_df3['finish_time'] = "2026-10-19 10:50:00"
        with self.assertRaises(ValueError):
            validate_feature_matrix(bad_df3)
