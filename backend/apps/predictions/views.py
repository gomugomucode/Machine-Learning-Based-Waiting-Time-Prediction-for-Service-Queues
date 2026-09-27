from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from .services import PredictionService


class PredictionStatusView(APIView):
    """
    Returns the current status, metrics, and architecture of the prediction engine.
    """
    def get(self, request):
        service = PredictionService.get_instance()
        return Response(service.get_status(), status=status.HTTP_200_OK)


class PredictWaitingTimeView(APIView):
    """
    Real-time prediction inference endpoint.
    Feeds operational queue inputs to the trained scikit-learn model and returns
    predicted wait times with confidence bounds and congestion indicators.
    """
    def post(self, request):
        service = PredictionService.get_instance()
        if not service.is_available():
            return Response({
                "status": "unavailable",
                "error": "Prediction model not loaded",
                "detail": "The machine learning model artifact is not loaded in memory. "
                          "Run 'python manage.py train_prediction_model' to generate it."
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        data = request.data
        try:
            queue_length = int(data.get('queue_length', 0))
            if queue_length < 0:
                return Response(
                    {"error": "queue_length must be a non-negative integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid queue_length. Must be an integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse arrival time if provided (e.g., '14:30' or '2026-10-05 14:30:00')
        arrival_time_str = data.get('arrival_time', '11:00')
        hour = 11
        minute = 0
        try:
            if ':' in str(arrival_time_str):
                parts = str(arrival_time_str).split(' ')[-1].split(':')
                hour = int(parts[0])
                minute = int(parts[1]) if len(parts) > 1 else 0
        except Exception:
            hour = 11
            minute = 0

        # Day of week (0=Mon, 4=Fri)
        day_of_week = int(data.get('day_of_week', 1))

        try:
            result = service.predict(
                queue_length=queue_length,
                hour=hour,
                minute=minute,
                day_of_week=day_of_week
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Inference failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
