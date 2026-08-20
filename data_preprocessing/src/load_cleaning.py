"""
src/load_cleaning.py

Grid Load Data Cleaning

Dataset:
hourlyLoadDataIndia.xlsx

Purpose:
1. Load hourly grid-load data
2. Verify datetime
3. Check missing values and duplicates
4. Keep the required national demand column
5. Save cleaned grid-load data
"""

import pandas as pd
from pathlib import Path

from inspect_data import load_raw_datasets


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

THIS_DIR = Path(__file__).resolve().parent
PROJECT_DIR = THIS_DIR.parent

PROCESSED_DIR = PROJECT_DIR / "data" / "processed"

OUTPUT_FILE = PROCESSED_DIR / "load_cleaned.csv"


# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------

def load_grid_data():
    """
    Load the hourly grid-load dataset.
    """

    _, load, _ = load_raw_datasets()

    return load


# ---------------------------------------------------------
# CLEAN DATETIME
# ---------------------------------------------------------

def clean_datetime(df):
    """
    Convert datetime column to pandas datetime
    and sort chronologically.
    """

    df_clean = df.copy()

    df_clean["datetime"] = pd.to_datetime(
        df_clean["datetime"]
    )

    df_clean = df_clean.sort_values(
        "datetime"
    ).reset_index(drop=True)

    return df_clean


# ---------------------------------------------------------
# VALIDATE DATA
# ---------------------------------------------------------

def validate_load_data(df):
    """
    Perform basic quality checks.
    """

    print("\n" + "=" * 60)
    print("GRID LOAD DATA VALIDATION")
    print("=" * 60)

    print(
        "Shape:",
        df.shape
    )

    print(
        "\nDatetime dtype:",
        df["datetime"].dtype
    )

    print(
        "Date range:",
        df["datetime"].min(),
        "to",
        df["datetime"].max()
    )

    print(
        "\nMissing values:"
    )

    print(
        df.isna().sum()
    )

    print(
        "\nDuplicate rows:",
        df.duplicated().sum()
    )

    print(
        "Duplicate timestamps:",
        df["datetime"].duplicated().sum()
    )

    print(
        "\nChronologically sorted:",
        df["datetime"].is_monotonic_increasing
    )


# ---------------------------------------------------------
# SELECT REQUIRED COLUMNS
# ---------------------------------------------------------

def select_required_columns(df):
    """
    Keep datetime and national hourly demand.

    National Hourly Demand is the grid-demand target
    used for our project scope.
    """

    required_columns = [
        "datetime",
        "National Hourly Demand"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: "
            f"{missing_columns}"
        )

    return df[required_columns].copy()


# ---------------------------------------------------------
# SAVE
# ---------------------------------------------------------

def save_load_data(df):
    """
    Save cleaned grid-load data.
    """

    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\n" + "=" * 60)
    print("GRID LOAD DATA SAVED")
    print("=" * 60)

    print(
        f"Saved to:\n{OUTPUT_FILE}"
    )

    print(
        f"Rows saved: {len(df)}"
    )


# ---------------------------------------------------------
# MAIN
# ---------------------------------------------------------

def main():

    print("\n" + "=" * 60)
    print("GRID LOAD CLEANING PIPELINE")
    print("=" * 60)

    # Load
    load = load_grid_data()

    print(
        f"\nRaw rows: {len(load)}"
    )

    # Datetime cleaning
    load_clean = clean_datetime(
        load
    )

    # Validation
    validate_load_data(
        load_clean
    )

    # Select required column
    load_clean = select_required_columns(
        load_clean
    )

    print(
        "\nFinal columns:",
        list(load_clean.columns)
    )

    # Save
    save_load_data(
        load_clean
    )

    print("\n" + "=" * 60)
    print("GRID LOAD CLEANING COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()