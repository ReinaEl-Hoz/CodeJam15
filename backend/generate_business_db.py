import duckdb
import pandas as pd
import numpy as np
from faker import Faker
from datetime import datetime, timedelta
import random

fake = Faker()
np.random.seed(42)
random.seed(42)

# ---------- CONFIG ----------
N_CUSTOMERS = 1000
N_PRODUCTS = 80
N_ORDERS = 20000
N_EMPLOYEES = 120
DAYS = 365  # last year
START_DATE = datetime(2024, 1, 1)
# ----------------------------

def random_dates(n, start, days_range):
    return [start + timedelta(days=int(np.random.randint(0, days_range))) for _ in range(n)]

# 1) Customers
def generate_customers():
    segments = ["SMB", "Enterprise", "Consumer"]
    industries = ["Retail", "SaaS", "FinTech", "Manufacturing", "Logistics", "E-commerce"]
    countries = ["USA", "Canada", "Germany", "France", "UK", "Australia", "Singapore"]

    rows = []
    for i in range(N_CUSTOMERS):
        cid = f"C{str(i+1).zfill(4)}"
        rows.append(
            {
                "customer_id": cid,
                "customer_name": fake.company(),
                "segment": random.choice(segments),
                "industry": random.choice(industries),
                "country": random.choice(countries),
                "created_at": fake.date_between(start_date="-3y", end_date="-1d"),
            }
        )
    return pd.DataFrame(rows)

# 2) Products
def generate_products():
    categories = ["Software", "Services", "Hardware", "Marketing"]
    subcats = {
        "Software": ["Analytics", "CRM", "Collaboration", "Billing"],
        "Services": ["Onboarding", "Support", "Consulting"],
        "Hardware": ["Appliance", "Device"],
        "Marketing": ["Print", "Digital"],
    }

    rows = []
    for i in range(N_PRODUCTS):
        pid = f"P{str(i+1).zfill(3)}"
        cat = random.choice(categories)
        subcat = random.choice(subcats[cat])
        base_cost = round(np.random.uniform(20, 400), 2)
        rows.append(
            {
                "product_id": pid,
                "product_name": f"{cat} {subcat} {fake.word().title()}",
                "category": cat,
                "subcategory": subcat,
                "sku": f"{cat[:3].upper()}-{str(i+1).zfill(3)}",
                "base_cost": base_cost,
            }
        )
    return pd.DataFrame(rows)

# 3) Orders + Order Items
def generate_orders(customers_df, products_df):
    customer_ids = customers_df["customer_id"].tolist()
    product_ids = products_df["product_id"].tolist()
    regions = ["North America", "Europe", "APAC", "LATAM"]
    segments = ["SMB", "Enterprise", "Consumer"]

    order_rows = []
    item_rows = []

    order_dates = random_dates(N_ORDERS, START_DATE, DAYS)
    order_dates.sort()

    order_id_counter = 10001
    order_item_id = 1

    for od in order_dates:
        customer_id = random.choice(customer_ids)
        region = random.choice(regions)
        segment = random.choice(segments)

        num_items = np.random.randint(1, 5)
        subtotal = 0.0
        cogs_total = 0.0

        for _ in range(num_items):
            product_id = random.choice(product_ids)
            quantity = np.random.randint(1, 6)
            base_cost = float(
                products_df.loc[products_df.product_id == product_id, "base_cost"].iloc[0]
            )
            markup = np.random.uniform(1.3, 2.5)
            unit_price = round(base_cost * markup, 2)
            discount = np.random.choice([0.0, 0.05, 0.10, 0.15], p=[0.6, 0.2, 0.15, 0.05])

            line_price = unit_price * quantity * (1 - discount)
            line_cost = base_cost * quantity

            subtotal += line_price
            cogs_total += line_cost

            item_rows.append(
                {
                    "order_item_id": order_item_id,
                    "order_id": order_id_counter,
                    "product_id": product_id,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "discount": discount,
                    "line_total": round(line_price, 2),
                }
            )
            order_item_id += 1

        tax = round(subtotal * 0.07, 2)
        total = round(subtotal + tax, 2)
        profit = round(total - cogs_total, 2)

        order_rows.append(
            {
                "order_id": order_id_counter,
                "order_date": od.date(),
                "customer_id": customer_id,
                "region": region,
                "segment": segment,
                "subtotal": round(subtotal, 2),
                "tax": tax,
                "total_amount": total,
                "cogs": round(cogs_total, 2),
                "profit": profit,
            }
        )

        order_id_counter += 1

    return pd.DataFrame(order_rows), pd.DataFrame(item_rows)

# 4) Marketing
def generate_marketing():
    channels = ["Google Ads", "Meta Ads", "LinkedIn Ads", "Email", "Organic Social"]
    rows = []
    for d in range(DAYS):
        day = START_DATE + timedelta(days=d)
        for ch in channels:
            spend = round(np.random.uniform(100, 1200), 2)
            impressions = int(np.random.uniform(10_000, 180_000))
            ctr = np.random.uniform(0.01, 0.06)
            conv_rate = np.random.uniform(0.01, 0.08)

            clicks = int(impressions * ctr)
            conversions = int(clicks * conv_rate)
            revenue = round(conversions * np.random.uniform(80, 300), 2)

            rows.append(
                {
                    "date": day.date(),
                    "channel": ch,
                    "campaign": f"{day.strftime('%b')} - {ch.split()[0]} Campaign",
                    "spend": spend,
                    "impressions": impressions,
                    "clicks": clicks,
                    "conversions": conversions,
                    "revenue": revenue,
                }
            )
    return pd.DataFrame(rows)

