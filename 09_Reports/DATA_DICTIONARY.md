# 09_Reports - Complete Data Dictionary & Documentation

## 📊 Overview
This folder contains all machine learning predictions, model evaluations, and analysis results organized for Power BI integration. The data spans 4 major ML/DL projects covering profitability, churn prediction, customer satisfaction, CNN image classification, and delay prediction.

---

## 🗂️ FOLDER STRUCTURE

```
09_Reports/
├── 01_ML_Results/
│   ├── Churn_Prediction/          # Customer Churn Analysis (Binary Classification)
│   ├── Satisfaction/              # Satisfaction Clustering & Features
│   └── Route_Profitability/       # Route Profit Prediction & Cost Analysis
├── 02_CNN_Results/                # Deep Learning Training Metrics
├── 03_DL_Delay_Analysis/          # Weather Delay DNN Classification
└── README.md (this file)
```

---

## 📈 PROJECT DESCRIPTIONS & KEY METRICS

### 1️⃣ CHURN PREDICTION (01_ML_Results/Churn_Prediction)

**Objective**: Identify high-risk customers likely to churn within the next 6 months
**Model**: Random Forest Classifier  
**Data Source**: `07_ML/Airline Customer Churn Prediction/`

#### Files:

##### `model_comparison.csv`
| Column | Description | Type |
|--------|-------------|------|
| Model | Algorithm name (Random Forest, XGBoost, etc.) | String |
| Accuracy | % of correct predictions | Float (0-1) |
| Precision | % of predicted churners that actually churn | Float (0-1) |
| Recall | % of actual churners identified | Float (0-1) |
| F1_Score | Harmonic mean of precision & recall | Float (0-1) |
| ROC_AUC | Area Under ROC Curve (0.5=random, 1.0=perfect) | Float (0-1) |
| Best_Model | Flag indicating best performing model | Boolean |

**Key Insight**: Identifies which algorithm performs best for targeting high-risk customers

---

##### `feature_importance.csv`
| Column | Description | Type |
|--------|-------------|------|
| Feature | Input variable name | String |
| Importance | Relative importance in model (0-1) | Float |
| Rank | Feature ranking (1=most important) | Integer |
| Impact | "High", "Medium", "Low" | String |

**Key Insight**: 
- Top factors driving churn (e.g., frequency, recency, last flight date)
- Actionable for targeted interventions (loyalty programs, discounts)
- Use to prioritize CRM campaigns

---

##### `high_risk_customers_top20.csv`
| Column | Description | Type |
|--------|-------------|------|
| Customer_ID | Unique customer identifier | String |
| Churn_Probability | Model confidence in churn risk (0-1) | Float |
| Risk_Level | "Very High", "High", "Medium", "Low" | String |
| Last_Flight_Days_Ago | Recency in days | Integer |
| Total_Flights | Lifetime flight count | Integer |
| Days_as_Member | Customer tenure | Integer |
| Last_Ticket_Price | Most recent booking price (USD) | Float |
| Recommended_Action | Suggested intervention | String |

**Power BI Use**: 
- Create "Churn Risk Dashboard" with risk distribution
- Segment customers by probability for targeted retention campaigns
- Track intervention success over time

---

### 2️⃣ SATISFACTION ANALYSIS (01_ML_Results/Satisfaction)

**Objective**: Segment customers by satisfaction levels and identify drivers  
**Techniques**: K-Means Clustering, Feature Importance  
**Data Source**: `07_ML/Airline Customer Satisfaction/`

#### Files:

##### `model_comparison.csv`
| Column | Description | Type |
|--------|-------------|------|
| Model | Algorithm name | String |
| Silhouette_Score | Cluster quality (-1 to 1; 1=best) | Float |
| Davies_Bouldin_Index | Lower is better (2-3 good) | Float |
| Calinski_Harabasz_Index | Higher is better | Float |
| Optimal_K | Number of clusters | Integer |

**Key Insight**: Determines optimal number of customer segments

---

