import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert, ShieldCheck, Activity, Users, Building2, CreditCard,
  FileText, Search, Download, Trash2, ExternalLink, RefreshCw,
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Send, LogOut,
  Eye, Check, ChevronRight, Filter, Lock, Key, Mail, Phone,
  Sparkles, Megaphone, Database, DollarSign, ArrowUpRight
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  getActivities,
  logActivity,
  clearActivities,
  type ActivityEvent,
  getPlatformAnnouncement,
  setPlatformAnnouncement,
  type PlatformAnnouncement,
} from "../lib/activity";

export const Route = createFileRoute("/super-admin")({
  component: SuperAdminPortal,
});

/* ── Types ─────────────────────────────────────────────────────────────── */
interface LandlordRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  createdAt?: string;
}

interface TenantRecord {
  id: string;
  landlordId?: string;
  name: string;
  email: string;
  phone?: string;
  unit: string;
  rentAmount: number;
  depositAmount: number;
  paymentStatus: "Paid" | "Unpaid" | "Overdue";
  dueDate?: string;
  leaseStart?: string;
  leaseEnd?: string;
  propertyName?: string;
  createdAt?: string;
}

interface PaymentRecord {
  id: string;
  landlordId?: string;
  tenantId?: string;
  tenantName: string;
  unit: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  transactionId?: string;
  createdAt?: string;
}

interface AgreementRecord {
  id: string;
  landlordId?: string;
  tenantName: string;
  unit: string;
  rentAmount: number;
  depositAmount: number;
  startDate?: string;
  endDate?: string;
  status: string;
  tenantEmail?: string;
  tenantPhone?: string;
  propertyName?: string;
  landlordName?: string;
  createdAt?: string;
}

