# BHVR Pattern Guide

## What is the BHVR Pattern?

BHVR (Behavior) is a pattern for managing complex state machines in your applications. It's particularly useful for workflows that have multiple states and defined transitions between them.

## Core Concepts

### 1. States

States represent the different stages an entity can be in:

```typescript
type ExpenseState = 
  | "draft"           // Initial creation
  | "pending_approval" // Submitted for review
  | "approved"        // Approved by manager
  | "rejected"        // Rejected by manager
  | "paid"            // Payment processed
  | "archived";       // Archived for record-keeping
```

### 2. Events

Events trigger transitions between states:

```typescript
interface ExpenseEvents {
  SUBMIT: { submittedBy: string; timestamp: Date };
  APPROVE: { approvedBy: string; timestamp: Date };
  REJECT: { rejectedBy: string; reason: string; timestamp: Date };
  PAY: { paidBy: string; transactionId: string; timestamp: Date };
  ARCHIVE: { archivedBy: string; timestamp: Date };
  EDIT: { editedBy: string; changes: any };
}
```

### 3. Transitions

Transitions define valid state changes:

```typescript
transitions: {
  draft: {
    SUBMIT: {
      target: "pending_approval",
      guard: (context, event) => {
        // Validate before allowing transition
        return context.data.amount > 0 && context.data.title.length > 0;
      }
    },
    ARCHIVE: {
      target: "archived"
    }
  },
  pending_approval: {
    APPROVE: { target: "approved" },
    REJECT: { target: "rejected" },
    EDIT: { target: "draft" }
  }
}
```

### 4. Guards

Guards are conditions that must be met for a transition to occur:

```typescript
guard: (context, event) => {
  const data = context.data as ExpenseData;
  // Only allow submission if amount is positive and title exists
  return data.amount > 0 && data.title.length > 0;
}
```

### 5. Effects

Effects are side effects that occur when entering or exiting a state:

```typescript
effects: {
  pending_approval: {
    onEnter: async (context) => {
      // Send notification email
      await sendEmail({
        to: context.data.approverEmail,
        subject: `New expense pending approval: ${context.data.title}`,
        body: `Amount: $${context.data.amount}`
      });
      
      // Log to audit trail
      await logAudit('expense_submitted', context.data.id);
    }
  },
  approved: {
    onEnter: async (context) => {
      // Notify submitter
      await notifyUser(context.data.createdBy, 'expense_approved');
    }
  }
}
```

## Implementation

### Step 1: Define Your Behavior

```typescript
import { Behavior } from "./core";

export const expenseBehavior: Behavior<ExpenseState, ExpenseEvents, ExpenseEffects> = {
  id: "expense-workflow",
  initial: "draft",
  transitions: {
    // Define your transitions
  },
  effects: {
    // Define your effects
  }
};
```

### Step 2: Create a Behavior Machine

```typescript
import { BehaviorMachine } from "./core";
import { expenseBehavior } from "./expense.behavior";

// Create instance with initial data
const machine = new BehaviorMachine(expenseBehavior, {
  id: "exp-123",
  title: "Office Supplies",
  amount: 45.99,
  // ... more data
});
```

### Step 3: Trigger Transitions

```typescript
// Attempt a transition
const success = await machine.transition("SUBMIT", {
  submittedBy: "user-123",
  timestamp: new Date()
});

if (success) {
  console.log("Current state:", machine.getState());
  // Output: "pending_approval"
} else {
  console.log("Transition failed - invalid or guarded");
}
```

### Step 4: Access Context

```typescript
// Get current state
const currentState = machine.getState();

// Get full context (state + data + history)
const context = machine.getContext();

// Get just the data
const data = machine.getData();

// Update data
machine.updateData({ amount: 50.00 });
```

## Benefits

### 1. Type Safety

TypeScript ensures you can only trigger valid events for the current state:

```typescript
// ✅ Valid
machine.transition("SUBMIT", { submittedBy: "user-123", timestamp: new Date() });

// ❌ TypeScript error - invalid event type
machine.transition("INVALID_EVENT", {});
```

### 2. Predictable State Changes

All state transitions are explicit and documented:

```
draft ──SUBMIT──> pending_approval ──APPROVE──> approved ──PAY──> paid
                        │                │
                    REJECT            REJECT
                        │                │
                        └────────> rejected
```

### 3. Audit Trail

Every transition is automatically tracked:

