# State Flow Diagram

## Expense Workflow States

```
┌──────────┐
│  DRAFT   │ ◄──────────────────────┐
└────┬─────┘                        │
     │                              │
     │ SUBMIT (with validation)     │
     │                              │ EDIT
     ▼                              │
┌─────────────────┐                 │
│ PENDING APPROVAL│                 │
└────┬────────┬───┘                 │
     │        │                     │
     │        │ REJECT              │
     │        └────────────┐        │
     │                     │        │
     │ APPROVE             ▼        │
     │              ┌──────────┐    │
     │              │ REJECTED │    │
     │              └────┬─────┘    │
     │                   │          │
     │                   │ EDIT     │
     │                   └──────────┘
     │                   │
     │                   │ ARCHIVE
     │                   │
     ▼                   ▼
┌──────────┐      ┌──────────┐
│ APPROVED │      │ ARCHIVED │
└────┬─────┘      └──────────┘
     │                  ▲
     │ PAY              │
     │                  │
     ▼                  │
┌──────────┐            │
│   PAID   │            │
└────┬─────┘            │
     │                  │
     │ ARCHIVE          │
     └──────────────────┘
```

## State Descriptions

| State | Description | Possible Actions |
|-------|-------------|------------------|
| **DRAFT** | Initial state when expense is created | SUBMIT, ARCHIVE |
| **PENDING_APPROVAL** | Submitted and awaiting manager approval | APPROVE, REJECT, EDIT |
| **APPROVED** | Approved by manager, ready for payment | PAY, REJECT |
| **REJECTED** | Rejected by manager | EDIT, ARCHIVE |
| **PAID** | Payment has been processed | ARCHIVE |
| **ARCHIVED** | Archived for record keeping | None (terminal state) |

## Transition Rules

### From DRAFT
- ✅ **SUBMIT** → PENDING_APPROVAL
  - Guard: title must not be empty AND amount must be > 0
- ✅ **ARCHIVE** → ARCHIVED

### From PENDING_APPROVAL
- ✅ **APPROVE** → APPROVED
  - Requires: approver role
- ✅ **REJECT** → REJECTED
  - Requires: reason for rejection
- ✅ **EDIT** → DRAFT
  - Allows submitter to make changes

### From APPROVED
- ✅ **PAY** → PAID
  - Requires: transaction ID
  - Effect: Update payment records
- ✅ **REJECT** → REJECTED
  - Requires: reason (e.g., fraud detected)

### From REJECTED
- ✅ **EDIT** → DRAFT
  - Allows resubmission after corrections
- ✅ **ARCHIVE** → ARCHIVED

### From PAID
- ✅ **ARCHIVE** → ARCHIVED
  - For record keeping

### From ARCHIVED
- ❌ No transitions (terminal state)

## User Roles and Permissions

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       │ Can:
       ├─ Create expenses (DRAFT)
       ├─ Submit expenses (SUBMIT)
       ├─ Edit rejected expenses (EDIT)
       └─ Archive own expenses

┌─────────────┐
│  APPROVER   │
└──────┬──────┘
       │
       │ Can:
       ├─ All USER permissions
       ├─ Approve expenses (APPROVE)
       ├─ Reject expenses (REJECT)
       └─ View pending expenses

┌─────────────┐
│    ADMIN    │
└──────┬──────┘
       │
       │ Can:
       ├─ All APPROVER permissions
       ├─ Mark as paid (PAY)
       ├─ Archive any expense
       └─ View all expenses
```

## Event Data Structure

### SUBMIT Event
```typescript
{
  submittedBy: string;    // User ID who submitted
  timestamp: Date;        // When it was submitted
}
```

### APPROVE Event
```typescript
{
  approvedBy: string;     // Approver ID
  timestamp: Date;        // When it was approved
}
```

### REJECT Event
```typescript
{
  rejectedBy: string;     // Approver ID
  reason: string;         // Reason for rejection
  timestamp: Date;        // When it was rejected
}
```

### PAY Event
```typescript
{
  paidBy: string;         // Admin ID who processed payment
  transactionId: string;  // Payment transaction ID
  timestamp: Date;        // When it was paid
}
```

### ARCHIVE Event
```typescript
{
  archivedBy: string;     // User ID who archived
  timestamp: Date;        // When it was archived
}
```

### EDIT Event
```typescript
{
  editedBy: string;       // User ID who edited
  changes: any;           // What was changed
}
```

## Example Workflows

### Happy Path (Successful Expense)

```
1. User creates expense
   State: DRAFT