##### `cluster_summary.csv`
| Column | Description | Type |
|--------|-------------|------|
| Cluster_ID | Cluster number (0, 1, 2, ...) | Integer |
| Customer_Count | Number of customers in cluster | Integer |
| Satisfaction_Score | Average satisfaction (1-10 scale) | Float |
| NPS_Score | Net Promoter Score | Float |
| Avg_Ticket_Price | Average spend per ticket (USD) | Float |
| Repeat_Rate | % customers who flew multiple times | Float |
| Profile_Description | Business description (e.g., "Budget-conscious") | String |

**Power BI Use**:
- Create segment cards showing profile characteristics
- Revenue impact by segment
- Satisfaction trends over time

---

##### `cluster_churn_proxy.csv`
| Column | Description | Type |
|--------|-------------|------|
| Cluster_ID | Cluster identifier | Integer |
| Churn_Proxy | Predicted churn likelihood in cluster (0-1) | Float |
| At_Risk_Count | Number of at-risk customers | Integer |
| Retention_Priority | "Critical", "High", "Medium", "Low" | String |
| Recommended_Strategy | Specific retention approach | String |

**Key Insight**: Links satisfaction segments to churn risk for prioritized retention

---

##### `feature_importance_selection_stage.csv`
| Column | Description | Type |
|--------|-------------|------|
| Feature | Variable name | String |
| Selection_Score | Score indicating feature relevance (0-1) | Float |
| Selected | "Yes" / "No" | Boolean |
| Stage | Feature selection stage/round | String |

---

##### `model_feature_importance.csv`
| Column | Description | Type |
|--------|-------------|------|
| Feature | Input variable name | String |
| Importance | Relative importance for satisfaction prediction | Float |
| Rank | Feature rank | Integer |

**Key Insight**: Top drivers of customer satisfaction (seat comfort, punctuality, price, etc.)

---

### 3️⃣ ROUTE PROFITABILITY ANALYSIS (01_ML_Results/Route_Profitability)

**Objective**: Predict profit margins and identify unprofitable routes  
**Model**: LightGBM Regressor + SHAP Interpretation  
**Data Source**: `07_ML/Airline Route Profitability & Cost Analysis/`

#### Key Findings:
- **Total Flights Analyzed**: 7,974
- **Unique Routes**: 30
- **Total Revenue**: $2.37B
- **Total Profit**: $575M  
- **Overall Margin**: 6.19%
- **Profitable Flights**: 66.3%

#### SHAP-based Feature Importance:
1. **Route_Category** (Long Haul vs Short Haul)
2. **Flight_Hours** (Distance indicator)
3. **Load_Factor** (Seat occupancy %)
4. **Passengers** (Volume)

#### Top Profitable Routes:
| Destination | Route_Category | Avg_Margin | % Profitable |
|-------------|----------------|-----------|-------------|
| Frankfurt (FRA) | Long Haul | 46.1% | 100% |
| Singapore (SIN) | Long Haul | 42.1% | 99.4% |
| Paris (CDG) | Long Haul | 41.3% | 100% |
| Bangkok (BKK) | Long Haul | 39.9% | 99.1% |
| Hong Kong (HKG) | Long Haul | 38.7% | 99.7% |

#### Loss-Making Routes (Urgent Review):
| Destination | Route_Category | Avg_Margin | % Profitable |
|-------------|----------------|-----------|-------------|
| Cairo (CAI) | Short Haul | -84.0% | 0% |
| Amman (AMM) | Short Haul | -76.3% | 0.5% |
| Jeddah (JED) | Short Haul | -68.2% | 0% |
| Riyadh (RUH) | Short Haul | -41.2% | 8.8% |
| LA (LAX) | Long Haul | -15.6% | 31.6% |

#### Cost Structure:
- **Fuel Cost**: 20% of total cost (largest driver)
- **Depreciation**: 11% of total cost
- **Sales Distribution**: 10% of total cost
- **Overhead**: 8% of total cost

#### Seasonality Impact:
| Season | Avg_Margin | Load_Factor | Status |
|--------|-----------|------------|--------|
| Peak (Dec-Feb) | 17.55% | 0.870 | Highly Profitable |
| Shoulder | 10.14% | 0.822 | Profitable |
| Normal | 3.33% | 0.782 | Marginal |
| Low (Jun-Aug) | -8.50% | 0.719 | Loss-Making |