# 5) Expenses
def generate_expenses():
    categories = ["Software", "Advertising", "Office Rent", "Travel", "Contractors", "Utilities"]
    departments = ["Engineering", "Marketing", "Sales", "Finance", "Operations"]

    rows = []
    expense_id = 1
    for d in range(DAYS):
        day = START_DATE + timedelta(days=d)
        # 0–3 expenses per day
        for _ in range(np.random.randint(0, 4)):
            cat = random.choice(categories)
            dept = random.choice(departments)
            amount = round(np.random.uniform(500, 25000), 2)
            rows.append(
                {
                    "expense_id": expense_id,
                    "date": day.date(),
                    "category": cat,
                    "department": dept,
                    "amount": amount,
                    "description": f"{cat} expense for {dept}",
                }
            )
            expense_id += 1
    return pd.DataFrame(rows)

# 6) Payroll
def generate_payroll():
    departments = ["Engineering", "Marketing", "Sales", "Finance", "Operations"]
    roles = {
        "Engineering": ["Backend Engineer", "Frontend Engineer", "DevOps Engineer"],
        "Marketing": ["Performance Marketer", "Brand Manager"],
        "Sales": ["Account Executive", "BDR"],
        "Finance": ["FP&A Analyst", "Controller"],
        "Operations": ["Ops Manager", "Coordinator"],
    }
    rows = []
    for i in range(N_EMPLOYEES):
        dept = random.choice(departments)
        role = random.choice(roles[dept])
        base_salary = round(np.random.uniform(60000, 160000), 2)
        bonus_target = round(np.random.uniform(0.05, 0.25), 2)
        rows.append(
            {
                "employee_id": f"E{str(i+1).zfill(3)}",
                "employee_name": fake.name(),
                "department": dept,
                "role": role,
                "base_salary": base_salary,
                "bonus_target": bonus_target,
                "hire_date": fake.date_between(start_date="-5y", end_date="-30d"),
                "employment_type": "Full-time",
            }
        )
    return pd.DataFrame(rows)

# 7) Profit vs Budget
def generate_profit_forecast(orders_df, expenses_df):
    # aggregate monthly revenue & expenses
    orders_df["month"] = pd.to_datetime(orders_df["order_date"]).dt.to_period("M").dt.to_timestamp()
    expenses_df["month"] = pd.to_datetime(expenses_df["date"]).dt.to_period("M").dt.to_timestamp()

    revenue = (
        orders_df.groupby("month")["total_amount"]
        .sum()
        .reset_index()
        .rename(columns={"total_amount": "revenue"})
    )
    cogs = (
        orders_df.groupby("month")["cogs"]
        .sum()
        .reset_index()
        .rename(columns={"cogs": "cogs"})
    )
    opex = (
        expenses_df.groupby("month")["amount"]
        .sum()
        .reset_index()
        .rename(columns={"amount": "opex"})
    )

    df = revenue.merge(cogs, on="month", how="left").merge(opex, on="month", how="left")
    df["profit"] = df["revenue"] - df["cogs"] - df["opex"]

    # create simple budget: +5–10% targets
    df["budget_revenue"] = df["revenue"] * np.random.uniform(1.03, 1.08)
    df["budget_profit"] = df["profit"] * np.random.uniform(1.05, 1.10)

    df = df.round(2)
    df.rename(columns={"month": "month_start"}, inplace=True)
    return df

def main():
    print("Generating synthetic business dataset...")

    customers_df = generate_customers()
    products_df = generate_products()
    orders_df, items_df = generate_orders(customers_df, products_df)
    marketing_df = generate_marketing()
    expenses_df = generate_expenses()
    payroll_df = generate_payroll()
    profit_forecast_df = generate_profit_forecast(orders_df, expenses_df)

    # Connect to DuckDB file (creates if not exists)
    con = duckdb.connect("codejam_15.db")

    # Register and create tables
    con.register("customers_df", customers_df)
    con.execute("CREATE OR REPLACE TABLE customers AS SELECT * FROM customers_df")

    con.register("products_df", products_df)
    con.execute("CREATE OR REPLACE TABLE products AS SELECT * FROM products_df")

    con.register("orders_df", orders_df)
    con.execute("CREATE OR REPLACE TABLE orders AS SELECT * FROM orders_df")

    con.register("items_df", items_df)
    con.execute("CREATE OR REPLACE TABLE order_items AS SELECT * FROM items_df")

    con.register("marketing_df", marketing_df)
    con.execute("CREATE OR REPLACE TABLE marketing AS SELECT * FROM marketing_df")

    con.register("expenses_df", expenses_df)
    con.execute("CREATE OR REPLACE TABLE expenses AS SELECT * FROM expenses_df")

    con.register("payroll_df", payroll_df)
    con.execute("CREATE OR REPLACE TABLE payroll AS SELECT * FROM payroll_df")

    con.register("profit_forecast_df", profit_forecast_df)
    con.execute("CREATE OR REPLACE TABLE profit_forecast AS SELECT * FROM profit_forecast_df")

    # Optional convenience table for your "daily_revenue" query type
    con.execute("""
        CREATE OR REPLACE TABLE daily_revenue AS
        SELECT
            order_date AS date,
            SUM(total_amount) AS total_revenue
        FROM orders
        GROUP BY order_date
        ORDER BY date;
    """)

    con.close()
    print("✅ codejam_15.db created with all tables.")

if __name__ == "__main__":
    main()
