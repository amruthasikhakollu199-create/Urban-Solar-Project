from fastapi import FastAPI, Header, HTTPException, status
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


# ============================================================
# ACCOUNT MANAGEMENT (Secure User & Data Deletion)
# ============================================================

@app.delete("/auth/delete-account")
@app.post("/auth/delete-account")
def delete_account(authorization: Optional[str] = Header(None)):
    """
    Securely deletes the authenticated user from Supabase Auth and removes
    their associated data (power_plants, solar_predictions, grid_predictions).

    Security:
    - Requires Bearer JWT token from the logged-in user.
    - Token is verified against Supabase Auth.
    - Only the user identified by the token is deleted.
    - Admin deletion is executed server-side using the SUPABASE_SERVICE_ROLE_KEY.
    - No service_role key is ever exposed to the client.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required."
        )

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is missing."
        )

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    anon_key = (
        os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
        or os.getenv("SUPABASE_KEY")
    )
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url:
        logger.error("Supabase URL is not configured on the backend.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database service URL is not configured on the server."
        )

    # 1. Verify user identity with Supabase Auth
    verify_endpoint = f"{supabase_url.rstrip('/')}/auth/v1/user"
    verify_headers = {
        "apikey": anon_key or service_key,
        "Authorization": f"Bearer {token}"
    }

    try:
        verify_res = requests.get(verify_endpoint, headers=verify_headers, timeout=10)
    except Exception as exc:
        logger.error(f"Error connecting to Supabase for token verification: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not connect to authentication service."
        )

    if verify_res.status_code != 200:
        logger.warning(f"Unauthorized delete attempt: status {verify_res.status_code}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please sign in again."
        )

    user_data = verify_res.json()
    user_id = user_data.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not determine user identity from session."
        )

    logger.info(f"Verified user {user_id} requested account deletion.")

    # 2. Explicitly remove user data from tables (solar_predictions, grid_predictions, power_plants)
    db_headers = {
        "apikey": service_key or anon_key,
        "Authorization": f"Bearer {service_key or token}",
        "Content-Type": "application/json"
    }

    for table in ["solar_predictions", "grid_predictions", "power_plants"]:
        try:
            del_endpoint = f"{supabase_url.rstrip('/')}/rest/v1/{table}?user_id=eq.{user_id}"
            res = requests.delete(del_endpoint, headers=db_headers, timeout=10)
            if res.status_code in (200, 204):
                logger.info(f"Cleaned up records from '{table}' for user {user_id}.")
            else:
                logger.debug(f"Table cleanup for '{table}' returned status {res.status_code}")
        except Exception as exc:
            logger.warning(f"Notice while cleaning table '{table}': {exc}")

    # 3. Permanently delete user from Supabase Auth admin API if service_key available
    if service_key:
        admin_endpoint = f"{supabase_url.rstrip('/')}/auth/v1/admin/users/{user_id}"
        admin_headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}"
        }
        try:
            admin_res = requests.delete(admin_endpoint, headers=admin_headers, timeout=10)
            if admin_res.status_code not in (200, 204):
                logger.error(
                    f"Supabase Admin API user deletion failed: {admin_res.status_code} - {admin_res.text}"
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to permanently delete user from authentication provider."
                )
            logger.info(f"Successfully deleted user {user_id} from Supabase Auth.")
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Exception calling Supabase admin delete: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while deleting the account."
            )
    else:
        # If service_role key is not configured, attempt calling the Postgres RPC delete_user
        rpc_endpoint = f"{supabase_url.rstrip('/')}/rest/v1/rpc/delete_user"
        rpc_headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        try:
            rpc_res = requests.post(rpc_endpoint, headers=rpc_headers, json={}, timeout=10)
            if rpc_res.status_code in (200, 204):
                logger.info(f"Successfully deleted user {user_id} via delete_user RPC.")
            else:
                logger.error(f"delete_user RPC returned status {rpc_res.status_code}: {rpc_res.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="SUPABASE_SERVICE_ROLE_KEY is not configured in backend and delete_user() SQL function is not installed in Supabase."
                )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Error calling delete_user RPC from backend: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete user account: {exc}"
            )

    return {
        "success": True,
        "message": "Account and associated data deleted successfully.",
        "user_id": user_id
    }