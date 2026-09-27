from rest_framework import serializers
from .models import ServiceType, QueueObservation


class ServiceTypeSerializer(serializers.ModelSerializer):
    observations_count = serializers.IntegerField(
        source='observations.count',
        read_only=True
    )

    class Meta:
        model = ServiceType
        fields = [
            'id',
            'name',
            'description',
            'created_at',
            'observations_count'
        ]


class QueueObservationSerializer(serializers.ModelSerializer):
    service_type_name = serializers.CharField(
        source='service_type.name',
        read_only=True
    )

    class Meta:
        model = QueueObservation
        fields = [
            'id',
            'arrival_time',
            'service_start_time',
            'service_end_time',
            'wait_time',
            'service_duration',
            'queue_length',
            'service_type',
            'service_type_name',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
