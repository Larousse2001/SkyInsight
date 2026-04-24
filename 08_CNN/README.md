# 08_CNN Starter Pipeline

This folder contains a starter vision pipeline for:
- Baggage Handling QC (detection + incident reports)
- Airport Crowd Analytics (YOLO person counting)
- Cabin Cleanliness Detection (CNN classification)

## Quick Start

1. Install dependencies
```bash
pip install -r 08_CNN/requirements.txt
```

2. Extract the Roboflow datasets
```bash
python 08_CNN/scripts/extract_roboflow_datasets.py
```

This builds the current dataset folders under:
- `08_CNN/data/cabin`
- `08_CNN/data/crowd`
- `08_CNN/data/luggage`

Each dataset contains `images/`, `labels/`, `classes.txt`, and a `dataset.yaml`.
`crowd` and `cabin` include `train`, `valid`, and `test` splits.
`luggage` currently includes `train` and `test`; split it later when you are ready.

3. Train the crowd model
```bash
python 08_CNN/scripts/train_yolo.py --data 08_CNN/data/crowd/dataset.yaml --model yolo11n.pt --epochs 30 --imgsz 640 --project 08_CNN/runs --name crowd_yolo
```

4. Train the baggage model after you split luggage later
```bash
python 08_CNN/scripts/train_yolo.py --data 08_CNN/configs/yolo_baggage.yaml --model yolo11n.pt --epochs 30 --imgsz 640 --project 08_CNN/runs --name baggage_yolo
```

5. Train the cabin cleanliness CNN only when you have Clean / Needs_Attention / Dirty folders
```bash
python 08_CNN/scripts/train_cabin_cleanliness.py --data-root 08_CNN/data/cabin_cleanliness --epochs 15 --img-size 224 --batch-size 16 --output-dir 08_CNN/models
```

6. Generate incident report from detections
```bash
python 08_CNN/scripts/generate_incident_report.py --detections-csv 08_CNN/reports/baggage_detections.csv --output 08_CNN/reports/incident_report.csv
```

## Notes
- YOLO labels must follow YOLO txt format: `class x_center y_center width height` normalized in [0,1].
- The current Roboflow cabin export is detection-style, not a ready-made Clean / Needs_Attention / Dirty CNN dataset.

## Start the Other Two Tasks

### Baggage Handling QC
1. Split luggage into train / valid / test when you are ready.
2. Train the YOLO model with `08_CNN/configs/yolo_baggage.yaml`.

### Cabin Cleanliness Detection
1. Collect images in `08_CNN/data/cabin_cleanliness/raw/Clean`, `Needs_Attention`, and `Dirty`.
2. Train the CNN once the class-folder structure is in place.
