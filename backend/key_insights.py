from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import duckdb
from typing import Dict, Any, List
from ydata_profiling import ProfileReport


def get_key_insights(query: str) -> JSONResponse:
    con = duckdb.connect("codejam_15.db")
    df = con.execute(query).fetchdf()
    
    # Generate profile report for advanced insights
    profile = ProfileReport(df, title="Dataset Insights", explorative=True, minimal=False)
    profile_dict = profile.get_description()
    
    # Calculate comprehensive statistics
    insights = {
        "overview": {
            "row_count": len(df),
            "column_count": len(df.columns),
            "memory_usage": df.memory_usage(deep=True).sum() / 1024**2,  # MB
            "duplicate_rows": df.duplicated().sum(),
        },
        "columns": []
    }
    
    for col in df.columns:
        col_data = {
            "name": col,
            "type": str(df[col].dtype),
            "missing": int(df[col].isna().sum()),
            "missing_percent": float(df[col].isna().sum() / len(df) * 100),
            "unique": int(df[col].nunique()),
        }
        
        # Get min/max samples from ydata-profiling
        if col in profile_dict['variables']:
            col_profile = profile_dict['variables'][col]
            
            # Add minimum values (actual data samples)
            if 'min' in col_profile:
                col_data['min_samples'] = []
                try:
                    min_vals = df[col].nsmallest(5).tolist()
                    col_data['min_samples'] = [str(v) for v in min_vals]
                except:
                    pass
            
            # Add maximum values (actual data samples)
            if 'max' in col_profile:
                col_data['max_samples'] = []
                try:
                    max_vals = df[col].nlargest(5).tolist()
                    col_data['max_samples'] = [str(v) for v in max_vals]
                except:
                    pass
        
        # Numeric columns
        if pd.api.types.is_numeric_dtype(df[col]):
            col_data["stats"] = {
                "mean": float(df[col].mean()) if not df[col].isna().all() else None,
                "median": float(df[col].median()) if not df[col].isna().all() else None,
                "std": float(df[col].std()) if not df[col].isna().all() else None,
                "min": float(df[col].min()) if not df[col].isna().all() else None,
                "max": float(df[col].max()) if not df[col].isna().all() else None,
                "q25": float(df[col].quantile(0.25)) if not df[col].isna().all() else None,
                "q75": float(df[col].quantile(0.75)) if not df[col].isna().all() else None,
            }
            # Histogram data
            hist, bins = np.histogram(df[col].dropna(), bins=20)
            col_data["histogram"] = {
                "counts": hist.tolist(),
                "bins": bins.tolist()
            }
        
        # Categorical/Object columns
        elif pd.api.types.is_object_dtype(df[col]) or pd.api.types.is_categorical_dtype(df[col]):
            value_counts = df[col].value_counts().head(10)
            col_data["top_values"] = [
                {"value": str(val), "count": int(count)} 
                for val, count in value_counts.items()
            ]
        
        # DateTime columns
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            col_data["stats"] = {
                "min": str(df[col].min()) if not df[col].isna().all() else None,
                "max": str(df[col].max()) if not df[col].isna().all() else None,
            }
        
        insights["columns"].append(col_data)
    
    # Full correlation matrix for numeric columns
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) > 1:
        corr_matrix = df[numeric_cols].corr()
        
        # Full correlation matrix as heatmap data
        insights["correlation_matrix"] = {
            "columns": numeric_cols.tolist(),
            "data": corr_matrix.values.tolist()
        }
        
        # Strong correlations list
        insights["correlations"] = [
            {
                "col1": col1,
                "col2": col2,
                "correlation": float(corr_matrix.loc[col1, col2])
            }
            for col1 in numeric_cols
            for col2 in numeric_cols
            if col1 < col2 and abs(corr_matrix.loc[col1, col2]) > 0.5
        ]
    
    # Interactions - scatter plot data for top correlated pairs
    if len(numeric_cols) >= 2:
        insights["interactions"] = []
        
        # Get top 3 correlated pairs
        if "correlations" in insights and len(insights["correlations"]) > 0:
            top_pairs = sorted(insights["correlations"], 
                             key=lambda x: abs(x["correlation"]), 
                             reverse=True)[:3]
            
            for pair in top_pairs:
                col1, col2 = pair["col1"], pair["col2"]
                
                # Sample data for scatter plot (max 500 points)
                sample_size = min(500, len(df))
                sample_df = df[[col1, col2]].dropna().sample(n=min(sample_size, len(df[[col1, col2]].dropna())))
                
                insights["interactions"].append({
                    "col1": col1,
                    "col2": col2,
                    "correlation": pair["correlation"],
                    "data": [
                        {"x": float(row[col1]), "y": float(row[col2])}
                        for _, row in sample_df.iterrows()
                    ]
                })
    
    return insights