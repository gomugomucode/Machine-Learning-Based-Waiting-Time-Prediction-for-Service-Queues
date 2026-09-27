from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg, Count, Min, Max
from django.db.models.functions import ExtractHour
from apps.queue_management.models import QueueObservation


class AnalyticsOverviewView(APIView):
    """
    Returns foundational statistics on observed queue wait times and service rates.
    """
    def get(self, request):
        stats = QueueObservation.objects.aggregate(
            total_observations=Count('id'),
            avg_wait_minutes=Avg('wait_time'),
            min_wait_minutes=Min('wait_time'),
            max_wait_minutes=Max('wait_time'),
            avg_service_minutes=Avg('service_duration'),
            avg_queue_length=Avg('queue_length'),
            max_queue_length=Max('queue_length'),
        )

        has_data = stats['total_observations'] > 0

        return Response({
            "has_data": has_data,
            "total_observations": stats['total_observations'],
            "summary": {
                "avg_wait_minutes": round(stats['avg_wait_minutes'], 2) if has_data and stats['avg_wait_minutes'] is not None else 0.0,
                "min_wait_minutes": stats['min_wait_minutes'] if has_data else 0.0,
                "max_wait_minutes": stats['max_wait_minutes'] if has_data else 0.0,
                "avg_service_minutes": round(stats['avg_service_minutes'], 2) if has_data and stats['avg_service_minutes'] is not None else 0.0,
                "avg_queue_length": round(stats['avg_queue_length'], 1) if has_data and stats['avg_queue_length'] is not None else 0.0,
                "max_queue_length": stats['max_queue_length'] if has_data else 0,
            }
        }, status=status.HTTP_200_OK)


class HourlyQueueAnalyticsView(APIView):
    """
    Returns average waiting time and queue length grouped by arrival hour.
    """
    def get(self, request):
        hourly_data = (
            QueueObservation.objects.annotate(hour=ExtractHour('arrival_time'))
            .values('hour')
            .annotate(
                count=Count('id'),
                avg_wait=Avg('wait_time'),
                avg_queue=Avg('queue_length'),
            )
            .order_by('hour')
        )

        formatted = [
            {
                "hour": item['hour'],
                "label": f"{item['hour']:02d}:00",
                "observations": item['count'],
                "avg_wait_minutes": round(item['avg_wait'], 2) if item['avg_wait'] is not None else 0.0,
                "avg_queue_length": round(item['avg_queue'], 1) if item['avg_queue'] is not None else 0.0,
            }
            for item in hourly_data
        ]

        return Response(formatted, status=status.HTTP_200_OK)
