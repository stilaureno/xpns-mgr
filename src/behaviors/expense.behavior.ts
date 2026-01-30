import { Behavior } from "./core";

// Simplified Expense States for daily tracking
export type ExpenseState = 
  | "active"
  | "archived";

// Simplified Expense Events
export interface ExpenseEvents {
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

// Expense Effects (simplified)
export interface ExpenseEffects {
  onArchive?: () => void;
  onRestore?: () => void;
}

// Simplified Expense Behavior for daily expense tracking
export const expenseBehavior: Behavior<ExpenseState, ExpenseEvents, ExpenseEffects> = {
  id: "expense-tracker",
  initial: "active",
  
  transitions: {
    active: {
      ARCHIVE: {
        target: "archived",
      },
    },
    archived: {
      RESTORE: {
        target: "active",
      },
    },
  },
  
  effects: {
    archived: {
      onEnter: async (context) => {
        console.log(`Expense ${context.data.id} archived`);
      },
    },
    active: {
      onEnter: async (context) => {
        console.log(`Expense ${context.data.id} restored to active`);
      },
    },
  },
};
