from django.db import models


class ServiceType(models.Model):
    """
    Represents a category of service offered at the facility.
    E.g. Cash Deposit, Account Opening, Loan Consultation, etc.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Name of the service type"
    )
    description = models.TextField(
        blank=True,
        default='',
        help_text="Description of the service type"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the service type was registered"
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Service Type'
        verbose_name_plural = 'Service Types'

    def __str__(self) -> str:
        return self.name


class QueueObservation(models.Model):
    """
    Records an individual queue service event based on empirical queue data.
    Directly maps to the verified Kaggle queue dataset schema while providing
    extensibility for future service type linkage.
    """
    arrival_time = models.DateTimeField(
        db_index=True,
        help_text="Timestamp when customer arrived and joined the queue"
    )
    service_start_time = models.DateTimeField(
        db_index=True,
        help_text="Timestamp when customer was summoned and service began"
    )
    service_end_time = models.DateTimeField(
        help_text="Timestamp when counter service concluded"
    )
    wait_time = models.FloatField(
        help_text="Observed waiting time in minutes (service_start_time - arrival_time)"
    )
    service_duration = models.FloatField(
        null=True,
        blank=True,
        help_text="Observed service duration in minutes (service_end_time - service_start_time)"
    )
    queue_length = models.PositiveIntegerField(
        help_text="Observed number of people ahead in queue at arrival time"
    )
    service_type = models.ForeignKey(
        ServiceType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='observations',
        help_text="Category of service if available"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when this database record was created"
    )

    class Meta:
        ordering = ['arrival_time']
        verbose_name = 'Queue Observation'
        verbose_name_plural = 'Queue Observations'
        indexes = [
            models.Index(fields=['arrival_time']),
            models.Index(fields=['service_start_time']),
            models.Index(fields=['queue_length']),
        ]

    def __str__(self) -> str:
        return f"Observation #{self.id} | Queue: {self.queue_length} | Wait: {self.wait_time:.2f} min"

    def save(self, *args, **kwargs):
        # Auto-compute wait_time and service_duration if not already explicitly assigned
        if self.arrival_time and self.service_start_time and (self.wait_time is None):
            delta = (self.service_start_time - self.arrival_time).total_seconds() / 60.0
            self.wait_time = round(max(0.0, delta), 2)

        if self.service_start_time and self.service_end_time and (self.service_duration is None):
            delta = (self.service_end_time - self.service_start_time).total_seconds() / 60.0
            self.service_duration = round(max(0.0, delta), 2)

        super().save(*args, **kwargs)
