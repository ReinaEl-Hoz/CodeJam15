import duckdb
import pandas as pd
import numpy as np

# -----------------------------
# Step 1: Define realistic tables as Pandas DataFrames
# -----------------------------

# Customers table
customers = pd.DataFrame({
    'customer_id': range(1, 101),
    'name': [f'Customer_{i}' for i in range(1, 101)],
    'email': [f'customer{i}@example.com' for i in range(1, 101)],
    'country': ['USA']*100
})

# Products table
products = pd.DataFrame({
    'product_id': range(1, 21),
    'product_name': [f'Product_{i}' for i in range(1, 21)],
    'price': [round(10 + i*5 + i%3*2, 2) for i in range(1, 21)]
})

# Orders table (links customers and products)
orders = pd.DataFrame({
    'order_id': range(1, 501),
    'customer_id': [i%100 + 1 for i in range(1, 501)],
    'product_id': [i%20 + 1 for i in range(1, 501)],
    'quantity': [int((i%5)+1) for i in range(1, 501)]
})
orders['revenue'] = orders['quantity'] * orders['product_id'].apply(lambda pid: products.loc[products['product_id']==pid,'price'].values[0])
orders['tax'] = orders['revenue'] * 0.15  # simple 15% tax

# Departments table
departments = pd.DataFrame({
    'department_id': range(1, 6),
    'department_name': ['Sales', 'HR', 'IT', 'Finance', 'Marketing']
})

# Payroll table
np.random.seed(42)
payroll = pd.DataFrame({
    'employee_id': range(1, 51),
    'department_id': np.random.choice(departments['department_id'], 50),
    'name': [f'Employee_{i}' for i in range(1, 51)],
    'salary': np.random.randint(40000, 120000, 50)
})

# Company expenses table
expenses = pd.DataFrame({
    'expense_id': range(1, 101),
    'department_id': np.random.choice(departments['department_id'], 100),
    'description': [f'Expense_{i}' for i in range(1, 101)],
    'amount': np.round(np.random.uniform(500, 5000, 100), 2),
    'date': pd.date_range(start='2023-01-01', periods=100)
})

# Daily revenue summary table
daily_revenue = orders.groupby(orders.index % 30).agg(
    total_revenue=('revenue', 'sum'),
    total_tax=('tax', 'sum')
).reset_index().rename(columns={'index': 'day_id'})
daily_revenue['date'] = pd.date_range(start='2023-01-01', periods=len(daily_revenue))

# -----------------------------
# Step 2: Setup DuckDB
# -----------------------------
con = duckdb.connect("codejam_15.db")

# Drop existing tables if they exist
con.execute("DROP TABLE IF EXISTS customers")
con.execute("DROP TABLE IF EXISTS products")
con.execute("DROP TABLE IF EXISTS orders")
con.execute("DROP TABLE IF EXISTS departments")
con.execute("DROP TABLE IF EXISTS payroll")
con.execute("DROP TABLE IF EXISTS expenses")
con.execute("DROP TABLE IF EXISTS daily_revenue")

# Load tables into DuckDB
con.register('customers_df', customers)
con.register('products_df', products)
con.register('orders_df', orders)
con.register('departments_df', departments)
con.register('payroll_df', payroll)
con.register('expenses_df', expenses)
con.register('daily_revenue_df', daily_revenue)

# Create SQL tables
con.execute("CREATE TABLE customers AS SELECT * FROM customers_df")
con.execute("CREATE TABLE products AS SELECT * FROM products_df")
con.execute("CREATE TABLE orders AS SELECT * FROM orders_df")
con.execute("CREATE TABLE departments AS SELECT * FROM departments_df")
con.execute("CREATE TABLE payroll AS SELECT * FROM payroll_df")
con.execute("CREATE TABLE expenses AS SELECT * FROM expenses_df")
con.execute("CREATE TABLE daily_revenue AS SELECT * FROM daily_revenue_df")

# -----------------------------
# Step 3: Verify tables were created
# -----------------------------
print("✓ Database setup complete!")
print("\nTables in DuckDB:")
tables = con.execute("SHOW TABLES").fetchall()
for table in tables:
    count = con.execute(f"SELECT COUNT(*) FROM {table[0]}").fetchone()[0]
    print(f"  - {table[0]}: {count} rows")

con.close()