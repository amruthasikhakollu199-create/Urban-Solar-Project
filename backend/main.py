from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
import joblib


app = FastAPI(
    title="Urban Solar Grid Load Forecasting API"
)


# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Find the trained model
BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR
    / ".."
    / "data_preprocessing"
    / "modeling"
    / "models"
    / "gradient_boosting.pkl"
).resolve()


# Load trained Gradient Boosting model
model = joblib.load(MODEL_PATH)


class PredictionRequest(BaseModel):
    date: str
    time: str
    solarPower: float
    loadLag1: float
    loadLag24: float
    rollingMean3: float
    rollingMean24: float


@app.get("/")
def root():
    return {
        "message": "Urban Solar Grid Load Forecasting API is running"
    }


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

    # Features must be in EXACT same order used during training
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