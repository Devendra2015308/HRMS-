from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class HealthCheckTests(TestCase):
    def test_health_endpoint(self):
        client = APIClient()
        response = client.get("/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "ok")