2. User submits for approval
   Event: SUBMIT
   State: PENDING_APPROVAL

3. Manager approves
   Event: APPROVE
   State: APPROVED

4. Finance processes payment
   Event: PAY
   State: PAID

5. System archives after 30 days
   Event: ARCHIVE
   State: ARCHIVED
```

### Rejection & Resubmission

```
1. User creates and submits expense
   State: DRAFT → PENDING_APPROVAL

2. Manager rejects (missing receipt)
   Event: REJECT
   State: REJECTED

3. User edits and adds receipt
   Event: EDIT
   State: DRAFT

4. User resubmits
   Event: SUBMIT
   State: PENDING_APPROVAL

5. Manager approves
   Event: APPROVE
   State: APPROVED
```

### Fraud Detection

```
1. Expense is approved
   State: APPROVED

2. Finance detects fraud
   Event: REJECT (with reason: "Duplicate submission")
   State: REJECTED

3. Admin archives for investigation
   Event: ARCHIVE
   State: ARCHIVED
```

## State Effects

### On Enter PENDING_APPROVAL
- 📧 Send email notification to approvers
- 📊 Update dashboard metrics
- 📝 Log audit trail

### On Enter APPROVED
- ✅ Send approval notification to submitter
- 📋 Add to payment queue
- 📊 Update approval statistics

### On Enter REJECTED
- ❌ Send rejection notification to submitter
- 📝 Log rejection reason
- 📊 Update rejection statistics

### On Enter PAID
- 💰 Record transaction in finance system
- 📧 Send payment confirmation
- 🧾 Generate receipt
- 📊 Update payment metrics

### On Enter ARCHIVED
- 🗄️ Move to cold storage
- 📊 Update archive statistics
- 🔒 Set as read-only

## Database Schema

### expenses table
```sql
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  category_id TEXT,
  date DATETIME NOT NULL,
  state TEXT NOT NULL,           -- Current state
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### expense_history table
```sql
CREATE TABLE expense_history (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL,
  from_state TEXT,               -- Previous state
  to_state TEXT NOT NULL,        -- New state
  event_type TEXT NOT NULL,      -- Which event triggered it
  event_data TEXT,               -- JSON event payload
  performed_by TEXT,             -- Who performed the action
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

This creates a complete audit trail of all state transitions.

## Implementation Code

### Create a Behavior Machine

```typescript
import { BehaviorMachine } from "./behaviors/core";
import { expenseBehavior, ExpenseData } from "./behaviors/expense.behavior";

const expense: ExpenseData = {
  id: "exp-123",
  title: "Office Supplies",
  amount: 45.99,
  // ... other fields
};

const machine = new BehaviorMachine(expenseBehavior, expense);
```

### Trigger Transitions

```typescript
// Submit for approval
await machine.transition("SUBMIT", {
  submittedBy: "user-123",
  timestamp: new Date()
});

console.log(machine.getState()); // "pending_approval"

// Approve
await machine.transition("APPROVE", {
  approvedBy: "manager-456",
  timestamp: new Date()
});

console.log(machine.getState()); // "approved"
```

### Check History

```typescript
const context = machine.getContext();

console.log(context.history);
// [
//   { state: "draft", timestamp: "2025-12-31T10:00:00Z" },
//   { state: "pending_approval", timestamp: "2025-12-31T11:00:00Z" },
//   { state: "approved", timestamp: "2025-12-31T12:00:00Z" }
// ]
```

---

This diagram provides a complete visual and textual reference for the expense workflow state machine.
