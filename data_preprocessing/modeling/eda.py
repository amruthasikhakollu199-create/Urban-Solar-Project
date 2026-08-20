"""
modeling/eda.py

Exploratory Data Analysis for the Urban Solar + Grid Load project.
Reads the cleaned combined dataset and performs basic validation,
statistics, and relationship analysis.
"""

"""
modeling/eda.py

Exploratory Data Analysis on solar_grid_combined.csv.
Purely visual/descriptive — no feature engineering, no modification
of the underlying data. Goal: understand patterns before building
features or training models.
"""

import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = THIS_DIR.parent / "data" / "processed"

def load_data():
    df = pd.read_csv(PROCESSED_DIR / "solar_grid_combined.csv")
    print("Actual columns found:", list(df.columns))   # TEMPORARY DEBUG LINE
    df['DATE_TIME'] = pd.to_datetime(df['DATE_TIME'])
    return df


def plot_full_timeseries(df):
    fig, axes = plt.subplots(2, 1, figsize=(14, 8), sharex=True)

    axes[0].plot(df['DATE_TIME'], df['Solar_AC_Power'], color='orange')
    axes[0].set_title('Solar AC Power — Full Period')
    axes[0].set_ylabel('Solar AC Power')

    axes[1].plot(df['DATE_TIME'], df['National Hourly Demand'], color='steelblue')
    axes[1].set_title('National Hourly Demand — Full Period')
    axes[1].set_ylabel('Demand')
    axes[1].set_xlabel('Date')

    plt.tight_layout()
    plt.savefig(THIS_DIR / "eda_full_timeseries.png")
    plt.close()
    print("Saved: eda_full_timeseries.png")


def plot_typical_day(df):
    """Average value by hour of day — shows the 'typical day' shape."""
    df = df.copy()
    df['hour'] = df['DATE_TIME'].dt.hour

    hourly_avg_solar = df.groupby('hour')['Solar_AC_Power'].mean()
    hourly_avg_demand = df.groupby('hour')['National Hourly Demand'].mean()

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    axes[0].plot(hourly_avg_solar.index, hourly_avg_solar.values, marker='o', color='orange')
    axes[0].set_title('Average Solar AC Power by Hour of Day')
    axes[0].set_xlabel('Hour')
    axes[0].set_ylabel('Avg Solar AC Power')

    axes[1].plot(hourly_avg_demand.index, hourly_avg_demand.values, marker='o', color='steelblue')
    axes[1].set_title('Average Demand by Hour of Day')
    axes[1].set_xlabel('Hour')
    axes[1].set_ylabel('Avg Demand')

    plt.tight_layout()
    plt.savefig(THIS_DIR / "eda_typical_day.png")
    plt.close()
    print("Saved: eda_typical_day.png")


def print_summary_stats(df):
    print("\n--- Summary Statistics ---")
    print(df[['Solar_AC_Power', 'National Hourly Demand']].describe())

    correlation = df['Solar_AC_Power'].corr(df['National Hourly Demand'])
    print(f"\nCorrelation between Solar_AC_Power and National Hourly Demand: {correlation:.4f}")


def main():
    df = load_data()
    print("Loaded shape:", df.shape)

    print_summary_stats(df)
    plot_full_timeseries(df)
    plot_typical_day(df)


if __name__ == "__main__":
    main()