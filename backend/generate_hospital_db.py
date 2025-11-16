import duckdb
import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

np.random.seed(123)
random.seed(123)

START_DATE = datetime(2024, 1, 1)
DAYS = 365

DEPARTMENTS = ["Emergency", "Cardiology", "ICU", "Orthopedics", "Oncology", "Pediatrics"]
ROLES = {
    "Emergency":   ["ED Nurse", "ED Doctor"],
    "Cardiology":  ["Cardio Nurse", "Cardiologist"],
    "ICU":         ["ICU Nurse", "Intensivist"],
    "Orthopedics": ["Ortho Nurse", "Orthopedic Surgeon"],
    "Oncology":    ["Oncology Nurse", "Oncologist"],
    "Pediatrics":  ["Peds Nurse", "Pediatrician"],
}

def random_dates(n, start, days_range):
    return [start + timedelta(days=int(np.random.randint(0, days_range)),
                              hours=int(np.random.randint(0, 24)))
            for _ in range(n)]

def generate_admissions(n=15000):
    rows = []
    admit_times = random_dates(n, START_DATE, DAYS)
    admit_times.sort()
    for i, admit_time in enumerate(admit_times, start=1):
        dept = random.choice(DEPARTMENTS)
        admission_type = np.random.choice(["Emergency", "Elective"], p=[0.7, 0.3])
        los_days = np.clip(np.random.normal(loc=3.5, scale=2.0), 0.2, 30.0)
        discharge_time = admit_time + timedelta(days=float(los_days))
        base_cost = np.random.uniform(1500, 7000)
        severity_factor = np.random.uniform(1.0, 2.5)
        cost = round(base_cost * severity_factor, 2)
        outcome = np.random.choice(["Recovered", "Improved", "Unchanged", "Deceased"],
                                   p=[0.65, 0.25, 0.08, 0.02])
        rows.append({
            "admission_id": i,
            "admit_time": admit_time,
            "discharge_time": discharge_time,
            "department": dept,
            "admission_type": admission_type,
            "length_of_stay_days": round(float(los_days), 2),
            "cost": cost,
            "outcome": outcome,
        })
    return pd.DataFrame(rows)

def generate_ed_visits(n=20000):
    rows = []
    arrival_times = random_dates(n, START_DATE, DAYS)
    arrival_times.sort()
    for i, arrival in enumerate(arrival_times, start=1):
        triage_level = int(np.random.choice([1,2,3,4,5], p=[0.05,0.15,0.4,0.25,0.15]))
        base_wait = {1: 5, 2: 15, 3: 40, 4: 75, 5: 120}[triage_level]
        wait = int(max(1, np.random.normal(base_wait, base_wait * 0.4)))
        busy_factor = np.random.uniform(0.8, 1.6)
        wait = int(wait * busy_factor)
        seen = np.random.rand() > 0.08
        lwbs = (not seen) and (wait > 90)
        dept = "Emergency"
        rows.append({
            "visit_id": i,
            "arrival_time": arrival,
            "triage_level": triage_level,
            "wait_time_minutes": wait,
            "seen_by_doctor": seen,
            "left_without_being_seen": lwbs,
            "department": dept,
        })
    return pd.DataFrame(rows)

def generate_bed_occupancy():
    rows = []
    for d in range(DAYS):
        day = START_DATE + timedelta(days=d)
        for dept in DEPARTMENTS:
            beds_total = {
                "ICU": 20,
                "Emergency": 30,
                "Cardiology": 25,
                "Orthopedics": 25,
                "Oncology": 20,
                "Pediatrics": 20,
            }[dept]
            seasonal_factor = 1.0
            if day.month in [1,2,3]:  # flu season
                seasonal_factor = 1.15
            base_occ_rate = np.random.uniform(0.6, 0.95) * seasonal_factor
            beds_occupied = int(np.clip(beds_total * base_occ_rate +
                                        np.random.normal(0, 2), 0, beds_total))
            rows.append({
                "date": day.date(),
                "department": dept,
                "beds_total": beds_total,
                "beds_occupied": beds_occupied,
            })
    return pd.DataFrame(rows)

