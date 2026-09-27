"""
Prediction Service.
Loads the serialized machine learning pipeline trained in Phase 2 on verified
queue observations and delivers real-time waiting-time inference.
"""
import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from django.conf import settings
import joblib


class PredictionService:
    _instance: Optional['PredictionService'] = None

    def __init__(self):
        self._model = None
        self._metrics: Dict[str, Any] = {}
        self._load_model()

    @classmethod
    def get_instance(cls) -> 'PredictionService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_model(self) -> None:
        models_dir = os.path.join(settings.BASE_DIR, 'apps', 'predictions', 'models')
        model_path = os.path.join(models_dir, 'best_waiting_time_model.joblib')
        metrics_path = os.path.join(models_dir, 'model_metrics.json')

        if os.path.exists(model_path) and os.path.exists(metrics_path):
            try:
                self._model = joblib.load(model_path)
                with open(metrics_path, 'r', encoding='utf-8') as f:
                    self._metrics = json.load(f)
            except Exception as e:
                self._model = None
                self._metrics = {"error": str(e)}

    def is_available(self) -> bool:
        """Indicates whether a trained machine learning model is loaded in memory."""
        return self._model is not None

    def get_status(self) -> Dict[str, Any]:
        """Returns the current state of the prediction engine."""
        if not self.is_available():
            return {
                "status": "offline",
                "model_connected": False,
                "version": "0.0.0-uninitialized",
                "message": "Prediction model not loaded. Run 'python manage.py train_prediction_model' to train."
            }

        return {
            "status": "online",
            "model_connected": True,
            "version": self._metrics.get("version", "1.0.0"),
            "model_name": self._metrics.get("best_model_name", "Ridge Regression"),
            "trained_at": self._metrics.get("trained_at"),
            "training_samples": self._metrics.get("training_samples"),
            "test_samples": self._metrics.get("test_samples"),
            "metrics": self._metrics.get("optimal_metrics", {}),
            "all_benchmarks": self._metrics.get("all_model_benchmarks", []),
            "message": "Trained machine learning pipeline is loaded and ready for real-time inference."
        }

    def predict(
        self,
        queue_length: int,
        hour: int = 12,
        minute: int = 0,
        day_of_week: int = 1,
        active_counters: int = 4,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executes waiting time prediction using the optimal scikit-learn model,
        scaled by active counter staffing capacity (multi-server queue physics).
        """
        if not self.is_available():
            raise RuntimeError("Prediction model is not loaded.")

        minute_of_day = hour * 60 + minute
        minutes_since_0900 = max(0, minute_of_day - (9 * 60))
        hour_sin = np.sin(2 * np.pi * hour / 24.0)
        hour_cos = np.cos(2 * np.pi * hour / 24.0)

        # Build feature DataFrame matching trained pipeline columns
        feature_cols = [
            'queue_length',
            'hour',
            'minute_of_day',
            'minutes_since_0900',
            'day_of_week',
            'hour_sin',
            'hour_cos',
        ]
        input_data = pd.DataFrame([{
            'queue_length': int(queue_length),
            'hour': int(hour),
            'minute_of_day': int(minute_of_day),
            'minutes_since_0900': int(minutes_since_0900),
            'day_of_week': int(day_of_week),
            'hour_sin': float(hour_sin),
            'hour_cos': float(hour_cos),
        }])[feature_cols]

        raw_prediction = float(self._model.predict(input_data)[0])
        base_predicted_wait = max(0.0, raw_prediction)

        # Multi-server capacity scaling:
        # The Kaggle empirical bank dataset operated with an average baseline of 4 counters.
        # Staffing changes scale queue clearance duration proportionally.
        counters = max(1, min(20, int(active_counters)))
        baseline_counters = 4
        capacity_factor = baseline_counters / counters

        # Service category complexity scaling:
        # Different banking service categories have varying mean transaction times:
        # - Cash Transactions (0.85x): Fast teller operations
        # - Account Services (1.00x): Standard baseline duration
        # - Customer Support (1.25x): Moderate investigation/dispute
        # - Loan Operations (1.70x): Heavy documentation/interviews
        # - General Inquiries (0.65x): Quick routing/questions
        service_type_id = kwargs.get('service_type_id')
        service_name = "General Queue Service"
        service_factor = 1.0

        if service_type_id:
            try:
                from django.apps import apps
                ServiceType = apps.get_model('queue_management', 'ServiceType')
                st = ServiceType.objects.filter(id=service_type_id).first()
                if st:
                    service_name = st.name
                    profile_key = st.name.lower().strip()
                    profiles = {
                        'cash transactions': 0.85,
                        'account services': 1.00,
                        'customer support': 1.25,
                        'loan operations': 1.70,
                        'general inquiries': 0.65,
                    }
                    service_factor = profiles.get(profile_key, 1.0)
            except Exception:
                pass

        total_multiplier = capacity_factor * service_factor

        if queue_length == 0:
            predicted_wait = 0.0
        else:
            predicted_wait = max(0.5, base_predicted_wait * total_multiplier)

        # Categorize operational congestion level
        if predicted_wait < 20.0:
            congestion_level = "Low Delay"
            congestion_color = "emerald"
        elif predicted_wait < 60.0:
            congestion_level = "Moderate Wait"
            congestion_color = "blue"
        elif predicted_wait < 120.0:
            congestion_level = "Substantial Congestion"
            congestion_color = "amber"
        else:
            congestion_level = "Severe Congestion"
            congestion_color = "rose"

        mae = self._metrics.get("optimal_metrics", {}).get("test_mae_minutes", 15.16)
        scaled_mae = mae * total_multiplier
        lower_bound = max(0.0, predicted_wait - scaled_mae)
        upper_bound = predicted_wait + scaled_mae

        return {
            "status": "success",
            "model_name": self._metrics.get("best_model_name", "Ridge Regression"),
            "predicted_wait_minutes": round(predicted_wait, 1),
            "confidence_interval": {
                "lower_minutes": round(lower_bound, 1),
                "upper_minutes": round(upper_bound, 1),
                "mae_tolerance": round(scaled_mae, 1),
            },
            "congestion": {
                "level": congestion_level,
                "badge_color": congestion_color,
            },
            "features_evaluated": {
                "queue_length": queue_length,
                "active_counters": counters,
                "service_type_name": service_name,
                "service_complexity_multiplier": round(service_factor, 2),
                "arrival_time": f"{hour:02d}:{minute:02d}",
                "minutes_since_0900": minutes_since_0900,
                "capacity_multiplier": round(capacity_factor, 2),
            }
        }
