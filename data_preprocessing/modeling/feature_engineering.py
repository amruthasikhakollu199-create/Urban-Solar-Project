"""
modeling/feature_engineering.py

Feature engineering for the Urban Solar + Grid Load forecasting project.

Input:
    data/processed/solar_grid_combined.csv

Target:
    National Hourly Demand

Creates:
    - Time-based features
    - Solar generation feature
    - Previous-hour demand
    - Previous-day demand
    - Leakage-safe rolling demand features

The original combined dataset is never modified.
"""

import pandas as pd
from pathlib import Path


# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

THIS_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = THIS_DIR.parent / "data" / "processed"

INPUT_FILE = PROCESSED_DIR / "solar_grid_combined.csv"
OUTPUT_FILE = PROCESSED_DIR / "model_ready_dataset.csv"


# ------------------------------------------------------------
# 1. LOAD DATA
# ------------------------------------------------------------

def load_data():
    """Load the cleaned solar + grid dataset."""

    df = pd.read_csv(INPUT_FILE)

    df["DATE_TIME"] = pd.to_datetime(df["DATE_TIME"])

    df = df.sort_values("DATE_TIME").reset_index(drop=True)

    print("=" * 60)
    print("FEATURE ENGINEERING")
    print("=" * 60)

    print("\nInput file:")
    print(INPUT_FILE)

    print("\nOriginal shape:")
    print(df.shape)

    return df


# ------------------------------------------------------------
# 2. CREATE TIME FEATURES
# ------------------------------------------------------------

def create_time_features(df):
    """Create calendar/time-based features from DATE_TIME."""

    df = df.copy()

    df["hour"] = df["DATE_TIME"].dt.hour
    df["day_of_week"] = df["DATE_TIME"].dt.dayofweek
    df["day_of_month"] = df["DATE_TIME"].dt.day
    df["month"] = df["DATE_TIME"].dt.month

    return df


# ------------------------------------------------------------
# 3. CREATE LAG FEATURES
# ------------------------------------------------------------

def create_lag_features(df):
    """
    Create historical demand features.

    lag_1  = previous hour demand
    lag_24 = previous day, same-hour demand
    """

    df = df.copy()

    df["load_lag_1"] = df["National Hourly Demand"].shift(1)

    df["load_lag_24"] = df["National Hourly Demand"].shift(24)

    return df


# ------------------------------------------------------------
# 4. CREATE ROLLING FEATURES
# ------------------------------------------------------------

def create_rolling_features(df):
    """
    Create rolling demand averages using only past observations.

    shift(1) ensures the current target value is NOT included.
    """

    df = df.copy()

    past_demand = df["National Hourly Demand"].shift(1)

    df["rolling_mean_3"] = (
        past_demand
        .rolling(window=3)
        .mean()
    )

    df["rolling_mean_24"] = (
        past_demand
        .rolling(window=24)
        .mean()
    )

    return df


# ------------------------------------------------------------
# 5. SELECT MODEL FEATURES
# ------------------------------------------------------------

def select_model_columns(df):
    """Keep the columns required for ML modeling."""

    feature_columns = [
        "DATE_TIME",
        "hour",
        "day_of_week",
        "day_of_month",
        "month",
        "Solar_AC_Power",
        "load_lag_1",
        "load_lag_24",
        "rolling_mean_3",
        "rolling_mean_24",
        "National Hourly Demand",
    ]

    df = df[feature_columns].copy()

    return df


# ------------------------------------------------------------
# 6. REMOVE ROWS WITH FEATURE NaN VALUES
# ------------------------------------------------------------

def remove_initial_nan_rows(df):
    """
    Lag and rolling features naturally create NaN values
    at the beginning of the dataset.

    Remove those rows after feature creation.
    """

    before = len(df)

    df = df.dropna().reset_index(drop=True)

    after = len(df)

    print("\nRows before removing NaN rows:", before)
    print("Rows after removing NaN rows:", after)
    print("Rows removed:", before - after)

    return df


# ------------------------------------------------------------
# 7. VALIDATE FINAL DATASET
# ------------------------------------------------------------

def validate_dataset(df):

    print("\n" + "=" * 60)
    print("MODEL-READY DATASET VALIDATION")
    print("=" * 60)

    print("\nFinal shape:")
    print(df.shape)

    print("\nFinal columns:")
    print(df.columns.tolist())

    print("\nMissing values:")
    print(df.isnull().sum())

    print("\nDuplicate rows:")
    print(df.duplicated().sum())

    print("\nDuplicate timestamps:")
    print(df["DATE_TIME"].duplicated().sum())

    print("\nDate range:")
    print(
        df["DATE_TIME"].min(),
        "to",
        df["DATE_TIME"].max()
    )


# ------------------------------------------------------------
# 8. SAVE DATASET
# ------------------------------------------------------------

def save_dataset(df):

    df.to_csv(OUTPUT_FILE, index=False)

    print("\n" + "=" * 60)
    print("MODEL-READY DATASET SAVED")
    print("=" * 60)

    print("\nSaved to:")
    print(OUTPUT_FILE)

    print("Rows saved:", len(df))
    print("Columns saved:", len(df.columns))


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------

def main():

    df = load_data()

    # Time-based features
    df = create_time_features(df)

    # Historical demand features
    df = create_lag_features(df)

    # Leakage-safe rolling features
    df = create_rolling_features(df)

    # Select final ML columns
    df = select_model_columns(df)

    # Remove rows affected by initial lag/rolling NaN values
    df = remove_initial_nan_rows(df)

    # Validate
    validate_dataset(df)

    # Save
    save_dataset(df)

    print("\n" + "=" * 60)
    print("FEATURE ENGINEERING COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()