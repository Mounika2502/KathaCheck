import sqlite3
import os
import datetime
from app.database import engine, Base
from app import models

DB_PATH = os.path.join(os.path.dirname(__file__), "app", "kathacheck.db")

def migrate():
    print(f"Checking database schema for: {DB_PATH}")
    
    # 1. Create all missing tables via SQLAlchemy
    Base.metadata.create_all(bind=engine)
    print("[OK] Base metadata create_all completed.")

    if not os.path.exists(DB_PATH):
        print("Database does not exist yet. It will be created on first start.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 2. Add missing columns to customers if not present
    cursor.execute("PRAGMA table_info(customers)")
    customer_cols = [row[1] for row in cursor.fetchall()]
    
    new_cust_cols = [
        ("alt_phone", "TEXT"),
        ("occupation", "TEXT"),
        ("guarantor_name", "TEXT"),
        ("guarantor_phone", "TEXT"),
        ("id_proof_type", "TEXT"),
        ("id_proof_number", "TEXT"),
        ("status", "TEXT DEFAULT 'ACTIVE'")
    ]
    for col_name, col_type in new_cust_cols:
        if col_name not in customer_cols:
            cursor.execute(f"ALTER TABLE customers ADD COLUMN {col_name} {col_type}")
            print(f"[MIGRATE] Added column {col_name} to customers.")

    # 3. Add missing columns to partner_investments if not present
    cursor.execute("PRAGMA table_info(partner_investments)")
    inv_cols = [row[1] for row in cursor.fetchall()]
    if "transaction_type" not in inv_cols:
        cursor.execute("ALTER TABLE partner_investments ADD COLUMN transaction_type TEXT DEFAULT 'INVESTMENT'")
        print("[MIGRATE] Added column transaction_type to partner_investments.")

    # 4. Add missing columns to users if not present
    cursor.execute("PRAGMA table_info(users)")
    user_cols = [row[1] for row in cursor.fetchall()]
    if "status" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE'")
        print("[MIGRATE] Added column status to users.")

    conn.commit()

    # 5. Backfill installments for any existing loans that have 0 installments
    cursor.execute("SELECT id, business_id, customer_id, principal_amount, total_return_amount, tenure_type, tenure_duration, installment_amount, start_date, status FROM loans")
    loans = cursor.fetchall()
    
    for loan in loans:
        l_id, b_id, c_id, principal, total_return, tenure_type, duration, inst_amt, start_date_str, l_status = loan
        
        cursor.execute("SELECT COUNT(*) FROM loan_installments WHERE loan_id = ?", (l_id,))
        count = cursor.fetchone()[0]
        if count == 0 and duration > 0:
            print(f"[BACKFILL] Generating {duration} installments for Loan #{l_id}...")
            
            try:
                start_dt = datetime.datetime.fromisoformat(start_date_str) if start_date_str else datetime.datetime.utcnow()
            except Exception:
                start_dt = datetime.datetime.utcnow()

            # Check existing collections for this loan
            cursor.execute("SELECT SUM(amount) FROM collections WHERE loan_id = ?", (l_id,))
            total_collected_res = cursor.fetchone()[0]
            unallocated = float(total_collected_res or 0.0)

            for i in range(1, duration + 1):
                if tenure_type == "months":
                    due_dt = start_dt + datetime.timedelta(days=i * 30)
                else: # weeks
                    due_dt = start_dt + datetime.timedelta(days=i * 7)

                paid_amt = 0.0
                inst_status = "PENDING"
                if unallocated >= inst_amt:
                    paid_amt = inst_amt
                    unallocated -= inst_amt
                    inst_status = "PAID"
                elif unallocated > 0:
                    paid_amt = unallocated
                    unallocated = 0.0
                    inst_status = "PARTIAL"
                elif due_dt < datetime.datetime.utcnow():
                    inst_status = "OVERDUE"

                cursor.execute("""
                    INSERT INTO loan_installments (business_id, loan_id, customer_id, installment_number, due_date, expected_amount, paid_amount, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (b_id, l_id, c_id, i, due_dt.isoformat(), inst_amt, paid_amt, inst_status))

            conn.commit()

    conn.close()
    print("Database migration and verification finished successfully.")

if __name__ == "__main__":
    migrate()
