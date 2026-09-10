import sys
import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_flow():
    print("=== STARTING KATHACHECK 2.0 ADVANCED TEST SUITE ===")
    ts = int(datetime.datetime.utcnow().timestamp())
    email1 = f"partner1_{ts}@kathacheck.com"
    email2 = f"partner2_{ts}@kathacheck.com"
    phone1 = f"987{ts % 10000000:07d}"
    phone2 = f"986{ts % 10000000:07d}"

    # 1. Register Partner 1 and create business "Lakshmi Finance Group 2"
    reg1_resp = client.post("/api/auth/register", json={
        "name": "Partner One",
        "email": email1,
        "phone": phone1,
        "password": "Password123!",
        "business_name": f"Lakshmi Finance Group {ts}"
    })
    assert reg1_resp.status_code == 200, f"Partner 1 register failed: {reg1_resp.text}"
    p1_data = reg1_resp.json()
    token1 = p1_data["access_token"]
    invite_code = p1_data["user"]["invite_code"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    print(f"[PASS] Partner 1 registered. Invite Code: {invite_code}")

    # 2. Register Partner 2 joining with invite code
    reg2_resp = client.post("/api/auth/register", json={
        "name": "Partner Two",
        "email": email2,
        "phone": phone2,
        "password": "Password123!",
        "invite_code": invite_code
    })
    assert reg2_resp.status_code == 200, f"Partner 2 register failed: {reg2_resp.text}"
    token2 = reg2_resp.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    print("[PASS] Partner 2 joined the same loop.")

    # 3. Both partners invest capital: Partner 1 ₹5 Lakhs, Partner 2 ₹5 Lakhs (Total pool: 10 Lakhs)
    client.post("/api/partners/investments", json={"amount": 500000.0, "notes": "Partner 1 capital"}, headers=headers1)
    client.post("/api/partners/investments", json={"amount": 500000.0, "notes": "Partner 2 capital"}, headers=headers2)
    print("[PASS] Capital pool funded with Rs 10,00,000.")

    # 4. Customer creation & Duplicate Phone Prevention
    c1_resp = client.post("/api/customers", json={
        "name": "Ramesh Kumar",
        "phone": "9111111111",
        "area": "Kothapet Market",
        "occupation": "Vegetable Vendor",
        "id_proof_type": "Aadhaar",
        "id_proof_number": "1234-5678-9012"
    }, headers=headers1)
    assert c1_resp.status_code == 200
    c1_id = c1_resp.json()["id"]

    # Duplicate phone attempt must FAIL with 400
    dup_resp = client.post("/api/customers", json={
        "name": "Duplicate Ramesh",
        "phone": "9111111111",
        "area": "Another Area"
    }, headers=headers2)
    assert dup_resp.status_code == 400, "Duplicate phone was not blocked!"
    print(f"[PASS] Duplicate Customer Phone Protection Verified: Blocked duplicate phone 9111111111.")

    # 5. Capital Availability Check: Attempting to loan ₹15 Lakhs when pool is only ₹10 Lakhs must FAIL with 400
    excess_loan_resp = client.post("/api/loans", json={
        "customer_id": c1_id,
        "principal_amount": 1500000.0,
        "interest_amount": 150000.0,
        "tenure_duration": 12,
        "tenure_type": "weeks"
    }, headers=headers1)
    assert excess_loan_resp.status_code == 400, "Disbursement exceeding pool capital was not blocked!"
    print(f"[PASS] Capital Pool Availability Protection Verified: Loan exceeding available pool cash blocked.")

    # 6. Loan creation within pool limits (₹10,000 for 12 weeks with ₹2,000 interest)
    loan_resp = client.post("/api/loans", json={
        "customer_id": c1_id,
        "principal_amount": 10000.0,
        "interest_amount": 2000.0,
        "tenure_duration": 12,
        "tenure_type": "weeks",
        "payment_mode": "CASH",
        "notes": "12-week test loan"
    }, headers=headers1)
    assert loan_resp.status_code == 200
    loan_data = loan_resp.json()
    loan_id = loan_data["id"]
    assert len(loan_data["installments"]) == 12, f"Expected 12 scheduled installments, got {len(loan_data['installments'])}"
    print(f"[PASS] Loan #{loan_id} created with 12 scheduled installment due dates.")

    # 7. Partial Payment & Schedule Allocation: Pay ₹500 on ₹1,000 weekly installment
    p_coll_resp = client.post("/api/collections", json={
        "loan_id": loan_id,
        "amount": 500.0,
        "payment_mode": "CASH",
        "notes": "Partial installment payment"
    }, headers=headers1)
    assert p_coll_resp.status_code == 200

    # Fetch schedule to check installment 1 status
    sched_resp = client.get(f"/api/loans/{loan_id}/schedule", headers=headers1)
    sched = sched_resp.json()
    assert sched[0]["paid_amount"] == 500.0
    assert sched[0]["status"] == "PARTIAL", f"Expected PARTIAL status, got {sched[0]['status']}"
    print(f"[PASS] Partial Payment Verified: Week 1 status is PARTIAL (Paid: Rs 500 / Expected: Rs 1000).")

    # Pay remaining ₹500 + next ₹1,000 (Total ₹1,500)
    client.post("/api/collections", json={
        "loan_id": loan_id,
        "amount": 1500.0,
        "payment_mode": "ONLINE",
        "notes": "Clear week 1 and pay week 2"
    }, headers=headers2)
    sched2 = client.get(f"/api/loans/{loan_id}/schedule", headers=headers1).json()
    assert sched2[0]["status"] == "PAID"
    assert sched2[1]["status"] == "PAID"
    print("[PASS] Full installment allocation verified: Weeks 1 and 2 now fully PAID.")

    # 8. Overpayment Prevention Check: Attempting to collect ₹25,000 on remaining balance of ₹10,000 must FAIL
    overpay_resp = client.post("/api/collections", json={
        "loan_id": loan_id,
        "amount": 25000.0,
        "payment_mode": "CASH"
    }, headers=headers1)
    assert overpay_resp.status_code == 400, "Collection exceeding remaining balance was not blocked!"
    print("[PASS] Overpayment Prevention Verified: Collection exceeding loan balance blocked.")

    # 9. Today's Route / Due Collections API
    today_route = client.get("/api/collections/today", headers=headers1).json()
    today_summary = client.get("/api/collections/today/summary", headers=headers1).json()
    assert "total_expected_today" in today_summary
    print(f"[PASS] Today's Route Desk verified: {len(today_route)} items on today's route sheet.")

    # 10. Operational Expenses: Record ₹500 petrol expense
    exp_resp = client.post("/api/expenses", json={
        "category": "Travel/Petrol",
        "amount": 500.0,
        "payment_mode": "CASH",
        "notes": "Field collection fuel"
    }, headers=headers1)
    assert exp_resp.status_code == 200
    print("[PASS] Operational Expense recorded: Rs 500 (Travel/Petrol).")

    # 11. Partner Capital Withdrawal: Partner 1 withdraws ₹50,000
    withd_resp = client.post("/api/partners/withdrawals", json={
        "amount": 50000.0,
        "notes": "Partner 1 personal capital withdrawal"
    }, headers=headers1)
    assert withd_resp.status_code == 200
    print("[PASS] Partner Capital Withdrawal recorded: Rs 50,000.")

    # 12. Check Dashboard Metrics with updated formula
    metrics = client.get("/api/dashboard/metrics", headers=headers1).json()
    # Investments: 10,00,000
    # Withdrawals: 50,000
    # Principal Disbursed: 10,000
    # Collections: 2,000 (500 + 1500)
    # Expenses: 500
    # Pool Cash Remaining: 1,000,000 - 50,000 - 10,000 + 2,000 - 500 = 941,500
    assert metrics["pool_cash_remaining"] == 941500.0, f"Expected 941500, got {metrics['pool_cash_remaining']}"
    assert metrics["total_expenses"] == 500.0
    assert metrics["total_capital_withdrawn"] == 50000.0
    print(f"[PASS] Updated Liquidity Formula verified: Pool Cash Remaining = Rs {metrics['pool_cash_remaining']:,.2f}")

    # 13. Customer History & Editing
    cust_hist = client.get(f"/api/customers/{c1_id}/history", headers=headers1).json()
    assert cust_hist["lifetime_principal_borrowed"] == 10000.0
    assert cust_hist["lifetime_repaid"] == 2000.0
    assert cust_hist["active_balance"] == 10000.0
    print("[PASS] Customer History API verified.")

    # 14. Reports & CSV export
    csv_resp = client.get("/api/reports/export/collections.csv", headers=headers1)
    assert csv_resp.status_code == 200
    assert "Collection ID" in csv_resp.text
    print("[PASS] CSV Export verified.")

    # 15. Audit Logs
    audit_resp = client.get("/api/audit", headers=headers1).json()
    assert len(audit_resp) >= 5
    print(f"[PASS] Audit Trail verified: {len(audit_resp)} audit events recorded.")

    print("\n=== ALL KATHACHECK 2.0 ADVANCED TESTS PASSED! ===")

if __name__ == "__main__":
    test_full_flow()
