from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
import joblib


app = FastAPI(
    title="Urban Solar Grid Load Forecasting API"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent


# ============================================================
# GRID LOAD MODEL
# ============================================================

MODEL_PATH = (
    BASE_DIR
    / ".."
    / "data_preprocessing"
    / "modeling"
    / "models"
    / "gradient_boosting.pkl"
).resolve()

model = joblib.load(MODEL_PATH)


# ============================================================
# SOLAR POWER MODEL
# ============================================================

SOLAR_MODEL_PATH = (
    BASE_DIR
    / ".."
    / "data_preprocessing"
    / "modeling"
    / "models"
    / "solar_model.pkl"
).resolve()

solar_model = joblib.load(SOLAR_MODEL_PATH)


# ============================================================
# GRID LOAD REQUEST
# ============================================================

class PredictionRequest(BaseModel):
    date: str
    time: str
    solarPower: float
    loadLag1: float
    loadLag24: float
    rollingMean3: float
    rollingMean24: float


# ============================================================
# SOLAR POWER REQUEST
# ============================================================

class SolarPredictionRequest(BaseModel):
    temperature: float
    humidity: float
    cloud_cover: float
    shortwave_radiation: float
    zenith: float
    angle_of_incidence: float


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Urban Solar Grid Load Forecasting API is running"
    }


# ============================================================
# GRID LOAD PREDICTION
# ============================================================

@app.post("/predict")
def predict(data: PredictionRequest):

    # Combine date and time
    date_time = datetime.strptime(
        f"{data.date} {data.time}",
        "%Y-%m-%d %H:%M"
    )

    # Extract date/time features
    hour = date_time.hour
    day_of_week = date_time.weekday()
    day_of_month = date_time.day
    month = date_time.month

    # Features must be in EXACT same order
    # used during Grid model training
    features = [[
        hour,
        day_of_week,
        day_of_month,
        month,
        data.solarPower,
        data.loadLag1,
        data.loadLag24,
        data.rollingMean3,
        data.rollingMean24
    ]]

    prediction = model.predict(features)[0]

    return {
        "predicted_demand": round(float(prediction), 2),
        "date": data.date,
        "time": data.time
    }


# ============================================================
# SOLAR POWER PREDICTION
# ============================================================

@app.post("/predict-solar")
def predict_solar(data: SolarPredictionRequest):

    # Features must be in EXACT same order
    # used during 6-feature Solar model training

    features = [[
        data.temperature,
        data.humidity,
        data.cloud_cover,
        data.shortwave_radiation,
        data.zenith,
        data.angle_of_incidence
    ]]

    prediction = solar_model.predict(features)[0]

    return {
        "predicted_solar_power": round(float(prediction), 2)
    }