# Usage Examples & Scenarios

This document provides real-world usage examples and common scenarios for the Expense Manager.

## Scenario 1: Employee Submits Travel Expense

### Step-by-Step

1. **Employee logs in** (John Doe)
2. **Creates a new expense:**
   - Title: "Flight to NYC for Client Meeting"
   - Amount: $450.00
   - Category: Travel
   - Date: 2025-12-15
   
3. **Submits for approval:**
   ```bash
   POST /api/expenses/{id}/submit
   {
     "submittedBy": "john-doe-id"
   }
   ```

4. **Manager receives notification** (Jane Smith - Approver)
5. **Manager reviews and approves:**
   ```bash
   POST /api/expenses/{id}/approve
   {
     "approvedBy": "jane-smith-id"
   }
   ```

6. **Finance team processes payment:**
   ```bash
   POST /api/expenses/{id}/pay
   {
     "paidBy": "admin-id",
     "transactionId": "TXN-2025-001"
   }
   ```

7. **System auto-archives after 30 days**

### Expected Results
- Employee receives payment confirmation
- Expense appears in reports
- Full audit trail maintained
- Manager's approval metrics updated

---

## Scenario 2: Rejected Expense with Resubmission

### Step-by-Step

1. **Employee submits expense without receipt:**
   ```bash
   # Create expense
   POST /api/expenses
   {
     "title": "Client Dinner",
     "amount": 125.50,
     "category": "food-category-id",
     "date": "2025-12-20",
     "createdBy": "employee-id"
   }
   
   # Submit
   POST /api/expenses/{id}/submit
   {
     "submittedBy": "employee-id"
   }
   ```

2. **Manager rejects (missing receipt):**
   ```bash
   POST /api/expenses/{id}/reject
   {
     "rejectedBy": "manager-id",
     "reason": "Please attach receipt showing itemized bill"
   }
   ```

3. **Employee receives rejection notification**

4. **Employee edits expense to add details:**
   ```bash
   # Move back to draft
   POST /api/expenses/{id}/edit
   {
     "editedBy": "employee-id",
     "changes": { "description": "Added receipt - see attached" }
   }
   
   # Update details
   PATCH /api/expenses/{id}
   {
     "description": "Client dinner with ABC Corp - discussed Q1 contract. Receipt attached."
   }
   ```

5. **Employee resubmits:**
   ```bash
   POST /api/expenses/{id}/submit
   {
     "submittedBy": "employee-id"
   }
   ```

6. **Manager approves second time**

### Expected Results
- History shows: draft → pending → rejected → draft → pending → approved
- Rejection reason preserved in audit log
- Manager can see this is a resubmission

---

## Scenario 3: Bulk Expense Processing

### Step-by-Step

1. **Multiple employees submit expenses**

2. **Admin queries pending expenses:**
   ```bash
   GET /api/expenses?state=pending_approval
   ```
   
   Response:
   ```json
   [
     { "id": "exp-1", "amount": 45.99, "title": "Office Supplies" },
     { "id": "exp-2", "amount": 125.50, "title": "Client Lunch" },
     { "id": "exp-3", "amount": 85.00, "title": "Software License" }
   ]
   ```

3. **Manager reviews and batch approves:**
   ```bash
   # Approve first expense
   POST /api/expenses/exp-1/approve
   { "approvedBy": "manager-id" }
   
   # Approve second expense
   POST /api/expenses/exp-2/approve
   { "approvedBy": "manager-id" }
   
   # Approve third expense
   POST /api/expenses/exp-3/approve
   { "approvedBy": "manager-id" }
   ```

4. **Finance processes all approved expenses:**
   ```bash
   # Get all approved expenses
   GET /api/expenses?state=approved
   
   # Process each payment
   for each expense:
     POST /api/expenses/{id}/pay
     {
       "paidBy": "finance-id",
       "transactionId": "TXN-{timestamp}"
     }
   ```

### Expected Results
- All expenses move through workflow
- Statistics updated in real-time
- Dashboard reflects current state

---

## Scenario 4: Monthly Expense Report

### Step-by-Step

1. **Admin queries expenses for date range:**
   ```bash
   GET /api/expenses
   ```

