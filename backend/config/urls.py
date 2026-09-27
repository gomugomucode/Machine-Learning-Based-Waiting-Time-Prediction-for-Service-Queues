"""
URL configuration for BCA Waiting Time Prediction project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import connection


@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint returning system and database status.
    """
    db_status = "ok"
    try:
        connection.ensure_connection()
    except Exception as e:
        db_status = f"error: {str(e)}"

    http_status = status.HTTP_200_OK if db_status == "ok" else status.HTTP_503_SERVICE_UNAVAILABLE

    return Response({
        "status": "ok" if db_status == "ok" else "degraded",
        "service": "waiting-time-backend",
        "database": db_status
    }, status=http_status)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/', include('apps.queue_management.urls')),
    path('api/datasets/', include('apps.datasets.urls')),
    path('api/predictions/', include('apps.predictions.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]
