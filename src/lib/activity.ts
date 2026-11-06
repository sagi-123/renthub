export interface ActivityEvent {
  id: string;
  type:
    | "landlord_signup"
    | "landlord_signin"
    | "tenant_signup"
    | "tenant_signin"
    | "payment_received"
    | "agreement_signed"
    | "agreement_created"
    | "account_deleted"
    | "system_announcement"
    | "system";
  title: string;
  details: string;
  actorEmail?: string;
  actorName?: string;
  amount?: number;
  unit?: string;
  timestamp: string;
}

const STORAGE_KEY = "rh_platform_activity_log";
const ANNOUNCEMENT_KEY = "rh_platform_announcement";

export function logActivity(event: Omit<ActivityEvent, "id" | "timestamp"> & { timestamp?: string }) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as ActivityEvent[];
    const newEntry: ActivityEvent = {
      id: "act_" + Math.random().toString(36).substring(2, 9),
      timestamp: event.timestamp || new Date().toISOString(),
      ...event,
    };
    // Keep up to 250 recent events
    const updated = [newEntry, ...existing].slice(0, 250);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to log activity:", e);
  }
}

export function getActivities(): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearActivities() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export interface PlatformAnnouncement {
  id: string;
  message: string;
  target: "all" | "landlords" | "tenants";
  type: "info" | "warning" | "success";
  active: boolean;
  createdAt: string;
}

export function setPlatformAnnouncement(announcement: PlatformAnnouncement | null) {
  if (typeof window === "undefined") return;
  if (!announcement) {
    localStorage.removeItem(ANNOUNCEMENT_KEY);
  } else {
    localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcement));
  }
}

export function getPlatformAnnouncement(): PlatformAnnouncement | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(ANNOUNCEMENT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

