# Data Warehouse Preparation Guide: Airline Project
## How to Clean Data and Build a DW with Table Relationships

---

## QUICK START

Run this Python script in your project folder to automatically clean all datasets and prepare them for DW:

```bash
python 02_build_airline_dw.py
```

This will:
1. Load all CSV datasets
2. Clean and standardize data
3. Create dimension and fact tables  
4. Export cleaned tables to `curated_dw/` folder
5. Generate DW schema and relationship documentation

---

## UNDERSTANDING YOUR DATA

### Datasets Overview

| Dataset | Purpose | Key Field | Records |
|---------|---------|-----------|---------|
| `airline_passenger_satisfaction.csv` | **Fact** - Service ratings | `id` (passenger) | ~103k |
| `Customer Flight Activity.csv` | **Fact** - Monthly activity | `loyalty_number` + `year` + `month` | ~13k |
| `Customer Loyalty History.csv` | **Dimension** - Customer profile | `loyalty_number` | ~3k |
| `Calendar.csv` | **Dimension** - Time reference | `date` | ~365 |

---

## DATA WAREHOUSE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    DW STAR SCHEMA                           │
└─────────────────────────────────────────────────────────────┘

                      DIM_CUSTOMER
                    ┌─────────────────┐
                    │ customer_sk (PK)│
                    │ loyalty_number  │
                    │ country         │
                    │ clv             │
                    │ loyalty_card    │
                    └────────┬────────┘
                             │
                      (FK: customer_sk)
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
  ┌──────────────┐  ┌──────────────┐    ┌──────────────┐
  │   FACT_      │  │   FACT_      │    │  DIM_TIME    │
  │ SATISFACTION │  │   ACTIVITY   │    │  date_sk     │
  │              │  │              │    │  date        │
  │ sat_sk (PK)  │  │ activity_sk  │    │  year_month  │
  │ id           │  │ activity_sk  │    └──────────────┘
  │ customer_...│  │ customer_sk  │
  │ delay_...   │  │ total_flights│
  │ service_... │  │ distance     │
  │ satisfaction│  │ points_...   │
  └──────────────┘  └──────────────┘

Legend: PK = Primary Key, FK = Foreign Key
```

---

## TABLE RELATIONSHIPS (THE JOINS YOU'LL USE)

### 1. DIMENSION: DIM_CUSTOMER
**Purpose**: Single source of truth for customer attributes  
**Primary Key**: `customer_sk` (surrogate key, auto-generated)  
**Business Key**: `loyalty_number` (unique customer ID)

Structure:
```sql
customer_sk         INT          (1, 2, 3, ...)  -- Surrogate PK
loyalty_number      VARCHAR      (LY001, LY002)  -- Business key
country             VARCHAR      (Canada, USA)
province            VARCHAR      (ON, BC)
city                VARCHAR      (Toronto, Vancouver)
postal_code         VARCHAR
gender              CHAR(1)      (M, F)
education          VARCHAR      (College, Bachelor, Master, Doctor)
salary              NUMERIC      (40000, 85000, ...)
marital_status      VARCHAR      (Single, Married, Divorced)
loyalty_card        VARCHAR      (Star, Nova, Aurora)
clv                NUMERIC      (Customer Lifetime Value in $)
enrollment_year    INT          (2018, 2019, ...)
is_active          INT          (1=active, 0=canceled)
load_date          DATE         (when row was created)
source_system      VARCHAR      ('Customer Loyalty History')
```

### 2. DIMENSION: DIM_TIME
**Purpose**: All time references for trend analysis  
**Primary Key**: `date_sk` (surrogate key)  
**Business Key**: `date`

Structure:
```sql
date_sk             INT          (1, 2, 3...)
date                DATE         (2020-01-01, ...)
start_of_year       DATE         (2020-01-01)
start_of_quarter    DATE         (2020-01-01, 2020-04-01, ...)
start_of_month      DATE         (2020-01-01, 2020-02-01, ...)
load_date           DATE         (when row was created)
```

### 3. FACT: FACT_SATISFACTION
**Purpose**: Individual flight satisfaction records  
**Primary Key**: `satisfaction_sk` (surrogate)  
**Grain**: One row per passenger flight  
**Foreign Keys**: None (used as standalone dimension)

Structure - Dimensions:
```sql
satisfaction_sk     INT          (PK - Row number)
id                  INT          (Passenger ID)
gender              CHAR(1)      (M, F)
age                 INT          (25, 45, ...)
customer_type       VARCHAR      (First-time, Returning)
type_of_travel      VARCHAR      (Business, Personal)
class               VARCHAR      (Business, Eco Plus, Economy)
flight_distance     INT          (miles traveled)
```

Structure - Measures (Service Ratings 1-5):
```sql
departure_delay                           INT    (minutes)
arrival_delay                              INT    (minutes)
departure_and_arrival_time_convenience    INT    (rating 1-5)
ease_of_online_booking                    INT    (rating 1-5)
check_in_service                          INT    (rating 1-5)
online_boarding                           INT    (rating 1-5)
gate_location                             INT    (rating 1-5)
on_board_service                          INT    (rating 1-5)
seat_comfort                              INT    (rating 1-5)
leg_room_service                          INT    (rating 1-5)
cleanliness                               INT    (rating 1-5)
food_and_drink                            INT    (rating 1-5)
in_flight_service                        INT    (rating 1-5)
in_flight_wifi_service                   INT    (rating 1-5)
in_flight_entertainment                  INT    (rating 1-5)
baggage_handling                          INT    (rating 1-5)
satisfaction                              VARCHAR (Satisfied / Neutral or Dissatisfied)
```

### 4. FACT: FACT_ACTIVITY  ⭐ (CONFORMED WITH DIM_CUSTOMER)
**Purpose**: Monthly customer flight and loyalty activity  
**Primary Key**: `activity_sk` (surrogate)  
**Grain**: One row per customer per month  
**Foreign Key**: `customer_sk` → `dim_customer.customer_sk` (MANY-TO-ONE)

Structure:
```sql
activity_sk             INT          (PK - Row number)
loyalty_number          VARCHAR      (Business key - LY001, LY002...)
customer_sk             INT          (FK to dim_customer) ⭐
year                    INT          (2018, 2019, ...)
month                   INT          (1-12)
total_flights           INT          (Flights booked in month)
distance                NUMERIC      (Total km traveled)
points_accumulated      NUMERIC      (Points earned in month)
points_redeemed         NUMERIC      (Points spent in month)
dollar_cost_points...   NUMERIC      ($ value of points redeemed)
```

---

## HOW TO CREATE DW RELATIONSHIPS (THE SQL JOINS)

### Join Pattern 1: Customer with Their Activity

```sql
-- Get each customer's profile with their monthly activity
SELECT 
    c.customer_sk,
    c.loyalty_number,
    c.country,
    c.loyalty_card,
    c.clv,
    fa.year,
    fa.month,
    fa.total_flights,
    fa.distance,
    fa.points_accumulated,
    fa.points_redeemed
