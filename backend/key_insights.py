from fastapi.responses import HTMLResponse
import pandas as pd
from ydata_profiling import ProfileReport
import duckdb


def get_key_insights(query: str) -> str:

    con = duckdb.connect("codejam_15.db")
    df = con.execute(query).fetchdf()

    # Generate the profile report
    profile = ProfileReport(df, title="Dataset Insights", explorative=True)

    return profile.to_html()
    

if __name__ == "__main__":

    html_str = get_key_insights("SELECT revenue, customer_id FROM orders")
    with open("profile_report.html", "w", encoding="utf-8") as f:
        f.write(html_str)
