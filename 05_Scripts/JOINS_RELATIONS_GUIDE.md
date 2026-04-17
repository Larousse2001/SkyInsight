# Joins and Table Relationships Guide

This guide explains how to create relationships between the warehouse tables and how to join them correctly in SQL and Power BI.

## 1) Warehouse Tables and Keys

### Dimension tables
- `dim_customer_cleaned.csv`
  - Primary key: `customer_sk`
  - Business key: `loyalty_number`

- `dim_time_cleaned.csv`
  - Primary key: `date_sk`
  - Business key: `date`

### Fact tables
- `fact_activity_cleaned.csv`
  - Primary key: `activity_sk`
  - Foreign key: `customer_sk` -> `dim_customer.customer_sk`
  - Time fields: `year`, `month` (recommended to map to `date_sk` if needed)

- `fact_satisfaction_cleaned.csv`
  - Primary key: `satisfaction_sk`
  - Contains detailed flight satisfaction metrics.
  - For customer-level analytics, use `id` to map to source customer identifier if available.

## 2) Recommended Relationship Model (Star Schema)

Use dimensions on the one-side and facts on the many-side.

1. `dim_customer.customer_sk` (1) -> (*) `fact_activity.customer_sk`
2. `dim_time.date_sk` (1) -> (*) `fact_activity.date_sk` (if date_sk exists in fact table)
3. `dim_time.date_sk` (1) -> (*) `fact_satisfaction.date_sk` (if date_sk exists in fact table)

If a fact table does not yet contain `date_sk`, derive it in ETL before loading to BI.

## 3) Join Types and When to Use Them

- `INNER JOIN`
  - Use when you want only matching records in both tables.
  - Best for KPI accuracy when orphan records should be excluded.

- `LEFT JOIN`
  - Use when you want all records from the fact table, even if dimension data is missing.
  - Best for data quality checks and orphan detection.

- `FULL OUTER JOIN`
  - Use only for reconciliation and debugging.

## 4) SQL Join Examples

## 4.1 Customer activity with customer attributes
```sql
SELECT
    fa.activity_sk,
    fa.customer_sk,
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
    ON fa.customer_sk = c.customer_sk;
```

## 4.2 Orphan key check (data quality)
```sql
SELECT
    fa.customer_sk,
    COUNT(*) AS orphan_rows
FROM fact_activity fa
LEFT JOIN dim_customer c
    ON fa.customer_sk = c.customer_sk
WHERE c.customer_sk IS NULL
GROUP BY fa.customer_sk
ORDER BY orphan_rows DESC;
```

## 4.3 Aggregate KPI by customer segment
```sql
SELECT
    c.loyalty_card,
    COUNT(DISTINCT fa.customer_sk) AS customers,
    SUM(fa.total_flights) AS flights,
    SUM(fa.distance) AS total_distance,
    SUM(fa.points_accumulated) AS points_earned,
    SUM(fa.points_redeemed) AS points_used
FROM fact_activity fa
INNER JOIN dim_customer c
    ON fa.customer_sk = c.customer_sk
GROUP BY c.loyalty_card
ORDER BY flights DESC;
```

## 5) Power BI Relationship Setup

Load these files from `04_Data_Cleaned/curated_dw`:
- `dim_customer_cleaned.csv`
- `dim_time_cleaned.csv`
- `fact_activity_cleaned.csv`
- `fact_satisfaction_cleaned.csv`

Then in Model view:
1. Create relationship: `fact_activity[customer_sk]` -> `dim_customer[customer_sk]`
2. Set cardinality: Many-to-one (*:1)
3. Set cross filter direction: Single
4. Mark `dim_time` as Date table (if date column is present)
5. Connect time keys (`date_sk`) once available in each fact table

## 6) Common Mistakes to Avoid

1. Joining on business keys when surrogate keys exist.
2. Using many-to-many relationships unless absolutely required.
3. Enabling bidirectional filters everywhere (can create ambiguous paths).
4. Not checking orphan keys before dashboarding.

## 7) Validation Checklist

- No nulls in primary keys (`customer_sk`, `date_sk`).
- No orphan foreign keys in facts.
- Relationship cardinality is correct (*:1 from fact to dimension).
- KPI values are stable between SQL and Power BI.

## 8) Practical Rule

If your metric is additive and transactional, start from fact tables.
If your metric is descriptive or segmentation-based, bring in dimensions via surrogate-key joins.
