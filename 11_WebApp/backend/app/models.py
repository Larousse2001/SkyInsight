"""ONNX model registry with lazy loading."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import onnxruntime as ort

from .config import MODEL_PATHS


@lru_cache(maxsize=None)
def get_session(name: str) -> ort.InferenceSession:
    path: Path = MODEL_PATHS[name]
    if not path.exists():
        raise FileNotFoundError(f"Model file missing: {path}")
    return ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])


def session_info(name: str) -> dict:
    sess = get_session(name)
    return {
        "inputs":  [{"name": i.name, "shape": i.shape, "type": i.type} for i in sess.get_inputs()],
        "outputs": [{"name": o.name, "shape": o.shape, "type": o.type} for o in sess.get_outputs()],
    }
