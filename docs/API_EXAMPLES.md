# API Examples

This document contains example API calls for the Expense Manager application.

## Authentication

Currently, the API doesn't require authentication. In production, you would add JWT or session-based authentication.

## Expenses API

### List All Expenses

```bash
curl http://localhost:3000/api/expenses
```

**With filters:**

```bash
# Filter by state
curl http://localhost:3000/api/expenses?state=pending_approval

# Filter by user
curl http://localhost:3000/api/expenses?createdBy=<user-id>

# Filter by category
curl http://localhost:3000/api/expenses?category=<category-id>

# Multiple filters
curl http://localhost:3000/api/expenses?state=approved&category=<category-id>
```

### Get Single Expense

```bash
curl http://localhost:3000/api/expenses/<expense-id>
```

### Create Expense

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Client Dinner",
    "description": "Dinner with potential client",
    "amount": 125.50,
    "currency": "USD",
    "category": "<category-id>",
    "date": "2025-12-31",
    "createdBy": "<user-id>"
  }'
```

### Update Expense

```bash
curl -X PATCH http://localhost:3000/api/expenses/<expense-id> \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "amount": 150.00
  }'
```

### Submit for Approval

```bash
curl -X POST http://localhost:3000/api/expenses/<expense-id>/submit \
  -H "Content-Type: application/json" \
  -d '{
    "submittedBy": "<user-id>"
  }'
```

### Approve Expense

```bash
curl -X POST http://localhost:3000/api/expenses/<expense-id>/approve \
  -H "Content-Type: application/json" \
  -d '{
    "approvedBy": "<approver-id>"
  }'
```

### Reject Expense

```bash
curl -X POST http://localhost:3000/api/expenses/<expense-id>/reject \
  -H "Content-Type: application/json" \
  -d '{
    "rejectedBy": "<approver-id>",
    "reason": "Missing receipt"
  }'
```

### Mark as Paid

```bash
curl -X POST http://localhost:3000/api/expenses/<expense-id>/pay \
  -H "Content-Type: application/json" \
  -d '{
    "paidBy": "<admin-id>",
    "transactionId": "TXN-123456"
  }'
```

### Archive Expense

```bash
curl -X POST http://localhost:3000/api/expenses/<expense-id>/archive \
  -H "Content-Type: application/json" \
  -d '{
    "archivedBy": "<user-id>"
  }'
```

### Get Expense History

```bash
curl http://localhost:3000/api/expenses/<expense-id>/history
```

### Get Statistics

```bash
# All expenses
curl http://localhost:3000/api/expenses/stats/summary

# For specific user
curl http://localhost:3000/api/expenses/stats/summary?userId=<user-id>
```

### Delete Expense

```bash
curl -X DELETE http://localhost:3000/api/expenses/<expense-id>
```

## Categories API

### List All Categories

```bash
curl http://localhost:3000/api/categories
```

### Get Single Category

```bash
curl http://localhost:3000/api/categories/<category-id>
```

### Create Category

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing",
    "description": "Marketing and advertising expenses",
    "color": "#FF6B6B"
  }'
```

### Update Category

```bash
curl -X PATCH http://localhost:3000/api/categories/<category-id> \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "color": "#4ECDC4"
  }'
```

### Delete Category

```bash
curl -X DELETE http://localhost:3000/api/categories/<category-id>
```

## Users API

### List All Users

```bash
curl http://localhost:3000/api/users
```

### Get Single User

```bash
curl http://localhost:3000/api/users/<user-id>
```

### Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "user"
  }'
```

## Complete Workflow Example

Here's a complete example of the expense lifecycle:

```bash
# 1. Get a user ID and category ID
USER_ID=$(curl -s http://localhost:3000/api/users | jq -r '.[0].id')
CATEGORY_ID=$(curl -s http://localhost:3000/api/categories | jq -r '.[0].id')

# 2. Create an expense
EXPENSE_ID=$(curl -s -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Team Lunch\",
    \"description\": \"Monthly team building lunch\",
    \"amount\": 85.00,
    \"currency\": \"USD\",
    \"category\": \"$CATEGORY_ID\",
    \"date\": \"2025-12-31\",
    \"createdBy\": \"$USER_ID\"
  }" | jq -r '.id')

echo "Created expense: $EXPENSE_ID"

# 3. Submit for approval
curl -X POST http://localhost:3000/api/expenses/$EXPENSE_ID/submit \
  -H "Content-Type: application/json" \
  -d "{\"submittedBy\": \"$USER_ID\"}"

# 4. Get an approver
APPROVER_ID=$(curl -s http://localhost:3000/api/users | jq -r '.[] | select(.role=="approver") | .id')

# 5. Approve the expense
curl -X POST http://localhost:3000/api/expenses/$EXPENSE_ID/approve \
  -H "Content-Type: application/json" \
  -d "{\"approvedBy\": \"$APPROVER_ID\"}"

# 6. Get admin
ADMIN_ID=$(curl -s http://localhost:3000/api/users | jq -r '.[] | select(.role=="admin") | .id')

# 7. Mark as paid
curl -X POST http://localhost:3000/api/expenses/$EXPENSE_ID/pay \
  -H "Content-Type: application/json" \
  -d "{\"paidBy\": \"$ADMIN_ID\", \"transactionId\": \"TXN-$(date +%s)\"}"

# 8. View history
curl http://localhost:3000/api/expenses/$EXPENSE_ID/history | jq

# 9. Archive
curl -X POST http://localhost:3000/api/expenses/$EXPENSE_ID/archive \
  -H "Content-Type: application/json" \
  -d "{\"archivedBy\": \"$USER_ID\"}"
```

## Response Examples

### Success Response (Expense)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Client Dinner",
  "description": "Dinner with potential client",
  "amount": 125.5,
  "currency": "USD",
  "category": "550e8400-e29b-41d4-a716-446655440001",
  "date": "2025-12-31T00:00:00.000Z",
  "state": "draft",
  "createdBy": "550e8400-e29b-41d4-a716-446655440002",
  "createdAt": "2025-12-31T12:00:00.000Z",
  "updatedAt": "2025-12-31T12:00:00.000Z",
  "receipts": [],
  "metadata": {}
}
```

### Error Response

```json
{
  "error": "Expense not found"
}
```

```json
{
  "error": "Failed to approve expense",
  "details": "Invalid transition: APPROVE from state draft"
}
```

## Testing with JavaScript

You can also test the API using JavaScript/Node.js:

```javascript
const API_BASE = 'http://localhost:3000/api';

async function createAndApproveExpense() {
  // Get users and categories
  const users = await fetch(`${API_BASE}/users`).then(r => r.json());
  const categories = await fetch(`${API_BASE}/categories`).then(r => r.json());
  
  // Create expense
  const expense = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Expense',
      description: 'Testing API',
      amount: 100,
      currency: 'USD',
      category: categories[0].id,
      date: new Date().toISOString(),
      createdBy: users[0].id
    })
  }).then(r => r.json());
  
  console.log('Created:', expense);
  
  // Submit for approval
  await fetch(`${API_BASE}/expenses/${expense.id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submittedBy: users[0].id })
  });
  
  console.log('Submitted for approval');
}

createAndApproveExpense();
```
