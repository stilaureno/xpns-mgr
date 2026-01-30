import { describe, test, expect, beforeAll } from "bun:test";
import { BehaviorMachine } from "../src/behaviors/core";
import { expenseBehavior, ExpenseData } from "../src/behaviors/expense.behavior";

describe("Expense Behavior Machine", () => {
  let machine: BehaviorMachine<any, any, any, ExpenseData>;
  
  beforeAll(() => {
    const initialData: ExpenseData = {
      id: "test-expense-1",
      title: "Test Expense",
      description: "Testing behavior machine",
      amount: 100,
      currency: "USD",
      category: "test-category",
      date: new Date(),
      createdBy: "test-user",
      receipts: [],
    };
    
    machine = new BehaviorMachine(expenseBehavior, initialData);
  });

  test("should start in draft state", () => {
    expect(machine.getState()).toBe("draft");
  });

  test("should transition from draft to pending_approval on SUBMIT", async () => {
    const success = await machine.transition("SUBMIT", {
      submittedBy: "test-user",
      timestamp: new Date(),
    });

    expect(success).toBe(true);
    expect(machine.getState()).toBe("pending_approval");
  });

  test("should transition from pending_approval to approved on APPROVE", async () => {
    const success = await machine.transition("APPROVE", {
      approvedBy: "test-approver",
      timestamp: new Date(),
    });

    expect(success).toBe(true);
    expect(machine.getState()).toBe("approved");
  });

  test("should transition from approved to paid on PAY", async () => {
    const success = await machine.transition("PAY", {
      paidBy: "test-admin",
      transactionId: "TXN-12345",
      timestamp: new Date(),
    });

    expect(success).toBe(true);
    expect(machine.getState()).toBe("paid");
  });

  test("should maintain state history", () => {
    const context = machine.getContext();
    
    expect(context.history).toHaveLength(4);
    expect(context.history[0].state).toBe("draft");
    expect(context.history[1].state).toBe("pending_approval");
    expect(context.history[2].state).toBe("approved");
    expect(context.history[3].state).toBe("paid");
  });
});

describe("Expense Behavior Guards", () => {
  test("should prevent SUBMIT with invalid data", async () => {
    const invalidData: ExpenseData = {
      id: "test-expense-2",
      title: "", // Empty title should fail guard
      description: "Testing guards",
      amount: 100,
      currency: "USD",
      category: "test-category",
      date: new Date(),
      createdBy: "test-user",
      receipts: [],
    };
    
    const machine = new BehaviorMachine(expenseBehavior, invalidData);
    
    const success = await machine.transition("SUBMIT", {
      submittedBy: "test-user",
      timestamp: new Date(),
    });

    expect(success).toBe(false);
    expect(machine.getState()).toBe("draft");
  });

  test("should prevent SUBMIT with zero amount", async () => {
    const invalidData: ExpenseData = {
      id: "test-expense-3",
      title: "Test",
      description: "Testing guards",
      amount: 0, // Zero amount should fail guard
      currency: "USD",
      category: "test-category",
      date: new Date(),
      createdBy: "test-user",
      receipts: [],
    };
    
    const machine = new BehaviorMachine(expenseBehavior, invalidData);
    
    const success = await machine.transition("SUBMIT", {
      submittedBy: "test-user",
      timestamp: new Date(),
    });

    expect(success).toBe(false);
    expect(machine.getState()).toBe("draft");
  });
});

