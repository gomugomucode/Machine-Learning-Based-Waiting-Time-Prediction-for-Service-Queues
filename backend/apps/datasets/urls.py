from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DatasetMetadataViewSet, dataset_summary

router = DefaultRouter()
router.register(r'metadata', DatasetMetadataViewSet, basename='dataset-metadata')

urlpatterns = [
    path('summary/', dataset_summary, name='dataset-summary'),
    path('', include(router.urls)),
]
