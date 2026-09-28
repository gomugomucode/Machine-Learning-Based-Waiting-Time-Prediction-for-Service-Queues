"""
Smoke Test for Phase 3 Model Inference.
Executes an end-to-end prediction against the trained Random Forest artifact.
"""
import sys
import json
from pathlib import Path

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.predictions.services import PredictionService
from ml.features import build_single_inference_vector


def run_smoke_test():
    print("=" * 65)
    print("PHASE 3 INFERENCE SMOKE TEST")
    print("=" * 65)

    # 1. Define Realistic Input
    queue_length = 25
    lag1_queue_length = 23
    arrivals_last_15m = 8
    arrivals_last_30m = 17
    arrival_time = "2026-10-19 10:30:00"

    print("\n[Input Parameters]")
    print(f"  Queue length:              {queue_length}")
    print(f"  Previous queue (lag-1):    {lag1_queue_length}")
    print(f"  Arrivals in last 15 min:   {arrivals_last_15m}")
    print(f"  Arrivals in last 30 min:   {arrivals_last_30m}")
    print(f"  Arrival timestamp:         {arrival_time}")

    # 2. Prepare Features via Causal Pipeline
    feature_df = build_single_inference_vector(
        queue_length=queue_length,
        arrival_time_str=arrival_time,
        lag1_queue_length=lag1_queue_length,
        arrivals_last_15m=arrivals_last_15m,
        arrivals_last_30m=arrivals_last_30m,
        feature_set='extended'
    )

    print("\n[Prepared Feature Vector (10 Exact Features)]")
    features_dict = feature_df.to_dict(orient='records')[0]
    for idx, (k, v) in enumerate(features_dict.items(), 1):
        print(f"  {idx:2d}. {k:<25} = {v}")

    # 3. Execute Prediction via PredictionService
    service = PredictionService.get_instance()
    response = service.predict(
        queue_length=queue_length,
        arrival_time=arrival_time,
        lag1_queue_length=lag1_queue_length,
        arrivals_last_15m=arrivals_last_15m,
        arrivals_last_30m=arrivals_last_30m,
        active_counters=4
    )

    print("\n[Inference Prediction Output]")
    print(f"  Predicted wait time:       {response['predicted_wait_minutes']:.2f} minutes ({response['predicted_wait_seconds']} seconds)")
    print(f"  Model name:                {response['model_name']}")
    print(f"  Model version:             {response['model_version']}")
    print(f"  Operational congestion:    {response['congestion']['level']}")
    print(f"  Expected tolerance (±MAE): {response['confidence_interval']['lower_minutes']:.2f} to {response['confidence_interval']['upper_minutes']:.2f} min (±{response['confidence_interval']['mae_tolerance']:.2f} min)")

    print("\n[Full JSON Response Payload]")
    print(json.dumps(response, indent=2))
    print("\n" + "=" * 65)
    print("SMOKE TEST COMPLETED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    run_smoke_test()
