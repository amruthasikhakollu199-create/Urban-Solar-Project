from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
from typing import Optional
import os
import logging
import requests
import joblib
from dotenv import load_dotenv


# ============================================================
# ENV & LOGGING
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env files
load_dotenv()
load_dotenv(BASE_DIR / ".." / "frontend" / ".env")
load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger("uvicorn.error")


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
# SUPABASE HELPER
# ============================================================

def save_to_supabase(table_name: str, payload: dict, auth_header: Optional[str] = None):
    """
    Saves prediction record to Supabase table via PostgREST API.
    If database saving fails, logs the error clearly and returns None,
    ensuring the API endpoint never crashes or hides the prediction result.
    """
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
    )

    if not supabase_url or not supabase_key:
        logger.warning(f"Supabase URL or Key not set. Skipping DB save for table '{table_name}'.")
        return None

    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/{table_name}"

    token = auth_header if auth_header else f"Bearer {supabase_key}"
    if auth_header and not auth_header.startswith("Bearer "):
        token = f"Bearer {auth_header}"

    headers = {
        "apikey": supabase_key,
        "Authorization": token,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    try:
        res = requests.post(endpoint, json=payload, headers=headers, timeout=10)
        if res.status_code in (200, 201):
            logger.info(f"Successfully saved prediction record to '{table_name}' table in Supabase.")
            return res.json()
        else:
            logger.error(f"Failed to save to Supabase '{table_name}': HTTP {res.status_code} - {res.text}")
    except Exception as exc:
        logger.error(f"Exception encountered while saving to Supabase '{table_name}': {exc}")

    return None


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
    / "gradient_boosting_solar_6_features.pkl"
).resolve()

if not SOLAR_MODEL_PATH.exists():
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
# REQUEST SCHEMAS
# ============================================================

class PredictionRequest(BaseModel):
    date: str
    time: str
    solarPower: float
    loadLag1: float
    loadLag24: float
    rollingMean3: float
    rollingMean24: float
    user_id: Optional[str] = None


class SolarPredictionRequest(BaseModel):
    temperature: float
    humidity: float
    cloud_cover: float
    shortwave_radiation: float
    zenith: float
    angle_of_incidence: float
    user_id: Optional[str] = None


class GridPredictionRequest(BaseModel):
    solar_power: float
    consumption: float
    forecast_period: float
    user_id: Optional[str] = None


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Urban Solar Grid Load Forecasting API is running"
    }


# ============================================================
# GRID LOAD PREDICTION (ML Model)
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
def predict_solar(data: SolarPredictionRequest, authorization: Optional[str] = Header(None)):

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
    predicted_power = round(float(prediction), 2)

    # Save to Supabase if user_id is provided
    if data.user_id:
        db_payload = {
            "user_id": data.user_id,
            "temperature": data.temperature,
            "humidity": data.humidity,
            "cloud_cover": data.cloud_cover,
            "shortwave_radiation": data.shortwave_radiation,
            "zenith": data.zenith,
            "angle_of_incidence": data.angle_of_incidence,
            "predicted_power": predicted_power
        }
        save_to_supabase("solar_predictions", db_payload, authorization)

    return {
        "predicted_solar_power": predicted_power
    }


# ============================================================
# GRID PREDICTION (Power Balance & Energy Balance)
# ============================================================

@app.post("/predict-grid")
def predict_grid(data: GridPredictionRequest, authorization: Optional[str] = Header(None)):

    solar = float(data.solar_power)
    consumed = float(data.consumption)
    days = float(data.forecast_period)

    power_balance = round(solar - consumed, 2)
    energy_balance = round(power_balance * 24 * days, 2)

    # Save to Supabase if user_id is provided
    if data.user_id:
        db_payload = {
            "user_id": data.user_id,
            "solar_power": solar,
            "consumption": consumed,
            "forecast_period": days,
            "power_balance": power_balance,
            "energy_balance": energy_balance
        }
        save_to_supabase("grid_predictions", db_payload, authorization)

    return {
        "solar": solar,
        "consumed": consumed,
        "days": days,
        "powerBalance": power_balance,
        "energyBalance": energy_balance
    }