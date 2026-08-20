"""
modeling/plot_predictions.py

Plot actual vs predicted National Hourly Demand
using the final Gradient Boosting model predictions.
"""

import pandas as pd
import matplotlib.pyplot as plt

from pathlib import Path


# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

THIS_DIR = Path(__file__).resolve().parent
MODEL_DIR = THIS_DIR / "models"

INPUT_FILE = MODEL_DIR / "test_predictions.csv"


# ------------------------------------------------------------
# LOAD PREDICTIONS
# ------------------------------------------------------------

def load_predictions():

    df = pd.read_csv(INPUT_FILE)

    df["DATE_TIME"] = pd.to_datetime(df["DATE_TIME"])

    return df


# ------------------------------------------------------------
# PLOT ACTUAL VS PREDICTED
# ------------------------------------------------------------

def plot_predictions(df):

    plt.figure(figsize=(14, 6))

    plt.plot(
        df["DATE_TIME"],
        df["National Hourly Demand"],
        label="Actual Demand"
    )

    plt.plot(
        df["DATE_TIME"],
        df["Predicted_Demand"],
        label="Predicted Demand"
    )

    plt.title(
        "Actual vs Predicted National Hourly Demand"
    )

    plt.xlabel("Date and Time")

    plt.ylabel("National Hourly Demand")

    plt.legend()

    plt.xticks(rotation=45)

    plt.grid(True)

    plt.tight_layout()

    plt.show()


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------

def main():

    print("=" * 60)
    print("ACTUAL VS PREDICTED DEMAND")
    print("=" * 60)

    df = load_predictions()

    print("\nPrediction data shape:")
    print(df.shape)

    print("\nGenerating graph...")

    plot_predictions(df)

    print("\nPlot generated successfully.")


if __name__ == "__main__":
    main()