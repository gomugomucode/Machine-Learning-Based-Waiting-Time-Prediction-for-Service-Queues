"""
Prediction Service Foundation.
This module defines the architectural contract for future ML model loading,
feature preprocessing, and inference. In accordance with project requirements,
no fake prediction values or placeholder heuristics are executed here.
"""
from typing import Dict, Any, Optional


class PredictionService:
    _instance: Optional['PredictionService'] = None
    _model_loaded: bool = False
    _model_version: str = "0.0.0-uninitialized"

    @classmethod
    def get_instance(cls) -> 'PredictionService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def is_available(self) -> bool:
        """Indicates whether a trained machine learning model is loaded in memory."""
        return self._model_loaded

    def get_status(self) -> Dict[str, Any]:
        """Returns the current state of the prediction engine."""
        return {
            "status": "offline",
            "model_connected": False,
            "version": self._model_version,
            "message": "Prediction module initialized — ML model is not yet connected. "
                       "Model training and baseline evaluation are scheduled for Phase 2."
        }

    def predict(self, queue_length: int, hour_of_day: int, **kwargs) -> Dict[str, Any]:
        """
        Placeholder inference method. Explicitly refuses to produce ungrounded/fake predictions.
        """
        raise NotImplementedError(
            "Prediction model is not yet connected. No fake predictions are permitted."
        )
