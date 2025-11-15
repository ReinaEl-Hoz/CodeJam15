import duckdb
from fastapi.responses import JSONResponse

def save_chart_query(query):
    con = duckdb.connect('charts.db')
    con.execute("INSERT INTO charts (query) VALUES (?)", [query])
    con.close()

def get_chart_queries():
    con = duckdb.connect('charts.db')
    con.execute("SELECT (id,query) FROM charts")
    con.close()

def get_charts():
    chart_queries = get_chart_queries()
    con = duckdb.connect("codejam15.db")
    charts = []
    for query in chart_queries:
        charts.append(JSONResponse(con.execute(query)))
    con.close()
    return charts



if __name__ == "__main__":
    con = duckdb.connect('charts.db')
    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS chart_id_seq START 1;
        
        CREATE TABLE users (
            id INTEGER PRIMARY KEY DEFAULT nextval('chart_id_seq'),
            query VARCHAR
        )
    """)