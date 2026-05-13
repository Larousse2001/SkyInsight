"""Path configuration for SkyInsight web app backend."""
from __future__ import annotations

from pathlib import Path

# Repo root = parent of 11_WebApp
REPO_ROOT = Path(__file__).resolve().parents[3]
REPORTS_DIR = REPO_ROOT / "09_Reports"

# Model paths (ONNX) sourced from 09_Reports
MODEL_PATHS = {
    "churn":        REPORTS_DIR / "[ML] Airline Customer Churn Prediction" / "best_churn_model.onnx",
    "satisfaction": REPORTS_DIR / "[ML] Airline Customer Satisfaction"     / "best_satisfaction_model.onnx",
    "delay":        REPORTS_DIR / "[ANN] Airlines Delay"                   / "best_skyinsight_model.onnx",
    "cabin":        REPORTS_DIR / "[CNN] Computer Vision"                  / "cabin_cleanliness_best.onnx",
    "crowd":        REPORTS_DIR / "[CNN] Computer Vision"                  / "crowd_best.onnx",
    "luggage":      REPORTS_DIR / "[CNN] Computer Vision"                  / "luggage_best.onnx",
}

# CNN class labels (from training/prediction csvs)
CNN_CLASSES = {
    "cabin":   ["Clean", "Dirty"],
    "crowd":   ["high_crowd", "low_crowd"],
    "luggage": ["damaged_luggage", "good_luggage"],
}

# Tabular feature order (from onnx_feature_order.csv files)
SATISFACTION_FEATURES = [
    "num__online_boarding", "num__inflight_wifi_service", "cat__class_Business",
    "cat__type_of_travel_Business", "cat__type_of_travel_Personal",
    "num__inflight_entertainment", "num__seat_comfort", "num__ease_of_online_booking",
    "cat__class_Economy", "num__leg_room_service", "cat__customer_type_First-time",
    "num__flight_distance", "num__age", "num__age_distance_interaction",
    "num__onboard_service", "num__cleanliness", "num__checkin_service",
    "num__baggage_handling", "cat__customer_type_Returning", "num__inflight_service",
    "num__departure_and_arrival_time_convenience", "num__gate_location",
    "num__food_and_drink", "num__total_delay", "num__departure_delay",
    "cat__gender_Female", "cat__gender_Male", "cat__class_Economy Plus",
    "num__delay_flag", "num__arrival_delay",
]

DELAY_FEATURES = [
    "year", "month", "arr_flights", "arr_del15", "carrier_ct", "weather_ct",
    "nas_ct", "security_ct", "late_aircraft_ct", "arr_cancelled", "arr_diverted",
    "arr_delay", "carrier_delay", "weather_delay", "nas_delay",
    "security_delay", "late_aircraft_delay",
]
