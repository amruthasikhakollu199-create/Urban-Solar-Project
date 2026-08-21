import pandas as pd
import joblib
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

THIS_DIR = Path(__file__).resolve().parent

MODEL_PATH = THIS_DIR / "models" / "solar_model.pkl"
DATA_PATH = (
    THIS_DIR.parent
    / "data"
    / "processed"
    / "solar_generation_processed.csv"
)


# ============================================================
# 6 FEATURES
# ============================================================

FEATURES = [
    "temperature_2_m_above_gnd",
    "relative_humidity_2_m_above_gnd",
    "total_cloud_cover_sfc",
    "shortwave_radiation_backwards_sfc",
    "zenith",
    "angle_of_incidence"
]


# ============================================================
# LOAD MODEL
# ============================================================

model = joblib.load(MODEL_PATH)

print("=" * 50)
print("SOLAR MODEL PREDICTION TEST")
print("=" * 50)

print("\nModel loaded successfully.")


# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully.")
print("Dataset shape:", df.shape)


# ============================================================
# TAKE ONE SAMPLE
# ============================================================

sample = df[FEATURES].iloc[[0]]

print("\nInput features:")
print(sample.to_string(index=False))


# ============================================================
# PREDICT
# ============================================================

prediction = model.predict(sample)[0]


# ============================================================
# RESULT
# ============================================================

print("\n" + "=" * 50)
print("SOLAR POWER PREDICTION")
print("=" * 50)

print(f"\nPredicted Solar AC Power: {prediction:.2f} kW")

print("\n" + "=" * 50)