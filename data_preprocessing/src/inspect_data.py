"""
src/inspect_data.py

Purpose:
Load the selected raw datasets and report their structure and quality.

Selected solar dataset:
Plant 2 Generation Data

No cleaning or modification is performed here.
"""

import pandas as pd
from pathlib import Path


# Path to data/raw
THIS_DIR = Path(__file__).resolve().parent
RAW_DIR = THIS_DIR.parent / "data" / "raw"


def load_raw_datasets():
    """
    Load the selected raw datasets.

    Plant 2 is the only solar-generation dataset used
    in this project.
    """

    solar = pd.read_csv(
        RAW_DIR / "Plant_2_Generation_Data.csv"
    )

    load = pd.read_excel(
        RAW_DIR / "hourlyLoadDataIndia.xlsx"
    )

    temp = pd.read_excel(
        RAW_DIR / "monthly_temp.xlsx"
    )

    return solar, load, temp


def inspect_dataframe(df, name):
    """
    Print a standard inspection report for one dataframe.
    """

    print("=" * 70)
    print(f"DATASET: {name}")
    print("=" * 70)

    print(f"Shape: {df.shape}")

    print(f"\nColumns: {list(df.columns)}")

    print(f"\nDtypes:\n{df.dtypes}")

    print(f"\nMissing values:\n{df.isnull().sum()}")

    print(f"\nDuplicate rows: {df.duplicated().sum()}")

    print(f"\nHead:\n{df.head()}")

    print("\n")


def main():

    solar, load, temp = load_raw_datasets()

    inspect_dataframe(
        solar,
        "Plant 2 Solar Generation"
    )

    inspect_dataframe(
        load,
        "Hourly Grid Load (India)"
    )

    inspect_dataframe(
        temp,
        "Monthly Temperature"
    )


if __name__ == "__main__":
    main()