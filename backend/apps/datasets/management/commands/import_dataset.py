"""
Management command to import queue observation CSV datasets into PostgreSQL.
"""
import os
import pandas as pd
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from apps.queue_management.models import QueueObservation
from apps.datasets.models import DatasetMetadata


class Command(BaseCommand):
    help = 'Import queue observation records from a CSV file into PostgreSQL'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file to import')
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit the number of records imported (useful for pilot testing)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Validate records without committing changes to the database'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing QueueObservation records before importing'
        )

    def handle(self, *args, **options):
        csv_path = options['csv_file']
        limit = options['limit']
        dry_run = options['dry_run']
        clear_first = options['clear']

        if not os.path.exists(csv_path):
            raise CommandError(f'File not found: {csv_path}')

        self.stdout.write(self.style.MIGRATE_HEADING(f'Processing dataset: {csv_path}'))

        # Load CSV
        try:
            df = pd.read_csv(csv_path)
        except Exception as e:
            raise CommandError(f'Error reading CSV file: {e}')

        total_rows = len(df)
        self.stdout.write(f'Source CSV loaded successfully: {total_rows} total rows.')

        # Expected columns validation
        required_cols = {'arrival_time', 'start_time', 'finish_time', 'wait_time', 'queue_length'}
        actual_cols = set(df.columns)
        if not required_cols.issubset(actual_cols):
            missing = required_cols - actual_cols
            raise CommandError(f'CSV is missing required columns: {missing}. Found: {df.columns.tolist()}')

        if limit:
            df = df.head(limit)
            self.stdout.write(self.style.WARNING(f'--limit flag active: processing first {limit} records only.'))

        # Parse timestamps
        try:
            df['arrival_dt'] = pd.to_datetime(df['arrival_time'])
            df['start_dt'] = pd.to_datetime(df['start_time'])
            df['finish_dt'] = pd.to_datetime(df['finish_time'])
        except Exception as e:
            raise CommandError(f'Error parsing timestamps: {e}')

        # Compute service duration if not present
        df['service_dur'] = (df['finish_dt'] - df['start_dt']).dt.total_seconds() / 60.0
        df['service_dur'] = df['service_dur'].clip(lower=0.0).round(2)

        # Validation checks
        null_counts = df[['arrival_dt', 'start_dt', 'finish_dt', 'wait_time', 'queue_length']].isnull().sum().sum()
        if null_counts > 0:
            self.stdout.write(self.style.WARNING(f'Warning: Found {null_counts} null values in target subset. Dropping invalid rows.'))
            df = df.dropna(subset=['arrival_dt', 'start_dt', 'finish_dt', 'wait_time', 'queue_length'])

        valid_rows = len(df)
        earliest_time = df['arrival_dt'].min()
        latest_time = df['arrival_dt'].max()

        self.stdout.write(f'Validation complete: {valid_rows} valid records.')
        self.stdout.write(f'Date range: {earliest_time} to {latest_time}')

        if dry_run:
            self.stdout.write(self.style.SUCCESS('[DRY RUN] Records validated successfully. No database changes were made.'))
            return

        with transaction.atomic():
            if clear_first:
                deleted_count, _ = QueueObservation.objects.all().delete()
                self.stdout.write(self.style.WARNING(f'Cleared {deleted_count} existing queue observations.'))

            observations = []
            for _, row in df.iterrows():
                # Make timezone-aware UTC
                arr = timezone.make_aware(row['arrival_dt']) if timezone.is_naive(row['arrival_dt']) else row['arrival_dt']
                st = timezone.make_aware(row['start_dt']) if timezone.is_naive(row['start_dt']) else row['start_dt']
                fin = timezone.make_aware(row['finish_dt']) if timezone.is_naive(row['finish_dt']) else row['finish_dt']

                obs = QueueObservation(
                    arrival_time=arr,
                    service_start_time=st,
                    service_end_time=fin,
                    wait_time=float(row['wait_time']),
                    service_duration=float(row['service_dur']),
                    queue_length=int(row['queue_length']),
                )
                observations.append(obs)

            self.stdout.write(f'Inserting {len(observations)} records into PostgreSQL in batches...')
            QueueObservation.objects.bulk_create(observations, batch_size=2000)

            # Record dataset metadata
            DatasetMetadata.objects.create(
                file_name=os.path.basename(csv_path),
                file_path=os.path.abspath(csv_path),
                total_records=total_rows,
                imported_records=len(observations),
                date_range_start=timezone.make_aware(earliest_time) if timezone.is_naive(earliest_time) else earliest_time,
                date_range_end=timezone.make_aware(latest_time) if timezone.is_naive(latest_time) else latest_time,
                notes=f'Imported via manage.py import_dataset. Records: {len(observations)}.'
            )

        self.stdout.write(self.style.SUCCESS(
            f'Successfully imported {len(observations)} queue observations into PostgreSQL!'
        ))
