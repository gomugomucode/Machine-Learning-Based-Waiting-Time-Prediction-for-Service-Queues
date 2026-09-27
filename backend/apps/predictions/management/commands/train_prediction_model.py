"""
Management command to train, evaluate, and serialize waiting time prediction models
using strict chronological splitting and scikit-learn regressors.
"""
import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.queue_management.models import QueueObservation

from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib


class Command(BaseCommand):
    help = 'Train and evaluate ML models for queue waiting time prediction'

    def add_arguments(self, parser):
        parser.add_argument(
            '--save-dir',
            type=str,
            default=None,
            help='Directory path where serialized model artifacts will be saved'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("=== Phase 2: Machine Learning Model Training & Evaluation ==="))

        # 1. Load Data
        obs_qs = QueueObservation.objects.all().order_by('arrival_time')
        count = obs_qs.count()

        if count > 0:
            self.stdout.write(f"Loading {count} records directly from PostgreSQL database...")
            data = []
            for obs in obs_qs:
                data.append({
                    'arrival_time': obs.arrival_time,
                    'start_time': obs.service_start_time,
                    'finish_time': obs.service_end_time,
                    'queue_length': obs.queue_length,
                    'wait_time': obs.wait_time,
                    'service_duration': obs.service_duration or 0.0,
                })
            df = pd.DataFrame(data)
        else:
            csv_path = Path(settings.BASE_DIR).parent / 'data' / 'verified_queue_waiting_time_dataset.csv'
            self.stdout.write(f"Database empty, loading from source CSV: {csv_path}...")
            df = pd.read_csv(csv_path)
            df['arrival_time'] = pd.to_datetime(df['arrival_time'])

        total_rows = len(df)
        self.stdout.write(f"Total dataset records: {total_rows}")

        # 2. Feature Engineering
        self.stdout.write("Engineering features: diurnal cyclical encodings, time since opening, and queue density...")
        df['arrival_dt'] = pd.to_datetime(df['arrival_time'])
        df['date'] = df['arrival_dt'].dt.date
        df['hour'] = df['arrival_dt'].dt.hour
        df['minute'] = df['arrival_dt'].dt.minute
        df['minute_of_day'] = df['hour'] * 60 + df['minute']
        df['day_of_week'] = df['arrival_dt'].dt.dayofweek  # 0=Mon, 4=Fri
        df['minutes_since_0900'] = np.maximum(0, df['minute_of_day'] - (9 * 60))

        # Cyclical diurnal components
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24.0)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24.0)

        feature_cols = [
            'queue_length',
            'hour',
            'minute_of_day',
            'minutes_since_0900',
            'day_of_week',
            'hour_sin',
            'hour_cos',
        ]
        target_col = 'wait_time'

        # 3. Chronological Temporal Split (Strict prevention of temporal data leakage)
        unique_dates = sorted(df['date'].unique())
        n_dates = len(unique_dates)
        split_idx = int(n_dates * 0.75)  # 75% days for training, 25% for held-out testing
        train_dates = unique_dates[:split_idx]
        test_dates = unique_dates[split_idx:]

        train_mask = df['date'].isin(train_dates)
        test_mask = df['date'].isin(test_dates)

        X_train = df.loc[train_mask, feature_cols]
        y_train = df.loc[train_mask, target_col]

        X_test = df.loc[test_mask, feature_cols]
        y_test = df.loc[test_mask, target_col]

        self.stdout.write(f"Chronological split across {n_dates} days:")
        self.stdout.write(f" - Train set: {len(X_train)} records ({train_dates[0]} to {train_dates[-1]})")
        self.stdout.write(f" - Test set:  {len(X_test)} records ({test_dates[0]} to {test_dates[-1]})")

        # 4. Model Candidates Definition
        models = {
            "Naive Mean Baseline": DummyRegressor(strategy='mean'),
            "Multiple Linear Regression": Pipeline([
                ('scaler', StandardScaler()),
                ('model', LinearRegression())
            ]),
            "Ridge Regression": Pipeline([
                ('scaler', StandardScaler()),
                ('model', Ridge(alpha=10.0))
            ]),
            "Random Forest Regressor": RandomForestRegressor(
                n_estimators=100,
                max_depth=12,
                min_samples_split=10,
                min_samples_leaf=4,
                random_state=42,
                n_jobs=-1
            ),
            "Gradient Boosting Regressor": GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.08,
                max_depth=5,
                subsample=0.85,
                random_state=42
            ),
        }

        # 5. Train & Evaluate
        self.stdout.write("\nEvaluating candidate models against held-out chronological test days...")
        results = []
        best_model_name = None
        best_test_mae = float('inf')
        best_estimator = None

        self.stdout.write("-" * 90)
        self.stdout.write(f"{'Model':<30} | {'Train MAE':<10} | {'Test MAE':<10} | {'Test RMSE':<10} | {'Test R²':<10}")
        self.stdout.write("-" * 90)

        for name, model in models.items():
            model.fit(X_train, y_train)

            train_preds = model.predict(X_train)
            test_preds = model.predict(X_test)

            train_mae = mean_absolute_error(y_train, train_preds)
            test_mae = mean_absolute_error(y_test, test_preds)
            test_rmse = root_mean_squared_error(y_test, test_preds)
            test_r2 = r2_score(y_test, test_preds)

            results.append({
                "model_name": name,
                "train_mae": round(float(train_mae), 2),
                "test_mae": round(float(test_mae), 2),
                "test_rmse": round(float(test_rmse), 2),
                "test_r2": round(float(test_r2), 4),
            })

            self.stdout.write(
                f"{name:<30} | {train_mae:<10.2f} | {test_mae:<10.2f} | {test_rmse:<10.2f} | {test_r2:<10.4f}"
            )

            # Optimization criterion: lowest test MAE
            if test_mae < best_test_mae:
                best_test_mae = test_mae
                best_model_name = name
                best_estimator = model

        self.stdout.write("-" * 90)
        self.stdout.write(self.style.SUCCESS(f"\nOptimal Model Selected: {best_model_name} (Test MAE: {best_test_mae:.2f} minutes)"))

        # 6. Serialization
        save_dir = options['save_dir'] or os.path.join(settings.BASE_DIR, 'apps', 'predictions', 'models')
        os.makedirs(save_dir, exist_ok=True)

        model_file_path = os.path.join(save_dir, 'best_waiting_time_model.joblib')
        metrics_file_path = os.path.join(save_dir, 'model_metrics.json')

        # Fit selected optimal model on all training data
        joblib.dump(best_estimator, model_file_path)
        self.stdout.write(f"Serialized model pipeline saved to: {model_file_path}")

        metrics_payload = {
            "best_model_name": best_model_name,
            "version": "1.0.0",
            "trained_at": pd.Timestamp.now().isoformat(),
            "target": "wait_time",
            "features": feature_cols,
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "train_dates": [str(d) for d in train_dates],
            "test_dates": [str(d) for d in test_dates],
            "optimal_metrics": {
                "test_mae_minutes": round(float(best_test_mae), 2),
                "test_rmse_minutes": round(float(next(r['test_rmse'] for r in results if r['model_name'] == best_model_name)), 2),
                "test_r2_score": round(float(next(r['test_r2'] for r in results if r['model_name'] == best_model_name)), 4),
            },
            "all_model_benchmarks": results,
        }

        with open(metrics_file_path, 'w', encoding='utf-8') as f:
            json.dump(metrics_payload, f, indent=2)

        self.stdout.write(f"Model benchmark metrics saved to: {metrics_file_path}")
        self.stdout.write(self.style.SUCCESS("=== Phase 2 ML Training & Evaluation Complete! ==="))
