"""
Train a satisfaction classifier and export it as an ONNX model.
Matches the 30-feature vector built by _vec_from_satisfaction() in inference.py.
"""
import csv as _csv
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

ROOT = Path(__file__).parent

# ── Column schema ─────────────────────────────────────────────────────────────
SCHEMA_COLUMNS = [
    "id", "gender", "age", "customer_type", "type_of_travel", "class",
    "flight_distance", "departure_delay", "arrival_delay",
    "departure_and_arrival_time_convenience", "ease_of_online_booking",
    "checkin_service", "online_boarding", "gate_location", "onboard_service",
    "seat_comfort", "leg_room_service", "cleanliness", "food_and_drink",
    "inflight_service", "inflight_wifi_service", "inflight_entertainment",
    "baggage_handling", "satisfaction", "satisfaction_sk",
]

# ── Feature order must match SATISFACTION_FEATURES in config.py ───────────────
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

# ── Load CSV ───────────────────────────────────────────────────────────────────
csv_path = ROOT / "07_ML" / "Airline Customer Satisfaction" / "Fact_Satisfaction_clean.csv"
print(f"Loading: {csv_path}")

# Detect whether the file already has a header row
with open(csv_path, newline="", encoding="utf-8-sig") as f:
    first_row = next(_csv.reader(f))

if first_row[0].strip().lower() == "id":
    df = pd.read_csv(csv_path)
    print("Header detected — read normally.")
else:
    # 26 columns in file: first is a numeric row-index, then 25 SCHEMA_COLUMNS
    df = pd.read_csv(csv_path, header=None, names=["_idx"] + SCHEMA_COLUMNS, index_col=0)
    print("No header — column names injected.")

print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print(f"satisfaction values: {df['satisfaction'].unique()}")

# ── Build feature matrix ───────────────────────────────────────────────────────
def build_features(df: pd.DataFrame) -> pd.DataFrame:
    d = pd.DataFrame(index=df.index)
    d["num__online_boarding"]   = pd.to_numeric(df["online_boarding"], errors="coerce")
    d["num__inflight_wifi_service"] = pd.to_numeric(df["inflight_wifi_service"], errors="coerce")
    d["cat__class_Business"]    = (df["class"] == "Business").astype(float)
    d["cat__type_of_travel_Business"] = (df["type_of_travel"] == "Business").astype(float)
    d["cat__type_of_travel_Personal"] = (df["type_of_travel"] == "Personal").astype(float)
    d["num__inflight_entertainment"] = pd.to_numeric(df["inflight_entertainment"], errors="coerce")
    d["num__seat_comfort"]      = pd.to_numeric(df["seat_comfort"], errors="coerce")
    d["num__ease_of_online_booking"] = pd.to_numeric(df["ease_of_online_booking"], errors="coerce")
    d["cat__class_Economy"]     = (df["class"] == "Economy").astype(float)
    d["num__leg_room_service"]  = pd.to_numeric(df["leg_room_service"], errors="coerce")
    d["cat__customer_type_First-time"] = (df["customer_type"] == "First-time").astype(float)
    d["num__flight_distance"]   = pd.to_numeric(df["flight_distance"], errors="coerce")
    d["num__age"]               = pd.to_numeric(df["age"], errors="coerce")
    d["num__age_distance_interaction"] = d["num__age"] * d["num__flight_distance"]
    d["num__onboard_service"]   = pd.to_numeric(df["onboard_service"], errors="coerce")
    d["num__cleanliness"]       = pd.to_numeric(df["cleanliness"], errors="coerce")
    d["num__checkin_service"]   = pd.to_numeric(df["checkin_service"], errors="coerce")
    d["num__baggage_handling"]  = pd.to_numeric(df["baggage_handling"], errors="coerce")
    d["cat__customer_type_Returning"] = (df["customer_type"] == "Returning").astype(float)
    d["num__inflight_service"]  = pd.to_numeric(df["inflight_service"], errors="coerce")
    d["num__departure_and_arrival_time_convenience"] = pd.to_numeric(
        df["departure_and_arrival_time_convenience"], errors="coerce")
    d["num__gate_location"]     = pd.to_numeric(df["gate_location"], errors="coerce")
    d["num__food_and_drink"]    = pd.to_numeric(df["food_and_drink"], errors="coerce")
    dep = pd.to_numeric(df["departure_delay"], errors="coerce")
    arr = pd.to_numeric(df["arrival_delay"], errors="coerce")
    d["num__total_delay"]       = dep + arr
    d["num__departure_delay"]   = dep
    d["cat__gender_Female"]     = (df["gender"] == "Female").astype(float)
    d["cat__gender_Male"]       = (df["gender"] == "Male").astype(float)
    d["cat__class_Economy Plus"] = (df["class"] == "Economy Plus").astype(float)
    d["num__delay_flag"]        = ((dep + arr) > 15).astype(float)
    d["num__arrival_delay"]     = arr
    return d[SATISFACTION_FEATURES]

X = build_features(df)
y = (df["satisfaction"].str.strip().str.lower() == "satisfied").astype(int)

# Drop rows with NaN
mask = X.notna().all(axis=1) & y.notna()
X, y = X[mask].astype(np.float32), y[mask]
print(f"Training rows: {len(X)}, class balance: {y.value_counts().to_dict()}")

# ── Train ──────────────────────────────────────────────────────────────────────
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("clf",    LogisticRegression(max_iter=1000, C=1.0, random_state=42)),
])
pipe.fit(X, y)
print("Training complete.")

# Quick accuracy check
from sklearn.metrics import accuracy_score
print(f"Train accuracy: {accuracy_score(y, pipe.predict(X)):.4f}")

# ── Export ONNX ────────────────────────────────────────────────────────────────
initial_type = [("float_input", FloatTensorType([None, len(SATISFACTION_FEATURES)]))]
onnx_model = convert_sklearn(pipe, initial_types=initial_type, target_opset=17)

out_path = ROOT / "09_Reports" / "[ML] Airline Customer Satisfaction" / "best_satisfaction_model.onnx"
out_path.parent.mkdir(parents=True, exist_ok=True)
with open(out_path, "wb") as f:
    f.write(onnx_model.SerializeToString())

size_kb = out_path.stat().st_size / 1024
print(f"ONNX saved: {out_path}  ({size_kb:.1f} KB)")

# ── Smoke-test via onnxruntime ─────────────────────────────────────────────────
import onnxruntime as rt
sess = rt.InferenceSession(str(out_path))
in_name = sess.get_inputs()[0].name
sample = X.values[:1]
outputs = sess.run(None, {in_name: sample})
print(f"ONNX outputs ({len(outputs)} tensors):")
for i, o in enumerate(outputs):
    print(f"  [{i}] type={type(o).__name__}  value={o}")
print("Satisfaction ONNX export OK.")
