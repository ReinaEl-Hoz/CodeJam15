import duckdb
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from key_insights import get_key_insights

app = FastAPI()
con = duckdb.connect("codejam_15.db")

@app.get("/key-insights", response_class=JSONResponse)
def profile_report(query: str):
    return get_key_insights(query)
