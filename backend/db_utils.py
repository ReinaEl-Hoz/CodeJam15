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
        "daily_revenue": "Daily revenue",
        "expenses": "Company expenses by department",
        "marketing": "Marketing campaigns and promotions",
        "order_items": "Order items and their details",
        "orders": "Customer orders and transactions",
        "payroll": "Employee payroll information",
        "products": "Product catalog with pricing and discounts",
        "profit_forecast": "Profit forecast for the month"
    }

def get_default_column_descriptions() -> Dict[str, Dict[str, str]]:
    """Get default column descriptions based on the database structure"""
    return {
        "customers": {
            "customer_id": "Unique customer ID",
            "name": "Customer name",
            "segment": "Customer segment",
            "industry": "Customer industry",
            "country": "Customer country",
            "created_at": "Date customer was created"
        },
        "daily_revenue": {
            "date": "Date of the revenue",
            "total_revenue": "Total revenue for the day in USD"
        },
        "expenses": {
            "expense_id": "Unique expense ID",
            "date": "Date of expense",
            "category": "Expense category",
            "department": "Department that incurred the expense",
            "amount": "Expense amount in USD",
            "description": "Expense description",
            "month": "Month of the expense"
        },
        "marketing": {
            "date": "Date of the marketing campaign",
            "channel": "Marketing channel",
            "campaign": "Marketing campaign name",
            "spend": "Marketing spend in USD",
            "impressions": "Marketing impressions",
            "clicks": "Marketing clicks",
            "conversions": "Marketing conversions",
            "revenue": "Marketing revenue in USD"
        },
        "order_items": {
            "order_item_id": "Order item ID",
            "order_id": "Order ID",
            "product_id": "Product ID",
            "quantity": "Quantity ordered",
            "unit_price": "Price per item in USD",
            "discount": "Discount amount in USD",
            "line_total": "Total line amount in USD"
        },
        "orders": {
            "order_id": "Unique order ID",
            "order_date": "Date of the order",
            "customer_id": "Customer who placed order",
            "region": "Region of the order",
            "segment": "Segment of the customer",
            "subtotal": "Subtotal of the order in USD",
            "tax": "Tax amount in USD",
            "total_amount": "Total amount of the order in USD",
            "cogs": "Cost of goods sold in USD",
            "profit": "Profit of the order in USD",
            "month": "Month of the order"
        },
        "payroll": {
            "employee_id": "Unique employee ID",
            "employee_name": "Employee name",
            "department": "Department the employee belongs to",
            "role": "Employee role",
            "base_salary": "Employee base salary in USD",
            "bonus_target": "Employee bonus target in USD",
            "hire_date": "Date the employee was hired",
            "employment_type": "Employee employment type"
        },
         "products": {
            "product_id": "Unique product ID",
            "product_name": "Product name",
            "category": "Product category",
            "subcategory": "Product subcategory",
            "sku": "Product SKU",
            "base_cost": "Product base cost in USD"
        },
        "profit_forecast": {
            "month_start": "Month start date of the profit forecast",
            "revenue": "Revenue in USD",
            "cogs": "Cost of goods sold in USD",
            "opex": "Operating expenses in USD",
            "profit": "Profit in USD",
            "budget_revenue": "Budget revenue in USD",
            "budget_profit": "Budget profit in USD"
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
    get_all_tables_info()
    schema = get_database_schema_with_descriptions()

    import json
    print(json.dumps(schema, indent=2)) 