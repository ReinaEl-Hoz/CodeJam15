# check_db.py
import duckdb

con = duckdb.connect("codejam_15.db")

def get_all_tables_info():
    tables = [t[0] for t in con.execute("SHOW TABLES").fetchall()]
    print(f"Found {len(tables)} tables:\n")
    
    for table in tables:
        cols = con.execute(f"PRAGMA table_info('{table}')").fetchall()
        print(f"\nTable: {table}")
        print("Columns:")
        for col in cols:
            print(f"  - {col[1]} ({col[2]})")
        
        # Show sample data
        sample = con.execute(f"SELECT * FROM {table} LIMIT 3").fetchall()
        print(f"Sample rows: {len(sample)}")

if __name__ == "__main__":
    get_all_tables_info()

con.close()