2. **Filter by date in application code:**
   ```javascript
   const expenses = await fetch('/api/expenses').then(r => r.json());
   
   const december = expenses.filter(e => {
     const date = new Date(e.date);
     return date.getMonth() === 11 && date.getFullYear() === 2025;
   });
   ```

3. **Calculate statistics:**
   ```javascript
   const stats = {
     total: december.reduce((sum, e) => sum + e.amount, 0),
     count: december.length,
     byCategory: december.reduce((acc, e) => {
       acc[e.category] = (acc[e.category] || 0) + e.amount;
       return acc;
     }, {}),
     byState: december.reduce((acc, e) => {
       acc[e.state] = (acc[e.state] || 0) + 1;
       return acc;
     }, {})
   };
   ```

4. **Generate report:**
   ```javascript
   console.log('December 2025 Expense Report');
   console.log('============================');
   console.log(`Total Expenses: $${stats.total.toFixed(2)}`);
   console.log(`Number of Expenses: ${stats.count}`);
   console.log('\nBy Category:');
   Object.entries(stats.byCategory).forEach(([cat, amt]) => {
     console.log(`  ${cat}: $${amt.toFixed(2)}`);
   });
   console.log('\nBy Status:');
   Object.entries(stats.byState).forEach(([state, count]) => {
     console.log(`  ${state}: ${count}`);
   });
   ```

### Expected Results
```
December 2025 Expense Report
============================
Total Expenses: $1,234.56
Number of Expenses: 15

By Category:
  Travel: $650.00
  Food: $284.50
  Office Supplies: $300.06

By Status:
  paid: 12
  pending_approval: 2
  rejected: 1
```

---

## Scenario 5: Audit Trail Investigation

### Step-by-Step

1. **CFO requests audit of specific expense:**
   ```bash
   GET /api/expenses/exp-suspicious-123
   ```

2. **Review complete history:**
   ```bash
   GET /api/expenses/exp-suspicious-123/history
   ```
   
   Response:
   ```json
   [
     {
       "id": "hist-1",
       "from_state": null,
       "to_state": "draft",
       "event_type": "CREATE",
       "performed_by": "employee-id",
       "timestamp": "2025-12-01T10:00:00Z"
     },
     {
       "id": "hist-2",
       "from_state": "draft",
       "to_state": "pending_approval",
       "event_type": "SUBMIT",
       "performed_by": "employee-id",
       "timestamp": "2025-12-01T14:30:00Z"
     },
     {
       "id": "hist-3",
       "from_state": "pending_approval",
       "to_state": "approved",
       "event_type": "APPROVE",
       "event_data": "{\"approvedBy\":\"manager-id\"}",
       "performed_by": "manager-id",
       "timestamp": "2025-12-02T09:15:00Z"
     }
   ]
   ```

3. **Analyze timeline:**
   - Created Dec 1 at 10:00 AM
   - Submitted same day at 2:30 PM
   - Approved next day at 9:15 AM
   - Total time to approval: ~23 hours

4. **Check for patterns:**
   ```javascript
   // Get all expenses by this employee
   const employeeExpenses = await fetch(
     `/api/expenses?createdBy=${employeeId}`
   ).then(r => r.json());
   
   // Check for duplicates
   const duplicates = employeeExpenses.filter(e => 
     e.amount === suspiciousExpense.amount &&
     e.date === suspiciousExpense.date &&
     e.id !== suspiciousExpense.id
   );
   ```

### Expected Results
- Complete audit trail available
- All actions attributed to users
- Timestamps for all changes
- Event data preserved

---

## Scenario 6: High-Value Expense (Special Approval)

### Step-by-Step

1. **Employee submits $5,000 expense:**
   ```bash
   POST /api/expenses
   {
     "title": "Conference Sponsorship",
     "amount": 5000.00,
     "category": "marketing-id",
     "date": "2025-12-31",
     "createdBy": "employee-id"
   }
   ```

2. **Submit triggers notification:**
   ```bash
   POST /api/expenses/{id}/submit
   {
     "submittedBy": "employee-id"
   }
   ```

3. **Manager approves, but needs CFO approval (business logic):**
   ```bash
   POST /api/expenses/{id}/approve
   {
     "approvedBy": "manager-id"
   }
   # In real implementation, add guard for high amounts
   ```

4. **CFO reviews and makes final approval:**
   ```bash
   # Could extend with secondary approval state
   POST /api/expenses/{id}/approve
   {
     "approvedBy": "cfo-id"
   }
   ```