def generate_surgeries(n=8000):
    rows = []
    dates = [START_DATE + timedelta(days=int(np.random.randint(0, DAYS)))
             for _ in range(n)]
    dates.sort()
    for i, day in enumerate(dates, start=1):
        dept = np.random.choice(["Orthopedics", "Cardiology", "Oncology"])
        if dept == "Orthopedics":
            stype = np.random.choice(["Knee Replacement", "Hip Replacement", "Fracture Fixation"])
        elif dept == "Cardiology":
            stype = np.random.choice(["Angioplasty", "Bypass Surgery"])
        else:
            stype = np.random.choice(["Tumor Resection", "Biopsy"])
        duration = int(np.clip(np.random.normal(120, 40), 40, 360))
        complications = np.random.rand() < 0.08
        cost = round(np.random.uniform(4000, 25000), 2)
        rows.append({
            "surgery_id": i,
            "surgery_date": day.date(),
            "department": dept,
            "surgery_type": stype,
            "duration_minutes": duration,
            "complications": complications,
            "cost": cost,
        })
    return pd.DataFrame(rows)

def generate_staff_shifts():
    rows = []
    for d in range(DAYS):
        day = START_DATE + timedelta(days=d)
        weekday = day.weekday()  # 0=Mon
        for dept in DEPARTMENTS:
            for role in ROLES[dept]:
                base_headcount = 6 if dept in ["ICU", "Emergency"] else 3
                weekend_adj = 0.9 if weekday >= 5 else 1.0
                headcount = int(np.clip(np.random.normal(base_headcount, 1.2) * weekend_adj, 1, 15))
                hours = round(headcount * 8.0 * np.random.uniform(0.9, 1.1), 1)
                rows.append({
                    "shift_date": day.date(),
                    "department": dept,
                    "role": role,
                    "headcount": headcount,
                    "hours_worked": hours,
                })
    return pd.DataFrame(rows)

def generate_patient_satisfaction():
    rows = []
    for d in range(DAYS):
        day = START_DATE + timedelta(days=d)
        for dept in DEPARTMENTS:
            base_nps = {
                "Emergency": 35,
                "ICU": 60,
                "Cardiology": 55,
                "Orthopedics": 50,
                "Oncology": 65,
                "Pediatrics": 70,
            }[dept]
            nps = int(np.clip(np.random.normal(base_nps, 8), -100, 100))
            responses = int(np.clip(np.random.normal(35, 10), 5, 120))
            rows.append({
                "survey_date": day.date(),
                "department": dept,
                "nps_score": nps,
                "responses": responses,
            })
    return pd.DataFrame(rows)

def main():
    print("Generating hospital operations dataset...")

    admissions_df = generate_admissions()
    ed_df = generate_ed_visits()
    beds_df = generate_bed_occupancy()
    surgeries_df = generate_surgeries()
    staff_df = generate_staff_shifts()
    satisfaction_df = generate_patient_satisfaction()

    con = duckdb.connect("hospital_ops.db")

    con.register("admissions_df", admissions_df)
    con.execute("CREATE OR REPLACE TABLE admissions AS SELECT * FROM admissions_df")

    con.register("ed_df", ed_df)
    con.execute("CREATE OR REPLACE TABLE ed_visits AS SELECT * FROM ed_df")

    con.register("beds_df", beds_df)
    con.execute("CREATE OR REPLACE TABLE bed_occupancy AS SELECT * FROM beds_df")

    con.register("surgeries_df", surgeries_df)
    con.execute("CREATE OR REPLACE TABLE surgeries AS SELECT * FROM surgeries_df")

    con.register("staff_df", staff_df)
    con.execute("CREATE OR REPLACE TABLE staff_shifts AS SELECT * FROM staff_df")

    con.register("satisfaction_df", satisfaction_df)
    con.execute("CREATE OR REPLACE TABLE patient_satisfaction AS SELECT * FROM satisfaction_df")

    # Convenience daily summary for "admissions_over_time"-type queries
    con.execute("""
        CREATE OR REPLACE TABLE daily_admissions AS
        SELECT
            date_trunc('day', admit_time)::DATE AS date,
            department,
            COUNT(*) AS admissions,
            AVG(length_of_stay_days) AS avg_los,
            SUM(cost) AS total_cost
        FROM admissions
        GROUP BY date, department
        ORDER BY date, department;
    """)

    con.close()
    print("✅ hospital_ops.db created.")

if __name__ == "__main__":
    main()
