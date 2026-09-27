from rest_framework import serializers
from .models import DatasetMetadata


class DatasetMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetMetadata
        fields = [
            'id',
            'file_name',
            'file_path',
            'total_records',
            'imported_records',
            'date_range_start',
            'date_range_end',
            'imported_at',
            'notes',
        ]
