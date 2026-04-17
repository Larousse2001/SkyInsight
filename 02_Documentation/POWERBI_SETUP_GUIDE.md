# Power BI Setup Guide: Loading Your DW Tables

## 📊 Loading Cleaned Data into Power BI

### Step 1: Open Power BI and Create New Report
1. Launch **Power BI Desktop**
2. Click **Get Data** → **Text/CSV**
3. Navigate to: `c:\Users\achre\Downloads\Esprit\DL\Ailines project\curated_dw\`

### Step 2: Load Dimension Tables

#### Load DIM_CUSTOMER
1. Select `dim_customer_cleaned.csv`
2. Click **Load**
3. In data model, set `customer_sk` as **Primary Key** (Mark as Primary Key)
4. Hide columns: `postal_code`, `source_system`, `load_date`

#### Load DIM_TIME
1. Repeat with `dim_time_cleaned.csv`
2. Set `date_sk` as **Primary Key**
3. Hide: `load_date`

#### Load FACT_SATISFACTION
1. Load `fact_satisfaction_cleaned.csv`
2. This table stands alone - no joins needed
3. Set `satisfaction_sk` as unique identifier

#### Load FACT_ACTIVITY
1. Load `fact_activity_cleaned.csv`
2. Set `activity_sk` as unique identifier

### Step 3: Create Relationships

In Power BI **Model View**:

1. **Drag** `fact_activity[customer_sk]` → `dim_customer[customer_sk]`
   - Should show **Many-to-One** relationship ✓

2. Optional: Create time dimension connection (if needed)
   - Later, if you add dates to fact_activity

---

## 📈 Dashboard 1: Customer Satisfaction Overview

### Visual 1: Average Satisfaction by Class
- **Chart Type**: Column Chart
- **Axis**: fact_satisfaction[class]
- **Values**: AVG(fact_satisfaction[seat_comfort]), AVG(fact_satisfaction[cleanliness])
- **Filters**: satisfaction = "Satisfied"

### Visual 2: Satisfaction Trend (Card)
- **Value**: DIVIDE(CountRows(FILTER(fact_satisfaction, fact_satisfaction[satisfaction]="Satisfied")), CountRows(fact_satisfaction))
- **Format**: 0.0%

### Visual 3: Top Service Bottlenecks
- **Chart Type**: Horizontal Bar
- **Axis**: Service dimensions (seat_comfort, cleanliness, food_and_drink, etc.)
- **Values**: Average rating
- **Sort**: Low to high

### Visual 4: Satisfaction by Customer Type
- **Chart Type**: Pie Chart
- **Legend**: fact_satisfaction[customer_type]
- **Values**: COUNT(fact_satisfaction[satisfaction_sk])

---

## 📊 Dashboard 2: Customer Loyalty & Retention

### Visual 1: Active vs Cancelled Customers (Card Set)
```
Card 1: SUM(dim_customer[is_active]) = Active Customers
Card 2: COUNTROWS(FILTER(dim_customer, dim_customer[is_active]=0)) = Churned
Card 3: CALCULATE(DIVIDE(Card2, COUNTROWS(dim_customer))) = Churn %
```

### Visual 2: CLV Distribution by Loyalty Card
- **Chart Type**: Box Chart
- **Category**: dim_customer[loyalty_card]
- **Values**: dim_customer[clv]
- **Shows**: Median, quartiles per card tier

### Visual 3: Enrollment vs Cancellation Trend
- **Chart Type**: Line & Column Combo
- **X-Axis**: dim_customer[enrollment_year]
- **Line**: COUNT of enrolled members
- **Column**: COUNT of canceled members

### Visual 4: CLV by Loyalty Card (Table)
| Loyalty Card | Avg CLV | Active | Churned | Churn % |
|---|---|---|---|---|
| Aurora | $X | N | N | X% |
| Nova | $X | N | N | X% |
| Star | $X | N | N | X% |

---

## 🚀 Dashboard 3: Operational Efficiency

### Visual 1: On-Time Performance (Gauge)
```
DIVIDE(
  COUNTROWS(FILTER(fact_satisfaction, 
    fact_satisfaction[departure_delay] < 15 && 
    fact_satisfaction[arrival_delay] < 15
  )),
  COUNTROWS(fact_satisfaction)
) * 100
Format: 0-100 gauge, Target: 85%
```

### Visual 2: Average Delay by Month
- **Chart Type**: Line Chart
- **X-Axis**: Year-Month (from fact_activity)
- **Values**: AVG(fact_satisfaction[departure_delay] + fact_satisfaction[arrival_delay])

### Visual 3: Service Rating Heatmap
- **Chart Type**: Matrix/Heat Map
- **Rows**: fact_satisfaction[class]
- **Columns**: Service dimensions
- **Values**: Average rating (color gradient)

### Visual 4: Top Delay Causes
- **Chart Type**: Word Cloud or Horizontal Bar
- **Based on**: Services with lowest ratings
- **Insight**: Which services contribute most to delays?

---

## 🌍 Dashboard 4: SDG Sustainability Metrics

### Visual 1: CO2 per Passenger (KPI Card)
```
CO2_PER_PASSENGER = 
DIVIDE(
  SUM(fact_activity[distance]) * 0.255,  -- 0.255 kg CO2/km
  COUNTROWS(fact_activity)
)
Format: 0.00 kg
Target: 0.8 kg
```

### Visual 2: Emission Trend (Line Chart)
- **X-Axis**: Year, Month from fact_activity
- **Values**: CO2_PER_PASSENGER (calculated measure)
- **Shows**: Trend over time with target line

### Visual 3: Fuel Efficiency by Loyalty Tier
- **Chart Type**: Column Chart
- **Category**: dim_customer[loyalty_card]
- **Values**: SUM(fact_activity[distance]) / COUNT(fact_activity[total_flights])
- **Insight**: Which customer segments use fuel efficiently?

### Visual 4: Cumulative Emissions Risk (Gauge)
```
Total CO2 emitted = SUM(fact_activity[distance]) * 0.255
```
- Show against sustainability goal
- Red zone if > target emissions

---

## 📋 Dashboard 5: SDG 9 - Innovation & Insights

### Visual 1: Smart Route Optimization (Map - if coordinates available)
- **Location**: dim_customer[country], dim_customer[city]
- **Values**: SUM(fact_activity[distance])
- **Shows**: Where most flights originate

### Visual 2: Customer Insights (Scorecard)
```
Measures:
- Avg Satisfaction Score
- Retention Rate
- Avg CLV
- Total Flights
```

### Visual 3: AI Model Readiness (Info Cards)
```
✓ ML Models Ready: 3 (Satisfaction, Churn, Segmentation)
✓ NLP Module: Future (Survey comments needed)
✓ CV Module: PoC (Gate congestion detection)
✓ DW Status: Ready
```

---

## 🎨 Power BI Design Best Practices

### Color Scheme
- **Primary**: Blue (#0078D4) - Satisfaction
- **Alert**: Red (#DA3B01) - Issues/Churn
- **Success**: Green (#107C10) - Targets met
- **Neutral**: Gray (#A6A6A6) - Reference

### Common Measures to Create

```DAX
-- Churn Rate
Churn_Rate = 
DIVIDE(
  COUNTROWS(FILTER(dim_customer, dim_customer[is_active] = 0)),
  COUNTROWS(dim_customer)
)

