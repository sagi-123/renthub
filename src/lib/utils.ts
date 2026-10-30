import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── Monthly Rent Cycle Evaluator ─────────────────────────────── */

export interface CycleTenant {
  id: string;
  name: string;
  dueDate: string;
  paymentStatus: "Paid" | "Unpaid" | "Overdue";
  [key: string]: any;
}

export interface CyclePayment {
  tenantId?: string;
  tenantName?: string;
  status: string;
  date?: string;
  [key: string]: any;
}

/**
 * Evaluates whether a tenant has paid rent for the current calendar month.
 * If paid: status is "Paid" and due date rolls over to next month's due date.
 * If unpaid and past due date: status is "Overdue".
 * If unpaid and on/before due date: status is "Unpaid".
 */
export function evaluateTenantCycleStatus(
  tenant: CycleTenant,
  payments: CyclePayment[]
): {
  paymentStatus: "Paid" | "Unpaid" | "Overdue";
  dueDate: string;
  isPaidThisMonth: boolean;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 to 11
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`; // "YYYY-MM"

  // 1. Determine the due day of month (default to 5th if not parseable)
  let dueDay = 5;
  if (tenant.dueDate) {
    const parts = tenant.dueDate.split("-");
    if (parts.length === 3) {
      dueDay = parseInt(parts[2], 10) || 5;
    } else {
      const match = tenant.dueDate.match(/\b([1-9]|[12]\d|3[01])\b/);
      if (match) dueDay = parseInt(match[1], 10) || 5;
    }
  }

  // Ensure day is valid for current month (e.g. not Feb 31)
  const maxDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const safeDueDay = Math.min(dueDay, maxDaysInMonth);

  // 2. Check if a successful payment exists for this tenant in this current month
  const tenantNameLower = (tenant.name || "").toLowerCase().trim();
  const hasPaidThisMonth = payments.some(p => {
    const isMatchingTenant =
      (p.tenantId && p.tenantId === tenant.id) ||
      (p.tenantName && p.tenantName.toLowerCase().trim() === tenantNameLower);
    const isSuccess = p.status === "Success" || p.status === "Paid";
    const isCurrentMonth = p.date && p.date.startsWith(currentMonthStr);
    return isMatchingTenant && isSuccess && isCurrentMonth;
  });

  const currentMonthDueDate = `${currentMonthStr}-${String(safeDueDay).padStart(2, "0")}`;
  const todayStr = now.toISOString().split("T")[0];

  if (hasPaidThisMonth) {
    // Current cycle is settled. Next cycle due date is next month's due day
    const nextMonthDate = new Date(currentYear, currentMonth + 1, safeDueDay);
    const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-${String(safeDueDay).padStart(2, "0")}`;
    return {
      paymentStatus: "Paid",
      dueDate: nextMonthStr,
      isPaidThisMonth: true,
    };
  } else {
    // Has not paid for current month
    const isOverdue = todayStr > currentMonthDueDate;
    return {
      paymentStatus: isOverdue ? "Overdue" : "Unpaid",
      dueDate: currentMonthDueDate,
      isPaidThisMonth: false,
    };
  }
}

/**
 * Synchronizes an array of tenants with their monthly payment cycle.
 * Returns updated tenants list and a boolean flag indicating if any tenant status changed.
 */
export function syncTenantsWithMonthlyCycle<T extends CycleTenant>(
  tenants: T[],
  payments: CyclePayment[]
): { updatedTenants: T[]; hasChanges: boolean } {
  let hasChanges = false;
  const updatedTenants = tenants.map(t => {
    const evaluated = evaluateTenantCycleStatus(t, payments);
    if (t.paymentStatus !== evaluated.paymentStatus || t.dueDate !== evaluated.dueDate) {
      hasChanges = true;
      return {
        ...t,
        paymentStatus: evaluated.paymentStatus,
        dueDate: evaluated.dueDate,
      };
    }
    return t;
  });
  return { updatedTenants, hasChanges };
}
