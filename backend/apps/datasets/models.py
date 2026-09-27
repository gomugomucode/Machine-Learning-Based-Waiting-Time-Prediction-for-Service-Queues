from django.db import models


class DatasetMetadata(models.Model):
    """
    Stores audit metadata for imported queue datasets.
    """
    file_name = models.CharField(max_length=255, help_text="Original file name of the dataset")
    file_path = models.CharField(max_length=500, blank=True, help_text="Path to the file on disk")
    total_records = models.PositiveIntegerField(help_text="Total rows in the source dataset")
    imported_records = models.PositiveIntegerField(default=0, help_text="Total valid rows imported")
    date_range_start = models.DateTimeField(null=True, blank=True, help_text="Earliest observation timestamp")
    date_range_end = models.DateTimeField(null=True, blank=True, help_text="Latest observation timestamp")
    imported_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when imported")
    notes = models.TextField(blank=True, default='', help_text="Notes and inspection details")

    class Meta:
        ordering = ['-imported_at']
        verbose_name = 'Dataset Metadata'
        verbose_name_plural = 'Dataset Metadata'

    def __str__(self) -> str:
        return f"{self.file_name} ({self.imported_records}/{self.total_records} records)"
