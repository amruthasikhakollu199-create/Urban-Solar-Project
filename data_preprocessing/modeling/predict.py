"""
modeling/predict.py

Generate predictions using the selected Gradient Boosting model
and compare actual vs predicted National Hourly Demand.
"""

import pandas as pd
import joblib

from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error


# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

THIS_DIR = Path(__file__).resolve().parent

PROCESSED_DIR = THIS_DIR.parent / "data" / "processed"
MODEL_DIR = THIS_DIR / "models"

DATA_FILE = PROCESSED_DIR / "model_ready_dataset.csv"
MODEL_FILE = MODEL_DIR / "gradient_boosting.pkl"
OUTPUT_FILE = MODEL_DIR / "test_predictions.csv"


# ------------------------------------------------------------
# LOAD DATA
# ------------------------------------------------------------

def load_data():

    df = pd.read_csv(DATA_FILE)

    df["DATE_TIME"] = pd.to_datetime(df["DATE_TIME"])

    df = df.sort_values("DATE_TIME").reset_index(drop=True)

    return df


# ------------------------------------------------------------
# PREPARE TEST DATA
# ------------------------------------------------------------

def prepare_test_data(df):

    feature_columns = [
        "hour",
        "day_of_week",
        "day_of_month",
        "month",
        "Solar_AC_Power",
        "load_lag_1",
        "load_lag_24",
        "rolling_mean_3",
        "rolling_mean_24",
    ]

    target_column = "National Hourly Demand"

    split_index = int(len(df) * 0.80)

    test_df = df.iloc[split_index:].copy()

    X_test = test_df[feature_columns]
    y_test = test_df[target_column]

    return test_df, X_test, y_test


# ------------------------------------------------------------
# GENERATE PREDICTIONS
# ------------------------------------------------------------

def generate_predictions(model, X_test):

    predictions = model.predict(X_test)

    return predictions


# ------------------------------------------------------------
# SAVE PREDICTIONS
# ------------------------------------------------------------

def save_predictions(test_df, predictions):

    result = test_df[
        ["DATE_TIME", "National Hourly Demand"]
    ].copy()

    result["Predicted_Demand"] = predictions

    result.to_csv(
        OUTPUT_FILE,
        index=False
    )

    return result


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------

def main():

    print("=" * 60)
    print("GRADIENT BOOSTING DEMAND PREDICTION")
    print("=" * 60)

    # Load dataset
    df = load_data()

    print("\nDataset shape:")
    print(df.shape)

    # Prepare test data
    test_df, X_test, y_test = prepare_test_data(df)

    print("\nTest rows:")
    print(len(X_test))

    # Load selected model
    model = joblib.load(MODEL_FILE)

    print("\nLoaded model:")
    print(MODEL_FILE)

    # Generate predictions
    predictions = generate_predictions(
        model,
        X_test
    )

    # Save predictions
    result = save_predictions(
        test_df,
        predictions
    )

    # Calculate errors
    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = mean_squared_error(
        y_test,
        predictions
    ) ** 0.5

    print("\n" + "=" * 60)
    print("PREDICTION RESULTS")
    print("=" * 60)

    print(f"\nMAE:  {mae:,.2f}")
    print(f"RMSE: {rmse:,.2f}")

    print("\nFirst 10 predictions:")
    print(result.head(10).to_string(index=False))

    print("\nPredictions saved to:")
    print(OUTPUT_FILE)

    print("\n" + "=" * 60)
    print("PREDICTION COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()