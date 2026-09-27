from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from .models import ServiceType, QueueObservation
from .serializers import ServiceTypeSerializer, QueueObservationSerializer


class HealthCheckApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        """Test GET /api/health/ returns status 200 and healthy database."""
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data.get('status'), 'ok')
        self.assertEqual(data.get('service'), 'waiting-time-backend')
        self.assertEqual(data.get('database'), 'ok')


class QueueManagementModelAndApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.service_type = ServiceType.objects.create(
            name="Cash Teller",
            description="Deposits and withdrawals"
        )
        now = timezone.now()
        self.observation = QueueObservation.objects.create(
            arrival_time=now,
            service_start_time=now + timedelta(minutes=15),
            service_end_time=now + timedelta(minutes=20),
            wait_time=15.0,
            service_duration=5.0,
            queue_length=12,
            service_type=self.service_type
        )

    def test_service_type_creation_and_serializer(self):
        """Test ServiceType model and serializer integrity."""
        self.assertEqual(str(self.service_type), "Cash Teller")
        serializer = ServiceTypeSerializer(instance=self.service_type)
        self.assertEqual(serializer.data['name'], "Cash Teller")
        self.assertEqual(serializer.data['observations_count'], 1)

    def test_queue_observation_auto_calc(self):
        """Test QueueObservation automatically computes wait_time and service_duration if omitted."""
        now = timezone.now()
        obs = QueueObservation.objects.create(
            arrival_time=now,
            service_start_time=now + timedelta(minutes=10),
            service_end_time=now + timedelta(minutes=14),
            wait_time=None,
            service_duration=None,
            queue_length=5
        )
        self.assertEqual(obs.wait_time, 10.0)
        self.assertEqual(obs.service_duration, 4.0)

    def test_get_service_types_api(self):
        """Test GET /api/service-types/ endpoint."""
        response = self.client.get('/api/service-types/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json().get('results', response.json())
        self.assertGreaterEqual(len(results), 1)

    def test_get_queue_observations_api(self):
        """Test GET /api/queue-observations/ pagination and fields."""
        response = self.client.get('/api/queue-observations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('results', data)
        self.assertGreaterEqual(data['count'], 1)
        record = data['results'][0]
        self.assertIn('wait_time', record)
        self.assertIn('queue_length', record)

    def test_get_single_queue_observation_api(self):
        """Test GET /api/queue-observations/<id>/ endpoint."""
        response = self.client.get(f'/api/queue-observations/{self.observation.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['id'], self.observation.id)
        self.assertEqual(data['queue_length'], 12)
        self.assertEqual(data['wait_time'], 15.0)


class PredictionApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_prediction_status_endpoint(self):
        """Test GET /api/predictions/status/ clearly indicates model offline."""
        response = self.client.get('/api/predictions/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'offline')
        self.assertFalse(data['model_connected'])

    def test_prediction_inference_refusal(self):
        """Test POST /api/predictions/predict/ refuses to generate fake predictions."""
        response = self.client.post('/api/predictions/predict/', {'queue_length': 10}, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        data = response.json()
        self.assertEqual(data['status'], 'unavailable')
