import pandas as pd
import numpy as np
from fairlearn.metrics import demographic_parity_difference, equalized_odds_difference

def compute_metrics(df: pd.DataFrame, sensitive_col: str, outcome_col: str, positive_value: str) -> dict:
    """
    Computes bias and fairness metrics for a given dataset based on a sensitive column and an outcome column.
    """
    df_clean = df.copy()
    
    # 1. Handle missing values: Treat '?' as NaN
    df_clean[sensitive_col] = df_clean[sensitive_col].replace('?', pd.NA)
    df_clean[outcome_col] = df_clean[outcome_col].replace('?', pd.NA)
    
    # Drop rows containing NaNs in either the sensitive or outcome column
    df_clean = df_clean.dropna(subset=[sensitive_col, outcome_col])
    
    if len(df_clean) == 0:
        return {"error": "No valid data after removing missing values"}
        
    # Strip leading/trailing spaces for the outcome comparisons as requested
    df_clean['outcome_clean'] = df_clean[outcome_col].astype(str).str.strip()
    pos_val_clean = str(positive_value).strip()
    
    # Encode the outcome as binary (positive_value = 1, else 0)
    y = (df_clean['outcome_clean'] == pos_val_clean).astype(int)
    sensitive_features = df_clean[sensitive_col]
    
    # 3. Compute group-level outcome rates
    group_rates = {}
    unique_groups = sensitive_features.unique()
    for group in unique_groups:
        mask = (sensitive_features == group)
        # Using native float for clean JSON serialization later
        group_rates[str(group)] = float(y[mask].mean())
        
    rates = list(group_rates.values())
    min_rate = min(rates) if rates else 0.0
    max_rate = max(rates) if rates else 0.0
    
    # 2. Compute Fairness constraints metrics
    # Note: FairLearn generally uses y_true and y_pred. Since we are evaluating an existing 
    # dataset's outcomes statically, we map the outcome labels sequentially to both.
    
    # Demographic Parity Difference 
    try:
        dp_diff = float(demographic_parity_difference(y_true=y, y_pred=y, sensitive_features=sensitive_features))
    except Exception:
        dp_diff = max_rate - min_rate
        
    # Statistical Parity Difference (Conceptually identical to Demographic Parity Difference)
    stat_parity_diff = dp_diff
    
    # Disparate Impact Ratio (min rate / max rate)
    di_ratio = float(min_rate / max_rate) if max_rate > 0 else 1.0
    
    # Equalized Odds Difference
    try:
        eo_diff = float(equalized_odds_difference(y_true=y, y_pred=y, sensitive_features=sensitive_features))
    except Exception:
        eo_diff = 0.0
        
    # 4. Classify severity
    # High if DP > 0.2 or DI < 0.7
    # Moderate if DP 0.1-0.2 or DI 0.7-0.8
    # else Low
    severity = "Low"
    if dp_diff > 0.2 or di_ratio < 0.7:
        severity = "High"
    elif dp_diff > 0.1 or di_ratio <= 0.8:
        severity = "Moderate"
        
    return {
        "demographic_parity_difference": dp_diff,
        "statistical_parity_difference": stat_parity_diff,
        "disparate_impact_ratio": di_ratio,
        "equalized_odds_difference": eo_diff,
        "group_rates": group_rates,
        "severity": severity
    }