-- Satisfaction Score (0-100)
Satisfaction_Score = 
AVERAGE(fact_satisfaction[seat_comfort]) * 20  -- Scale 0-5 to 0-100

-- On-Time Performance
OnTime_Performance = 
DIVIDE(
  COUNTROWS(FILTER(fact_satisfaction, 
    fact_satisfaction[departure_delay] < 15 && 
    fact_satisfaction[arrival_delay] < 15
  )),
  COUNTROWS(fact_satisfaction)
)

-- CO2 Emissions per Passenger
CO2_Per_Pax = 
DIVIDE(
  SUM(fact_activity[distance]) * 0.255,
  COUNTROWS(fact_activity)
)

-- Average CLV
Avg_CLV = AVERAGE(dim_customer[clv])

-- Monthly Activity (flying customers)
Active_Count = DISTINCTCOUNT(fact_activity[customer_sk])
```

---

## 🎯 Slicers to Add to Every Dashboard

Place these on all dashboards for drill-down:

1. **Loyalty Card Tier**: Star | Nova | Aurora
2. **Country**: [All countries from dim_customer]
3. **Year**: 2018-2025
4. **Satisfaction**: Satisfied | Neutral or Dissatisfied
5. **Customer Type**: First-time | Returning

---

## 📤 Export for Presentation

### Create a Report Folder
1. File → Save As PowerPoint (for slide export)
2. File → Export → PDF (for print)
3. File → Publish (if using Power BI service)

### Recommended Pages for Jury Presentation
1. **Title Slide**: "Airline AI + BI Intelligence Platform"
2. **Executive Summary**: Top 4-5 KPIs
3. **Customer Satisfaction**: Dashboard 1
4. **Loyalty & Retention**: Dashboard 2
5. **Operational Excellence**: Dashboard 3
6. **SDG Impact**: Dashboard 4
7. **Conclusions**: Key recommendations

---

## 💡 Pro Tips

- **Use tooltips**: On every visual, add context explanation
- **Add bookmarks**: Create drill-down bookmarks for interactivity
- **Mobile layout**: Create a mobile-optimized version for demos
- **Refresh schedule**: Auto-refresh data weekly
- **Row-level security**: If sharing, set security by country/region

---

## 🔗 File Paths for Power BI Data Source

When prompted for CSV file locations:
```
c:\Users\achre\Downloads\Esprit\DL\Ailines project\curated_dw\dim_customer_cleaned.csv
c:\Users\achre\Downloads\Esprit\DL\Ailines project\curated_dw\dim_time_cleaned.csv
c:\Users\achre\Downloads\Esprit\DL\Ailines project\curated_dw\fact_satisfaction_cleaned.csv
c:\Users\achre\Downloads\Esprit\DL\Ailines project\curated_dw\fact_activity_cleaned.csv
```

---

✨ **Your BI dashboards are now ready for the presentation!** ✨