### Implementation Note
For multi-level approvals, you could extend the behavior:

```typescript
type ExpenseState = 
  | "draft"
  | "pending_approval"
  | "pending_cfo_approval"  // Add new state
  | "approved"
  | "rejected"
  | "paid"
  | "archived";

transitions: {
  pending_approval: {
    APPROVE: {
      target: "pending_cfo_approval",
      guard: (context) => context.data.amount >= 1000
    },
    APPROVE_DIRECT: {
      target: "approved",
      guard: (context) => context.data.amount < 1000
    }
  },
  pending_cfo_approval: {
    APPROVE: { target: "approved" },
    REJECT: { target: "rejected" }
  }
}
```

---

## Scenario 7: Dashboard Analytics

### Step-by-Step

1. **Load statistics:**
   ```bash
   GET /api/expenses/stats/summary
   ```

2. **Display on dashboard:**
   ```javascript
   const stats = await fetch('/api/expenses/stats/summary')
     .then(r => r.json());
   
   // Calculate totals
   const totalPaid = stats
     .filter(s => s.state === 'paid')
     .reduce((sum, s) => sum + s.total_amount, 0);
   
   const pendingApproval = stats
     .find(s => s.state === 'pending_approval')
     ?.total_count || 0;
   
   // Display
   document.getElementById('total-paid').textContent = 
     `$${totalPaid.toFixed(2)}`;
   document.getElementById('pending-count').textContent = 
     pendingApproval;
   ```

3. **Show trends:**
   ```javascript
   // Get all expenses
   const allExpenses = await fetch('/api/expenses')
     .then(r => r.json());
   
   // Group by month
   const byMonth = allExpenses.reduce((acc, e) => {
     const month = new Date(e.date).toISOString().slice(0, 7);
     acc[month] = (acc[month] || 0) + e.amount;
     return acc;
   }, {});
   
   // Show chart
   createChart(byMonth);
   ```

### Expected Results
- Real-time dashboard metrics
- Trend visualization
- Quick decision-making insights

---

## Common API Patterns

### Pattern 1: Create and Submit in One Flow
```javascript
async function quickSubmit(expenseData, userId) {
  // Create
  const expense = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData)
  }).then(r => r.json());
  
  // Submit immediately
  await fetch(`/api/expenses/${expense.id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submittedBy: userId })
  });
  
  return expense;
}
```

### Pattern 2: Bulk Operations
```javascript
async function batchApprove(expenseIds, approverId) {
  const results = await Promise.all(
    expenseIds.map(id => 
      fetch(`/api/expenses/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: approverId })
      })
    )
  );
  
  return results;
}
```

### Pattern 3: Filtered Reports
```javascript
async function getUserExpensesReport(userId, startDate, endDate) {
  const expenses = await fetch(`/api/expenses?createdBy=${userId}`)
    .then(r => r.json());
  
  const filtered = expenses.filter(e => {
    const date = new Date(e.date);
    return date >= startDate && date <= endDate;
  });
  
  return {
    expenses: filtered,
    total: filtered.reduce((sum, e) => sum + e.amount, 0),
    count: filtered.length
  };
}
```

---

## Tips and Best Practices

1. **Always validate before submitting:**
   ```javascript
   if (expense.amount <= 0 || !expense.title) {
     alert('Invalid expense data');
     return;
   }
   ```

2. **Handle errors gracefully:**
   ```javascript
   try {
     await submitExpense(id);
   } catch (error) {
     console.error('Failed to submit:', error);
     alert('Submission failed. Please try again.');
   }
   ```

3. **Provide feedback to users:**
   ```javascript
   const success = await approveExpense(id);
   if (success) {
     showNotification('Expense approved successfully');
     refreshDashboard();
   }
   ```

4. **Keep audit trail in mind:**
   - Every action is logged
   - Provide clear rejection reasons
   - Document unusual approvals

5. **Use filters effectively:**
   ```javascript
   // Show only my pending expenses
   const myPending = await fetch(
     `/api/expenses?state=pending_approval&createdBy=${myId}`
   ).then(r => r.json());
   ```

---

These scenarios demonstrate real-world usage of the Expense Manager and show how the BHVR pattern handles complex workflows elegantly.
