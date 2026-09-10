# 💳 KathaCheck 2.0 — Multi-Partner Finance & Weekly Collection System

**KathaCheck** is a collaborative microfinance, community lending, and weekly/monthly collection management platform engineered for partnerships and individual financiers who pool capital, disburse loans across areas, and manage field collections with real-time transparency and financial rigor.

---

## 🌟 What KathaCheck Does & Core Features

### 1. Multi-Partner Common Business Loop
- Form a business partnership firm (e.g. *Sri Venkateswara Finance Loop*) with an automatically generated 6-character Invite Code (e.g. `KC-B60A`).
- Any number of partners can register and join using this invite code.
- Each partner invests capital (e.g. ₹5 Lakhs each).
- **Cross-Partner Shared Visibility**: Even if Partner 1 operates in Area A, Partner 2 in Area B, and Partner 3 in Area C, all partners see all customers, loans, collections, and available cash.
- **Partner Capital Withdrawals**: Partners can withdraw capital up to their net contribution and available pool cash.
- **Equity Share Calculation**: Real-time equity percentages calculated based on each partner's active net capital.

### 2. Smart Loan Scheduling & Calculation
- Predefined quick-select tenure options:
  - **Weekly Presets**: `12 Weeks`, `21 Weeks`, `25 Weeks`, `40 Weeks` (or custom weeks)
  - **Monthly Presets**: `5 Months`, `10 Months` (or custom months)
- Automatic row-by-row installment schedule generated with exact weekly/monthly due dates:
  $$\text{Total Return} = \text{Principal} + \text{Interest}$$
  $$\text{Installment per Period} = \frac{\text{Total Return}}{\text{Duration}}$$
- Supports **Fixed Interest Amount (₹)** or **Interest Rate (%)**.
- **Pool Capital Availability Protection**: Prevents disbursing a loan exceeding the available pool cash.

### 3. Smart Repayment Allocation & Overpayment Prevention
- Supports full and **partial installment payments** (e.g. customer paying ₹500 on ₹1,000 due marks it `PARTIAL` with ₹500 balance).
- **Overpayment Prevention**: Prevents collections greater than the remaining loan balance.
- Real-time loan status auto-completion when total return is reached.
- Tag each payment as **💵 Cash in Hand** or **📱 Online (UPI / Bank)**.

### 4. Today's Route / Field Collection Desk (⭐ Daily Tool)
- Dedicated field screen organized by Area and Locality.
- Displays all customers due today or overdue with quick-call buttons.
- Today's target bar: Expected Today, Collected Today, Pending, and Overdue Amount.
- 1-Click collection recording pre-filled with the exact due amount.

### 5. Enhanced Customer Management & KYC
- Tracks: Name, Primary Phone, Alternate Mobile, Area, Address, Occupation/Business, Guarantor Name & Phone, ID Proof Type (Aadhaar, PAN, Voter ID), ID Proof Number, Status (`ACTIVE`, `INACTIVE`, `BLOCKED`), and Notes.
- **Duplicate Phone Protection**: Blocks adding duplicate customer phone numbers within the same business loop.
- Complete Customer Profile Modal with KYC editing and lifetime borrowing/repayment history.

### 6. Business Accounting & Operational Expenses
- Dedicated Expenses Module: Track fuel/petrol, office rent, tea & refreshments, stationery, staff salary, legal fees.
- Deducted from cash pool liquidity:
  $$\text{Available Pool Cash} = \sum \text{Investments} - \sum \text{Withdrawals} - \sum \text{Principal Given} + \sum \text{Collections} - \sum \text{Expenses}$$
- Net profit calculation: Gross Interest Earned minus Operational Expenses.

### 7. Reports, Overdue Analytics & CSV Export
- Financial report summary filtered by date (Today, Last 7 Days, This Month, All Time).
- One-click CSV export:
  - `collections.csv` (Collection Receipts Ledger)
  - `overdue.csv` (Overdue Installments with Customer & Guarantor Details)
- Print report friendly layout.

### 8. Audit Trail & Partner Security
- Chronological audit log of all critical business actions: who disbursed a loan, collected payment, added customer, recorded an expense, or withdrew capital.

---

## 📁 Architecture & Directory Layout

```
kathacheck/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app with CORS & routers
│   │   ├── database.py          # SQLAlchemy SQLite connection
│   │   ├── models.py            # User, Business, PartnerInvestment, Customer, Loan, LoanInstallment, Collection, Expense, AuditLog, OtpToken
│   │   ├── schemas.py           # Pydantic schemas with positive validations
│   │   ├── auth_utils.py        # JWT, bcrypt, OTP generator
│   │   ├── audit_utils.py       # Audit logging utility
│   │   └── routers/
│   │       ├── auth.py          # Register, Login, Forgot Password, OTP, Reset Password
│   │       ├── partners.py      # Capital investments, withdrawals, equity shares
│   │       ├── customers.py     # Customers, duplicate check, KYC editing, history
│   │       ├── loans.py         # Capital check, schedule generation, interest %
│   │       ├── collections.py   # Overpayment check, partial payments, Today's Route
│   │       ├── expenses.py      # Business operational expense tracking
│   │       ├── reports.py       # Summaries & CSV exports
│   │       ├── audit.py         # Chronological audit log
│   │       └── dashboard.py     # Real-time metrics & today's target
│   ├── migrate_db.py            # Database auto-migration script
│   ├── test_api.py              # Automated verification test suite
│   ├── requirements.txt
│   └── start_backend.bat
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Navigation with Today's Route, Expenses, Reports
│   │   │   ├── StatCard.jsx             # KPI metric card
│   │   │   ├── CustomerModal.jsx        # Customer KYC creation
│   │   │   ├── CustomerProfileModal.jsx # KYC editing & full loan history
│   │   │   ├── LoanModal.jsx            # Loan disbursement with pool liquidity check
│   │   │   ├── CollectionModal.jsx      # Collection recording with Cash/Online
│   │   │   ├── InvestmentModal.jsx      # Partner capital injection
│   │   │   ├── WithdrawalModal.jsx      # Partner capital withdrawal
│   │   │   └── ScheduleModal.jsx        # Week-by-week installment schedule viewer
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx            # Today target widget, pool liquidity, net profit
│   │   │   ├── TodayRoute.jsx           # Field collection desk organized by area
│   │   │   ├── Customers.jsx            # Shared customer directory with profile modal
│   │   │   ├── Loans.jsx                # Loans ledger with schedule view
│   │   │   ├── Collections.jsx          # Collection receipts ledger
│   │   │   ├── Expenses.jsx             # Operational cost tracker
│   │   │   ├── Reports.jsx              # Financial reports & CSV downloads
│   │   │   ├── Partners.jsx             # Partner equity & audit trail
│   │   │   └── Auth/
│   │   ├── services/
│   │   │   └── api.js                   # API client service layer
│   │   ├── App.jsx                      # Protected routes
│   │   └── main.jsx
│   └── start_frontend.bat
└── start_all.bat
```

---

## 🚀 How to Run

### Option 1: 1-Click Launch
Double-click `start_all.bat` in the root folder.

### Option 2: Manual Terminal Commands
1. **Backend**:
   ```powershell
   cd backend
   python -m uvicorn app.main:app --reload --port 8000
   ```
   - Swagger Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

2. **Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```
   - Web App: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Automated Testing

Run the full end-to-end test suite:
```powershell
cd backend
python test_api.py
```
