"""
API Views for Waiting-Time Prediction.
Exposes status and real-time inference endpoints.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import pandas as pd
from .services import PredictionService


class PredictionStatusView(APIView):
    """
    Returns the current status, architecture, and validation metrics of the prediction engine.
    """
    def get(self, request):
        service = PredictionService.get_instance()
        return Response(service.get_status(), status=status.HTTP_200_OK)


class PredictWaitingTimeView(APIView):
    """
    Real-time waiting-time prediction endpoint.
    Accepts operational queue observations available at prediction moment t_0,
    validates inputs, and returns predicted wait times from the trained Random Forest model.
    """
    def post(self, request):
        service = PredictionService.get_instance()
        if not service.is_available():
            return Response({
                "status": "unavailable",
                "error": "Prediction model not loaded",
                "detail": "The machine learning model artifact is not loaded in memory. "
                          "Run 'python backend/ml/run_experiments.py' to generate it."
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        data = request.data or {}

        # 1. Validate required queue_length
        if 'queue_length' not in data:
            return Response(
                {"error": "queue_length is a required field."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            queue_length = int(data['queue_length'])
            if queue_length < 0:
                return Response(
                    {"error": "queue_length must be a non-negative integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if queue_length > 10000:
                return Response(
                    {"error": "queue_length exceeds plausible operational limits (>10000)."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid queue_length. Must be an integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Validate arrival_time
        arrival_time_raw = data.get('arrival_time')
        if arrival_time_raw is not None and str(arrival_time_raw).strip() != '':
            try:
                # Test parse with pandas to enforce valid datetime format
                parsed_dt = pd.to_datetime(arrival_time_raw)
                arrival_time_str = parsed_dt.isoformat()
            except Exception:
                return Response(
                    {"error": f"Invalid arrival_time '{arrival_time_raw}'. Must be a valid datetime or timestamp string."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Default to a canonical operational timestamp
            arrival_time_str = '2026-10-19T10:30:00'

        # 3. Validate lag1_queue_length (optional)
        lag1_queue_length = None
        if 'lag1_queue_length' in data and data['lag1_queue_length'] is not None:
            try:
                lag1_queue_length = int(data['lag1_queue_length'])
                if lag1_queue_length < 0:
                    return Response(
                        {"error": "lag1_queue_length must be a non-negative integer."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid lag1_queue_length. Must be an integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 4. Validate arrivals_last_15m (optional)
        arrivals_last_15m = None
        if 'arrivals_last_15m' in data and data['arrivals_last_15m'] is not None:
            try:
                arrivals_last_15m = float(data['arrivals_last_15m'])
                if arrivals_last_15m < 0:
                    return Response(
                        {"error": "arrivals_last_15m must be non-negative."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid arrivals_last_15m. Must be numeric."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 5. Validate arrivals_last_30m (optional)
        arrivals_last_30m = None
        if 'arrivals_last_30m' in data and data['arrivals_last_30m'] is not None:
            try:
                arrivals_last_30m = float(data['arrivals_last_30m'])
                if arrivals_last_30m < 0:
                    return Response(
                        {"error": "arrivals_last_30m must be non-negative."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid arrivals_last_30m. Must be numeric."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 6. Validate active_counters (optional, baseline 4)
        active_counters = 4
        if 'active_counters' in data and data['active_counters'] is not None:
            try:
                active_counters = int(data['active_counters'])
                if active_counters < 1 or active_counters > 50:
                    return Response(
                        {"error": "active_counters must be between 1 and 50."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid active_counters. Must be an integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 7. Validate service_type (optional foreign key)
        service_type_id = None
        if 'service_type' in data and data['service_type'] is not None:
            try:
                service_type_id = int(data['service_type'])
            except (ValueError, TypeError):
                service_type_id = None

        # 8. Execute prediction through PredictionService
        try:
            result = service.predict(
                queue_length=queue_length,
                arrival_time=arrival_time_str,
                lag1_queue_length=lag1_queue_length,
                arrivals_last_15m=arrivals_last_15m,
                arrivals_last_30m=arrivals_last_30m,
                active_counters=active_counters,
                service_type_id=service_type_id
            )
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as ve:
            return Response(
                {"error": f"Validation error: {str(ve)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Inference failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
