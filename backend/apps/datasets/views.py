from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Avg, Min, Max, Count
from .models import DatasetMetadata
from .serializers import DatasetMetadataSerializer
from apps.queue_management.models import QueueObservation


class DatasetMetadataViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for imported dataset metadata.
    """
    queryset = DatasetMetadata.objects.all().order_by('-imported_at')
    serializer_class = DatasetMetadataSerializer


@api_view(['GET'])
def dataset_summary(request):
    """
    Returns high-level summary metrics of the current database state:
    - total observations
    - average wait time
    - average queue length
    - min/max wait time
    - date range
    - imported datasets count
    """
    stats = QueueObservation.objects.aggregate(
        total_count=Count('id'),
        avg_wait_time=Avg('wait_time'),
        min_wait_time=Min('wait_time'),
        max_wait_time=Max('wait_time'),
        avg_queue_length=Avg('queue_length'),
        min_queue_length=Min('queue_length'),
        max_queue_length=Max('queue_length'),
        earliest_arrival=Min('arrival_time'),
        latest_arrival=Max('arrival_time'),
    )

    imported_datasets = DatasetMetadata.objects.count()

    return Response({
        "status": "ready" if stats['total_count'] > 0 else "empty",
        "total_observations": stats['total_count'],
        "imported_datasets_count": imported_datasets,
        "metrics": {
            "avg_wait_time_minutes": round(stats['avg_wait_time'], 2) if stats['avg_wait_time'] is not None else None,
            "min_wait_time_minutes": stats['min_wait_time'],
            "max_wait_time_minutes": stats['max_wait_time'],
            "avg_queue_length": round(stats['avg_queue_length'], 1) if stats['avg_queue_length'] is not None else None,
            "min_queue_length": stats['min_queue_length'],
            "max_queue_length": stats['max_queue_length'],
            "earliest_arrival": stats['earliest_arrival'],
            "latest_arrival": stats['latest_arrival'],
        }
    })
