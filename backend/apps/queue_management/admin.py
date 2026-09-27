from django.contrib import admin
from .models import ServiceType, QueueObservation


@admin.register(ServiceType)
class ServiceTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at')
    search_fields = ('name', 'description')


@admin.register(QueueObservation)
class QueueObservationAdmin(admin.ModelAdmin):
    list_display = ('id', 'arrival_time', 'service_start_time', 'queue_length', 'wait_time', 'service_duration', 'service_type')
    list_filter = ('service_type', 'arrival_time')
    search_fields = ('id',)
    date_hierarchy = 'arrival_time'
