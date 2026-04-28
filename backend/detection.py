import pandas as pd
import re

KEYWORDS = [
    "gender", "sex", "age", "dob", "birth", "race", "caste", "religion", 
    "community", "pincode", "zip", "region", "district", "income", 
    "salary", "wage"
]

def detect_sensitive_attributes(df: pd.DataFrame) -> dict:
    """
    Analyzes a DataFrame and returns a list of detected sensitive column names 
    based on keyword matching (Layer 1) and cardinality checks (Layer 2).
    """
    detected = []
    reason_map = {}
    
    for col in df.columns:
        col_name = str(col).lower()
        
        # Layer 1: Keyword match
        # Check if column name contains any of the sensitive keywords
        # The 'in' operator accurately identifies substrings even if separated by hyphens (e.g. 'marital-status')
        # We also do a word boundary regex check to be safe
        clean_name = col_name.replace('-', ' ').replace('_', ' ')
        is_keyword = any(re.search(rf'\b{kw}\b', clean_name) for kw in KEYWORDS)
        
        # Fallback to pure substring as requested ("contains any of")
        if not is_keyword:
            is_keyword = any(kw in col_name for kw in KEYWORDS)
            
        if is_keyword:
            detected.append(col)
            reason_map[col] = "keyword"
            continue
            
        # Layer 2: Cardinality check
        # Flag any column with 2-5 unique non-null values. 
        # Treat literal '?' as missing/NA.
        valid_mask = ~df[col].isin(['?']) & df[col].notna()
        num_unique = df[col][valid_mask].nunique()
        
        if 2 <= num_unique <= 5:
            detected.append(col)
            reason_map[col] = "cardinality"
            
    return {
        "detected": detected,
        "reason": reason_map
    }
