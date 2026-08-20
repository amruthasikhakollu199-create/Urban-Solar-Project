"""
modeling/train_model.py

Train machine-learning models for National Hourly Demand forecasting.

Input:
    data/processed/model_ready_dataset.csv

Target:
    National Hourly Demand

Uses chronological train/test splitting to avoid time-series data leakage.
"""

import pandas as pd
import joblib

from pathlib import Path

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.ensemble import GradientBoostingRegressor


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

    print("=" * 60)
    print("MODEL TRAINING")
    print("=" * 60)

    print("\nInput file:")
    print(INPUT_FILE)

    print("\nDataset shape:")
    print(df.shape)

    return df


# ------------------------------------------------------------
# PREPARE FEATURES AND TARGET
# ------------------------------------------------------------

def prepare_data(df):

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

    return X, y, feature_columns


# ------------------------------------------------------------
# CHRONOLOGICAL TRAIN/TEST SPLIT
# ------------------------------------------------------------

def chronological_split(X, y, train_ratio=0.80):

    split_index = int(len(X) * train_ratio)

    X_train = X.iloc[:split_index].copy()
    X_test = X.iloc[split_index:].copy()

    y_train = y.iloc[:split_index].copy()
    y_test = y.iloc[split_index:].copy()

    print("\n" + "=" * 60)
    print("CHRONOLOGICAL TRAIN / TEST SPLIT")
    print("=" * 60)

    print("\nTraining rows:", len(X_train))
    print("Testing rows:", len(X_test))

    return X_train, X_test, y_train, y_test


# ------------------------------------------------------------
# TRAIN MODELS
# ------------------------------------------------------------

def train_models(X_train, y_train):

    models = {

        "linear_regression": LinearRegression(),

        "random_forest": RandomForestRegressor(
            n_estimators=200,
            random_state=42,
            n_jobs=-1
        ),

        "gradient_boosting": GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=3,
            random_state=42
        )
    }

    trained_models = {}

    print("\n" + "=" * 60)
    print("TRAINING MODELS")
    print("=" * 60)

    for name, model in models.items():

        print(f"\nTraining: {name}")

        model.fit(X_train, y_train)

        trained_models[name] = model

        print("Training completed.")

    return trained_models


# ------------------------------------------------------------
# GENERATE TEST PREDICTIONS
# ------------------------------------------------------------

def generate_predictions(trained_models, X_test):

    predictions = {}

    print("\n" + "=" * 60)
    print("GENERATING TEST PREDICTIONS")
    print("=" * 60)

    for name, model in trained_models.items():

        predictions[name] = model.predict(X_test)

        print(f"{name}: predictions generated")

    return predictions


# ------------------------------------------------------------
# SAVE MODELS
# ------------------------------------------------------------

def save_models(trained_models):

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    print("\n" + "=" * 60)
    print("SAVING TRAINED MODELS")
    print("=" * 60)

    for name, model in trained_models.items():

        output_file = MODEL_DIR / f"{name}.pkl"

        joblib.dump(model, output_file)

        print(f"Saved: {output_file}")


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------

def main():

    # Load
    df = load_data()

    # Features + target
    X, y, feature_columns = prepare_data(df)

    print("\nFeatures used:")
    for feature in feature_columns:
        print(" -", feature)

    print("\nTarget:")
    print(" - National Hourly Demand")

    # Chronological split
    X_train, X_test, y_train, y_test = chronological_split(
        X,
        y,
        train_ratio=0.80
    )

    # Train
    trained_models = train_models(
        X_train,
        y_train
    )

    # Predict
    predictions = generate_predictions(
        trained_models,
        X_test
    )

    # Save
    save_models(trained_models)

    print("\n" + "=" * 60)
    print("MODEL TRAINING COMPLETED")
    print("=" * 60)

    print("\nModels trained:")
    for name in trained_models:
        print(" -", name)

    print("\nTest predictions are ready for evaluation.")


if __name__ == "__main__":
    main()