FROM fact_activity fa
INNER JOIN dim_customer c 
    ON fa.customer_sk = c.customer_sk
ORDER BY c.loyalty_number, fa.year, fa.month;
```

**Use Case**: 
- Analyze if high-value customers (high CLV) have more redemptions
- Track loyalty card tier vs activity patterns
- Find customers with low activity but high enrollmentage

### Join Pattern 2: Activity with Time Dimension (Optional)

```sql
-- If you want to add month/year names from DIM_TIME
SELECT 
    c.customer_sk,
    c.loyalty_number,
    dt.date,
    dt.start_of_month,
    fa.total_flights,
    fa.points_accumulated
FROM fact_activity fa
INNER JOIN dim_customer c 
    ON fa.customer_sk = c.customer_sk
LEFT JOIN dim_time dt
    ON dt.start_of_month = DATEFROMPARTS(fa.year, fa.month, 1)
ORDER BY c.loyalty_number, dt.date;
```

### Join Pattern 3: Analytical Query - Churn Prediction

```sql
-- Identify who is likely to churn (high-value customers with declining activity)
SELECT 
    c.customer_sk,
    c.loyalty_number,
    c.clv,
    c.loyalty_card,
    c.is_active,
    COUNT(*) as total_activity_months,
    SUM(fa.total_flights) as total_flights,
    AVG(fa.distance) as avg_distance,
    SUM(fa.points_accumulated) as total_points,
    SUM(CASE WHEN fa.year = 2023 THEN fa.total_flights ELSE 0 END) as flights_2023,
    SUM(CASE WHEN fa.year = 2022 THEN fa.total_flights ELSE 0 END) as flights_2022
FROM dim_customer c
LEFT JOIN fact_activity fa 
    ON c.customer_sk = fa.customer_sk
GROUP BY 
    c.customer_sk, c.loyalty_number, c.clv, c.loyalty_card, c.is_active
HAVING SUM(fa.total_flights) > 0
    AND c.is_active = 0  -- Canceled members
    AND c.clv > 10000;    -- High value
