import duckdb
import os

DB_PATH = "codejam_15.db"

def get_db_connection():
    """Get DuckDB connection"""
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")
    return duckdb.connect(DB_PATH, read_only=False)

def execute_query(query, params=None):
    """Execute a query and return results as a list of dicts"""
    con = get_db_connection()
    try:
        if params:
            result = con.execute(query, params).fetchall()
        else:
            result = con.execute(query).fetchall()
        
        # Get column names
        columns = [desc[0] for desc in con.description]
        
        # Convert to list of dicts
        return [dict(zip(columns, row)) for row in result]
    finally:
        con.close()

def execute_query_df(query, params=None):
    """Execute a query and return as pandas DataFrame"""
    con = get_db_connection()
    try:
        if params:
            result = con.execute(query, params).df()
        else:
            result = con.execute(query).df()
        return result
    finally:
        con.close()