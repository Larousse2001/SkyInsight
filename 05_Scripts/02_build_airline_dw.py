#!/usr/bin/env python3
"""
Airline Data Warehouse Builder
Cleans all datasets and creates dimension/fact tables
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
from datetime import datetime

# Configuration
# Resolve project root from script location to keep the pipeline portable.
BASE_PATH = Path(__file__).resolve().parents[1]
RAW_DATA_PATH = BASE_PATH / "03_Data_Raw"
CURATED_PATH = BASE_PATH / "04_Data_Cleaned" / "curated_dw"

# Create output directory
CURATED_PATH.mkdir(parents=True, exist_ok=True)

# Logging
audit_log = []
def log_msg(section, msg, level="INFO"):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{ts}] [{level}] {section}: {msg}"
    print(entry)
    audit_log.append(entry)

print("\n" + "="*80)
print("AIRLINE DATA WAREHOUSE BUILDER")
print("="*80)

# ============================================================================
# STEP 1: LOAD RAW DATA
# ============================================================================
print("\n[STEP 1] Loading raw datasets...")

dataset_files = {
    'airline_satisfaction': 'airline_passenger_satisfaction.csv',
    'customer_activity': 'Customer Flight Activity.csv',
    'customer_loyalty': 'Customer Loyalty History.csv',
    'calendar': 'Calendar.csv'
}

raw_data = {}
for key, filename in dataset_files.items():
    filepath = RAW_DATA_PATH / filename
    if filepath.exists():
        df = pd.read_csv(filepath)
        raw_data[key] = df
        log_msg("LOAD", f"{key}: {len(df):,} rows × {len(df.columns)} cols")
    else:
        log_msg("LOAD", f"{key}: FILE NOT FOUND", level="WARNING")

# ============================================================================
# STEP 2: STANDARDIZE COLUMN NAMES
# ============================================================================
print("\n[STEP 2] Standardizing column names...")

def standardize_cols(df):
    df.columns = (df.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace('[^a-z0-9_]', '', regex=True))
    return df

cleaned_data = {}
for key, df in raw_data.items():
    df_clean = df.copy()
    df_clean = standardize_cols(df_clean)
    cleaned_data[key] = df_clean
    log_msg("STANDARDIZE", f"{key}: columns standardized")

# ============================================================================
# STEP 3: REMOVE DUPLICATES
# ============================================================================
print("\n[STEP 3] Removing duplicates...")

df_sat = cleaned_data['airline_satisfaction']
before = len(df_sat)
df_sat = df_sat.drop_duplicates(subset=['id'], keep='first')
removed = before - len(df_sat)
cleaned_data['airline_satisfaction'] = df_sat
log_msg("DEDUP", f"airline_satisfaction: removed {removed} duplicates")

df_act = cleaned_data['customer_activity']
before = len(df_act)
df_act = df_act.drop_duplicates(subset=['loyalty_number', 'year', 'month'], keep='first')
removed = before - len(df_act)
cleaned_data['customer_activity'] = df_act
log_msg("DEDUP", f"customer_activity: removed {removed} duplicates")

df_loy = cleaned_data['customer_loyalty']
before = len(df_loy)
df_loy = df_loy.drop_duplicates(subset=['loyalty_number'], keep='first')
removed = before - len(df_loy)
cleaned_data['customer_loyalty'] = df_loy
log_msg("DEDUP", f"customer_loyalty: removed {removed} duplicates")

# ============================================================================
# STEP 4: CREATE SURROGATE KEYS
# ============================================================================
print("\n[STEP 4] Creating surrogate keys...")

df_loy = cleaned_data['customer_loyalty']
unique_cust = df_loy[['loyalty_number']].drop_duplicates().reset_index(drop=True)
unique_cust['customer_sk'] = range(1, len(unique_cust) + 1)
customer_key_map = dict(zip(unique_cust['loyalty_number'], unique_cust['customer_sk']))
log_msg("SURROG_KEY", f"Created {len(customer_key_map):,} customer keys")

df_cal = cleaned_data['calendar']
unique_dates = df_cal[['date']].drop_duplicates().reset_index(drop=True)
unique_dates['date_sk'] = range(1, len(unique_dates) + 1)
date_key_map = dict(zip(unique_dates['date'], unique_dates['date_sk']))
log_msg("SURROG_KEY", f"Created {len(date_key_map):,} date keys")

# ============================================================================
# STEP 5: BUILD DIMENSIONS
# ============================================================================
print("\n[STEP 5] Building dimension tables...")

# DIM_CUSTOMER
dim_customer = cleaned_data['customer_loyalty'].copy()
dim_customer['customer_sk'] = dim_customer['loyalty_number'].map(customer_key_map)
dim_customer = dim_customer[[
    'customer_sk', 'loyalty_number', 'country', 'province', 'city',
    'postal_code', 'gender', 'education', 'salary', 'marital_status',
    'loyalty_card', 'clv', 'enrollment_type', 'enrollment_year', 'enrollment_month'
]]
dim_customer['load_date'] = datetime.now().date()
log_msg("DIM_CUSTOMER", f"Built with {len(dim_customer):,} rows")

# DIM_TIME
dim_time = cleaned_data['calendar'].copy()
dim_time['date_sk'] = dim_time['date'].map(date_key_map)
dim_time = dim_time[['date_sk', 'date', 'start_of_year', 'start_of_quarter', 'start_of_month']].copy()
dim_time['load_date'] = datetime.now().date()
log_msg("DIM_TIME", f"Built with {len(dim_time):,} rows")

# ============================================================================
# STEP 6: BUILD FACT TABLES
# ============================================================================
print("\n[STEP 6] Building fact tables...")

# FACT_SATISFACTION
fact_sat = cleaned_data['airline_satisfaction'].copy()
fact_sat['satisfaction_sk'] = fact_sat.index + 1
log_msg("FACT_SATISFACTION", f"Built with {len(fact_sat):,} rows")

# FACT_ACTIVITY
fact_act = cleaned_data['customer_activity'].copy()
fact_act['activity_sk'] = fact_act.index + 1
fact_act['customer_sk'] = fact_act['loyalty_number'].map(customer_key_map)
log_msg("FACT_ACTIVITY", f"Built with {len(fact_act):,} rows")

# ============================================================================
# STEP 7: VALIDATE REFERENTIAL INTEGRITY
# ============================================================================
print("\n[STEP 7] Validating referential integrity...")

fact_fks = set(fact_act['customer_sk'].dropna().unique())
dim_pks = set(dim_customer['customer_sk'].unique())
orphaned = fact_fks - dim_pks
coverage = len(fact_fks - orphaned) / len(fact_fks) * 100 if len(fact_fks) > 0 else 100

if len(orphaned) == 0:
    log_msg("VALIDATE_FK", f"fact_activity → dim_customer: 100% coverage ✓")
else:
    log_msg("VALIDATE_FK", f"fact_activity → dim_customer: {coverage:.1f}% ({len(orphaned)} orphaned)", level="WARNING")

# ============================================================================
# STEP 8: EXPORT TABLES
# ============================================================================
print("\n[STEP 8] Exporting cleaned tables...")

dim_customer.to_csv(CURATED_PATH / "dim_customer_cleaned.csv", index=False)
log_msg("EXPORT", f"dim_customer: {len(dim_customer):,} rows")

dim_time.to_csv(CURATED_PATH / "dim_time_cleaned.csv", index=False)
log_msg("EXPORT", f"dim_time: {len(dim_time):,} rows")

fact_sat.to_csv(CURATED_PATH / "fact_satisfaction_cleaned.csv", index=False)
log_msg("EXPORT", f"fact_satisfaction: {len(fact_sat):,} rows")

fact_act.to_csv(CURATED_PATH / "fact_activity_cleaned.csv", index=False)
log_msg("EXPORT", f"fact_activity: {len(fact_act):,} rows")

# ============================================================================
# STEP 9: EXPORT SCHEMA METADATA
# ============================================================================
print("\n[STEP 9] Generating schema metadata...")

dw_schema = {
    "schema_name": "airline_dw",
    "version": "1.0",
    "created": datetime.now().isoformat(),
    "dimensions": {
        "dim_customer": {
            "primary_key": "customer_sk",
            "business_key": "loyalty_number",
            "rows": len(dim_customer),
            "description": "Customer profile with demographics and loyalty status"
        },
        "dim_time": {
            "primary_key": "date_sk",
            "business_key": "date",
            "rows": len(dim_time),
            "description": "Time dimension for temporal analysis"
        }
    },
    "facts": {
        "fact_satisfaction": {
            "primary_key": "satisfaction_sk",
            "grain": "Individual flight satisfaction",
            "rows": len(fact_sat),
            "foreign_keys": [],
            "description": "Passenger satisfaction metrics"
        },
        "fact_activity": {
            "primary_key": "activity_sk",
            "grain": "Customer monthly activity",
            "rows": len(fact_act),
            "foreign_keys": {"customer_sk": "dim_customer.customer_sk"},
            "description": "Monthly customer flights and loyalty points"
        }
    },
    "relationships": [
        {
            "fact_table": "fact_activity",
            "fact_column": "customer_sk",
            "dimension_table": "dim_customer",
            "dimension_column": "customer_sk",
            "cardinality": "Many-to-One"
        }
    ]
}

with open(CURATED_PATH / "dw_schema_metadata.json", 'w') as f:
    json.dump(dw_schema, f, indent=2, default=str)

log_msg("SCHEMA", "Exported dw_schema_metadata.json")

# ============================================================================
# STEP 10: EXPORT SQL TEMPLATES
# ============================================================================
print("\n[STEP 10] Generating SQL templates...")

sql_templates = {
    "join_customer_activity": """
    SELECT 
        c.customer_sk, c.loyalty_number, c.country, c.loyalty_card, c.clv,
        fa.year, fa.month, fa.total_flights, fa.distance, 
        fa.points_accumulated, fa.points_redeemed
    FROM fact_activity fa
    INNER JOIN dim_customer c ON fa.customer_sk = c.customer_sk
    ORDER BY c.loyalty_number, fa.year, fa.month
    """,
    "satisfaction_by_segment": """
    SELECT 
        customer_type, class, type_of_travel,
        COUNT(*) as flights,
        AVG(seat_comfort) as avg_comfort,
        SUM(CASE WHEN satisfaction = 'Satisfied' THEN 1 ELSE 0 END) as satisfied
    FROM fact_satisfaction
    GROUP BY customer_type, class, type_of_travel
    """,
    "kpi_churn_rate": """
    SELECT 
        loyalty_card,
        COUNT(*) as total_customers,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as churned,
        ROUND(100.0 * SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) / COUNT(*), 2) as churn_pct
    FROM dim_customer
    GROUP BY loyalty_card
    """,
    "kpi_emission_per_passenger": """
    SELECT 
        fa.year, fa.month,
        SUM(fa.distance) as total_km,
        COUNT(DISTINCT fa.customer_sk) as unique_customers,
        ROUND(SUM(fa.distance) * 0.255 / COUNT(DISTINCT fa.customer_sk), 2) as co2_kg_per_pax
    FROM fact_activity fa
    GROUP BY fa.year, fa.month
    ORDER BY fa.year, fa.month
    """
}

with open(CURATED_PATH / "dw_sql_templates.json", 'w') as f:
    json.dump(sql_templates, f, indent=2)

log_msg("SQL_TEMPLATES", "Exported dw_sql_templates.json")

# ============================================================================
# STEP 11: EXPORT AUDIT LOG
# ============================================================================
print("\n[STEP 11] Saving audit log...")

with open(CURATED_PATH / "data_cleaning_audit.txt", 'w', encoding='utf-8') as f:
    f.write("AIRLINE DATA WAREHOUSE PREPARATION AUDIT\n")
    f.write(f"Executed: {datetime.now().isoformat()}\n")
    f.write("="*80 + "\n\n")
    for entry in audit_log:
        f.write(entry + "\n")

log_msg("AUDIT", "Saved data_cleaning_audit.txt")

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\n" + "="*80)
print("✅ DATA WAREHOUSE PREPARATION COMPLETE!")
print("="*80)
print(f"\n📦 Output Location: {CURATED_PATH}")
print("\nExported Files:")
for file in sorted(CURATED_PATH.glob("*.csv")) + sorted(CURATED_PATH.glob("*.json")) + sorted(CURATED_PATH.glob("*.txt")):
    size_kb = file.stat().st_size / 1024
    print(f"  ✓ {file.name} ({size_kb:.1f} KB)")

print(f"\n📊 DW Structure:")
print(f"  Dimensions: 2 (dim_customer, dim_time)")
print(f"  Fact Tables: 2 (fact_satisfaction, fact_activity)")
print(f"  Relationships: 1 (fact_activity → dim_customer)")
print(f"  Total Records: {len(dim_customer) + len(dim_time) + len(fact_sat) + len(fact_act):,}")

print(f"\n📖 Read DW_PREPARATION_GUIDE.md for:")
print(f"  - Table relationship diagrams")
print(f"  - KPI formulas for SDG 9, 12, 13")
print(f"  - SQL JOIN examples")
print(f"  - Next steps for BI/Power BI")

print("\n✨ Your data is ready for analysis!\n")
