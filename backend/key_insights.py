import pandas as pd
import numpy as np
import duckdb
from ydata_profiling import ProfileReport


def to_python_type(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    if isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    if isinstance(obj, dict):
        return {k: to_python_type(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [to_python_type(v) for v in obj]
    return obj


def get_key_insights(query: str) -> dict:
    con = duckdb.connect("codejam_15.db")
    df = con.execute(query).fetchdf()
    
    # Generate profile report for advanced insights
    profile = ProfileReport(df, title="Dataset Insights", explorative=True, minimal=False)
    profile_desc = profile.get_description()   # BaseDescription object
    
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
    
    # Iterate through columns
    for col in df.columns:
        col_data = {
            "name": col,
            "type": str(df[col].dtype),
            "missing": int(df[col].isna().sum()),
            "missing_percent": float(df[col].isna().sum() / len(df) * 100) if len(df) > 0 else 0,
            "unique": int(df[col].nunique()),
        }

        # -----------------------------
        # YDATA-PROFILING SAFE ACCESS
        # -----------------------------
        if hasattr(profile_desc, "variables") and col in profile_desc.variables:
            col_profile = profile_desc.variables[col]

            # Add min/max *sample values* manually (real data samples)
            try:
                col_data["min_samples"] = [str(v) for v in df[col].nsmallest(5).tolist()]
            except Exception:
                pass

            try:
                col_data["max_samples"] = [str(v) for v in df[col].nlargest(5).tolist()]
            except Exception:
                pass

        # -----------------------------
        # NUMERIC COLUMNS
        # -----------------------------
        if pd.api.types.is_numeric_dtype(df[col]):
            if not df[col].isna().all():
                col_data["stats"] = {
                    "mean": float(df[col].mean()),
                    "median": float(df[col].median()),
                    "std": float(df[col].std()),
                    "min": float(df[col].min()),
                    "max": float(df[col].max()),
                    "q25": float(df[col].quantile(0.25)),
                    "q75": float(df[col].quantile(0.75)),
                }
            else:
                col_data["stats"] = None

            # Histogram (for frontend charts)
            clean = df[col].dropna()
            if len(clean) > 0:
                hist, bins = np.histogram(clean, bins=20)
                col_data["histogram"] = {
                    "counts": hist.tolist(),
                    "bins": bins.tolist()
                }

        # -----------------------------
        # CATEGORICAL COLUMNS
        # -----------------------------
        elif pd.api.types.is_object_dtype(df[col]) or pd.api.types.is_categorical_dtype(df[col]):
            value_counts = df[col].value_counts().head(10)
            col_data["top_values"] = [
                {"value": str(val), "count": int(count)}
                for val, count in value_counts.items()
            ]

        # -----------------------------
        # DATETIME COLUMNS
        # -----------------------------
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            if not df[col].isna().all():
                col_data["stats"] = {
                    "min": str(df[col].min()),
                    "max": str(df[col].max()),
                }

        insights["columns"].append(col_data)

    # -----------------------------
    # CORRELATION MATRIX
    # -----------------------------
    numeric_cols = df.select_dtypes(include=["number"]).columns
    print(f"DEBUG: Found {len(numeric_cols)} numeric columns: {list(numeric_cols)}")
    
    if len(numeric_cols) > 1:
        corr_matrix = df[numeric_cols].corr()

        insights["correlation_matrix"] = {
            "columns": numeric_cols.tolist(),
            "data": corr_matrix.values.tolist(),
        }

        # Strong correlations (abs > 0.5)
        strong_corrs = [
            {
                "col1": col1,
                "col2": col2,
                "correlation": float(corr_matrix.loc[col1, col2]),
            }
            for col1 in numeric_cols
            for col2 in numeric_cols
            if col1 < col2 and abs(corr_matrix.loc[col1, col2]) > 0.5
        ]
        
        # Also include ALL correlations for display (not just strong ones)
        insights["correlations"] = [
            {
                "col1": col1,
                "col2": col2,
                "correlation": float(corr_matrix.loc[col1, col2]),
            }
            for col1 in numeric_cols
            for col2 in numeric_cols
            if col1 < col2
        ]
        
        print(f"DEBUG: Generated {len(insights['correlations'])} correlations")
    else:
        print(f"DEBUG: Not enough numeric columns ({len(numeric_cols)}) for correlations")
        insights["correlation_matrix"] = None
        insights["correlations"] = []

    # -----------------------------
    # TOP INTERACTIONS (scatter data)
    # -----------------------------
    if len(numeric_cols) >= 2:
        insights["interactions"] = []

        if "correlations" in insights and insights["correlations"]:
            top_pairs = sorted(
                insights["correlations"],
                key=lambda x: abs(x["correlation"]),
                reverse=True
            )[:3]

            for pair in top_pairs:
                col1, col2 = pair["col1"], pair["col2"]

                # Sample up to 500 rows
                clean_df = df[[col1, col2]].dropna()
                sample_df = clean_df.sample(n=min(500, len(clean_df))) if len(clean_df) > 0 else []

                insights["interactions"].append({
                    "col1": col1,
                    "col2": col2,
                    "correlation": pair["correlation"],
                    "data": [
                        {"x": float(row[col1]), "y": float(row[col2])}
                        for _, row in sample_df.iterrows()
                    ],
                })

    return to_python_type(insights)