```

**Outcome**: Find VIP churners to save with targeted campaigns

---

## KPI FORMULAS FOR YOUR PROJECT

### SDG 9: Operational Efficiency
```sql
-- Average satisfaction across all flights
SELECT AVG((
    COALESCE(departure_delay, 0) +
    COALESCE(seat_comfort, 0) +
    COALESCE(cleanliness, 0) +
    COALESCE(on_board_service, 0)
) / 4.0) as avg_experience_score
FROM fact_satisfaction;

-- On-time performance
SELECT 
    COUNT(*) as total_flights,
    SUM(CASE WHEN departure_delay < 15 AND arrival_delay < 15 THEN 1 ELSE 0 END) as ontime,
    ROUND(100.0 * SUM(CASE WHEN departure_delay < 15 AND arrival_delay < 15 THEN 1 ELSE 0 END)
          / COUNT(*), 2) as ontime_pct
FROM fact_satisfaction;
```

### SDG 12: Resource Efficiency (Fuel per Passenger)
```sql
-- Total fuel estimate based on distance
-- Formula: total_distance * fuel_factor / total_passengers
SELECT 
    SUM(fa.distance) as total_distance_km,
    COUNT(fa.activity_sk) as total_activity_records,
    SUM(fa.distance) / COUNT(fa.activity_sk) as avg_km_per_activity,
    -- Estimated fuel (assuming 0.06 liters per km on average)
    ROUND(SUM(fa.distance) * 0.06 / COUNT(fa.activity_sk), 3) as est_fuel_per_record_liters
FROM fact_activity fa;
```

### SDG 13: Climate Action  (CO2 per Passenger)
```sql
-- CO2 emissions per passenger (assuming 0.255 kg CO2 per km)
SELECT 
    fa.year,
    fa.month,
    SUM(fa.distance) as total_distance_km,
    COUNT(DISTINCT fa.customer_sk) as unique_passengers,
    ROUND(SUM(fa.distance) * 0.255 / COUNT(DISTINCT fa.customer_sk), 2) as co2_kg_per_passenger
FROM fact_activity fa
GROUP BY fa.year, fa.month
ORDER BY fa.year, fa.month;
```

### Customer Loyalty Retention
```sql
-- Churn rate and retention by loyalty card tier
SELECT 
    c.loyalty_card,
    COUNT(*) as total_customers,
    SUM(CASE WHEN c.is_active = 0 THEN 1 ELSE 0 END) as churned,
    SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active,
    ROUND(100.0 * SUM(CASE WHEN c.is_active = 0 THEN 1 ELSE 0 END) / COUNT(*), 2) as churn_pct,
    ROUND(AVG(c.clv), 2) as avg_clv
FROM dim_customer c
GROUP BY c.loyalty_card
ORDER BY avg_clv DESC;
```

---

## COLUMNS TO ADD FOR SUSTAINABILITY TRACKING

If you want to fully track SDG 13 KPIs, you should add these calculated columns:

```python
# In your cleaning script, add:
fact_activity['fuel_consumed_liters'] = fact_activity['distance'] * 0.06
fact_activity['co2_emitted_kg'] = fact_activity['distance'] * 0.255
fact_activity['passenger_km'] = fact_activity['distance']  # Assuming 1 passenger per record
fact_activity['co2_per_passenger'] = fact_activity['co2_emitted_kg'] / fact_activity['passenger_km']
```

---

## NEXT STEPS

1. **Run the cleaning script**: `python 02_build_airline_dw.py`
2. **Check outputs** in `curated_dw/` folder:
   - `dim_customer_cleaned.csv`
   - `dim_time_cleaned.csv`
   - `fact_satisfaction_cleaned.csv`
   - `fact_activity_cleaned.csv`
   - `dw_schema_metadata.json` (schema definition)
   - `dw_sql_templates.json` (sample queries)
3. **Create Power BI/Tableau models** using these cleaned tables
4. **Build dashboards** with the KPI formulas above
5. **Generate reports** for SDG metrics

---

## File Locations

```
Ailines project/
├── Raw Data (input):
│   ├── airline_passenger_satisfaction.csv
│   ├── Customer Flight Activity.csv
│   ├── Customer Loyalty History.csv
│   └── Calendar.csv
├── Scripts:
│   └── 02_build_airline_dw.py
└── curated_dw/ (output - auto-created)
    ├── dim_customer_cleaned.csv
    ├── dm_time_cleaned.csv
    ├── fact_satisfaction_cleaned.csv
    ├── fact_activity_cleaned.csv
    ├── dw_schema_metadata.json
    ├── dw_sql_templates.json
    └── data_cleaning_audit.txt
```

---

Questions? Check the generated JSON files for detailed schema and SQL templates!
