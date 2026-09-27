from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination
from .models import ServiceType, QueueObservation
from .serializers import ServiceTypeSerializer, QueueObservationSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 500


class ServiceTypeViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows service types to be viewed or edited.
    """
    queryset = ServiceType.objects.all().order_by('name')
    serializer_class = ServiceTypeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']


class QueueObservationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows queue observations to be viewed or created.
    Supports pagination and ordering by arrival_time, queue_length, or wait_time.
    """
    queryset = QueueObservation.objects.select_related('service_type').all().order_by('arrival_time')
    serializer_class = QueueObservationSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['arrival_time', 'wait_time', 'queue_length', 'service_duration']

    def get_queryset(self):
        queryset = super().get_queryset()
        service_type_id = self.request.query_params.get('service_type')
        if service_type_id:
            queryset = queryset.filter(service_type_id=service_type_id)
        return queryset
