"""
src/solar_cleaning.py

Plant 2 Solar Generation Data Cleaning

Steps:
1. Load Plant 2 raw solar data
2. Standardize DATE_TIME
3. Reindex to a complete timestamp × inverter grid
4. Keep genuinely missing measurements as NaN
5. Validate the cleaned dataset
6. Save the cleaned solar dataset

Note:
No power or yield values are artificially invented.
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

OUTPUT_FILE = PROCESSED_DIR / "solar_cleaned.csv"


# ---------------------------------------------------------
# STEP 1: DATE_TIME STANDARDIZATION
# ---------------------------------------------------------

def standardize_datetime(solar):
    """
    Convert Plant 2 DATE_TIME into pandas datetime.

    Plant 2 raw format:
    YYYY-MM-DD HH:MM:SS

    Returns a new dataframe.
    """

    solar_clean = solar.copy()

    solar_clean["DATE_TIME"] = pd.to_datetime(
        solar_clean["DATE_TIME"],
        format="%Y-%m-%d %H:%M:%S"
    )

    return solar_clean


# ---------------------------------------------------------
# STEP 2: MISSING TIMESTAMP INSPECTION
# ---------------------------------------------------------

def find_missing_timestamps(
    df,
    freq="15min"
):
    """
    Find completely missing 15-minute timestamps.

    This function only inspects the data.
    It does not modify the dataframe.
    """

    actual_timestamps = set(
        df["DATE_TIME"].unique()
    )

    expected_timestamps = pd.date_range(
        start=df["DATE_TIME"].min(),
        end=df["DATE_TIME"].max(),
        freq=freq
    )

    missing = sorted(
        set(expected_timestamps)
        - actual_timestamps
    )

    print("\n" + "=" * 60)
    print("STEP 2: MISSING TIMESTAMP INSPECTION")
    print("=" * 60)

    print(
        f"Expected timestamps: "
        f"{len(expected_timestamps)}"
    )

    print(
        f"Actual unique timestamps: "
        f"{len(actual_timestamps)}"
    )

    print(
        f"Missing timestamps: "
        f"{len(missing)}"
    )

    if len(missing) > 0:

        print("\nMissing timestamps:")

        for timestamp in missing:
            print(" ", timestamp)

    return missing


# ---------------------------------------------------------
# STEP 3: COMPLETE TIMESTAMP × INVERTER GRID
# ---------------------------------------------------------

def reindex_to_complete_grid(
    df,
    freq="15min"
):
    """
    Create a complete timestamp × inverter grid.

    If an inverter has no measurement at a timestamp,
    a row is created and measurement columns become NaN.

    No measurement values are invented.
    """

    plant_id_value = df["PLANT_ID"].iloc[0]

    all_source_keys = (
        df["SOURCE_KEY"].unique()
    )

    expected_timestamps = pd.date_range(
        start=df["DATE_TIME"].min(),
        end=df["DATE_TIME"].max(),
        freq=freq
    )

    full_index = pd.MultiIndex.from_product(
        [
            expected_timestamps,
            all_source_keys
        ],
        names=[
            "DATE_TIME",
            "SOURCE_KEY"
        ]
    )

    df_indexed = df.set_index(
        [
            "DATE_TIME",
            "SOURCE_KEY"
        ]
    )

    df_reindexed = (
        df_indexed
        .reindex(full_index)
        .reset_index()
    )

    # PLANT_ID is an identifier, not a measurement.
    # It remains constant for Plant 2.
    df_reindexed["PLANT_ID"] = (
        plant_id_value
    )

    # Put columns in a clean order.
    column_order = [
        "DATE_TIME",
        "PLANT_ID",
        "SOURCE_KEY",
        "DC_POWER",
        "AC_POWER",
        "DAILY_YIELD",
        "TOTAL_YIELD"
    ]

    df_reindexed = (
        df_reindexed[column_order]
    )

    original_rows = len(df)

    new_rows = len(df_reindexed)

    added_rows = (
        new_rows - original_rows
    )

    print("\n" + "=" * 60)
    print("STEP 3: COMPLETE TIMESTAMP × INVERTER GRID")
    print("=" * 60)

    print(
        f"Original rows: {original_rows}"
    )

    print(
        f"Rows after reindexing: {new_rows}"
    )

    print(
        f"New rows created: {added_rows}"
    )

    print("\nMissing values after reindexing:")

    print(
        df_reindexed.isna().sum()
    )

    return df_reindexed


# ---------------------------------------------------------
# STEP 4: MISSING VALUE REPORT
# ---------------------------------------------------------

def report_missing_values(df):
    """
    Report missing values without modifying them.
    """

    print("\n" + "=" * 60)
    print("STEP 4: MISSING VALUE REPORT")
    print("=" * 60)

    missing_counts = (
        df.isna().sum()
    )

    print(missing_counts)

    total_missing = (
        missing_counts.sum()
    )

    print(
        f"\nTotal missing cells: "
        f"{total_missing}"
    )

    missing_rows = (
        df.isna()
        .any(axis=1)
        .sum()
    )

    print(
        f"Rows containing missing values: "
        f"{missing_rows}"
    )

    # Day/night information for missing rows
    missing_rows_df = df[
        df.isna().any(axis=1)
    ]

    if len(missing_rows_df) > 0:

        hours = (
            missing_rows_df["DATE_TIME"]
            .dt.hour
        )

        daytime = (
            (hours >= 6) &
            (hours <= 18)
        ).sum()

        nighttime = len(hours) - daytime

        print(
            f"\nLikely daytime missing rows: "
            f"{daytime}"
        )

        print(
            f"Likely nighttime missing rows: "
            f"{nighttime}"
        )


# ---------------------------------------------------------
# STEP 5: BASIC VALIDATION
# ---------------------------------------------------------

def validate_cleaned_data(df):
    """
    Perform basic validation checks.
    """

    print("\n" + "=" * 60)
    print("STEP 5: FINAL VALIDATION")
    print("=" * 60)

    # Check datetime
    print(
        "DATE_TIME dtype:",
        df["DATE_TIME"].dtype
    )

    # Check chronological order
    print(
        "Chronologically sorted:",
        df["DATE_TIME"].is_monotonic_increasing
    )

    # Check duplicate rows
    print(
        "Duplicate rows:",
        df.duplicated().sum()
    )

    # Check duplicate timestamp + inverter combinations
    duplicate_keys = df.duplicated(
        subset=[
            "DATE_TIME",
            "SOURCE_KEY"
        ]
    ).sum()

    print(
        "Duplicate timestamp-inverter rows:",
        duplicate_keys
    )

    # Check number of plants
    print(
        "Unique PLANT_ID values:",
        df["PLANT_ID"].nunique()
    )

    # Check number of inverters
    print(
        "Unique inverters:",
        df["SOURCE_KEY"].nunique()
    )

    # Check negative power values
    negative_dc = (
        df["DC_POWER"] < 0
    ).sum()

    negative_ac = (
        df["AC_POWER"] < 0
    ).sum()

    print(
        "Negative DC_POWER values:",
        negative_dc
    )

    print(
        "Negative AC_POWER values:",
        negative_ac
    )

    print("\nFinal shape:")

    print(
        df.shape
    )


# ---------------------------------------------------------
# STEP 6: SAVE CLEANED DATA
# ---------------------------------------------------------

def save_cleaned_data(df):
    """
    Save cleaned solar data to data/processed/.
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
    print("STEP 6: DATA SAVED")
    print("=" * 60)

    print(
        f"Saved cleaned solar data to:\n"
        f"{OUTPUT_FILE}"
    )

    print(
        f"Rows saved: {len(df)}"
    )

    print(
        f"Columns saved: {len(df.columns)}"
    )


