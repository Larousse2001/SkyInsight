# ✈️ SkyInsight — Airlines Data Engineering & AI Project

## 📌 Overview
**SkyInsight** is an end-to-end Data Engineering and Artificial Intelligence platform designed to help airlines improve:

- Passenger satisfaction  
- Customer loyalty  
- Operational efficiency  
- Sustainability and environmental impact  

The project combines **Data Engineering, Business Intelligence, Machine Learning, NLP, and Computer Vision** into a unified analytics ecosystem — from raw data ingestion to intelligent predictions and dashboards.

---

# 🏗️ Project Architecture

```text
Raw Data → Data Cleaning → Data Warehouse → Dashboards → AI Models
```

### Core Layers
- **Data Sources** → Airline operational & customer datasets  
- **Data Cleaning** → Transformation and preprocessing pipelines  
- **Data Warehouse** → Structured analytical storage  
- **Dashboards** → Interactive BI reporting with Power BI  
- **AI Layer**:
  - Machine Learning
  - NLP
  - Computer Vision (CNN)

---

# 📂 Repository Structure

```bash
SkyInsight/
│
├── 01_Presentations/       # Project presentations, demos & slides
├── 02_Documentation/       # Architecture, technical docs & diagrams
├── 03_Data_Raw/            # Original raw datasets
├── 04_Data_Cleaned/        # Cleaned and transformed datasets
├── 05_DataWarehouse/       # Data warehouse models & structured data
├── 06_Dashboards/          # Power BI dashboards & analytics exports
├── 07_ML/                  # Machine Learning notebooks, models & ONNX
├── 08_CNN/                 # CNN & Computer Vision models
├── 09_Reports/             # Final reports & analytical deliverables
├── 10_NLP/                 # NLP pipelines & text analytics
├── 11_WebApp/              # Web application & deployment interface
│
├── .gitattributes          # Git LFS tracking configuration
├── README.md
├── git_commands.txt        # Useful Git/Git LFS commands
├── train_delay_onnx.py     # Delay prediction ONNX export script
├── train_satisfaction_onnx.py # Satisfaction model ONNX export script
```

---

# 📊 Business Intelligence Objectives

## ✈️ Passenger Satisfaction Analytics
- Satisfaction scoring analysis  
- Service quality benchmarking  
- Delay impact analysis  
- Passenger experience KPIs  

## 💳 Loyalty & Customer Analytics
- Customer Lifetime Value (CLV)  
- Loyalty segmentation  
- Churn analysis & retention metrics  

## 📈 Flight Operations Analytics
- Flight delay monitoring  
- Route performance analysis  
- Revenue & utilization metrics  
- Operational efficiency indicators  

## 🌱 Sustainability Analytics
- Carbon emission tracking  
- Fuel consumption analysis  
- Eco-efficiency monitoring  
- Sustainability KPI reporting  

---

# 🤖 Machine Learning Modules (`07_ML/`)

## Implemented Use Cases
- Passenger satisfaction classification  
- Flight delay prediction  
- Customer churn prediction  
- Customer segmentation (clustering)  
- Operational forecasting  

## ML Technologies
- Scikit-learn  
- XGBoost  
- TensorFlow / PyTorch  
- ONNX model export for deployment  

---

# 👁️ Computer Vision (`08_CNN/`)

The CNN module focuses on intelligent visual analysis for airline operations.

## Features
- Cabin cleanliness classification  
- Passenger crowd detection  
- Aircraft anomaly detection  
- Baggage handling quality control  
- CNN-based image classification  

## Technologies
- OpenCV  
- TensorFlow / PyTorch  
- YOLO architectures  

---

# 🧠 Natural Language Processing (`10_NLP/`)

NLP pipelines are designed to analyze customer textual feedback and airline communication.

## Features
- Sentiment analysis  
- Topic modeling  
- Aspect-based sentiment analysis  
- Feedback categorization  
- Keyword extraction  
- Automated reporting  

## Technologies
- NLTK  
- SpaCy  
- BERTopic  
- Transformers  

---

# 🌐 Web Application (`11_WebApp/`)

The web application layer centralizes:
- Dashboard access  
- ML inference APIs  
- Prediction visualization  
- User interaction interfaces  
- Deployment integration  

Potential deployment targets:
- Streamlit  
- FastAPI  
- Flask  
- React frontend integration  

---

# ⚙️ Tech Stack

## Programming Languages
- Python  
- SQL  

## Data Engineering
- Pandas  
- PySpark  

## Visualization
- Power BI  

## Machine Learning & Deep Learning
- Scikit-learn  
- XGBoost  
- TensorFlow  
- PyTorch  
- ONNX Runtime  

## NLP
- NLTK  
- SpaCy  
- BERTopic  

## Computer Vision
- OpenCV  
- YOLO  
- CNN Architectures  

## Dev Tools
- Git & GitHub  
- Git LFS  

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone https://github.com/Larousse2001/Airlines_Project.git
cd Airlines_Project
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Run ML Training

```bash
python train_satisfaction_onnx.py
python train_delay_onnx.py
```

---

# 📅 Project Roadmap

- ✅ Data Engineering Pipeline  
- ✅ Data Cleaning & Transformation  
- ✅ Data Warehouse Integration  
- ✅ Power BI Dashboards  
- ✅ Machine Learning Models  
- ✅ CNN & Computer Vision Integration  
- 🔄 Advanced NLP Pipelines  
- 🔄 Web Application Deployment  
- 🔄 API & Real-Time Inference  
- 🔄 Cloud Deployment  

---

# 🌍 Sustainability Goals Alignment

This project contributes to:

- **SDG 9** → Industry, Innovation & Infrastructure  
- **SDG 12** → Responsible Consumption & Production  
- **SDG 13** → Climate Action  

---

# 👨‍💻 Contributors

- Achref AROUS  
- Oumaima ROUIS  
- Iheb KOUKI  
- Mehdi JOUDI  
- Eya CHIIBNI  

---

# 📜 License

This repository is intended for academic, educational, and research purposes.
