from django.urls import path
from .views import PredictionStatusView, PredictWaitingTimeView

urlpatterns = [
    path('status/', PredictionStatusView.as_view(), name='prediction-status'),
    path('predict/', PredictWaitingTimeView.as_view(), name='prediction-predict'),
]
