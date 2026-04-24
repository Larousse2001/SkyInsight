# 09_Reports - Power BI Data Repository

This folder contains all predicted results and training outputs organized for Power BI integration.

## 📊 Folder Structure

### 01_ML_Results/
Machine Learning model predictions and analysis results from the 07_ML folder.

#### Churn_Prediction/
- **model_comparison.csv** - Performance metrics comparison of churn prediction models
- **feature_importance.csv** - Top features driving customer churn predictions
- **high_risk_customers_top20.csv** - Top 20 high-risk customers for churn (business intelligence)

#### Satisfaction/
- **model_comparison.csv** - Performance metrics of satisfaction models
- **model_feature_importance.csv** - Feature importance for satisfaction prediction
- **feature_importance_selection_stage.csv** - Feature selection analysis
- **cluster_summary.csv** - Customer satisfaction clustering results
- **cluster_churn_proxy.csv** - Relationship between clusters and churn proxy metrics

### 02_CNN_Results/
Deep Learning CNN model training results from the 08_CNN folder.

- **training_results_20260410_151447.csv** - Training results (Run 1)
- **training_results_20260410_154607.csv** - Training results (Run 2)
- **training_results_20260410_155743.csv** - Training results (Run 3)
- **training_results_20260410_160728.csv** - Training results (Run 4)
- **training_results_20260414_210733.csv** - Training results (Run 5 - Latest)

## 🔄 Using with Power BI

1. **Connect Data Sources**: Link each CSV as a separate query in Power BI
2. **Create Relationships**: Link customer/model data where applicable
3. **Build Dashboards**: 
   - Churn Risk Dashboard (using high_risk_customers_top20.csv)
   - Satisfaction Analysis (using cluster & feature importance data)
   - Model Performance Comparison (using model_comparison.csv files)
   - CNN Training Progress (using training_results CSVs)

## 📝 Notes

- All CSV files are ready for direct import into Power BI
- Timestamps in CNN results can be used for temporal analysis
- Feature importance files help explain model decisions
- High-risk customer list is updated based on latest predictions

---
**Last Updated**: 2026-04-15
