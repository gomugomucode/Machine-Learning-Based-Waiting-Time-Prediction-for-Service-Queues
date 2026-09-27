from django.urls import path
from .views import AnalyticsOverviewView, HourlyQueueAnalyticsView

urlpatterns = [
    path('overview/', AnalyticsOverviewView.as_view(), name='analytics-overview'),
    path('hourly/', HourlyQueueAnalyticsView.as_view(), name='analytics-hourly'),
]
