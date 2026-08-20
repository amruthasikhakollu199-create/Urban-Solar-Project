"""
src/preprocessing.py

Preprocessing pipeline for the solar + grid-load datasets.

Steps:
1. Load cleaned solar data
2. Convert 15-minute solar data to hourly plant-level generation
3. Load cleaned grid-load data
4. Merge solar generation with national grid demand
5. Save the combined ML-ready base dataset
"""

import pandas as pd
from pathlib import Path


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

THIS_DIR = Path(__file__).resolve().parent
PROJECT_DIR = THIS_DIR.parent

PROCESSED_DIR = PROJECT_DIR / "data" / "processed"

SOLAR_FILE = PROCESSED_DIR / "solar_cleaned.csv"
LOAD_FILE = PROCESSED_DIR / "load_cleaned.csv"

OUTPUT_FILE = (
    PROCESSED_DIR / "solar_grid_combined.csv"
)


# ---------------------------------------------------------
# LOAD CLEANED DATA
# ---------------------------------------------------------

def load_cleaned_data():

    solar = pd.read_csv(
        SOLAR_FILE,
        parse_dates=["DATE_TIME"]
    )

    load = pd.read_csv(
        LOAD_FILE,
        parse_dates=["datetime"]
    )

    return solar, load


# ---------------------------------------------------------
# SOLAR: 15-MINUTE → HOURLY
# ---------------------------------------------------------

def aggregate_solar_hourly(solar):
    """
    Convert 15-minute inverter-level solar data
    into hourly plant-level solar generation.

    AC_POWER is used as the generation measure.

    First, inverter AC_POWER values are summed for each
    timestamp to get plant-level generation.

    Then the 15-minute plant-level values are averaged
    within each hour.
    """

    solar = solar.copy()

    # Plant-level generation at each 15-minute timestamp
    plant_15min = (
        solar
        .groupby("DATE_TIME")["AC_POWER"]
        .sum(min_count=1)
        .reset_index()
    )

    plant_15min.rename(
        columns={
            "AC_POWER": "Solar_AC_Power"
        },
        inplace=True
    )

    # Convert 15-minute values to hourly values
    plant_hourly = (
        plant_15min
        .set_index("DATE_TIME")
        .resample("1h")
        .mean()
        .reset_index()
    )

    return plant_hourly


# ---------------------------------------------------------
# MERGE SOLAR + GRID LOAD
# ---------------------------------------------------------

def merge_solar_and_load(
    solar_hourly,
    load
):
    """
    Merge hourly solar generation with
    national hourly grid demand.
    """

    # Rename load datetime so both datasets
    # use the same column name.
    load = load.rename(
        columns={
            "datetime": "DATE_TIME"
        }
    )

    merged = pd.merge(
        solar_hourly,
        load,
        on="DATE_TIME",
        how="inner"
    )

    merged = merged.sort_values(
        "DATE_TIME"
    ).reset_index(drop=True)

    return merged


# ---------------------------------------------------------
# VALIDATION
# ---------------------------------------------------------

def validate_combined_data(df):

    print("\n" + "=" * 60)
    print("COMBINED DATA VALIDATION")
    print("=" * 60)

    print(
        "Shape:",
        df.shape
    )

    print(
        "\nColumns:",
        list(df.columns)
    )

    print(
        "\nDate range:",
        df["DATE_TIME"].min(),
        "to",
        df["DATE_TIME"].max()
    )

    print("\nMissing values:")

    print(
        df.isna().sum()
    )

    print(
        "\nDuplicate rows:",
        df.duplicated().sum()
    )

    print(
        "Duplicate timestamps:",
        df["DATE_TIME"].duplicated().sum()
    )

    print(
        "\nFirst 5 rows:"
    )

    print(
        df.head()
    )


# ---------------------------------------------------------
# SAVE
# ---------------------------------------------------------

def save_combined_data(df):

    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\n" + "=" * 60)
    print("COMBINED DATA SAVED")
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
    print("SOLAR + GRID PREPROCESSING")
    print("=" * 60)

    # Load cleaned datasets
    solar, load = load_cleaned_data()

    print(
        f"\nSolar rows: {len(solar)}"
    )

    print(
        f"Load rows: {len(load)}"
    )

    # 15-minute → hourly solar
    solar_hourly = aggregate_solar_hourly(
        solar
    )

    print(
        f"\nHourly solar rows: "
        f"{len(solar_hourly)}"
    )

    print(
        "\nHourly solar date range:",
        solar_hourly["DATE_TIME"].min(),
        "to",
        solar_hourly["DATE_TIME"].max()
    )

    # Merge
    combined = merge_solar_and_load(
        solar_hourly,
        load
    )

    # Validate
    validate_combined_data(
        combined
    )

    # Save
    save_combined_data(
        combined
    )

    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()