export function SuperAdminPortal() {
  const navigate = useNavigate();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("rh_super_admin_logged_in") === "true";
  });
  const [loginEmail, setLoginEmail] = useState("admin@renthub.com");
  const [loginPasscode, setLoginPasscode] = useState("");
  const [loginError, setLoginError] = useState("");

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "landlords" | "tenants" | "payments" | "agreements" | "system"
  >("overview");

  // Live Platform Data
  const [landlords, setLandlords] = useState<LandlordRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<"all" | "auth" | "payment" | "agreement" | "deletion">("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | "Paid" | "Unpaid">("all");

  // Announcement State
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState<"all" | "landlords" | "tenants">("all");
  const [announcementType, setAnnouncementType] = useState<"info" | "warning" | "success">("info");
  const [activeAnnouncement, setActiveAnnouncement] = useState<PlatformAnnouncement | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Load Platform Data ──────────────────────────────────────────────── */
  const loadPlatformData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Landlords
      let dbLandlords: LandlordRecord[] = [];
      try {
        const res = (await supabase.from("rh_landlords").select("*")) as LandlordRecord[];
        if (res && Array.isArray(res)) dbLandlords = res;
      } catch (e) {
        console.warn("Supabase rh_landlords load fallback:", e);
      }
      if (dbLandlords.length === 0) {
        const cached = localStorage.getItem("rh_landlords");
        if (cached) dbLandlords = JSON.parse(cached);
      }
      setLandlords(dbLandlords);

      // 2. Fetch Tenants
      let dbTenants: TenantRecord[] = [];
      try {
        const res = (await supabase.from("rh_tenants").select("*")) as TenantRecord[];
        if (res && Array.isArray(res)) dbTenants = res;
      } catch (e) {
        console.warn("Supabase rh_tenants load fallback:", e);
      }
      if (dbTenants.length === 0) {
        // Collect from all local storage tenant caches
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("rh_tenants_")) {
            try {
              const list = JSON.parse(localStorage.getItem(key) || "[]");
              dbTenants.push(...list);
            } catch (_) {}
          }
        }
        // Deduplicate by ID
        const seen = new Set<string>();
        dbTenants = dbTenants.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
      }
      setTenants(dbTenants);

      // 3. Fetch Payments
      let dbPayments: PaymentRecord[] = [];
      try {
        const res = (await supabase.from("rh_payments").select("*")) as PaymentRecord[];
        if (res && Array.isArray(res)) dbPayments = res;
      } catch (e) {
        console.warn("Supabase rh_payments load fallback:", e);
      }
      if (dbPayments.length === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("rh_payments_")) {
            try {
              const list = JSON.parse(localStorage.getItem(key) || "[]");
              dbPayments.push(...list);
            } catch (_) {}
          }
        }
        const seenP = new Set<string>();
        dbPayments = dbPayments.filter((p) => (seenP.has(p.id) ? false : (seenP.add(p.id), true)));
      }
      // Sort payments newest first
      dbPayments.sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
      setPayments(dbPayments);

      // 4. Fetch Agreements
      let dbAgreements: AgreementRecord[] = [];
      try {
        const res = (await supabase.from("rh_agreements").select("*")) as AgreementRecord[];
        if (res && Array.isArray(res)) dbAgreements = res;
      } catch (e) {
        console.warn("Supabase rh_agreements load fallback:", e);
      }
      if (dbAgreements.length === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("rh_agreements_")) {
            try {
              const list = JSON.parse(localStorage.getItem(key) || "[]");
              dbAgreements.push(...list);
            } catch (_) {}
          }
        }
      }
      setAgreements(dbAgreements);

      // 5. Build Combined Activity Feed (Logged events + DB reconstructed records)
      const logged = getActivities();
      const syntheticEvents: ActivityEvent[] = [];

      // Landlord events
      dbLandlords.forEach((l) => {
        if (l.createdAt) {
          syntheticEvents.push({
            id: "l_reg_" + l.id,
            type: "landlord_signup",
            title: "Landlord Registration",
            details: `Landlord ${l.name} (${l.email}) registered on the platform`,
            actorEmail: l.email,
            actorName: l.name,
            timestamp: l.createdAt,
          });
        }
      });

      // Tenant events
      dbTenants.forEach((t) => {
        syntheticEvents.push({
          id: "t_reg_" + t.id,
          type: "tenant_signup",
          title: "Tenant Profile Added",
          details: `Tenant ${t.name} enrolled for Unit ${t.unit} (₹${(t.rentAmount || 0).toLocaleString("en-IN")}/mo)`,
          actorEmail: t.email,
          actorName: t.name,
          unit: t.unit,
          timestamp: t.createdAt || new Date(Date.now() - 3600000).toISOString(),
        });
      });

      // Payment events
      dbPayments.forEach((p) => {
        syntheticEvents.push({
          id: "p_evt_" + p.id,
          type: "payment_received",
          title: "Rent Payment Received",
          details: `₹${(p.amount || 0).toLocaleString("en-IN")} collected from ${p.tenantName} (${p.unit}) via ${p.method}`,
          amount: p.amount,
          unit: p.unit,
          timestamp: p.date || p.createdAt || new Date().toISOString(),
        });
      });

      // Agreement events
      dbAgreements.forEach((a) => {
        syntheticEvents.push({
          id: "agr_evt_" + a.id,
          type: a.status === "Signed" ? "agreement_signed" : "agreement_created",
          title: a.status === "Signed" ? "Agreement Fully Executed" : "Lease Agreement Drafted",
          details: `Agreement for ${a.tenantName} (${a.unit}) - Status: ${a.status}`,
          unit: a.unit,
          timestamp: a.createdAt || new Date().toISOString(),
        });
      });

      // Merge and deduplicate by id
      const allEvents = [...logged, ...syntheticEvents];
      const seenIds = new Set<string>();
      const dedupedEvents = allEvents.filter((ev) => {
        if (seenIds.has(ev.id)) return false;
        seenIds.add(ev.id);
        return true;
      });

      // Sort newest first
      dedupedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(dedupedEvents);

      // Load active announcement
      setActiveAnnouncement(getPlatformAnnouncement());
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Super Admin data loading error:", err);
      showToast("Failed to load some data. Please retry.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPlatformData();
      const interval = setInterval(() => {
        loadPlatformData();
      }, 45000); // auto-refresh every 45 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  /* ── Authentication Handlers ─────────────────────────────────────────── */
  const handleSuperAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = loginPasscode.trim();
    // Default master passcodes: "renthub@admin2026", "renthub2026", or "admin123"
    const allowedPasscodes = ["renthub@admin2026", "renthub2026", "admin123", "masteradmin"];
    
    if (loginEmail.toLowerCase().trim() === "admin@renthub.com" || cleanPass.length >= 6) {
      if (allowedPasscodes.includes(cleanPass) || cleanPass === "admin") {
        setIsAuthenticated(true);
        sessionStorage.setItem("rh_super_admin_logged_in", "true");
        setLoginError("");
        showToast("Welcome to RentHub Super Admin Command Center!");
        logActivity({
          type: "system",
          title: "Master Admin Login",
          details: "Super Admin authenticated successfully into the platform control panel.",
        });
      } else {
        setLoginError("Invalid master passcode. Default: renthub@admin2026");
      }
    } else {
      setLoginError("Please enter valid credentials.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("rh_super_admin_logged_in");
    setIsAuthenticated(false);
    showToast("Logged out from Super Admin.", "info");
  };

  const quickDemoLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem("rh_super_admin_logged_in", "true");
    setLoginError("");
    showToast("Master access granted!");
  };

  /* ── Impersonation Helpers (Customer Support) ────────────────────────── */
  const impersonateLandlord = (landlord: LandlordRecord) => {
    sessionStorage.setItem("rh_admin_logged_in", "true");
    sessionStorage.setItem("rh_logged_in_landlord", JSON.stringify(landlord));
    logActivity({
      type: "system",
      title: "Landlord Impersonation",
      details: `Admin inspected portal as Landlord: ${landlord.name} (${landlord.email})`,
      actorEmail: landlord.email,
      actorName: landlord.name,
    });
    showToast(`Accessing Landlord portal as ${landlord.name}...`);
    setTimeout(() => {
      window.open("/admin", "_blank");
    }, 400);
  };

  const impersonateTenant = (tenant: TenantRecord) => {
    sessionStorage.setItem("rh_logged_in_tenant", JSON.stringify(tenant));
    logActivity({
      type: "system",
      title: "Tenant Impersonation",
      details: `Admin inspected portal as Tenant: ${tenant.name} (${tenant.unit})`,
      actorEmail: tenant.email,
      actorName: tenant.name,
      unit: tenant.unit,
    });
    showToast(`Accessing Tenant portal as ${tenant.name}...`);
    setTimeout(() => {
      window.open("/tenant", "_blank");
    }, 400);
  };

  /* ── Export to CSV ───────────────────────────────────────────────────── */
  const exportPaymentsCSV = () => {
    if (payments.length === 0) {
      showToast("No payment records to export.", "info");
      return;
    }
    const headers = ["Transaction ID", "Tenant Name", "Unit", "Amount (INR)", "Payment Method", "Status", "Date"];
    const rows = payments.map((p) => [
      `"${p.transactionId || p.id}"`,
      `"${p.tenantName}"`,
      `"${p.unit}"`,
      p.amount,
      `"${p.method}"`,
      `"${p.status}"`,
      `"${p.date || p.createdAt || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `renthub_master_payments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Payment ledger downloaded as CSV!");
  };

  /* ── Announcement Broadcast ──────────────────────────────────────────── */
  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;

    const newAnnouncement: PlatformAnnouncement = {
      id: "ann_" + Date.now(),
      message: announcementMsg.trim(),
      target: announcementTarget,
      type: announcementType,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setPlatformAnnouncement(newAnnouncement);
    setActiveAnnouncement(newAnnouncement);
    setAnnouncementMsg("");
    showToast(`Broadcast published to ${announcementTarget.toUpperCase()} users!`);
    logActivity({
      type: "system_announcement",
      title: "System Announcement Broadcasted",
      details: `Broadcast: "${newAnnouncement.message}" targeting ${newAnnouncement.target}`,
    });
  };

  const handleClearAnnouncement = () => {
    setPlatformAnnouncement(null);
    setActiveAnnouncement(null);
    showToast("Announcement dismissed from all portals.", "info");
  };

  /* ── Calculated High-Level KPIs ──────────────────────────────────────── */
  const totalRentVolume = useMemo(() => {
    return payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [payments]);

  const paidTenantsCount = useMemo(() => {
    return tenants.filter((t) => t.paymentStatus === "Paid").length;
  }, [tenants]);

  const paymentSuccessRate = useMemo(() => {
    if (tenants.length === 0) return 100;
    return Math.round((paidTenantsCount / tenants.length) * 100);
  }, [tenants, paidTenantsCount]);

  const signedAgreementsCount = useMemo(() => {
    return agreements.filter((a) => a.status === "Signed").length;
  }, [agreements]);

  /* ── Filtered Data Views ─────────────────────────────────────────────── */
  const filteredActivities = useMemo(() => {
    return activities.filter((ev) => {
      if (activityFilter === "auth") {
        return ev.type.includes("signin") || ev.type.includes("signup");
      }
      if (activityFilter === "payment") {
        return ev.type === "payment_received";
      }
      if (activityFilter === "agreement") {
        return ev.type.includes("agreement");
      }
      if (activityFilter === "deletion") {
        return ev.type.includes("deleted");
      }
      return true;
    });
  }, [activities, activityFilter]);

  const filteredLandlords = useMemo(() => {
    if (!searchQuery.trim()) return landlords;
    const q = searchQuery.toLowerCase().trim();
    return landlords.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.upiId?.toLowerCase().includes(q)
    );
  }, [landlords, searchQuery]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        !searchQuery.trim() ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        t.unit?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        t.email?.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesStatus =
        paymentStatusFilter === "all" || t.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchQuery, paymentStatusFilter]);

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const q = searchQuery.toLowerCase().trim();
    return payments.filter(
      (p) =>
        p.tenantName?.toLowerCase().includes(q) ||
        p.unit?.toLowerCase().includes(q) ||
        p.transactionId?.toLowerCase().includes(q) ||
        p.method?.toLowerCase().includes(q)
    );
  }, [payments, searchQuery]);

  /* ── Format Helpers ──────────────────────────────────────────────────── */
  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return "Recently";
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  /* ── 1. LOGIN SCREEN ─────────────────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glowing background ambient lights */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
          {/* Brand header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-2">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              RentHub Super Admin
            </h1>
            <p className="text-xs text-slate-400">
              Platform Governance, Live Analytics & Transaction Audit
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSuperAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Master Admin Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="admin@renthub.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Master Passcode</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={loginPasscode}
                  onChange={(e) => setLoginPasscode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="••••••••••••"
                />
              </div>
              <p className="text-[11px] text-slate-500">Default passcode: <code className="text-teal-400 font-mono">renthub@admin2026</code></p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Key className="h-4 w-4" /> Sign In to Super Admin
            </button>
          </form>

          {/* Quick Access Helper */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={quickDemoLogin}
              className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700/50"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-400" /> One-Click Quick Access as Admin
            </button>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
            <Link to="/admin" className="hover:text-slate-300 underline">Landlord Portal</Link>
            <Link to="/tenant" className="hover:text-slate-300 underline">Tenant Portal</Link>
            <Link to="/" className="hover:text-slate-300 underline">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── 2. SUPER ADMIN MAIN DASHBOARD ───────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 border ${
              toast.type === "error"
                ? "bg-rose-950/90 border-rose-800 text-rose-300"
                : toast.type === "info"
                ? "bg-sky-950/90 border-sky-800 text-sky-300"
                : "bg-teal-950/90 border-teal-800 text-teal-300"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-display">RentHub Super Admin</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                LIVE PRODUCTION
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Platform Command Center & Transaction Ledger</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={loadPlatformData}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
            title="Refresh live data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-teal-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Quick Portals Links */}
          <Link
            to="/admin"
            target="_blank"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium hidden md:flex items-center gap-1.5 transition-colors border border-slate-700/60"
          >
            <Building2 className="h-3.5 w-3.5 text-indigo-400" /> Landlord Portal <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>
          <Link
            to="/tenant"
            target="_blank"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium hidden md:flex items-center gap-1.5 transition-colors border border-slate-700/60"
          >
            <Users className="h-3.5 w-3.5 text-teal-400" /> Tenant Portal <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 text-xs transition-colors cursor-pointer border border-slate-700/60"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-slate-900/50 border-r border-slate-800/80 p-4 space-y-6 flex-shrink-0">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
              Main Governance
            </p>
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Activity className="h-4 w-4" /> Platform Overview
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "activity"
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                Live Activity Feed
              </div>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300">
                {activities.length}
              </span>
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
              Entities & Ledgers
            </p>
            <button
              onClick={() => setActiveTab("landlords")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "landlords"
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4" /> All Landlords
              </div>
              <span className="text-[11px] font-mono text-slate-400">{landlords.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("tenants")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "tenants"
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" /> All Tenants
              </div>
              <span className="text-[11px] font-mono text-slate-400">{tenants.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "payments"
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4" /> Master Payments
              </div>
              <span className="text-[11px] font-mono text-slate-400">{payments.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("agreements")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "agreements"
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4" /> Global Agreements
              </div>
              <span className="text-[11px] font-mono text-slate-400">{agreements.length}</span>
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
              System Controls
            </p>
            <button
              onClick={() => setActiveTab("system")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "system"
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Megaphone className="h-4 w-4" /> Broadcast & System
            </button>
          </div>

          {/* Quick Platform Status */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Database Sync</span>
              <span className="text-teal-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 inline-block" /> Cloud Connected
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              Updated: {lastRefreshed.toLocaleTimeString()}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {/* Active Platform Announcement Banner if published */}
          {activeAnnouncement && activeAnnouncement.active && (
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 flex-shrink-0 text-teal-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                      Active Broadcast ({activeAnnouncement.target})
                    </span>
                    <span className="text-xs text-slate-400">{formatTimeAgo(activeAnnouncement.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-100 mt-0.5">{activeAnnouncement.message}</p>
                </div>
              </div>
              <button
                onClick={handleClearAnnouncement}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ── TAB 1: OVERVIEW & KPIS ─────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-reveal">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Platform Overview</h2>
                <p className="text-xs text-slate-400">Holistic metrics across all landlords, units, and transactions</p>
              </div>

              {/* 5 Key Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Landlords */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl space-y-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium">Total Landlords</span>
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">{landlords.length}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-teal-400 font-semibold">Active Owners</span> on platform
                  </div>
                </div>

                {/* Tenants */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl space-y-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium">Total Tenants</span>
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">{tenants.length}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-teal-400 font-semibold">{paidTenantsCount} Paid</span> / {tenants.length - paidTenantsCount} Pending
                  </div>
                </div>

                {/* Total Rent Volume */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl space-y-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium">Total Transacted</span>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    ₹{totalRentVolume.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-emerald-400 font-semibold">{payments.length} Payments</span> logged
                  </div>
                </div>

                {/* Agreements */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl space-y-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium">Digital Agreements</span>
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">{agreements.length}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-teal-400 font-semibold">{signedAgreementsCount} Signed</span> / {agreements.length - signedAgreementsCount} Pending
                  </div>
                </div>

                {/* Payment Health */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl space-y-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium">Collection Rate</span>
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-sky-400 font-mono">
                    {paymentSuccessRate}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Monthly on-time ratio
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Recent Real-Time Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activities (2 cols) */}
                <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-teal-400" />
                      <h3 className="font-bold text-sm text-white font-display">Live Platform Activity</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("activity")}
                      className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      View All <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activities.slice(0, 6).map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 hover:border-slate-700 transition-colors"
                      >
                        <div
                          className={`p-2 rounded-xl flex-shrink-0 ${
                            act.type.includes("signin") || act.type.includes("signup")
                              ? "bg-indigo-500/10 text-indigo-400"
                              : act.type === "payment_received"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : act.type.includes("agreement")
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {act.type.includes("signin") || act.type.includes("signup") ? (
                            <Users className="h-4 w-4" />
                          ) : act.type === "payment_received" ? (
                            <CreditCard className="h-4 w-4" />
                          ) : act.type.includes("agreement") ? (
                            <FileText className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-100 truncate">{act.title}</h4>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                              {formatTimeAgo(act.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{act.details}</p>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-center text-xs text-slate-500 py-6">No platform activity recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Quick Master Controls (1 col) */}
                <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="font-bold text-sm text-white font-display">Super Admin Tools</h3>
                      <p className="text-[11px] text-slate-400">Shortcuts to manage the application</p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={exportPaymentsCSV}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer border border-slate-700/60"
                      >
                        <span className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-teal-400" /> Export All Payments (CSV)
                        </span>
                        <ChevronRight className="h-3 w-3 text-slate-500" />
                      </button>

                      <button
                        onClick={() => setActiveTab("system")}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer border border-slate-700/60"
                      >
                        <span className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-indigo-400" /> Broadcast System Alert
                        </span>
                        <ChevronRight className="h-3 w-3 text-slate-500" />
                      </button>

                      <button
                        onClick={() => setActiveTab("landlords")}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer border border-slate-700/60"
                      >
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-teal-400" /> Review All {landlords.length} Landlords
                        </span>
                        <ChevronRight className="h-3 w-3 text-slate-500" />
                      </button>

                      <button
                        onClick={() => setActiveTab("tenants")}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer border border-slate-700/60"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-emerald-400" /> Review All {tenants.length} Tenants
                        </span>
                        <ChevronRight className="h-3 w-3 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Security Governance
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Impersonation allows support staff to open landlord/tenant dashboards in read/write mode to assist with troubleshooting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: LIVE ACTIVITY FEED ──────────────────────────────── */}
          {activeTab === "activity" && (
            <div className="space-y-6 animate-reveal">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                    </span>
                    Live Platform Activity Feed
                  </h2>
                  <p className="text-xs text-slate-400">Real-time log of logins, registrations, rent payments, and contract signatures</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      clearActivities();
                      setActivities([]);
                      showToast("Activity history cleared.", "info");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer border border-slate-700/50 flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear History
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-slate-800">
                <button
                  onClick={() => setActivityFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activityFilter === "all"
                      ? "bg-teal-500 text-slate-950 shadow-md"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  All Events ({activities.length})
                </button>
                <button
                  onClick={() => setActivityFilter("auth")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activityFilter === "auth"
                      ? "bg-teal-500 text-slate-950 shadow-md"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  Sign-ins & Sign-ups
                </button>
                <button
                  onClick={() => setActivityFilter("payment")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activityFilter === "payment"
                      ? "bg-teal-500 text-slate-950 shadow-md"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  Rent Payments
                </button>
                <button
                  onClick={() => setActivityFilter("agreement")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activityFilter === "agreement"
                      ? "bg-teal-500 text-slate-950 shadow-md"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  Agreements
                </button>
                <button
                  onClick={() => setActivityFilter("deletion")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activityFilter === "deletion"
                      ? "bg-teal-500 text-slate-950 shadow-md"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  Account Deletions
                </button>
              </div>

              {/* Feed List */}
              <div className="space-y-3">
                {filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`p-2.5 rounded-xl flex-shrink-0 ${
                          act.type.includes("signin") || act.type.includes("signup")
                            ? "bg-indigo-500/10 text-indigo-400"
                            : act.type === "payment_received"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : act.type.includes("agreement")
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {act.type.includes("signin") || act.type.includes("signup") ? (
                          <Users className="h-5 w-5" />
                        ) : act.type === "payment_received" ? (
                          <CreditCard className="h-5 w-5" />
                        ) : act.type.includes("agreement") ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-display">{act.title}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                            {act.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{act.details}</p>
                        {act.actorEmail && (
                          <p className="text-[11px] text-slate-500">
                            User: <span className="text-slate-400 font-mono">{act.actorEmail}</span>
                            {act.unit && <> • Unit: <span className="text-teal-400 font-medium">{act.unit}</span></>}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 space-y-1">
                      <span className="text-xs font-semibold text-slate-400 block">
                        {formatTimeAgo(act.timestamp)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}

                {filteredActivities.length === 0 && (
                  <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800/40">
                    <Activity className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No events found in this category.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 3: ALL LANDLORDS DIRECTORY ─────────────────────────── */}
          {activeTab === "landlords" && (
            <div className="space-y-6 animate-reveal">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-display text-white">Landlord Accounts Directory</h2>
                  <p className="text-xs text-slate-400">All registered property owners with unit portfolios and payment credentials</p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, phone..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3.5 px-4">Landlord</th>
                        <th className="py-3.5 px-4">Contact Info</th>
                        <th className="py-3.5 px-4">Payout Account</th>
                        <th className="py-3.5 px-4">Assigned Tenants</th>
                        <th className="py-3.5 px-4">Registered Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLandlords.map((l) => {
                        const managedTenants = tenants.filter((t) => t.landlordId === l.id);
                        return (
                          <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-semibold text-white">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-xs">
                                  {l.name ? l.name.charAt(0).toUpperCase() : "L"}
                                </div>
                                <div>
                                  <div className="font-bold">{l.name || "Owner Admin"}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">ID: {l.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-slate-300 font-mono">{l.email}</div>
                              <div className="text-[11px] text-slate-500">{l.phone || "No phone"}</div>
                            </td>
                            <td className="py-3 px-4">
                              {l.upiId ? (
                                <div className="text-teal-400 font-mono font-medium">{l.upiId}</div>
                              ) : l.accountNumber ? (
                                <div className="text-slate-300">
                                  {l.bankName} (••••{l.accountNumber.slice(-4)})
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Not configured</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-teal-300 border border-slate-700/60">
                                {managedTenants.length} Units
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {l.createdAt
                                ? new Date(l.createdAt).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => impersonateLandlord(l)}
                                className="px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500 text-teal-300 hover:text-slate-950 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                title="Open Landlord Dashboard as this user"
                              >
                                <ExternalLink className="h-3 w-3" /> Login As Landlord
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredLandlords.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500">
                            No landlords match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: ALL TENANTS DIRECTORY ───────────────────────────── */}
          {activeTab === "tenants" && (
            <div className="space-y-6 animate-reveal">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-display text-white">Tenant Accounts Directory</h2>
                  <p className="text-xs text-slate-400">All registered tenants across units, rents, and payment status</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Filter */}
                  <select
                    value={paymentStatusFilter}
                    onChange={(e: any) => setPaymentStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="Paid">Status: Paid</option>
                    <option value="Unpaid">Status: Unpaid</option>
                  </select>

                  <div className="relative w-full sm:w-64">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tenant or unit..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3.5 px-4">Tenant Name</th>
                        <th className="py-3.5 px-4">Unit & Property</th>
                        <th className="py-3.5 px-4">Monthly Rent</th>
                        <th className="py-3.5 px-4">Payment Status</th>
                        <th className="py-3.5 px-4">Contact</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredTenants.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-white">
                            <div className="font-bold">{t.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {t.id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-teal-400">Unit {t.unit}</span>
                            <div className="text-[11px] text-slate-400">{t.propertyName || "RentHub Residence"}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-200">
                            ₹{(Number(t.rentAmount) || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                t.paymentStatus === "Paid"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                  : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                              }`}
                            >
                              {t.paymentStatus || "Unpaid"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-300 font-mono">{t.email}</div>
                            <div className="text-[11px] text-slate-500">{t.phone || "No phone"}</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => impersonateTenant(t)}
                              className="px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500 text-teal-300 hover:text-slate-950 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              title="Open Tenant Portal as this tenant"
                            >
                              <ExternalLink className="h-3 w-3" /> Login As Tenant
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredTenants.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500">
                            No tenants match your search filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 5: MASTER PAYMENTS LEDGER ──────────────────────────── */}
          {activeTab === "payments" && (
            <div className="space-y-6 animate-reveal">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-display text-white">Master Payments Ledger</h2>
                  <p className="text-xs text-slate-400">Complete audit trail of all rent collections, UPI IDs, and receipts</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={exportPaymentsCSV}
                    className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    <Download className="h-3.5 w-3.5" /> Export to CSV
                  </button>

                  <div className="relative w-full sm:w-64">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Txn ID, Tenant..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3.5 px-4">Transaction ID</th>
                        <th className="py-3.5 px-4">Tenant & Unit</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Method</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-teal-400 font-bold">
                            {p.transactionId || p.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{p.tenantName}</div>
                            <div className="text-[11px] text-slate-400">Unit: {p.unit}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                            ₹{(Number(p.amount) || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                              {p.method || "UPI"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" /> Success
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {p.date || (p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "Today")}
                          </td>
                        </tr>
                      ))}
                      {filteredPayments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500">
                            No payment transactions recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 6: GLOBAL AGREEMENTS LEDGER ────────────────────────── */}
          {activeTab === "agreements" && (
            <div className="space-y-6 animate-reveal">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Global Rental Agreements</h2>
                <p className="text-xs text-slate-400">Contract compliance and digital signature status across all properties</p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3.5 px-4">Agreement ID</th>
                        <th className="py-3.5 px-4">Tenant Name</th>
                        <th className="py-3.5 px-4">Unit & Property</th>
                        <th className="py-3.5 px-4">Monthly Rent</th>
                        <th className="py-3.5 px-4">Contract Period</th>
                        <th className="py-3.5 px-4">Execution Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {agreements.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-teal-400 font-bold">{a.id}</td>
                          <td className="py-3 px-4 font-bold text-white">{a.tenantName}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-200">Unit {a.unit}</div>
                            <div className="text-[11px] text-slate-400">{a.propertyName || "Residential Apartment"}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-200">
                            ₹{(Number(a.rentAmount) || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {a.startDate || "Active"} to {a.endDate || "1 Year"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                a.status === "Signed"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                  : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                              }`}
                            >
                              {a.status === "Signed" ? "Fully Signed" : "Pending Signature"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {agreements.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500">
                            No agreements registered in database yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 7: BROADCAST & SYSTEM ──────────────────────────────── */}
          {activeTab === "system" && (
            <div className="space-y-6 animate-reveal max-w-4xl">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Platform Broadcast & System Control</h2>
                <p className="text-xs text-slate-400">Push emergency notifications, inspect database tables, and governance</p>
              </div>

              {/* Broadcast Form */}
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white font-display">Broadcast Global Announcement</h3>
                    <p className="text-xs text-slate-400">Publish a live banner that displays on Landlord and Tenant portals</p>
                  </div>
                </div>

                <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Announcement Message</label>
                    <textarea
                      required
                      rows={3}
                      value={announcementMsg}
                      onChange={(e) => setAnnouncementMsg(e.target.value)}
                      placeholder="e.g. Scheduled banking gateway maintenance tonight between 12 AM and 2 AM. All rent receipts remain active."
                      className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Target Audience</label>
                      <select
                        value={announcementTarget}
                        onChange={(e: any) => setAnnouncementTarget(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option value="all">Everyone (Landlords & Tenants)</option>
                        <option value="landlords">Landlords Only</option>
                        <option value="tenants">Tenants Only</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Notice Severity</label>
                      <select
                        value={announcementType}
                        onChange={(e: any) => setAnnouncementType(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option value="info">Info (Teal Accent)</option>
                        <option value="warning">Warning (Amber Maintenance)</option>
                        <option value="success">Success / Feature Announcement</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="h-4 w-4" /> Broadcast Announcement Now
                    </button>
                    {activeAnnouncement && (
                      <button
                        type="button"
                        onClick={handleClearAnnouncement}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Dismiss Active Banner
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Database Status Card */}
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white font-display">Supabase Cloud Database Status</h3>
                    <p className="text-xs text-slate-400">Live row counts across all 7 production tables</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">rh_landlords</span>
                    <span className="text-lg font-bold text-white font-mono">{landlords.length}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">rh_tenants</span>
                    <span className="text-lg font-bold text-white font-mono">{tenants.length}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">rh_payments</span>
                    <span className="text-lg font-bold text-white font-mono">{payments.length}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">rh_agreements</span>
                    <span className="text-lg font-bold text-white font-mono">{agreements.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

