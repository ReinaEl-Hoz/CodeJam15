import duckdb
from typing import List, Dict, Optional

def get_connection(db_path: str = "codejam_15.db"):
    """Get a DuckDB connection"""
    return duckdb.connect(db_path)

def get_table_columns(con: duckdb.DuckDBPyConnection, table_name: str) -> List[Dict[str, str]]:
    """
    Get column information for a specific table.
    Returns a list of column dictionaries with name and type.
    """
    # Use DESCRIBE to get column information
    result = con.execute(f"DESCRIBE {table_name}").fetchall()
    columns = []
    for row in result:
        col_name = row[0]
        col_type = row[1].upper()  # Normalize to uppercase
        columns.append({
            "name": col_name,
            "type": col_type
        })
    return columns

def get_database_schema(
    db_path: str = "codejam_15.db",
    table_descriptions: Optional[Dict[str, str]] = None,
    column_descriptions: Optional[Dict[str, Dict[str, str]]] = None
) -> List[Dict]:
    """
    Extract database schema and format it for AI consumption.
    
    Args:
        db_path: Path to the DuckDB database file
        table_descriptions: Optional dict mapping table names to descriptions
        column_descriptions: Optional dict mapping table names to dicts of column descriptions
                           e.g., {"orders": {"order_id": "Unique order ID", ...}}
    
    Returns:
        List of table schema dictionaries in the format:
        [
            {
                "table": "table_name",
                "description": "table description",
                "columns": [
                    {"name": "col_name", "type": "TYPE", "description": "col description"},
                    ...
                ]
            },
            ...
        ]
    """
    con = get_connection(db_path)
    
    # Get all tables
    tables = [t[0] for t in con.execute("SHOW TABLES").fetchall()]
    
    schema = []
    for table_name in tables:
        # Get columns for this table
        columns_info = get_table_columns(con, table_name)
        
        # Format columns with descriptions
        formatted_columns = []
        for col_info in columns_info:
            col_dict = {
                "name": col_info["name"],
                "type": col_info["type"]
            }
            
            # Add description if provided
            if column_descriptions and table_name in column_descriptions:
                col_desc = column_descriptions[table_name].get(col_info["name"])
                if col_desc:
                    col_dict["description"] = col_desc
            
            formatted_columns.append(col_dict)
        
        # Create table entry
        table_entry = {
            "table": table_name,
            "columns": formatted_columns
        }
        
        # Add table description if provided
        if table_descriptions and table_name in table_descriptions:
            table_entry["description"] = table_descriptions[table_name]
        
        schema.append(table_entry)
    
    con.close()
    return schema

def get_default_table_descriptions() -> Dict[str, str]:
    """Get default table descriptions based on the database structure"""
    return {
        "customers": "Customer information",
        "products": "Product catalog with pricing",
        "orders": "Customer orders and transactions",
        "departments": "Company departments",
        "payroll": "Employee payroll information",
        "expenses": "Company expenses by department",
        "daily_revenue": "Daily revenue and tax summaries"
    }

def get_default_column_descriptions() -> Dict[str, Dict[str, str]]:
    """Get default column descriptions based on the database structure"""
    return {
        "customers": {
            "customer_id": "Unique customer ID",
            "name": "Customer name",
            "email": "Email address",
            "country": "Customer country"
        },
        "products": {
            "product_id": "Unique product ID",
            "product_name": "Product name",
            "price": "Product price in USD"
        },
        "orders": {
            "order_id": "Unique order ID",
            "customer_id": "Customer who placed order",
            "product_id": "Product ordered",
            "quantity": "Quantity ordered",
            "revenue": "Order revenue in USD",
            "tax": "Tax amount in USD"
        },
        "departments": {
            "department_id": "Unique department ID",
            "department_name": "Department name"
        },
        "payroll": {
            "employee_id": "Unique employee ID",
            "department_id": "Department the employee belongs to",
            "name": "Employee name",
            "salary": "Employee salary in USD"
        },
        "expenses": {
            "expense_id": "Unique expense ID",
            "department_id": "Department that incurred the expense",
            "description": "Expense description",
            "amount": "Expense amount in USD",
            "date": "Date of expense"
        },
        "daily_revenue": {
            "day_id": "Day identifier",
            "total_revenue": "Total revenue for the day in USD",
            "total_tax": "Total tax for the day in USD",
            "date": "Date of the revenue"
        }
    }

def get_database_schema_with_descriptions(db_path: str = "codejam_15.db") -> List[Dict]:
    """
    Get database schema with default descriptions included.
    This is a convenience function that uses the default descriptions.
    """
    table_descriptions = get_default_table_descriptions()
    column_descriptions = get_default_column_descriptions()
    return get_database_schema(db_path, table_descriptions, column_descriptions)

def get_all_tables_info(db_path: str = "codejam_15.db"):
    """Legacy function - prints table information (kept for backward compatibility)"""
    con = get_connection(db_path)
    tables = [t[0] for t in con.execute("SHOW TABLES").fetchall()]
    for table in tables:
        cols = [c[1] for c in con.execute(f"PRAGMA table_info('{table}')").fetchall()]
        print(f"Table {table}: columns = {cols}")
    con.close()

if __name__ == "__main__":
    # Example usage - get schema with descriptions
    schema = get_database_schema_with_descriptions()
    import json
    print(json.dumps(schema, indent=2))