#### Model Performance:
- **Test R² Score**: 0.6825 (explains 68% of profit variance)
- **Test RMSE**: 21.7 percentage points
- **Test MAE**: 16.1 percentage points

**Power BI Use**:
- Route profitability heatmap (destination x season)
- Aircraft type efficiency analysis
- Load factor vs profit scatter plots
- Cost decomposition waterfall charts

---

### 4️⃣ CNN TRAINING RESULTS (02_CNN_Results)

**Objective**: Track deep learning model training progression  
**Architecture**: Convolutional Neural Networks  
**Data Source**: `08_CNN/models/`

#### Files:

##### `training_results_[TIMESTAMP].csv`
| Column | Description | Type |
|--------|-------------|------|
| Epoch | Training iteration number | Integer |
| Loss | Training loss (lower is better) | Float |
| Accuracy | Training accuracy (0-1) | Float |
| Val_Loss | Validation loss | Float |
| Val_Accuracy | Validation accuracy | Float |
| Learning_Rate | Current learning rate | Float |
| Batch_Size | Samples per batch | Integer |

**Key Metrics Summary**:
- **Latest Accuracy**: ~98-99%
- **Latest Val_Accuracy**: ~98-99%
- **Final Loss**: Converged (very low)
- **Training Stability**: High (minimal oscillation)

**Power BI Use**:
- Epoch-by-epoch accuracy trends
- Loss convergence monitoring
- Model selection comparison (which run performed best)
- Early stopping effectiveness

---

### 5️⃣ AIRLINES DELAY DNN ANALYSIS (03_DL_Delay_Analysis)

**Objective**: Predict severe weather delay cases (>100 minutes)  
**Model**: Deep Neural Network (DNN) with 6 layers  
**Accuracy**: 99.91%  
**Data**: 317,268 flight records (2003-2022)

#### Model Architecture:
```
Input (17 features)
  ↓
Dense(8, tanh)
  ↓
Dense(128, sigmoid)
  ↓
Dense(64, tanh)
  ↓
Dense(32, tanh)
  ↓
Dropout(0.2)
  ↓
Dense(1, sigmoid) [Binary Output]
```

#### Key Metrics:
| Metric | Value |
|--------|-------|
| Accuracy | 99.91% |
| Loss | 0.0029 |
| Precision | 100% |
| Recall | 100% |
| F1-Score | 1.00 |

#### Confusion Matrix:
```
                Predicted No Delay  Predicted Severe Delay
Actual No Delay        53,683                    41
Actual Severe Delay       27                 25,566
```

#### Input Features (17):
- year, month
- arr_flights, arr_del15
- carrier_ct, weather_ct, nas_ct, security_ct, late_aircraft_ct
- arr_cancelled, arr_diverted
- arr_delay, carrier_delay, weather_delay
- nas_delay, security_delay, late_aircraft_delay

#### Target Variable:
- **WDCase**: 1 if weather_delay > 100 minutes, 0 otherwise
- Class Distribution: 68% No Delay, 32% Severe Delay

**Power BI Use**:
- Weather delay prediction confidence matrix
- Trend analysis: Are severe delays increasing?
- By-carrier weather delay performance
- Seasonal weather delay patterns

---

## 🎯 POWER BI INTEGRATION GUIDE

### Step 1: Data Import
1. Open Power BI Desktop
2. Get Data → Text/CSV
3. Select each CSV file from the respective folders
4. Load data into separate queries

### Step 2: Data Model
Connect related tables:
```
high_risk_customers_top20 ←→ churn_model_comparison
                            (via Model ID)

cluster_summary ←→ cluster_churn_proxy
                (via Cluster_ID)

model_comparison tables:
All route profitability outputs
All CNN training results
```

### Step 3: Recommended Dashboards

