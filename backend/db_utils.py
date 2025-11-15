import duckdb

con = duckdb.connect("codejam_15.db")

def get_all_tables_info():
    tables = [t[0] for t in con.execute("SHOW TABLES").fetchall()]
    for table in tables:
        cols = [c[1] for c in con.execute(f"PRAGMA table_info('{table}')").fetchall()]
        print(f"Table {table}: columns = {cols}")

if __name__ == "__main__":
    get_all_tables_info()