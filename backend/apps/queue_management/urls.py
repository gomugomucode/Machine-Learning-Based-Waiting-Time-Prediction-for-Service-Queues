from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceTypeViewSet, QueueObservationViewSet

router = DefaultRouter()
router.register(r'service-types', ServiceTypeViewSet, basename='service-type')
router.register(r'queue-observations', QueueObservationViewSet, basename='queue-observation')

urlpatterns = [
    path('', include(router.urls)),
]