# ---------------------------------------------------------
# MAIN PIPELINE
# ---------------------------------------------------------

def main():

    print("\n")
    print("=" * 60)
    print("PLANT 2 SOLAR CLEANING PIPELINE")
    print("=" * 60)

    # -----------------------------------------------------
    # Load raw datasets
    # -----------------------------------------------------

    solar, load, temp = (
        load_raw_datasets()
    )

    print(
        f"\nRaw Plant 2 rows: "
        f"{len(solar)}"
    )

    # -----------------------------------------------------
    # Step 1: DATE_TIME standardization
    # -----------------------------------------------------

    solar_clean = (
        standardize_datetime(
            solar
        )
    )

    print("\n" + "=" * 60)
    print("STEP 1: DATE_TIME STANDARDIZATION")
    print("=" * 60)

    print(
        "DATE_TIME dtype:",
        solar_clean["DATE_TIME"].dtype
    )

    print(
        "Date range:",
        solar_clean["DATE_TIME"].min(),
        "to",
        solar_clean["DATE_TIME"].max()
    )

    # -----------------------------------------------------
    # Step 2: Missing timestamp inspection
    # -----------------------------------------------------

    find_missing_timestamps(
        solar_clean
    )

    # -----------------------------------------------------
    # Step 3: Complete timestamp × inverter grid
    # -----------------------------------------------------

    solar_reindexed = (
        reindex_to_complete_grid(
            solar_clean
        )
    )

    # -----------------------------------------------------
    # Step 4: Missing value report
    # -----------------------------------------------------

    report_missing_values(
        solar_reindexed
    )

    # -----------------------------------------------------
    # Step 5: Validation
    # -----------------------------------------------------

    validate_cleaned_data(
        solar_reindexed
    )

    # -----------------------------------------------------
    # Step 6: Save
    # -----------------------------------------------------

    save_cleaned_data(
        solar_reindexed
    )

    print("\n")
    print("=" * 60)
    print("SOLAR CLEANING COMPLETED")
    print("=" * 60)


# ---------------------------------------------------------
# RUN
# ---------------------------------------------------------

if __name__ == "__main__":
    main()