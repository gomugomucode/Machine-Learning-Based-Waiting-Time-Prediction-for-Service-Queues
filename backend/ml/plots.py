"""
Temporal Structure and Distribution Plotting Module (Phase 2 - Step 6).
Generates publication-quality figures for the BCA Major Project and saves to docs/phase2_figures/.
"""
import os
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from ml.data_loader import load_clean_dataset


def generate_all_phase2_plots(output_dir: str = None) -> list:
    """
    Generates the 7 required academic plots:
    1. Waiting time distribution (waiting_time_distribution.png)
    2. Queue length distribution (queue_length_distribution.png)
    3. Waiting time by hour (waiting_time_by_hour.png)
    4. Queue length by hour (queue_length_by_hour.png)
    5. Waiting time by date (waiting_time_by_date.png)
    6. Service duration distribution (service_duration_distribution.png)
    7. Queue length vs waiting time (queue_vs_waiting_time.png)
    """
    if output_dir is None:
        base_dir = Path(__file__).resolve().parent.parent.parent
        fig_dir = base_dir / "docs" / "phase2_figures"
    else:
        fig_dir = Path(output_dir)

    fig_dir.mkdir(parents=True, exist_ok=True)

    df = load_clean_dataset()
    df['arrival_hour'] = df['arrival_time'].dt.hour
    df['date'] = df['arrival_time'].dt.date
    df['date_str'] = df['date'].astype(str)

    generated_files = []

    # Modern styling
    plt.rcParams.update({
        'font.size': 11,
        'axes.labelsize': 12,
        'axes.titlesize': 13,
        'xtick.labelsize': 10,
        'ytick.labelsize': 10,
        'figure.titlesize': 14,
        'figure.autolayout': True,
    })

    # 1. Waiting Time Distribution
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(df['wait_time'], bins=50, color='#2563eb', edgecolor='#1d4ed8', alpha=0.85)
    mean_w = df['wait_time'].mean()
    median_w = df['wait_time'].median()
    ax.axvline(mean_w, color='#dc2626', linestyle='--', linewidth=2, label=f'Mean: {mean_w:.1f} min')
    ax.axvline(median_w, color='#16a34a', linestyle=':', linewidth=2, label=f'Median: {median_w:.1f} min')
    ax.set_title('Figure 1: Customer Waiting Time Distribution (N = 12,017)')
    ax.set_xlabel('Waiting Time (Minutes)')
    ax.set_ylabel('Number of Customer Observations')
    ax.grid(True, linestyle='--', alpha=0.5)
    ax.legend(frameon=True, facecolor='white', framealpha=0.9)
    p1 = fig_dir / 'waiting_time_distribution.png'
    fig.savefig(p1, dpi=300)
    plt.close(fig)
    generated_files.append(p1)

    # 2. Queue Length Distribution
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(df['queue_length'], bins=40, color='#4f46e5', edgecolor='#4338ca', alpha=0.85)
    mean_q = df['queue_length'].mean()
    median_q = df['queue_length'].median()
    ax.axvline(mean_q, color='#dc2626', linestyle='--', linewidth=2, label=f'Mean: {mean_q:.1f} people')
    ax.axvline(median_q, color='#16a34a', linestyle=':', linewidth=2, label=f'Median: {median_q:.1f} people')
    ax.set_title('Figure 2: Queue Depth Distribution at Customer Arrival Time')
    ax.set_xlabel('Observed Queue Length (Customers Ahead in Line)')
    ax.set_ylabel('Frequency')
    ax.grid(True, linestyle='--', alpha=0.5)
    ax.legend(frameon=True, facecolor='white', framealpha=0.9)
    p2 = fig_dir / 'queue_length_distribution.png'
    fig.savefig(p2, dpi=300)
    plt.close(fig)
    generated_files.append(p2)

    # 3. Waiting Time by Hour (Diurnal pattern)
    fig, ax = plt.subplots(figsize=(8, 5))
    hourly_wait = [df[df['arrival_hour'] == h]['wait_time'].values for h in sorted(df['arrival_hour'].unique())]
    labels_h = [f'{h:02d}:00' for h in sorted(df['arrival_hour'].unique())]
    bplot = ax.boxplot(hourly_wait, tick_labels=labels_h, patch_artist=True,
                       boxprops=dict(facecolor='#93c5fd', color='#1d4ed8'),
                       medianprops=dict(color='#dc2626', linewidth=2),
                       whiskerprops=dict(color='#1d4ed8'),
                       capprops=dict(color='#1d4ed8'))
    ax.set_title('Figure 3: Diurnal Waiting Time Progression by Arrival Hour')
    ax.set_xlabel('Customer Arrival Hour (09:00 – 16:00)')
    ax.set_ylabel('Waiting Time (Minutes)')
    ax.grid(True, linestyle='--', alpha=0.5)
    p3 = fig_dir / 'waiting_time_by_hour.png'
    fig.savefig(p3, dpi=300)
    plt.close(fig)
    generated_files.append(p3)

    # 4. Queue Length by Hour
    fig, ax = plt.subplots(figsize=(8, 5))
    hourly_q = [df[df['arrival_hour'] == h]['queue_length'].values for h in sorted(df['arrival_hour'].unique())]
    bplot_q = ax.boxplot(hourly_q, tick_labels=labels_h, patch_artist=True,
                         boxprops=dict(facecolor='#c7d2fe', color='#4338ca'),
                         medianprops=dict(color='#dc2626', linewidth=2),
                         whiskerprops=dict(color='#4338ca'),
                         capprops=dict(color='#4338ca'))
    ax.set_title('Figure 4: Queue Accumulation by Arrival Hour (Diurnal Congestion)')
    ax.set_xlabel('Arrival Hour Window')
    ax.set_ylabel('Queue Length (People)')
    ax.grid(True, linestyle='--', alpha=0.5)
    p4 = fig_dir / 'queue_length_by_hour.png'
    fig.savefig(p4, dpi=300)
    plt.close(fig)
    generated_files.append(p4)

    # 5. Waiting Time by Date (Multi-day variation)
    fig, ax = plt.subplots(figsize=(10, 5))
    daily_wait = df.groupby('date_str')['wait_time'].mean()
    dates_sorted = sorted(df['date_str'].unique())
    short_dates = [d[5:] for d in dates_sorted] # MM-DD
    bars = ax.bar(short_dates, [daily_wait[d] for d in dates_sorted], color='#0284c7', edgecolor='#0369a1', alpha=0.85)
    ax.axhline(df['wait_time'].mean(), color='#dc2626', linestyle='--', linewidth=2, label=f'Grand Mean: {df["wait_time"].mean():.1f}m')
    ax.set_title('Figure 5: Mean Customer Waiting Time across 14 Observation Days')
    ax.set_xlabel('Observation Date (Month-Day)')
    ax.set_ylabel('Average Waiting Time (Minutes)')
    ax.set_xticks(range(len(short_dates)))
    ax.set_xticklabels(short_dates, rotation=45)
    ax.grid(True, linestyle='--', alpha=0.5)
    ax.legend(frameon=True, facecolor='white', framealpha=0.9)
    p5 = fig_dir / 'waiting_time_by_date.png'
    fig.savefig(p5, dpi=300)
    plt.close(fig)
    generated_files.append(p5)

    # 6. Service Duration Distribution
    fig, ax = plt.subplots(figsize=(8, 5))
    # Filter 0 to 15 min for clear visualization
    s_data = df['service_duration_minutes']
    ax.hist(s_data[s_data <= 15], bins=45, color='#0d9488', edgecolor='#0f766e', alpha=0.85)
    mean_s = s_data.mean()
    median_s = s_data.median()
    ax.axvline(mean_s, color='#dc2626', linestyle='--', linewidth=2, label=f'Mean: {mean_s:.2f} min')
    ax.axvline(median_s, color='#16a34a', linestyle=':', linewidth=2, label=f'Median: {median_s:.2f} min')
    ax.set_title('Figure 6: Counter Service Duration Distribution (Mean = 2.38 min)')
    ax.set_xlabel('Service Duration (Minutes: Finish Time - Start Time)')
    ax.set_ylabel('Frequency')
    ax.grid(True, linestyle='--', alpha=0.5)
    ax.legend(frameon=True, facecolor='white', framealpha=0.9)
    p6 = fig_dir / 'service_duration_distribution.png'
    fig.savefig(p6, dpi=300)
    plt.close(fig)
    generated_files.append(p6)

    # 7. Queue Length vs Waiting Time (Scatter & Correlation)
    fig, ax = plt.subplots(figsize=(8, 5))
    # Sample 1500 points for crisp visual without over-saturation
    sample_df = df.sample(n=min(2000, len(df)), random_state=42)
    corr = df[['queue_length', 'wait_time']].corr().iloc[0, 1]
    ax.scatter(sample_df['queue_length'], sample_df['wait_time'], alpha=0.35, color='#3b82f6', edgecolors='none', s=20)
    # Regression line
    m, b = np.polyfit(df['queue_length'], df['wait_time'], 1)
    x_vals = np.linspace(df['queue_length'].min(), df['queue_length'].max(), 100)
    ax.plot(x_vals, m * x_vals + b, color='#dc2626', linewidth=2.5, label=f'Linear Fit (r = {corr:.4f})')
    ax.set_title('Figure 7: Queue Depth vs Waiting Time Empirical Correlation')
    ax.set_xlabel('Queue Length at Arrival (Customers)')
    ax.set_ylabel('Actual Waiting Time (Minutes)')
    ax.grid(True, linestyle='--', alpha=0.5)
    ax.legend(frameon=True, facecolor='white', framealpha=0.9)
    p7 = fig_dir / 'queue_vs_waiting_time.png'
    fig.savefig(p7, dpi=300)
    plt.close(fig)
    generated_files.append(p7)

    return generated_files


if __name__ == "__main__":
    files = generate_all_phase2_plots()
    print(f"Generated {len(files)} Phase 2 figures:")
    for f in files:
        print(f" - {f}")
