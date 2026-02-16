import { Behavior } from "./core";

// Full Expense States for workflow management
export type ExpenseState =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "paid"
  | "archived";

// Full Expense Events
export interface ExpenseEvents {
  SUBMIT: { submittedBy: string; timestamp: Date };
  APPROVE: { approvedBy: string; timestamp: Date };
  REJECT: { rejectedBy: string; reason: string; timestamp: Date };
  PAY: { paidBy: string; transactionId: string; timestamp: Date };
  EDIT: { editedBy: string; changes: Partial<ExpenseData> };
  ARCHIVE: { archivedBy: string; timestamp: Date };
  RESTORE: { restoredBy: string; timestamp: Date };
}

// Expense Data
export interface ExpenseData {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: Date;
  createdBy: string;
  receipts: string[];
  metadata?: Record<string, any>;
}

// Expense Effects
export interface ExpenseEffects {
  onDraft?: () => void;
  onPendingApproval?: () => void;
  onApproved?: () => void;
  onRejected?: () => void;
  onPaid?: () => void;
  onArchived?: () => void;
  onRestored?: () => void;
}

// Full Expense Behavior with state transitions and guards
export const expenseBehavior: Behavior<ExpenseState, ExpenseEvents, ExpenseEffects> = {
  id: "expense-workflow",
  initial: "draft",

  transitions: {
    draft: {
      SUBMIT: {
        target: "pending_approval",
        guard: (context, event) => {
          // Guard: Expense must have a title and positive amount
          return context.data.title.trim().length > 0 && context.data.amount > 0;
        }
      },
      ARCHIVE: {
        target: "archived"
      }
    },
    pending_approval: {
      APPROVE: {
        target: "approved"
      },
      REJECT: {
        target: "rejected"
      },
      EDIT: {
        target: "draft"
      },
      ARCHIVE: {
        target: "archived"
      }
    },
    approved: {
      PAY: {
        target: "paid"
      },
      ARCHIVE: {
        target: "archived"
      }
    },
    rejected: {
      EDIT: {
        target: "draft"
      },
      ARCHIVE: {
        target: "archived"
      }
    },
    paid: {
      ARCHIVE: {
        target: "archived"
      }
    },
    archived: {
      RESTORE: {
        target: "draft"
      }
    }
  },

  effects: {
    draft: {
      onEnter: async (context) => {
        console.log(`Expense ${context.data.id} entered draft state`);
      },
    },
    pending_approval: {
      onEnter: async (context) => {
        console.log(`Expense ${context.data.id} submitted for approval`);
        // Could trigger notifications here
      },
    },
    approved: {
      onEnter: async (context) => {
        console.log(`Expense ${context.data.id} approved`);
      },
    },
    rejected: {
      onEnter: async (context) => {
        console.log(`Expense ${context.data.id} rejected`);
      },
    },
    paid: {
      onEnter: async (context) => {
        console.log(`Expense ${context.data.id} marked as paid`);
      },
    },
    archived: {
      onEnter: async (context) => {
        console.log(`Expense ${context.data.id} archived`);
      },
    }
  },
};