describe("Expense Rejection Flow", () => {
  test("should handle rejection and allow re-editing", async () => {
    const data: ExpenseData = {
      id: "test-expense-4",
      title: "Test Rejection",
      description: "Testing rejection flow",
      amount: 100,
      currency: "USD",
      category: "test-category",
      date: new Date(),
      createdBy: "test-user",
      receipts: [],
    };
    
    const machine = new BehaviorMachine(expenseBehavior, data);
    
    // Submit
    await machine.transition("SUBMIT", {
      submittedBy: "test-user",
      timestamp: new Date(),
    });
    expect(machine.getState()).toBe("pending_approval");
    
    // Reject
    await machine.transition("REJECT", {
      rejectedBy: "test-approver",
      reason: "Missing receipt",
      timestamp: new Date(),
    });
    expect(machine.getState()).toBe("rejected");
    
    // Edit (back to draft)
    await machine.transition("EDIT", {
      editedBy: "test-user",
      changes: { description: "Added receipt" },
    });
    expect(machine.getState()).toBe("draft");
  });
});

describe("Invalid Transitions", () => {
  test("should not allow APPROVE from draft state", async () => {
    const data: ExpenseData = {
      id: "test-expense-5",
      title: "Test Invalid",
      description: "Testing invalid transitions",
      amount: 100,
      currency: "USD",
      category: "test-category",
      date: new Date(),
      createdBy: "test-user",
      receipts: [],
    };
    
    const machine = new BehaviorMachine(expenseBehavior, data);
    
    const success = await machine.transition("APPROVE", {
      approvedBy: "test-approver",
      timestamp: new Date(),
    });

    expect(success).toBe(false);
    expect(machine.getState()).toBe("draft");
  });

  test("should not allow PAY from draft state", async () => {
    const data: ExpenseData = {
      id: "test-expense-6",
      title: "Test Invalid",
      description: "Testing invalid transitions",
      amount: 100,
      currency: "USD",
      category: "test-category",
      date: new Date(),
      createdBy: "test-user",
      receipts: [],
    };
    
    const machine = new BehaviorMachine(expenseBehavior, data);
    
    const success = await machine.transition("PAY", {
      paidBy: "test-admin",
      transactionId: "TXN-12345",
      timestamp: new Date(),
    });

    expect(success).toBe(false);
    expect(machine.getState()).toBe("draft");
  });
});

describe("Archive Flow", () => {
  test("should allow archiving from paid state", async () => {
    const data: ExpenseData = {
      id: "test-expense-7",
      title: "Test Archive",
      description: "Testing archive flow",
      amount: 100,
      currency: "USD",
      category: "test-category",
      date: new Date(),
      createdBy: "test-user",
      receipts: [],
    };
    
    const machine = new BehaviorMachine(expenseBehavior, data);
    
    // Complete workflow
    await machine.transition("SUBMIT", { submittedBy: "test-user", timestamp: new Date() });
    await machine.transition("APPROVE", { approvedBy: "test-approver", timestamp: new Date() });
    await machine.transition("PAY", { paidBy: "test-admin", transactionId: "TXN-12345", timestamp: new Date() });
    
    expect(machine.getState()).toBe("paid");
    
    // Archive
    const success = await machine.transition("ARCHIVE", {
      archivedBy: "test-user",
      timestamp: new Date(),
    });

    expect(success).toBe(true);
    expect(machine.getState()).toBe("archived");
  });

  test("should allow archiving from rejected state", async () => {
    const data: ExpenseData = {
      id: "test-expense-8",
      title: "Test Archive Rejected",
      description: "Testing archive from rejected",
      amount: 100,
      currency: "USD",
      category: "test-category",
      date: new Date(),
      createdBy: "test-user",
      receipts: [],
    };
    
    const machine = new BehaviorMachine(expenseBehavior, data);
    
    await machine.transition("SUBMIT", { submittedBy: "test-user", timestamp: new Date() });
    await machine.transition("REJECT", { 
      rejectedBy: "test-approver", 
      reason: "Invalid", 
      timestamp: new Date() 
    });
    
    expect(machine.getState()).toBe("rejected");
    
    const success = await machine.transition("ARCHIVE", {
      archivedBy: "test-user",
      timestamp: new Date(),
    });

    expect(success).toBe(true);
    expect(machine.getState()).toBe("archived");
  });
});
