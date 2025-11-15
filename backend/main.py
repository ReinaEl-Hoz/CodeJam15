import duckdb
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from key_insights import get_key_insights
from backend.chart_persistence_utils import get_charts, save_chart_query

app = FastAPI()
con = duckdb.connect("codejam_15.db")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React/Vite ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/key-insights", response_class=JSONResponse)
def profile_report(query: str):
    return get_key_insights(query)

@app.get("/charts", response_class=list[JSONResponse])
def get_charts():
    return get_charts 

@app.post("/save-chart")
def save_chart(query: str):
    save_chart_query(query)
