"""
modeling/evaluate_model.py

Evaluate trained models for National Hourly Demand forecasting.

Metrics:
- MAE  : Mean Absolute Error
- RMSE : Root Mean Squared Error
- R²   : R-squared

The models are evaluated on the chronological test set used
during model training.
"""

import pandas as pd
import joblib

from pathlib import Path

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

THIS_DIR = Path(__file__).resolve().parent

PROCESSED_DIR = THIS_DIR.parent / "data" / "processed"
MODEL_DIR = THIS_DIR / "models"

INPUT_FILE = PROCESSED_DIR / "model_ready_dataset.csv"


# ------------------------------------------------------------
# LOAD DATA
# ------------------------------------------------------------

def load_data():

    df = pd.read_csv(INPUT_FILE)

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

    X = df[feature_columns]
    y = df[target_column]

    # Same chronological 80/20 split used during training
    split_index = int(len(df) * 0.80)

    X_test = X.iloc[split_index:].copy()
    y_test = y.iloc[split_index:].copy()

    return X_test, y_test


# ------------------------------------------------------------
# LOAD TRAINED MODELS
# ------------------------------------------------------------

def load_models():

    model_names = [
        "linear_regression",
        "random_forest",
        "gradient_boosting"
    ]

    models = {}

    for name in model_names:

        model_file = MODEL_DIR / f"{name}.pkl"

        models[name] = joblib.load(model_file)

    return models


# ------------------------------------------------------------
# EVALUATE MODELS
# ------------------------------------------------------------

def evaluate_models(models, X_test, y_test):

    results = []

    print("=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)

    for name, model in models.items():

        predictions = model.predict(X_test)

        mae = mean_absolute_error(
            y_test,
            predictions
        )

        rmse = mean_squared_error(
            y_test,
            predictions
        ) ** 0.5

        r2 = r2_score(
            y_test,
            predictions
        )

        results.append({
            "Model": name,
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2
        })

    results_df = pd.DataFrame(results)

    return results_df


# ------------------------------------------------------------
# DISPLAY RESULTS
# ------------------------------------------------------------

def display_results(results_df):

    print("\n" + "=" * 60)
    print("MODEL COMPARISON")
    print("=" * 60)

    print(
        results_df.to_string(
            index=False,
            float_format=lambda x: f"{x:,.4f}"
        )
    )

    # Best model based on lowest RMSE
    best_index = results_df["RMSE"].idxmin()

    best_model = results_df.loc[
        best_index,
        "Model"
    ]

    print("\n" + "=" * 60)
    print("BEST MODEL")
    print("=" * 60)

    print(f"\nBest model based on lowest RMSE: {best_model}")

    return best_model


# ------------------------------------------------------------
# SAVE RESULTS
# ------------------------------------------------------------

def save_results(results_df):

    output_file = MODEL_DIR / "model_comparison.csv"

    results_df.to_csv(
        output_file,
        index=False
    )

    print("\nResults saved to:")
    print(output_file)


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------

def main():

    print("=" * 60)
    print("NATIONAL HOURLY DEMAND MODEL EVALUATION")
    print("=" * 60)

    # Load dataset
    df = load_data()

    print("\nDataset shape:")
    print(df.shape)

    # Prepare test data
    X_test, y_test = prepare_test_data(df)

    print("\nTest rows:")
    print(len(X_test))

    # Load trained models
    models = load_models()

    # Evaluate
    results_df = evaluate_models(
        models,
        X_test,
        y_test
    )

    # Display
    best_model = display_results(
        results_df
    )

    # Save comparison
    save_results(
        results_df
    )

    print("\n" + "=" * 60)
    print("MODEL EVALUATION COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()