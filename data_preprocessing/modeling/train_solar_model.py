import pandas as pd
import joblib
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ============================================================
# PATHS
# ============================================================

THIS_DIR = Path(__file__).resolve().parent

DATA_PATH = (
    THIS_DIR.parent
    / "data"
    / "processed"
    / "solar_generation_processed.csv"
)

MODEL_DIR = THIS_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("SOLAR POWER GENERATION MODEL TRAINING")
print("=" * 60)

print("\nInput file:")
print(DATA_PATH)

df = pd.read_csv(DATA_PATH)

print("\nDataset shape:")
print(df.shape)


# ============================================================
# FEATURES AND TARGET
# ============================================================

FEATURES = [
    "temperature_2_m_above_gnd",
    "relative_humidity_2_m_above_gnd",
    "mean_sea_level_pressure_MSL",
    "total_precipitation_sfc",
    "snowfall_amount_sfc",
    "total_cloud_cover_sfc",
    "high_cloud_cover_high_cld_lay",
    "medium_cloud_cover_mid_cld_lay",
    "low_cloud_cover_low_cld_lay",
    "shortwave_radiation_backwards_sfc",
    "wind_speed_10_m_above_gnd",
    "wind_direction_10_m_above_gnd",
    "wind_speed_80_m_above_gnd",
    "wind_direction_80_m_above_gnd",
    "wind_speed_900_mb",
    "wind_direction_900_mb",
    "wind_gust_10_m_above_gnd",
    "angle_of_incidence",
    "zenith",
    "azimuth"
]

TARGET = "generated_power_kw"

X = df[FEATURES]
y = df[TARGET]


print("\nFeatures used:")
for feature in FEATURES:
    print(" -", feature)

print("\nTarget:")
print(" -", TARGET)


# ============================================================
# CHRONOLOGICAL TRAIN / TEST SPLIT
# ============================================================

split_index = int(len(df) * 0.80)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]

print("\n" + "=" * 60)
print("CHRONOLOGICAL TRAIN / TEST SPLIT")
print("=" * 60)

print("\nTraining rows:", len(X_train))
print("Testing rows:", len(X_test))


# ============================================================
# MODELS
# ============================================================

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


# ============================================================
# TRAIN + EVALUATE
# ============================================================

results = {}
trained_models = {}

print("\n" + "=" * 60)
print("TRAINING SOLAR MODELS")
print("=" * 60)

for name, model in models.items():

    print(f"\nTraining: {name}")

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(y_test, predictions) ** 0.5
    r2 = r2_score(y_test, predictions)

    results[name] = {
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2
    }

    trained_models[name] = model

    print("Training completed.")
    print(f"MAE:  {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R2:   {r2:.4f}")


# ============================================================
# MODEL COMPARISON
# ============================================================

results_df = pd.DataFrame(results).T

print("\n" + "=" * 60)
print("SOLAR MODEL COMPARISON")
print("=" * 60)

print(results_df)


# ============================================================
# SELECT BEST MODEL
# ============================================================

best_model_name = results_df["RMSE"].idxmin()
best_model = trained_models[best_model_name]

print("\n" + "=" * 60)
print("BEST SOLAR MODEL")
print("=" * 60)

print("\nBest model based on lowest RMSE:")
print(best_model_name)


# ============================================================
# SAVE ALL MODELS
# ============================================================

for name, model in trained_models.items():

    model_path = MODEL_DIR / f"{name}_solar.pkl"

    joblib.dump(model, model_path)

    print(f"Saved: {model_path}")


# ============================================================
# SAVE BEST MODEL
# ============================================================

best_model_path = MODEL_DIR / "solar_model.pkl"

joblib.dump(best_model, best_model_path)

print("\nBest model saved to:")
print(best_model_path)


# ============================================================
# SAVE MODEL COMPARISON
# ============================================================

comparison_path = MODEL_DIR / "solar_model_comparison.csv"

results_df.to_csv(comparison_path)

print("\nModel comparison saved to:")
print(comparison_path)


print("\n" + "=" * 60)
print("SOLAR MODEL TRAINING COMPLETED")
print("=" * 60)