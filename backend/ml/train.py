"""
Model Training Pipeline for Queue Waiting-Time Prediction.

Trains Candidate Models:
1. Linear Regression (with StandardScaler)
2. Random Forest Regressor
3. Gradient Boosting Regressor

Strict reproducibility: fixed random seeds, training strictly on train set.
"""
from typing import Dict, Any, Tuple
import joblib
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor


def get_candidate_models(random_state: int = 42) -> Dict[str, Any]:
    """
    Returns the dictionary of initialized candidate ML models.
    """
    models = {
        "Linear Regression": Pipeline([
            ('scaler', StandardScaler()),
            ('regressor', LinearRegression())
        ]),
        "Random Forest": RandomForestRegressor(
            n_estimators=100,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=random_state
        ),
    }
    return models


def train_models(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Fits all candidate models on training features and returns fitted models.
    """
    models = get_candidate_models(random_state=random_state)
    fitted_models = {}

    for name, model in models.items():
        print(f"Training {name} on {len(X_train)} samples...")
        model.fit(X_train, y_train)
        fitted_models[name] = model

    return fitted_models


def save_model_artifact(
    model: Any,
    model_name: str,
    output_dir: Path
) -> Path:
    """
    Serializes trained model to joblib artifact.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{model_name.lower().replace(' ', '_')}.joblib"
    dest = output_dir / filename
    joblib.dump(model, dest)
    print(f"Model saved to {dest}")
    return dest
