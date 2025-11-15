from db import execute_query, execute_query_df
import pandas as pd

def get_daily_revenue_trend(start_date=None, end_date=None):
    """
    Get daily revenue trend in Plotly format
    Returns: dict with x (dates) and y (revenue) arrays
    """
    query = """
    SELECT 
        date as x,
        total_revenue as y
    FROM daily_revenue
    WHERE 1=1
    """
    
    params = []
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
    
    query += " ORDER BY date"
    
    df = execute_query_df(query, params if params else None)
    
    return {
        'x': df['x'].astype(str).tolist(),  # Convert dates to strings
        'y': df['y'].tolist(),
        'type': 'scatter',
        'mode': 'lines+markers',
        'name': 'Daily Revenue'
    }

def get_revenue_by_product():
    """
    Get total revenue by product in Plotly format
    Returns: dict with x (product names) and y (revenue) arrays
    """
    query = """
    SELECT 
        p.product_name as x,
        SUM(o.revenue) as y
    FROM orders o
    JOIN products p ON o.product_id = p.product_id
    GROUP BY p.product_name
    ORDER BY y DESC
    """
    
    df = execute_query_df(query)
    
    return {
        'x': df['x'].tolist(),
        'y': df['y'].tolist(),
        'type': 'bar',
        'name': 'Revenue by Product'
    }

def get_revenue_by_customer(top_n=10):
    """
    Get top N customers by revenue in Plotly format
    """
    query = """
    SELECT 
        c.name as x,
        SUM(o.revenue) as y
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    GROUP BY c.name
    ORDER BY y DESC
    LIMIT ?
    """
    
    df = execute_query_df(query, [top_n])
    
    return {
        'x': df['x'].tolist(),
        'y': df['y'].tolist(),
        'type': 'bar',
        'name': f'Top {top_n} Customers by Revenue'
    }

def get_payroll_by_department():
    """
    Get total payroll by department in Plotly format
    """
    query = """
    SELECT 
        d.department_name as x,
        SUM(p.salary) as y
    FROM payroll p
    JOIN departments d ON p.department_id = d.department_id
    GROUP BY d.department_name
    ORDER BY y DESC
    """
    
    df = execute_query_df(query)
    
    return {
        'x': df['x'].tolist(),
        'y': df['y'].tolist(),
        'type': 'bar',
        'name': 'Payroll by Department'
    }

def get_expenses_over_time():
    """
    Get expenses over time (aggregated by month) in Plotly format
    """
    query = """
    SELECT 
        DATE_TRUNC('month', date) as x,
        SUM(amount) as y
    FROM expenses
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY x
    """
    
    df = execute_query_df(query)
    
    return {
        'x': df['x'].astype(str).tolist(),
        'y': df['y'].tolist(),
        'type': 'scatter',
        'mode': 'lines+markers',
        'name': 'Monthly Expenses'
    }

def get_revenue_vs_expenses():
    """
    Compare revenue vs expenses (multi-trace for Plotly)
    Returns: list of two traces
    """
    # Get monthly revenue
    revenue_query = """
    SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(total_revenue) as amount
    FROM daily_revenue
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month
    """
    
    # Get monthly expenses
    expenses_query = """
    SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as amount
    FROM expenses
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month
    """
    
    revenue_df = execute_query_df(revenue_query)
    expenses_df = execute_query_df(expenses_query)
    
    return [
        {
            'x': revenue_df['month'].astype(str).tolist(),
            'y': revenue_df['amount'].tolist(),
            'type': 'scatter',
            'mode': 'lines+markers',
            'name': 'Revenue'
        },
        {
            'x': expenses_df['month'].astype(str).tolist(),
            'y': expenses_df['amount'].tolist(),
            'type': 'scatter',
            'mode': 'lines+markers',
            'name': 'Expenses'
        }
    ]

def get_top_products_by_quantity(top_n=5):
    """
    Get top N products by quantity sold
    """
    query = """
    SELECT 
        p.product_name as x,
        SUM(o.quantity) as y
    FROM orders o
    JOIN products p ON o.product_id = p.product_id
    GROUP BY p.product_name
    ORDER BY y DESC
    LIMIT ?
    """
    
    df = execute_query_df(query, [top_n])
    
    return {
        'x': df['x'].tolist(),
        'y': df['y'].tolist(),
        'type': 'bar',
        'name': f'Top {top_n} Products by Quantity'
    }

# Map query types to functions
QUERY_FUNCTIONS = {
    'daily_revenue': get_daily_revenue_trend,
    'revenue_by_product': get_revenue_by_product,
    'revenue_by_customer': get_revenue_by_customer,
    'payroll_by_department': get_payroll_by_department,
    'expenses_over_time': get_expenses_over_time,
    'revenue_vs_expenses': get_revenue_vs_expenses,
    'top_products': get_top_products_by_quantity,
}