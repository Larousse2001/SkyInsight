"""Inference helpers for tabular and CNN models."""
from __future__ import annotations

import io
from typing import Any

import numpy as np
from PIL import Image

from .config import CNN_CLASSES, DELAY_FEATURES, SATISFACTION_FEATURES
from .models import get_session


# ---------- Tabular ---------------------------------------------------------

def _vec_from_satisfaction(req: dict[str, Any]) -> np.ndarray:
    """Build the 30-d one-hot/numeric feature vector in the trained column order."""
    cls = req.get("class") or req.get("travel_class")
    gender = req["gender"]
    ctype = req["customer_type"]
    ttype = req["type_of_travel"]
    fd = float(req["flight_distance"])
    age = float(req["age"])

    values = {
        "num__online_boarding": req["online_boarding"],
        "num__inflight_wifi_service": req["inflight_wifi_service"],
        "cat__class_Business": 1.0 if cls == "Business" else 0.0,
        "cat__type_of_travel_Business": 1.0 if ttype == "Business" else 0.0,
        "cat__type_of_travel_Personal": 1.0 if ttype == "Personal" else 0.0,
        "num__inflight_entertainment": req["inflight_entertainment"],
        "num__seat_comfort": req["seat_comfort"],
        "num__ease_of_online_booking": req["ease_of_online_booking"],
        "cat__class_Economy": 1.0 if cls == "Economy" else 0.0,
        "num__leg_room_service": req["leg_room_service"],
        "cat__customer_type_First-time": 1.0 if ctype == "First-time" else 0.0,
        "num__flight_distance": fd,
        "num__age": age,
        "num__age_distance_interaction": age * fd,
        "num__onboard_service": req["onboard_service"],
        "num__cleanliness": req["cleanliness"],
        "num__checkin_service": req["checkin_service"],
        "num__baggage_handling": req["baggage_handling"],
        "cat__customer_type_Returning": 1.0 if ctype == "Returning" else 0.0,
        "num__inflight_service": req["inflight_service"],
        "num__departure_and_arrival_time_convenience": req["departure_and_arrival_time_convenience"],
        "num__gate_location": req["gate_location"],
        "num__food_and_drink": req["food_and_drink"],
        "num__total_delay": float(req["departure_delay"]) + float(req["arrival_delay"]),
        "num__departure_delay": req["departure_delay"],
        "cat__gender_Female": 1.0 if gender == "Female" else 0.0,
        "cat__gender_Male": 1.0 if gender == "Male" else 0.0,
        "cat__class_Economy Plus": 1.0 if cls == "Economy Plus" else 0.0,
        "num__delay_flag": 1.0 if (float(req["departure_delay"]) + float(req["arrival_delay"])) > 15 else 0.0,
        "num__arrival_delay": req["arrival_delay"],
    }
    return np.array([[values[f] for f in SATISFACTION_FEATURES]], dtype=np.float32)


def _softmax(x: np.ndarray) -> np.ndarray:
    x = x - x.max(axis=-1, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=-1, keepdims=True)


def _to_probs(raw: Any, n_classes: int) -> np.ndarray:
    """Normalize ONNX output (logits, probas, or sklearn zipmap list) into (n_classes,) probs."""
    if isinstance(raw, list) and raw and isinstance(raw[0], dict):
        d = raw[0]
        return np.array([float(d[k]) for k in sorted(d.keys())], dtype=np.float32)
    arr = np.asarray(raw).reshape(-1)
    if arr.size == 1:
        p = float(arr[0])
        p = max(0.0, min(1.0, p))
        return np.array([1.0 - p, p], dtype=np.float32)
    if arr.size == n_classes:
        if arr.min() < 0 or abs(arr.sum() - 1.0) > 1e-3:
            return _softmax(arr.astype(np.float32))
        return arr.astype(np.float32)
    return _softmax(arr.astype(np.float32))[:n_classes]


def predict_satisfaction(req: dict[str, Any]) -> dict[str, Any]:
    sess = get_session("satisfaction")
    x = _vec_from_satisfaction(req)
    in_name = sess.get_inputs()[0].name
    outputs = sess.run(None, {in_name: x})
    # sklearn ONNX returns [labels, probabilities-dict-list]; iterate reversed to hit probs first
    probs = None
    for out in reversed(outputs):
        try:
            cand = _to_probs(out, 2)
            if cand is not None and len(cand) == 2:
                probs = cand
                break
        except Exception:
            continue
    if probs is None:
        probs = np.array([0.5, 0.5], dtype=np.float32)
    classes = ["Neutral or Dissatisfied", "Satisfied"]
    idx = int(np.argmax(probs))
    return {
        "label": classes[idx],
        "probabilities": {c: float(p) for c, p in zip(classes, probs)},
        "confidence": float(probs[idx]),
    }


def predict_delay(req: dict[str, Any]) -> dict[str, Any]:
    sess = get_session("delay")
    x = np.array([[float(req[f]) for f in DELAY_FEATURES]], dtype=np.float32)
    in_name = sess.get_inputs()[0].name
    outputs = sess.run(None, {in_name: x})
    # Prefer the probability dict output (outputs[1] for sklearn ONNX) over labels (outputs[0])
    probs = None
    for out in reversed(outputs):
        try:
            cand = _to_probs(out, 2)
            if cand is not None and len(cand) == 2:
                probs = cand
                break
        except Exception:
            continue
    if probs is None:
        probs = np.array([0.5, 0.5], dtype=np.float32)
    classes = ["On Time", "Delayed"]
    idx = int(np.argmax(probs))
    return {
        "label": classes[idx],
        "probabilities": {classes[0]: float(probs[0]), classes[1]: float(probs[1])},
        "confidence": float(probs[idx]),
    }


# ---------- CNN -------------------------------------------------------------

def _preprocess_image(file_bytes: bytes, size: int = 224) -> np.ndarray:
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB").resize((size, size))
    arr = np.asarray(img, dtype=np.float32) / 255.0  # rescale to [0, 1]
    arr = np.expand_dims(arr, axis=0)                # (1,H,W,3) - NHWC
    return arr


def predict_cnn(task: str, file_bytes: bytes) -> dict[str, Any]:
    if task not in CNN_CLASSES:
        raise ValueError(f"Unknown CNN task: {task}")
    sess = get_session(task)
    inp = sess.get_inputs()[0]
    shape = inp.shape  # often [None, 224, 224, 3] or [None, 3, 224, 224]
    nhwc = (len(shape) == 4 and shape[-1] == 3)
    size = 224
    for s in shape:
        if isinstance(s, int) and s > 16:
            size = s
            break
    x = _preprocess_image(file_bytes, size)
    if not nhwc:
        x = np.transpose(x, (0, 3, 1, 2))  # NCHW
    raw = sess.run(None, {inp.name: x})[0]
    probs = _to_probs(raw, len(CNN_CLASSES[task]))
    classes = CNN_CLASSES[task]
    idx = int(np.argmax(probs))
    return {
        "task": task,
        "label": classes[idx],
        "probabilities": {c: float(p) for c, p in zip(classes, probs)},
        "confidence": float(probs[idx]),
    }
