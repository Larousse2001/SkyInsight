"""
Train a delay classifier and export it as an ONNX model.
Matches the 17-feature DELAY_FEATURES list in config.py.
Target: WDCase = (weather_delay > 100).astype(int)
"""
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

ROOT = Path(__file__).parent

# ── Feature order must match DELAY_FEATURES in config.py ─────────────────────
DELAY_FEATURES = [
    "year", "month", "arr_flights", "arr_del15", "carrier_ct", "weather_ct",
    "nas_ct", "security_ct", "late_aircraft_ct", "arr_cancelled", "arr_diverted",
    "arr_delay", "carrier_delay", "weather_delay", "nas_delay",
    "security_delay", "late_aircraft_delay",
]

# ── Load CSV ───────────────────────────────────────────────────────────────────
csv_path = ROOT / "07_ML" / "Airlines Delay" / "Airline_Delay_Cause.csv"
print(f"Loading: {csv_path}")
df = pd.read_csv(csv_path, low_memory=False)
print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")

# ── Preprocess ────────────────────────────────────────────────────────────────
# Drop rows where any of the needed columns are NaN
needed = DELAY_FEATURES + ["weather_delay"]
df = df.dropna(subset=needed)

# Coerce to numeric
for col in DELAY_FEATURES:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df = df.dropna(subset=DELAY_FEATURES)

# Target: severe weather delay (weather_delay > 100 minutes)
y = (df["weather_delay"] > 100).astype(int)
X = df[DELAY_FEATURES].astype(np.float32)

print(f"Training rows: {len(X)}, class balance: {y.value_counts().to_dict()}")

# ── Train ──────────────────────────────────────────────────────────────────────
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("clf",    LogisticRegression(max_iter=1000, C=1.0, random_state=42)),
])
pipe.fit(X, y)
print("Training complete.")

from sklearn.metrics import accuracy_score
print(f"Train accuracy: {accuracy_score(y, pipe.predict(X)):.4f}")

# ── Export ONNX ────────────────────────────────────────────────────────────────
initial_type = [("float_input", FloatTensorType([None, len(DELAY_FEATURES)]))]
onnx_model = convert_sklearn(pipe, initial_types=initial_type, target_opset=17)

out_path = ROOT / "09_Reports" / "[ANN] Airlines Delay" / "best_skyinsight_model.onnx"
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
print("Delay ONNX export OK.")
