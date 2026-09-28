"""
Data loader module for Queue Waiting Time Dataset.
Loads and types the verified 12,017 Kaggle queue observation records.
"""
import os
from pathlib import Path
from typing import Optional
import pandas as pd


def get_dataset_path(custom_path: Optional[str] = None) -> Path:
    """Resolves the absolute path to verified_queue_waiting_time_dataset.csv."""
    if custom_path:
        p = Path(custom_path)
        if p.exists():
            return p

    # Try relative search from current file: backend/ml/ -> project root/data/
    base_dir = Path(__file__).resolve().parent.parent.parent
    candidate = base_dir / "data" / "verified_queue_waiting_time_dataset.csv"
    if candidate.exists():
        return candidate

    # Fallback to local data folder
    local_candidate = Path("data/verified_queue_waiting_time_dataset.csv").resolve()
    if local_candidate.exists():
        return local_candidate

    raise FileNotFoundError(f"Could not locate verified_queue_waiting_time_dataset.csv at {candidate}")


def load_raw_dataset(csv_path: Optional[str] = None) -> pd.DataFrame:
    """
    Loads raw CSV without any transformations.
    Columns: arrival_time, start_time, finish_time, wait_time, queue_length.
    """
    path = get_dataset_path(csv_path)
    df = pd.read_csv(path)
    return df


def load_clean_dataset(csv_path: Optional[str] = None) -> pd.DataFrame:
    """
    Loads dataset, parses timestamps, and adds verified target & duration columns.
    """
    df = load_raw_dataset(csv_path)

    # Parse timestamps
    df['arrival_time'] = pd.to_datetime(df['arrival_time'])
    df['start_time'] = pd.to_datetime(df['start_time'])
    df['finish_time'] = pd.to_datetime(df['finish_time'])

    # Ensure numeric columns
    df['wait_time'] = pd.to_numeric(df['wait_time'], errors='raise')
    df['queue_length'] = pd.to_numeric(df['queue_length'], errors='raise').astype(int)

    # Calculate exact wait time and service duration in minutes from timestamps
    df['calculated_wait_minutes'] = (df['start_time'] - df['arrival_time']).dt.total_seconds() / 60.0
    df['service_duration_minutes'] = (df['finish_time'] - df['start_time']).dt.total_seconds() / 60.0

    # Ensure chronological order by arrival time
    df = df.sort_values(by='arrival_time').reset_index(drop=True)

    return df
