#!/usr/bin/env python3
from __future__ import annotations

import argparse
from ultralytics import YOLO


def main() -> None:
    parser = argparse.ArgumentParser(description="Train YOLO model.")
    parser.add_argument("--data", required=True, type=str, help="Path to YOLO data yaml")
    parser.add_argument("--model", default="yolo11n.pt", type=str, help="Base YOLO model")
    parser.add_argument("--epochs", default=30, type=int)
    parser.add_argument("--imgsz", default=640, type=int)
    parser.add_argument("--project", default="08_CNN/runs", type=str)
    parser.add_argument("--name", default="exp", type=str)
    args = parser.parse_args()

    model = YOLO(args.model)
    model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        project=args.project,
        name=args.name,
    )

    print("Training completed.")


if __name__ == "__main__":
    main()
