from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import PredictionService


class PredictionStatusView(APIView):
    """
    Returns the current status of the prediction model engine.
    """
    def get(self, request):
        service = PredictionService.get_instance()
        return Response(service.get_status(), status=status.HTTP_200_OK)


class PredictWaitingTimeView(APIView):
    """
    Prediction inference endpoint.
    Strictly adheres to project principles: refuses to return hardcoded or fake predictions.
    """
    def post(self, request):
        service = PredictionService.get_instance()
        if not service.is_available():
            return Response({
                "status": "unavailable",
                "error": "Prediction model not yet connected",
                "detail": "The machine learning prediction model has not been trained or deployed yet. "
                          "Per architectural rules, no mock or simulated predictions are generated."
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Future inference logic will go here
        return Response({"error": "Unreachable"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