```typescript
const context = machine.getContext();
console.log(context.history);
// [
//   { state: "draft", timestamp: "2025-12-31T10:00:00Z" },
//   { state: "pending_approval", timestamp: "2025-12-31T11:00:00Z" },
//   { state: "approved", timestamp: "2025-12-31T12:00:00Z" }
// ]
```

### 4. Side Effect Management

Effects are centralized and easy to test:

```typescript
// All notification logic in one place
effects: {
  approved: {
    onEnter: async (context) => {
      await sendApprovalEmail(context);
      await updateDashboard(context);
      await logMetrics(context);
    }
  }
}
```

## Advanced Patterns

### Conditional Transitions

```typescript
transitions: {
  approved: {
    PAY: {
      target: "paid",
      guard: (context, event) => {
        // Only allow payment if amount is under $10,000
        // Higher amounts need additional approval
        return context.data.amount < 10000;
      }
    }
  }
}
```

### Async Effects

```typescript
effects: {
  paid: {
    onEnter: async (context) => {
      // Process payment
      const result = await paymentGateway.processPayment({
        amount: context.data.amount,
        account: context.data.accountNumber
      });
      
      // Update transaction ID
      context.data.transactionId = result.transactionId;
      
      // Send receipt
      await sendReceipt(context);
    }
  }
}
```

### State History

```typescript
// Get all previous states
const history = machine.getContext().history;

// Check if expense was ever rejected
const wasRejected = history.some(h => h.state === "rejected");

// Get time in each state
const timeInApproved = history.filter(h => h.state === "approved")
  .reduce((total, h) => {
    const next = history[history.indexOf(h) + 1];
    if (next) {
      return total + (next.timestamp - h.timestamp);
    }
    return total;
  }, 0);
```

## Testing

### Unit Testing Transitions

```typescript
import { BehaviorMachine } from "./core";
import { expenseBehavior } from "./expense.behavior";

test("should transition from draft to pending_approval", async () => {
  const machine = new BehaviorMachine(expenseBehavior, {
    id: "test-1",
    title: "Test Expense",
    amount: 100
  });
  
  const success = await machine.transition("SUBMIT", {
    submittedBy: "user-123",
    timestamp: new Date()
  });
  
  expect(success).toBe(true);
  expect(machine.getState()).toBe("pending_approval");
});

test("should not allow invalid transitions", async () => {
  const machine = new BehaviorMachine(expenseBehavior, {
    id: "test-1",
    title: "Test Expense",
    amount: 100
  });
  
  // Cannot approve from draft state
  const success = await machine.transition("APPROVE", {
    approvedBy: "manager-123",
    timestamp: new Date()
  });
  
  expect(success).toBe(false);
  expect(machine.getState()).toBe("draft"); // Still in draft
});

test("should enforce guards", async () => {
  const machine = new BehaviorMachine(expenseBehavior, {
    id: "test-1",
    title: "", // Invalid: empty title
    amount: 100
  });
  
  const success = await machine.transition("SUBMIT", {
    submittedBy: "user-123",
    timestamp: new Date()
  });
  
  expect(success).toBe(false); // Guard prevented transition
});
```

## Common Use Cases

### Approval Workflows

- Purchase orders
- Leave requests
- Document approvals
- Expense approvals

### E-commerce Order Flow

- Cart → Checkout → Processing → Shipped → Delivered

### Content Management

- Draft → Review → Published → Archived

### User Onboarding

- Registered → Email Verified → Profile Complete → Active

### Support Tickets

- Open → In Progress → Resolved → Closed

## Best Practices

1. **Keep States Simple**: Don't create too many states. Combine similar states when possible.

2. **Use Guards Wisely**: Guards should be pure functions that don't modify state.

3. **Async Effects**: Always use async/await for effects that do I/O.

4. **Error Handling**: Wrap effect handlers in try-catch blocks.

5. **Immutable Data**: Don't mutate context data directly. Use `updateData()`.

6. **Document Transitions**: Create a state diagram to visualize your workflow.

7. **Test Edge Cases**: Test invalid transitions and guard conditions.

## Comparison with Other Patterns

### vs XState

XState is more feature-rich but heavier. BHVR is lighter and easier to understand.

### vs Redux

Redux manages application state. BHVR manages entity workflow state.

### vs Simple State Variables

BHVR provides type safety, history tracking, and side effect management.

## Resources

- [State Machine Basics](https://statecharts.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [XState Documentation](https://xstate.js.org/) (for comparison)

---

**Next Steps**: Try implementing your own behavior for a different workflow (e.g., user registration, order processing, etc.)
