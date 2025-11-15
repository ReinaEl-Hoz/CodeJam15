import pandas as pd
from ydata_profiling import ProfileReport
import duckdb
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from key_insights import get_key_insights

app = FastAPI()
con = duckdb.connect("codejam_15.db")

@app.get("/key-insights", response_class=HTMLResponse)
def profile_report(query: str):
    html_str = get_key_insights(query)
    return HTMLResponse(content=html_str)