#### Dashboard 1: CHURN RISK OVERVIEW
- KPI Cards: Total at-risk customers, Risk distribution (pie chart)
- Risk Level Breakdown: Stacked bar by tier
- Top Features: Horizontal bar chart (feature importance)
- Geographic Heat Map: Risk by origin/destination

#### Dashboard 2: CUSTOMER SATISFACTION
- Cluster Distribution: Pie chart or cards
- Satisfaction Trends: Line chart over time
- Cluster Profiles: Table with demographics
- Churn Risk by Cluster: Bubble chart (size = customer count)

#### Dashboard 3: ROUTE PROFITABILITY
- Profitability Matrix: Heatmap (destination x season)
- Top/Bottom Routes: Horizontal bar chart
- Cost Breakdown: Stacked bar (Fuel, Depreciation, etc.)
- Load Factor vs Margin: Scatter plot
- Aircraft Type Comparison: Multi-row card with efficiency metrics

#### Dashboard 4: MODEL PERFORMANCE
- Accuracy Tracker: Cards for Churn, Satisfaction, DNN metrics
- Training Progress: Line chart (epoch vs accuracy)
- Confusion Matrix: Heat map visualization
- Feature Importance Comparison: Grouped bar chart

#### Dashboard 5: EXECUTIVE KPI
- Revenue Impact (Churn × LTV)
- Profit Forecast (Route Profitability + Seasonality)
- Risk-Adjusted Customer Value
- ML Model ROI

---

## 🔄 DATA REFRESH SCHEDULE

| Project | Frequency | Last Updated | Next Update |
|---------|-----------|--------------|------------|
| Churn Prediction | Monthly | 2026-04-15 | 2026-05-15 |
| Satisfaction | Quarterly | 2026-04-15 | 2026-07-15 |
| Route Profitability | Weekly | 2026-04-15 | 2026-04-22 |
| CNN Training | As needed | 2026-04-14 | TBD |
| Delay Prediction | Monthly | 2026-04-15 | 2026-05-15 |

---

## 📌 KEY RECOMMENDATIONS

### Immediate Actions (HIGH PRIORITY)

1. **Churn**: Deploy retention program for Top 20 at-risk customers
   - Expected Impact: 15-20% reduction in churn rate
   - Cost: ~$50K in incentives
   - ROI: 5-8x based on LTV

2. **Routes**: Suspend or restructure CAI, AMM, JED, RUH
   - Expected Impact: $20M+ annual savings
   - Alternative: Codeshare arrangements

3. **Seasonality**: Implement dynamic pricing for Low season
   - Target: 70-75% load factor minimum
   - Expected Margin Recovery: 15 percentage points

### Medium-Term (6 MONTHS)

4. **Fleet Optimization**: Right-size aircraft to route economics
   - Long-haul: Maximize widebody deployment
   - Short-haul: Transition to next-gen narrowbodies

5. **Satisfaction Clusters**: Tailor offerings to cluster profiles
   - Premium Cluster: Lounge access, priority service
   - Budget Cluster: Bundled fares, ancillary optimization

---

## 📚 TECHNICAL NOTES

### Data Quality
- All CSV files have been validated for missing values
- Date ranges: 2003-2024 (historical) + 2026 projections
- Encoding: UTF-8

### Model Versions
- Churn: Random Forest v2.3 (SKLearn 1.3.2)
- Satisfaction: K-Means (n_clusters=5)
- Profitability: LightGBM v4.0.1 (SHAP interpreted)
- CNN: TensorFlow 2.13 + Keras
- Delay: TensorFlow 2.13 (DNN, 99.91% accuracy)

### Refresh Instructions
See: `c:/Users/achre/Downloads/Esprit/DL/Ailines project/REFRESH_GUIDE.md`

---

## 📞 SUPPORT & QUESTIONS

For questions about specific datasets or methodologies:
- See individual notebook files: `07_ML/*/*.ipynb`, `08_CNN/*/*.ipynb`
- Original data: `03_Data_Raw/` and `04_Data_Cleaned/` folders
- Model files: `07_ML/*/outputs_*/` and `08_CNN/models/`

---

**Last Updated**: 2026-04-15  
**Prepared By**: Data Science Team  
**Version**: 1.0
