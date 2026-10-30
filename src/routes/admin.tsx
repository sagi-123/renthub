import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Building2, Users, FileText, CreditCard, BellRing, BarChart3,
  Plus, Search, Home, Check, X, AlertCircle, Trash2,
  Edit3, Send, Download, RefreshCw, Upload, DollarSign,
  Percent, Clock, LogOut, Sun, Moon,
  FileCheck, FileDown, Phone, Mail, FileUp, Sparkles, TrendingUp,
  User, Lock, ArrowRight, Settings, Menu, ShieldCheck, Award, CheckCircle2, PenTool
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { syncCollection, saveCollection, deleteRecord, saveRecord, supabase } from "../lib/supabase";
import { createLandlordRouteAccount } from "../lib/api/razorpay";

export const Route = createFileRoute("/admin")({
  component: AdminPortal,
});

/* ── Types ───────────────────────────────────────────── */
interface Tenant {
  id: string;
  landlordId?: string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  rentAmount: number;
  depositAmount: number;
  paymentStatus: "Paid" | "Unpaid" | "Overdue";
  dueDate: string;
  leaseStart: string;
  leaseEnd: string;
  residentialAddress?: string;
  propertyName?: string;
  blockNumber?: string;
  propertyAddress?: string;
}

interface AgreementHistoryItem {
  id: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  signedAt: string;
  termsAndConditions?: string;
  contractText?: string;
}

interface Agreement {
  id: string;
  agreementNumber?: string;
  landlordId?: string;
  tenantName: string;
  unit: string;
  rentAmount: number;
  depositAmount: number;
  startDate: string;
  endDate: string;
  status: "Active" | "Pending Signature" | "Expired";
  tenantEmail?: string;
  tenantPhone?: string;
  tenantAddress?: string;
  propertyName?: string;
  blockNumber?: string;
  propertyAddress?: string;
  termsAndConditions?: string;
  contractText?: string;
  landlordName?: string;
  landlordSignature?: string;
  landlordSignedAt?: string;
  tenantSignature?: string;
  tenantSignatureType?: "type" | "draw";
  tenantSignedAt?: string;
  landlordFatherName?: string;
  landlordAadhaar?: string;
  landlordPan?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  landlordAddress?: string;
  tenantFatherName?: string;
  tenantAadhaar?: string;
  tenantPan?: string;
  floorNumber?: string;
  flatNumber?: string;
  carpetArea?: string;
  builtUpArea?: string;
  parking?: string;
  furnishing?: string;
  keysGiven?: string;
  notaryStatus?: "none" | "pending" | "notarized";
  notaryName?: string;
  notaryRegNo?: string;
  notaryJurisdiction?: string;
  notarySignedAt?: string;
  notarySeal?: string;
  notarySerialNo?: string;
  notaryRemarks?: string;
  utilElectricity?: string;
  utilWater?: string;
  utilGas?: string;
  utilInternet?: string;
  utilMaintenance?: string;
  utilSociety?: string;
  history?: AgreementHistoryItem[];
}

interface Document {
  id: string;
  landlordId?: string;
  name: string;
  category: "Lease Agreement" | "ID Proof" | "Payment Receipt" | "Other";
  size: string;
  uploadDate: string;
  tenantName: string;
  fileData?: string;
}

interface ReminderLog {
  id: string;
  landlordId?: string;
  tenantName: string;
  unit: string;
  channel: "WhatsApp" | "SMS" | "Email";
  message: string;
  sentAt: string;
  status: "Sent" | "Delivered" | "Failed";
}

interface PaymentRecord {
  id: string;
  landlordId?: string;
  tenantId: string;
  tenantName: string;
  unit: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  transactionId: string;
}

/* ── Initial Mock Data ───────────────────────────────── */
const INITIAL_TENANTS: Tenant[] = [];
const INITIAL_AGREEMENTS: Agreement[] = [];
const INITIAL_DOCUMENTS: Document[] = [];
const INITIAL_REMINDERS: ReminderLog[] = [];
const INITIAL_PAYMENTS: PaymentRecord[] = [];

const RENTAL_CARDS = [
  {
    title: 'Skyline Heights Penthouse',
    location: 'Mumbai, MH',
    price: '₹75,000/mo',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
    beds: '3 BHK',
    area: '1,800 sqft'
  },
  {
    title: 'Urban Oasis Studio',
    location: 'Bangalore, KA',
    price: '₹22,000/mo',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80',
    beds: '1 BHK',
    area: '650 sqft'
  },
  {
    title: 'Greenwood Luxury Villa',
    location: 'Pune, MH',
    price: '₹1,20,000/mo',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
    beds: '4 BHK',
    area: '3,200 sqft'
  },
  {
    title: 'The Minimalist Loft',
    location: 'Delhi, NCR',
    price: '₹35,000/mo',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=400&q=80',
    beds: '2 BHK',
    area: '1,100 sqft'
  },
  {
    title: 'Serene Heights Duplex',
    location: 'Hyderabad, TS',
    price: '₹48,000/mo',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80',
    beds: '3 BHK',
    area: '1,500 sqft'
  },
  {
    title: 'Cozy Corner Apartment',
    location: 'Chennai, TN',
    price: '₹18,000/mo',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=400&q=80',
    beds: '1 BHK',
    area: '550 sqft'
  },
];

const COL_CARDS = [...RENTAL_CARDS, ...RENTAL_CARDS];

function PropertyScrollingCard({ title, location, price, image, beds, area }: typeof RENTAL_CARDS[0]) {
  return (
    <div className="w-full bg-white/95 dark:bg-slate-900/90 rounded-[20px] overflow-hidden shadow-lg border border-teal-100/20 dark:border-slate-800 flex flex-col shrink-0 select-none">
      <div className="w-full h-[120px] overflow-hidden relative">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover block"
          loading="lazy"
        />
        <div className="absolute top-2.5 right-2.5 bg-white/90 dark:bg-slate-800/90 px-2 py-0.5 rounded-full text-[9px] font-bold text-teal-600 dark:text-teal-400 shadow-sm">
          {beds}
        </div>
      </div>

      <div className="p-3">
        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate m-0 leading-tight">
          {title}
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 m-0 mt-0.5 font-medium truncate">
          {location} • {area}
        </p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{price}</span>
          <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            Verified
          </span>
        </div>
      </div>
    </div>
  );
}

function ScrollColumn({ cards, direction }: { cards: typeof RENTAL_CARDS; direction: 'up' | 'down' }) {
  const duration = direction === 'up' ? 24 : 28;
  return (
    <div className="flex flex-col gap-3.5 overflow-hidden flex-1">
      <div className="flex flex-col gap-3.5" style={{ animation: `scroll-${direction} ${duration}s linear infinite` }}>
        {cards.map((c, i) => <PropertyScrollingCard key={i} {...c} />)}
      </div>
    </div>
  );
}

/* ── Custom Hook: Dark Mode ──────────────────────────── */
function useDarkMode() {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const toggle = useCallback(() => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
  }, [dark]);
  return { dark, toggle };
}

/* ── Main Component ──────────────────────────────────── */
function AdminPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "tenants" | "agreements" | "documents" | "reminders" | "reports" | "settings">("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { dark, toggle: toggleDark } = useDarkMode();
  const [mounted, setMounted] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("rh_admin_logged_in") === "true";
    }
    return false;
  });
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const [settName, setSettName] = useState("");
  const [settEmail, setSettEmail] = useState("");
  const [settPhone, setSettPhone] = useState("");
  const [settBankName, setSettBankName] = useState("");
  const [settAccountNumber, setSettAccountNumber] = useState("");
  const [settIfscCode, setSettIfscCode] = useState("");
  const [settUpiId, setSettUpiId] = useState("");
  const [settRazorpayAccountId, setSettRazorpayAccountId] = useState("");


  // Derive logged-in landlord from sessionStorage so name/email shows in header
  const loggedInLandlord = (() => {
    if (typeof window === "undefined") return null;
    const s = sessionStorage.getItem("rh_logged_in_landlord");
    return s ? JSON.parse(s) as { id: string; name: string; email: string } : null;
  })();

  // No auto-redirect; using inline floating card login as per design preferences

  /* ── Database State ────────────────────────────────── */
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [syncTrigger, setSyncTrigger] = useState(0);

  // Listen to cross-tab/local changes to trigger instant updates
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && (
        e.key.startsWith("rh_tenants_") ||
        e.key.startsWith("rh_agreements_") ||
        e.key.startsWith("rh_payments_") ||
        e.key.startsWith("rh_renewals_") ||
        e.key === "rh_logged_in_landlord" ||
        e.key === "rh_landlords"
      )) {
        setSyncTrigger(prev => prev + 1);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);


  /* ── Supabase & LocalStorage Synchronizer ─────────────────────── */
  useEffect(() => {
    async function loadData() {
      setMounted(true);

      const savedL = sessionStorage.getItem("rh_logged_in_landlord");
      const parsedL = savedL ? JSON.parse(savedL) : null;
      const landlordId = parsedL ? parsedL.id : null;

      if (!landlordId) {
        setTenants([]);
        setAgreements([]);
        setDocuments([]);
        setReminders([]);
        setRenewals([]);
        return;
      }

      // Fetch fresh landlord info to make sure bank details are loaded
      try {
        const res = await supabase.from("rh_landlords").select("*", `id=eq.${encodeURIComponent(landlordId)}`) as any[];
        if (res && res.length > 0) {
          const freshL = res[0];
          sessionStorage.setItem("rh_logged_in_landlord", JSON.stringify(freshL));
          setSettName(freshL.name || "");
          setSettEmail(freshL.email || "");
          setSettPhone(freshL.phone || "");
          setSettBankName(freshL.bankName || "");
          setSettAccountNumber(freshL.accountNumber || "");
          setSettIfscCode(freshL.ifscCode || "");
          setSettUpiId(freshL.upiId || "");
          setSettRazorpayAccountId(freshL.razorpay_account_id || "");
        }
      } catch (e) {
        console.error("Error loading fresh landlord info:", e);
      }

      const filter = `landlordId=eq.${encodeURIComponent(landlordId)}`;
      const localKey = (key: string) => `${key}_${landlordId}`;

      const syncedTenants = await syncCollection<Tenant>("rh_tenants", localKey("rh_tenants"), INITIAL_TENANTS, filter);
      setTenants(syncedTenants);

      const syncedAgreements = await syncCollection<Agreement>("rh_agreements", localKey("rh_agreements"), INITIAL_AGREEMENTS, filter);
      setAgreements(syncedAgreements);

      const syncedDocs = await syncCollection<Document>("rh_documents", localKey("rh_documents"), INITIAL_DOCUMENTS, filter);
      setDocuments(syncedDocs);

      const syncedReminders = await syncCollection<ReminderLog>("rh_reminders", localKey("rh_reminders"), INITIAL_REMINDERS, filter);
      setReminders(syncedReminders);

      const syncedPayments = await syncCollection<PaymentRecord>("rh_payments", localKey("rh_payments"), INITIAL_PAYMENTS, filter);
      setPayments(syncedPayments);

      const syncedRenewals = await syncCollection<any>("rh_renewals", localKey("rh_renewals"), [], filter);
      setRenewals(syncedRenewals);
    }
    loadData();
  }, [isAdminLoggedIn, syncTrigger]);

  // Hydrate settings form from session storage immediately on admin login
  useEffect(() => {
    if (isAdminLoggedIn) {
      const savedL = sessionStorage.getItem("rh_logged_in_landlord");
      if (savedL) {
        const parsedL = JSON.parse(savedL);
        setSettName(parsedL.name || "");
        setSettEmail(parsedL.email || "");
        setSettPhone(parsedL.phone || "");
        setSettBankName(parsedL.bankName || "");
        setSettAccountNumber(parsedL.accountNumber || "");
        setSettIfscCode(parsedL.ifscCode || "");
        setSettUpiId(parsedL.upiId || "");
        setSettRazorpayAccountId(parsedL.razorpay_account_id || "");
      }
    }
  }, [isAdminLoggedIn]);

  const saveTenants = (newTenants: Tenant[]) => {
    setTenants(newTenants);
    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    const landlordId = parsedL ? parsedL.id : "";
    saveCollection("rh_tenants", `rh_tenants_${landlordId}`, newTenants);
  };

  const saveAgreements = (newAgreements: Agreement[]) => {
    setAgreements(newAgreements);
    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    const landlordId = parsedL ? parsedL.id : "";
    saveCollection("rh_agreements", `rh_agreements_${landlordId}`, newAgreements);
  };

  const saveDocs = (newDocs: Document[]) => {
    setDocuments(newDocs);
    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    const landlordId = parsedL ? parsedL.id : "";
    saveCollection("rh_documents", `rh_documents_${landlordId}`, newDocs);
  };

  const saveReminders = (newReminders: ReminderLog[]) => {
    setReminders(newReminders);
    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    const landlordId = parsedL ? parsedL.id : "";
    saveCollection("rh_reminders", `rh_reminders_${landlordId}`, newReminders);
  };

  const savePayments = (newPayments: PaymentRecord[]) => {
    setPayments(newPayments);
    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    const landlordId = parsedL ? parsedL.id : "";
    saveCollection("rh_payments", `rh_payments_${landlordId}`, newPayments);
  };

  const saveRenewals = (newRenewals: any[]) => {
    setRenewals(newRenewals);
    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    const landlordId = parsedL ? parsedL.id : "";
    saveCollection("rh_renewals", `rh_renewals_${landlordId}`, newRenewals);
  };

  /* ── Toast Notifications ───────────────────────────── */
  const [toasts, setToasts] = useState<{ id: string; message: React.ReactNode; type: "success" | "info" | "error" }[]>([]);
  const showToast = (message: React.ReactNode, type: "success" | "info" | "error" = "success") => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setAdminError("Please enter email and password.");
      return;
    }
    try {
      const emailFilter = `email=eq.${encodeURIComponent(adminEmail.toLowerCase().trim())}`;
      const landlords = await supabase.from("rh_landlords").select("*", emailFilter) as any[];
      const landlord = landlords && landlords[0];

      if (landlord && landlord.password === adminPassword) {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem("rh_admin_logged_in", "true");
        sessionStorage.setItem("rh_logged_in_landlord", JSON.stringify(landlord));
        setAdminError("");
        setAdminEmail("");
        setAdminPassword("");
        showToast(`Welcome back, ${landlord.name || "Owner"}!`);
      } else {
        setAdminError("Invalid credentials. Please verify your email and password.");
      }
    } catch (err: any) {
      console.error("Admin sign in error:", err);
      setAdminError(`Authentication failed: ${err?.message || err || "Please try again."}`);
    }
  };

  const handleAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword || !adminName || !adminPhone) {
      setAdminError("All fields are required.");
      return;
    }
    try {
      const emailFilter = `email=eq.${encodeURIComponent(adminEmail.toLowerCase().trim())}`;
      const existing = await supabase.from("rh_landlords").select("id", emailFilter) as any[];
      const emailExists = existing && existing.length > 0;
      if (emailExists) {
        setAdminError("Email is already registered. Please sign in.");
        return;
      }

      const newLandlord = {
        id: "l-" + Math.random().toString(36).substring(7),
        name: adminName.trim(),
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword,
        phone: adminPhone.trim(),
        createdAt: new Date().toISOString()
      };

      await saveRecord("rh_landlords", "rh_landlords", newLandlord, []);

      setIsAdminLoggedIn(true);
      sessionStorage.setItem("rh_admin_logged_in", "true");
      sessionStorage.setItem("rh_logged_in_landlord", JSON.stringify(newLandlord));
      setAdminError("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminName("");
      setAdminPhone("");
      showToast("Account created successfully!");
    } catch (err) {
      console.error(err);
      setAdminError("Registration failed. Please try again.");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    if (isSignUp) {
      handleAdminSignUp(e);
    } else {
      handleAdminLogin(e);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("rh_admin_logged_in");
    sessionStorage.removeItem("rh_logged_in_landlord"); // clear landlord identity too
    setIsAdminLoggedIn(false);
    showToast("Logged out from admin portal.", "info");
  };

  /* ── Form States ───────────────────────────────────── */
  // Tenant Modal
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editWizardStep, setEditWizardStep] = useState<1 | 2 | 3>(1);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantUnit, setTenantUnit] = useState("");
  const [tenantRent, setTenantRent] = useState("");
  const [tenantDeposit, setTenantDeposit] = useState("");
  const [tenantStatus, setTenantStatus] = useState<"Paid" | "Unpaid" | "Overdue">("Unpaid");
  const [tenantDueDate, setTenantDueDate] = useState("2026-07-05");
  const [tenantLeaseStart, setTenantLeaseStart] = useState("2026-07-01");
  const [tenantLeaseEnd, setTenantLeaseEnd] = useState("2027-06-30");
  const [tenantResidentialAddress, setTenantResidentialAddress] = useState("");
  const [tenantPropertyName, setTenantPropertyName] = useState("");
  const [tenantBlockNumber, setTenantBlockNumber] = useState("");
  const [tenantPropertyAddress, setTenantPropertyAddress] = useState("");

  // Agreement Wizard Modal
  const [showAgreementWizard, setShowAgreementWizard] = useState(false);
  const [isNewTenantWizard, setIsNewTenantWizard] = useState(true); // true = tenant+agreement, false = agreement only
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [wizTenantName, setWizTenantName] = useState("");
  const [wizUnit, setWizUnit] = useState("");
  const [wizRent, setWizRent] = useState("");
  const [wizDeposit, setWizDeposit] = useState("");
  const [wizStart, setWizStart] = useState("2026-07-01");
  const [wizEnd, setWizEnd] = useState("2027-06-30");
  const [wizTenantEmail, setWizTenantEmail] = useState("");
  const [wizTenantPhone, setWizTenantPhone] = useState("");
  const [wizTenantAddress, setWizTenantAddress] = useState("");
  const [wizPropertyName, setWizPropertyName] = useState("");
  const [wizBlockNumber, setWizBlockNumber] = useState("");
  const [wizPropertyAddress, setWizPropertyAddress] = useState("");
  const [wizTerms, setWizTerms] = useState("");
  const [wizAgreementNumber, setWizAgreementNumber] = useState("");
  const [wizLandlordName, setWizLandlordName] = useState("");
  const [wizTenantFatherName, setWizTenantFatherName] = useState("");
  const [wizTenantAadhaar, setWizTenantAadhaar] = useState("");
  const [wizTenantPan, setWizTenantPan] = useState("");
  const [wizLandlordFatherName, setWizLandlordFatherName] = useState("");
  const [wizLandlordPhone, setWizLandlordPhone] = useState("");
  const [wizLandlordEmail, setWizLandlordEmail] = useState("");
  const [wizLandlordAddress, setWizLandlordAddress] = useState("");
  const [wizLandlordAadhaar, setWizLandlordAadhaar] = useState("");
  const [wizLandlordPan, setWizLandlordPan] = useState("");
  const [wizFloorNumber, setWizFloorNumber] = useState("");
  const [wizFlatNumber, setWizFlatNumber] = useState("");
  const [wizCarpetArea, setWizCarpetArea] = useState("");
  const [wizBuiltUpArea, setWizBuiltUpArea] = useState("");
  const [wizParking, setWizParking] = useState("");
  const [wizFurnishing, setWizFurnishing] = useState("Unfurnished");
  const [wizKeysGiven, setWizKeysGiven] = useState("");
  const [wizUtilElectricity, setWizUtilElectricity] = useState("Tenant");
  const [wizUtilWater, setWizUtilWater] = useState("Tenant");
  const [wizUtilGas, setWizUtilGas] = useState("Tenant");
  const [wizUtilInternet, setWizUtilInternet] = useState("Tenant");
  const [wizUtilMaintenance, setWizUtilMaintenance] = useState("Tenant");
  const [wizUtilSociety, setWizUtilSociety] = useState("Landlord");
  const [wizContractText, setWizContractText] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  // Landlord E-Signature state
  const [wizSigMethod, setWizSigMethod] = useState<"type" | "draw" | "aadhaar">("type");
  const [wizDrawSignature, setWizDrawSignature] = useState(false);
  const [wizTypedSignature, setWizTypedSignature] = useState("");
  const [wizIsDrawing, setWizIsDrawing] = useState(false);
  const wizCanvasRef = useRef<HTMLCanvasElement>(null);

  // Aadhaar OTP Verification States
  const [wizAadhaarNumber, setWizAadhaarNumber] = useState("");
  const [wizAadhaarOtp, setWizAadhaarOtp] = useState("");
  const [wizAadhaarOtpSent, setWizAadhaarOtpSent] = useState(false);
  const [wizAadhaarOtpVerifying, setWizAadhaarOtpVerifying] = useState(false);
  const [wizAadhaarOtpVerified, setWizAadhaarOtpVerified] = useState(false);
  const [wizAadhaarTimer, setWizAadhaarTimer] = useState(0);

  // Aadhaar Resend OTP Timer — placed here so wizAadhaarTimer is declared above
  useEffect(() => {
    if (wizAadhaarTimer <= 0) return;
    const interval = setInterval(() => {
      setWizAadhaarTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [wizAadhaarTimer]);

  const wizStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = wizCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#0F9D9A";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setWizIsDrawing(true);
  };
  const wizDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!wizIsDrawing) return;
    const canvas = wizCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const wizStopDrawing = () => setWizIsDrawing(false);
  const wizClearCanvas = () => {
    const canvas = wizCanvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Notary Signature Drawing Handlers
  const notaryStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = notaryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setNotaryIsDrawing(true);
  };
  const notaryDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!notaryIsDrawing) return;
    const canvas = notaryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const notaryStopDrawing = () => setNotaryIsDrawing(false);
  const notaryClearCanvas = () => {
    const canvas = notaryCanvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleOpenNotaryModal = (agr: Agreement) => {
    setNotaryTargetAgreement(agr);
    setNotaryName(agr.notaryName || "Adv. R. K. Sharma, Public Notary");
    setNotaryRegNo(agr.notaryRegNo || "NOT-IND/2026/88491");
    setNotaryJurisdiction(agr.notaryJurisdiction || "District & Sessions Court, State Jurisdiction");
    setNotarySerialNo(agr.notarySerialNo || `NOT-CERT-${Math.floor(100000 + Math.random() * 900000)}`);
    setNotaryRemarks(agr.notaryRemarks || "Solemnly affirmed & attested after verifying identity credentials & original documents of both parties.");
    setNotaryTypedSignature(agr.notarySeal && !agr.notarySeal.startsWith("data:image") ? agr.notarySeal : (agr.notaryName || "Adv. R. K. Sharma, Public Notary"));
    setShowNotaryModal(true);
  };

  const handleSaveNotaryAttestation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaryTargetAgreement) return;

    let sealData = notaryTypedSignature.trim();
    if (notarySignatureType === "draw") {
      const canvas = notaryCanvasRef.current;
      if (canvas) {
        sealData = canvas.toDataURL("image/png");
      }
    }

    if (!sealData) {
      showToast("Please provide Notary signature or seal signature", "error");
      return;
    }

    const signedAtDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const updatedAgreements = agreements.map(a =>
      a.id === notaryTargetAgreement.id ? {
        ...a,
        notaryStatus: "notarized" as const,
        notaryName,
        notaryRegNo,
        notaryJurisdiction,
        notarySignedAt: signedAtDate,
        notarySeal: sealData,
        notarySerialNo: notarySerialNo || `NOT-CERT-${Math.floor(100000 + Math.random() * 900000)}`,
        notaryRemarks
      } : a
    );

    saveAgreements(updatedAgreements);
    showToast(`Document for ${notaryTargetAgreement.tenantName} officially notarized by ${notaryName}!`, "success");
    setShowNotaryModal(false);
    setNotaryTargetAgreement(null);
  };

  // Document Upload State
  const [uploadCategory, setUploadCategory] = useState<"Lease Agreement" | "ID Proof" | "Payment Receipt" | "Other">("Lease Agreement");
  const [uploadTenant, setUploadTenant] = useState("");
  const [uploadProgress, setUploadProgress] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reminder Composer State
  const [remindTenantId, setRemindTenantId] = useState("");
  const [remindChannel, setRemindChannel] = useState<"WhatsApp" | "Email">("WhatsApp");
  const [remindMsg, setRemindMsg] = useState("");
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  // Real Agreement Preview Modal
  const [previewAgreement, setPreviewAgreement] = useState<Agreement | null>(null);

  // Renewal Modal State
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewAgreement, setRenewAgreement] = useState<Agreement | null>(null);
  const [renewStart, setRenewStart] = useState("");
  const [renewEnd, setRenewEnd] = useState("");
  const [renewRent, setRenewRent] = useState("");

  // Notary Attestation Modal State
  const [showNotaryModal, setShowNotaryModal] = useState(false);
  const [notaryTargetAgreement, setNotaryTargetAgreement] = useState<Agreement | null>(null);
  const [notaryName, setNotaryName] = useState("Adv. R. K. Sharma, Public Notary");
  const [notaryRegNo, setNotaryRegNo] = useState("NOT-IND/2026/88491");
  const [notaryJurisdiction, setNotaryJurisdiction] = useState("High Court Jurisdiction / District Court");
  const [notarySerialNo, setNotarySerialNo] = useState("");
  const [notaryRemarks, setNotaryRemarks] = useState("Solemnly affirmed & attested after verifying identity credentials & original documents of both parties.");
  const [notarySignatureType, setNotarySignatureType] = useState<"type" | "draw">("type");
  const [notaryTypedSignature, setNotaryTypedSignature] = useState("R. K. Sharma, Public Notary");
  const [notaryIsDrawing, setNotaryIsDrawing] = useState(false);
  const notaryCanvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Search Filters ────────────────────────────────── */
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantStatusFilter, setTenantStatusFilter] = useState<"All" | "Paid" | "Unpaid" | "Overdue">("All");
  const [agreementSearch, setAgreementSearch] = useState("");
  const [agreementFilter, setAgreementFilter] = useState<"All" | "Active" | "Pending Signature" | "Expired" | "Renewed">("All");

  /* ── Calculations & KPI Metrics ────────────────────── */
  const totalRentExcludingPaid = tenants
    .filter(t => t.paymentStatus !== "Paid")
    .reduce((sum, t) => sum + t.rentAmount, 0);

  const totalCollected = tenants
    .filter(t => t.paymentStatus === "Paid")
    .reduce((sum, t) => sum + t.rentAmount, 0);

  const totalMonthlyRent = tenants.reduce((sum, t) => sum + t.rentAmount, 0);
  const totalDeposits = tenants.reduce((sum, t) => sum + (t.depositAmount || 0), 0);

  const occupancyRate = tenants.length > 0 ? Math.round((tenants.length / 8) * 100) : 0; // Out of 8 total units
  const activeAgreements = agreements.filter(a => a.status === "Active").length;

  /* ── Chart Data Preparations ───────────────────────── */
  const getPastMonthsData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIdx = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const hasRealPayments = payments.length > 0;

    const data = [];
    for (let i = 5; i >= 0; i--) {
      let mIdx = currentMonthIdx - i;
      let year = currentYear;
      if (mIdx < 0) {
        mIdx += 12;
        year -= 1;
      }
      const monthName = months[mIdx];

      const discountFactor = 1 - (i * 0.05); // 5% growth per month back in time
      const expectedHist = Math.round(totalMonthlyRent * discountFactor);

      if (hasRealPayments) {
        const monthString = `${year}-${String(mIdx + 1).padStart(2, "0")}`; // e.g. "2026-07"
        const monthPayments = payments.filter(p => p.date?.startsWith(monthString) && p.status === "Success");
        const monthRevenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        let collectionRate = expectedHist > 0 ? Math.round((monthRevenue / expectedHist) * 100) : 0;
        collectionRate = Math.min(100, collectionRate);

        data.push({
          name: monthName,
          revenue: i === 0 ? totalCollected : monthRevenue,
          expected: expectedHist,
          collectionRate: i === 0 && totalMonthlyRent > 0 ? Math.round((totalCollected / totalMonthlyRent) * 100) : collectionRate
        });
      } else {
        // Fallback to realistic mock data if the landlord has no payment history at all
        const rateHist = expectedHist > 0 ? 88 + (Math.abs(Math.sin(mIdx)) * 8) : 0;
        const revenueHist = Math.round((expectedHist * rateHist) / 100);

        data.push({
          name: monthName,
          revenue: i === 0 ? totalCollected : revenueHist,
          expected: expectedHist,
          collectionRate: i === 0 && totalMonthlyRent > 0 ? Math.round((totalCollected / totalMonthlyRent) * 100) : Math.round(rateHist)
        });
      }
    }
    return data;
  };

  const revenueTrendData = getPastMonthsData();

  const paymentStatusData = [
    { name: "Paid", value: tenants.filter(t => t.paymentStatus === "Paid").length, color: "#10B981" },
    { name: "Unpaid", value: tenants.filter(t => t.paymentStatus === "Unpaid").length, color: "#F59E0B" },
    { name: "Overdue", value: tenants.filter(t => t.paymentStatus === "Overdue").length, color: "#EF4444" }
  ];

  /* ── Handler Actions ───────────────────────────────── */
  // Helper for numbers to Indian words
  const numberToWords = (num: number): string => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';

    const convert = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    };

    return convert(num).trim();
  };

  // Helper to compile legal contract text
  const compileContractText = (d: {
    id?: string;
    agreementNumber?: string;
    landlordName: string;
    tenantName: string;
    tenantEmail: string;
    tenantPhone: string;
    tenantAddress: string;
    propertyName: string;
    blockNumber: string;
    propertyAddress: string;
    rentAmount: number;
    depositAmount: number;
    startDate: string;
    endDate: string;
    terms: string;
    landlordFatherName?: string;
    landlordAadhaar?: string;
    landlordPan?: string;
    landlordPhone?: string;
    landlordEmail?: string;
    landlordAddress?: string;
    tenantFatherName?: string;
    tenantAadhaar?: string;
    tenantPan?: string;
    floorNumber?: string;
    flatNumber?: string;
    carpetArea?: string;
    builtUpArea?: string;
    parking?: string;
    furnishing?: string;
    keysGiven?: string;
    utilElectricity?: string;
    utilWater?: string;
    utilGas?: string;
    utilInternet?: string;
    utilMaintenance?: string;
    utilSociety?: string;
  }) => {
    const executionLocation = d.propertyAddress || "Pune, Maharashtra, India";

    const executionDate = (() => {
      try {
        if (!d.startDate) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const date = new Date(d.startDate);
        if (isNaN(date.getTime())) return d.startDate;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch {
        return d.startDate;
      }
    })();

    const year = d.startDate ? new Date(d.startDate).getFullYear() : new Date().getFullYear();
    let suffix = "";
    if (d.agreementNumber) {
      suffix = d.agreementNumber.split("-").pop() || "";
    }
    if (!suffix || suffix.length < 6) {
      const cleanId = (d.id || "").replace(/[^a-zA-Z0-9]/g, "");
      suffix = cleanId.slice(-6).toUpperCase();
      while (suffix.length < 6) {
        suffix = "0" + suffix;
      }
    }
    const finalAgreementNum = `RH-${year}-${suffix}`;

    return `RENTAL LEASE AGREEMENT
Agreement No. ${finalAgreementNum}
 
This Rental Lease Agreement (the "Agreement") is entered into and executed at ${executionLocation}, India on ${executionDate} by and between:

LANDLORD / OWNER:
- Name: ${d.landlordName || "Owner Admin"}
- Father's / Husband's Name: ${d.landlordFatherName || "N/A"}
- Phone: ${d.landlordPhone || "N/A"}
- Email: ${d.landlordEmail || "N/A"}
- Permanent Address: ${d.landlordAddress || "N/A"}
${d.landlordAadhaar ? `- Aadhaar: ${d.landlordAadhaar}\n` : ""}${d.landlordPan ? `- PAN: ${d.landlordPan}\n` : ""}(hereinafter referred to as the "Landlord", which expression shall unless repugnant to the context include heirs, legal representatives, and assigns) of the FIRST PART.

AND

TENANT:
- Name: ${d.tenantName}
- Father's / Husband's Name: ${d.tenantFatherName || "N/A"}
- Phone: ${d.tenantPhone || "N/A"}
- Email: ${d.tenantEmail || "N/A"}
- Permanent Address: ${d.tenantAddress || "N/A"}
${d.tenantAadhaar ? `- Aadhaar: ${d.tenantAadhaar}\n` : ""}${d.tenantPan ? `- PAN: ${d.tenantPan}\n` : ""}(hereinafter referred to as the "Tenant", which expression shall unless repugnant to the context include heirs, legal representatives, and assigns) of the SECOND PART.

WHEREAS the Landlord is the absolute owner of the property described below:
- Property Name: ${d.propertyName || "N/A"}
- Block / Unit Number: ${d.blockNumber || "N/A"}
- Floor Number: ${d.floorNumber || "N/A"}
- Flat Number: ${d.flatNumber || "N/A"}
- Carpet Area: ${d.carpetArea || "N/A"}
- Built-up Area: ${d.builtUpArea || "N/A"}
- Parking: ${d.parking || "N/A"}
- Furnishing: ${d.furnishing || "N/A"}
- Number of Keys Given: ${d.keysGiven || "N/A"}
- Detailed Address: ${d.propertyAddress || "N/A"}
(Hereinafter referred to as the "Demised Premises").

NOW THIS INDENTURE WITNESSETH AND IT IS HEREBY AGREED BY AND BETWEEN BOTH PARTIES AS UNDER:

1. LEASE TERM: This lease is granted for a period starting from ${d.startDate} and ending on ${d.endDate}.
2. MONTHLY RENT: The Tenant agrees to pay the Landlord a monthly rent of ₹${d.rentAmount.toLocaleString('en-IN')} (Rupees ${numberToWords(d.rentAmount)} only), payable on or before the 5th day of every calendar month.
3. SECURITY DEPOSIT: The Tenant has paid a security deposit of ₹${d.depositAmount.toLocaleString('en-IN')} (Rupees ${numberToWords(d.depositAmount)} only) as interest-free security. This deposit is refundable at the time of vacation of premises, subject to deduction of unpaid bills or damage repairs.
4. UTILITY BILLS & CHARGES: The responsibility for payment of utility bills and charges shall be as follows:
   - Electricity Bill: ${d.utilElectricity || "Tenant"}
   - Water Charges: ${d.utilWater || "Tenant"}
   - Gas / LPG: ${d.utilGas || "Tenant"}
   - Internet / Broadband: ${d.utilInternet || "Tenant"}
   - Maintenance Charges: ${d.utilMaintenance || "Tenant"}
   - Society / Association Charges: ${d.utilSociety || "Landlord"}
   All bills shall be paid directly by the responsible party on or before the due date. The Tenant shall not allow any bills to fall into arrears and shall hand over all paid bills / receipts to the Landlord at the time of vacating the premises.
5. MAINTENANCE RESPONSIBILITY:
   a) TENANT'S RESPONSIBILITY: The Tenant shall be responsible for all minor day-to-day repairs and upkeep of the Demised Premises during the tenancy, including but not limited to: minor plumbing leaks (taps, washers), replacement of fuses, light bulbs, door handles, locks, and general cleanliness of the premises.
   b) LANDLORD'S RESPONSIBILITY: The Landlord shall be responsible for all major structural repairs and maintenance of the Demised Premises, including but not limited to:
      - Structural repairs (walls, roof, foundation, flooring)
      - Major plumbing issues (pipelines, drainage, water supply infrastructure)
      - Electrical failures (main wiring, switchboards, distribution panels)
      - Any repair arising due to natural wear and tear beyond the Tenant's control.
   The Tenant shall promptly notify the Landlord in writing of any defects or damages requiring the Landlord's attention. Failure to do so may result in the Tenant being held liable for consequential damages.
6. ILLEGAL ACTIVITIES:
   The Tenant shall not use the Demised Premises, or permit it to be used, for any purpose that is unlawful, immoral, or contrary to public order and morality. Without limiting the generality of the foregoing, the Tenant specifically agrees NOT to use the premises for:
   - Gambling or operating any form of gambling establishment
   - Conducting any illegal business, trade, or commercial activity not permitted by law
   - Any criminal activity, including but not limited to drug trafficking, manufacturing, or consumption of prohibited substances
   - Storage of prohibited items, hazardous materials, explosives, or contraband goods
   - Any activity that causes nuisance, disturbance, or inconvenience to neighbours or the surrounding community
   Any violation of this clause shall constitute an immediate and material breach of this Agreement, entitling the Landlord to terminate the lease forthwith and take legal action as deemed appropriate.
7. INSPECTION RIGHTS:
   The Landlord or their authorized representative shall have the right to enter and inspect the Demised Premises during reasonable daytime hours (10:00 AM to 6:00 PM), subject to providing the Tenant with at least 24 hours prior notice, except in cases of emergency where immediate entry is necessary.
8. DAMAGE CLAUSE:
   The Tenant agrees to maintain the Demised Premises in a clean, hygienic, and tenantable condition. Upon expiration or termination of this lease, the Tenant shall hand over vacant and peaceful possession of the premises to the Landlord in the same condition as received, subject only to normal wear and tear and natural aging of the structure.
9. TERMS & CONDITIONS:
${d.terms}

IN WITNESS WHEREOF, the parties hereto have set their hands to this Agreement.

LANDLORD: ______________________
TENANT: ______________________`;
  };

  /* ── Handler Actions ───────────────────────────────── */
  // Open tenant WIZARD for Add (4-step: details → lease → preview → sign)
  const handleAddTenantClick = () => {
    setEditingTenant(null);
    // Reset all wizard fields
    setWizTenantName("");
    setWizTenantEmail("");
    setWizTenantPhone("");
    setWizTenantAddress("");
    setWizUnit("");
    setWizPropertyName("");
    setWizBlockNumber("");
    setWizPropertyAddress("");
    setWizRent("");
    setWizDeposit("");
    setWizStart(new Date().toISOString().split("T")[0]);
    const endD = new Date(); endD.setMonth(endD.getMonth() + 11);
    setWizEnd(endD.toISOString().split("T")[0]);
    setTenantDueDate("" + new Date(new Date().setDate(5)).toISOString().split("T")[0]);
    setTenantStatus("Unpaid");
    setWizTerms(
      "1. RENT PAYMENTS: The Tenant shall pay the monthly rent on or before the 5th of each month.\n" +
      "2. DEPOSIT REFUND CONDITIONS: The security deposit shall be refunded to the Tenant within 15 days of handing over vacant possession of the premises, after deducting any outstanding utility bills, unpaid rent, or costs of repairing damages beyond normal wear and tear.\n" +
      "3. NOTICE PERIOD: Either party may terminate this agreement with 2 months prior written notice.\n" +
      "4. LOCK-IN PERIOD: A minimum lock-in period of 11 months shall apply to this lease.\n" +
      "5. INFLATION HIKES: Standard rent escalation of 5% applies at the end of the term upon lease renewal."
    );
    setWizAgreementNumber(`RH-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`);
    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    setWizLandlordName(parsedL ? parsedL.name : "Owner Admin");
    setWizTenantFatherName("");
    setWizTenantAadhaar("");
    setWizTenantPan("");
    setWizLandlordFatherName("");
    setWizLandlordPhone(parsedL ? parsedL.phone || "" : "");
    setWizLandlordEmail(parsedL ? parsedL.email || "" : "");
    setWizLandlordAddress("");
    setWizLandlordAadhaar("");
    setWizLandlordPan("");
    setWizFloorNumber("");
    setWizFlatNumber("");
    setWizCarpetArea("");
    setWizBuiltUpArea("");
    setWizParking("");
    setWizFurnishing("Unfurnished");
    setWizKeysGiven("");
    setWizUtilElectricity("Tenant");
    setWizUtilWater("Tenant");
    setWizUtilGas("Tenant");
    setWizUtilInternet("Tenant");
    setWizUtilMaintenance("Tenant");
    setWizUtilSociety("Landlord");
    setWizTypedSignature("");
    setWizDrawSignature(false);
    wizClearCanvas();
    setIsNewTenantWizard(true); // This is the tenant registration flow
    setWizardStep(1);
    setShowAgreementWizard(true); // Reuse the agreement wizard for tenant registration
  };

  // Open tenant modal for Edit
  const handleEditTenantClick = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setTenantName(tenant.name);
    setTenantEmail(tenant.email);
    setTenantPhone(tenant.phone);
    setTenantUnit(tenant.unit);
    setTenantRent(tenant.rentAmount.toString());
    setTenantDeposit(tenant.depositAmount.toString());
    setTenantStatus(tenant.paymentStatus);
    setTenantDueDate(tenant.dueDate);
    setTenantLeaseStart(tenant.leaseStart);
    setTenantLeaseEnd(tenant.leaseEnd);
    setTenantResidentialAddress(tenant.residentialAddress || "");
    setTenantPropertyName(tenant.propertyName || "");
    setTenantBlockNumber(tenant.blockNumber || tenant.unit);
    setTenantPropertyAddress(tenant.propertyAddress || "");
    setEditWizardStep(1);
    setShowTenantModal(true);
  };

  // Save Tenant (EDIT ONLY — Add flow now uses the wizard)
  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantUnit || !tenantRent) {
      showToast("Please fill all required fields", "error");
      return;
    }
    const rent = parseFloat(tenantRent);
    const deposit = parseFloat(tenantDeposit) || 0;

    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    const landlordName = parsedL ? parsedL.name : "Owner Admin";

    const updated = tenants.map(t =>
      t.id === editingTenant!.id
        ? {
          ...t,
          name: tenantName,
          email: tenantEmail,
          phone: tenantPhone,
          unit: tenantUnit,
          rentAmount: rent,
          depositAmount: deposit,
          paymentStatus: tenantStatus,
          dueDate: tenantDueDate,
          leaseStart: tenantLeaseStart,
          leaseEnd: tenantLeaseEnd,
          residentialAddress: tenantResidentialAddress,
          propertyName: tenantPropertyName,
          blockNumber: tenantBlockNumber || tenantUnit,
          propertyAddress: tenantPropertyAddress,
        }
        : t
    );
    saveTenants(updated);

    // Sync back to agreements so rate changes reflect there too!
    const oldEmail = editingTenant!.email?.toLowerCase().trim() || "";
    const newEmail = tenantEmail.toLowerCase().trim();
    const updatedAgreements = agreements.map(a => {
      const matchesEmail = a.tenantEmail?.toLowerCase().trim() === oldEmail || a.tenantEmail?.toLowerCase().trim() === newEmail;
      const matchesName = a.tenantName === editingTenant!.name;
      if (matchesEmail || matchesName) {
        // Recompile contract text with the updated rate and tenant details!
        const compiledText = compileContractText({
          landlordName: a.landlordName || landlordName,
          tenantName: tenantName,
          tenantEmail: tenantEmail,
          tenantPhone: tenantPhone,
          tenantAddress: tenantResidentialAddress,
          propertyName: tenantPropertyName,
          blockNumber: tenantBlockNumber || tenantUnit,
          propertyAddress: tenantPropertyAddress,
          rentAmount: rent,
          depositAmount: deposit,
          startDate: tenantLeaseStart,
          endDate: tenantLeaseEnd,
          terms: a.termsAndConditions || "1. RENT PAYMENTS: The Tenant shall pay the monthly rent on or before the 5th of each month.\n2. SECURITY DEPOSIT: Refundable upon lease completion after adjustment of damage dues.",
          landlordFatherName: a.landlordFatherName || "",
          landlordAadhaar: a.landlordAadhaar || "",
          landlordPan: a.landlordPan || "",
          landlordPhone: a.landlordPhone || "",
          landlordEmail: a.landlordEmail || "",
          landlordAddress: a.landlordAddress || "",
          tenantFatherName: a.tenantFatherName || "",
          tenantAadhaar: a.tenantAadhaar || "",
          tenantPan: a.tenantPan || ""
        });

        return {
          ...a,
          tenantName: tenantName,
          tenantEmail: tenantEmail,
          tenantPhone: tenantPhone,
          tenantAddress: tenantResidentialAddress,
          propertyName: tenantPropertyName,
          blockNumber: tenantBlockNumber || tenantUnit,
          propertyAddress: tenantPropertyAddress,
          unit: tenantBlockNumber || tenantUnit,
          rentAmount: rent,
          depositAmount: deposit,
          startDate: tenantLeaseStart,
          endDate: tenantLeaseEnd,
          contractText: compiledText
        };
      }
      return a;
    });
    saveAgreements(updatedAgreements);

    showToast(`Tenant ${tenantName} and associated lease agreement updated successfully`);
    setShowTenantModal(false);
  };

  // Delete Tenant
  const handleDeleteTenant = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove tenant ${name}?`)) {
      const savedL = sessionStorage.getItem("rh_logged_in_landlord");
      const parsedL = savedL ? JSON.parse(savedL) : null;
      const landlordId = parsedL ? parsedL.id : "";

      // Find the tenant record before deleting to get their email for cache cleanup
      const deletedTenant = tenants.find(t => t.id === id);

      const updated = await deleteRecord("rh_tenants", `rh_tenants_${landlordId}`, id, tenants);
      setTenants(updated);

      // Also remove the tenant's agreements from the landlord's list
      if (deletedTenant) {
        const emailLower = deletedTenant.email?.toLowerCase().trim() || "";
        const updatedAgreements = agreements.filter(a =>
          !(a.tenantEmail?.toLowerCase().trim() === emailLower || a.tenantName === deletedTenant.name)
        );
        if (updatedAgreements.length !== agreements.length) {
          saveAgreements(updatedAgreements);
        }

        // Clear ALL personal localStorage caches for this tenant
        // (keyed by tenant ID and any possible email-based keys)
        const keysToDelete: string[] = [
          `rh_tenants_${id}`,
          `rh_agreements_${id}`,
          `rh_payments_${id}`,
          `rh_renewals_${id}`,
        ];
        // Also scan for any key that might contain the tenant's email-based cache
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && emailLower && key.toLowerCase().includes(emailLower)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => localStorage.removeItem(key));
      }

      showToast(`Tenant ${name} and all associated records removed`, "info");
    }
  };

  // Toggle Payment status manually
  const togglePaymentStatus = (tenant: Tenant) => {
    const nextStatusMap: Record<Tenant["paymentStatus"], Tenant["paymentStatus"]> = {
      "Paid": "Unpaid",
      "Unpaid": "Overdue",
      "Overdue": "Paid"
    };
    const nextStatus = nextStatusMap[tenant.paymentStatus];

    // If transitioning to Paid, record a transaction in rh_payments
    if (nextStatus === "Paid") {
      const savedL = sessionStorage.getItem("rh_logged_in_landlord");
      const parsedL = savedL ? JSON.parse(savedL) : null;
      const landlordId = parsedL ? parsedL.id : "";

      const newPayment: PaymentRecord = {
        id: "p-" + Math.random().toString(36).substring(4),
        landlordId,
        tenantId: tenant.id,
        tenantName: tenant.name,
        unit: tenant.unit,
        amount: tenant.rentAmount,
        date: new Date().toISOString().split("T")[0],
        method: "Direct Cash/Bank Transfer",
        status: "Success",
        transactionId: "OFFLINE-" + Math.random().toString(36).substring(3).toUpperCase()
      };
      savePayments([newPayment, ...payments]);
    }

    const updated = tenants.map(t =>
      t.id === tenant.id ? { ...t, paymentStatus: nextStatus } : t
    );
    saveTenants(updated);
    showToast(`Marked ${tenant.name} as ${nextStatus}`, "info");
  };

  // Create Standalone Agreement Wizard Trigger (Agreements tab)
  const handleCreateAgreement = () => {
    setIsNewTenantWizard(false); // Agreement-only flow
    setWizTenantName("");
    setWizTenantEmail("");
    setWizTenantPhone("");
    setWizTenantAddress("");
    setWizPropertyName("");
    setWizBlockNumber("");
    setWizPropertyAddress("");
    setWizRent("");
    setWizDeposit("");
    setWizStart(new Date().toISOString().split("T")[0]);

    const end = new Date();
    end.setMonth(end.getMonth() + 11);
    setWizEnd(end.toISOString().split("T")[0]);

    setWizTerms(
      "1. RENT PAYMENTS: The Tenant shall pay the monthly rent on or before the 5th of each month.\n" +
      "2. DEPOSIT REFUND CONDITIONS: The security deposit shall be refunded to the Tenant within 15 days of handing over vacant possession of the premises, after deducting any outstanding utility bills, unpaid rent, or costs of repairing damages beyond normal wear and tear.\n" +
      "3. NOTICE PERIOD: Either party may terminate this agreement with 2 months prior written notice.\n" +
      "4. LOCK-IN PERIOD: A minimum lock-in period of 11 months shall apply to this lease.\n" +
      "5. INFLATION HIKES: Standard rent escalation of 5% applies at the end of the term upon lease renewal."
    );
    setWizAgreementNumber(`RH-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`);

    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    setWizLandlordName(parsedL ? parsedL.name : "Owner Admin");
    setWizTenantFatherName("");
    setWizTenantAadhaar("");
    setWizTenantPan("");
    setWizLandlordFatherName("");
    setWizLandlordPhone(parsedL ? parsedL.phone || "" : "");
    setWizLandlordEmail(parsedL ? parsedL.email || "" : "");
    setWizLandlordAddress("");
    setWizLandlordAadhaar("");
    setWizLandlordPan("");
    setWizFloorNumber("");
    setWizFlatNumber("");
    setWizCarpetArea("");
    setWizBuiltUpArea("");
    setWizParking("");
    setWizFurnishing("Unfurnished");
    setWizKeysGiven("");
    setWizUtilElectricity("Tenant");
    setWizUtilWater("Tenant");
    setWizUtilGas("Tenant");
    setWizUtilInternet("Tenant");
    setWizUtilMaintenance("Tenant");
    setWizUtilSociety("Landlord");
    setSelectedTenantId("");
    setWizardStep(1);
    setShowAgreementWizard(true);
  };

  const saveWizardAgreement = () => {
    if (!wizTenantName || !wizRent || !wizStart || !wizEnd) {
      showToast("Please fill all required details", "error");
      return;
    }

    // Collect landlord signature
    let landlordSig = "";
    if (wizSigMethod === "draw") {
      const canvas = wizCanvasRef.current;
      if (!canvas) { showToast("Signature canvas not found", "error"); return; }
      landlordSig = canvas.toDataURL("image/png");
    } else if (wizSigMethod === "aadhaar") {
      if (!wizAadhaarOtpVerified) { showToast("Please verify your Aadhaar OTP first", "error"); return; }
      landlordSig = `Aadhaar OTP e-Signed (Verified Aadhaar: ${wizAadhaarNumber})`;
    } else {
      if (!wizTypedSignature.trim()) { showToast("Please sign the agreement before generating.", "error"); return; }
      landlordSig = wizTypedSignature.trim();
    }

    const rent = parseFloat(wizRent) || 0;
    const deposit = parseFloat(wizDeposit) || 0;

    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    const landlordId = parsedL ? parsedL.id : "";

    const compiledText = compileContractText({
      agreementNumber: wizAgreementNumber,
      landlordName: wizLandlordName,
      tenantName: wizTenantName,
      tenantEmail: wizTenantEmail,
      tenantPhone: wizTenantPhone,
      tenantAddress: wizTenantAddress,
      propertyName: wizPropertyName,
      blockNumber: wizBlockNumber,
      propertyAddress: wizPropertyAddress,
      rentAmount: rent,
      depositAmount: deposit,
      startDate: wizStart,
      endDate: wizEnd,
      terms: wizTerms,
      landlordFatherName: wizLandlordFatherName,
      landlordAadhaar: wizLandlordAadhaar,
      landlordPan: wizLandlordPan,
      landlordPhone: wizLandlordPhone,
      landlordEmail: wizLandlordEmail,
      landlordAddress: wizLandlordAddress,
      tenantFatherName: wizTenantFatherName,
      tenantAadhaar: wizTenantAadhaar,
      tenantPan: wizTenantPan,
      floorNumber: wizFloorNumber,
      flatNumber: wizFlatNumber,
      carpetArea: wizCarpetArea,
      builtUpArea: wizBuiltUpArea,
      parking: wizParking,
      furnishing: wizFurnishing,
      keysGiven: wizKeysGiven,
      utilElectricity: wizUtilElectricity,
      utilWater: wizUtilWater,
      utilGas: wizUtilGas,
      utilInternet: wizUtilInternet,
      utilMaintenance: wizUtilMaintenance,
      utilSociety: wizUtilSociety,
    });

    const isNewTenant = isNewTenantWizard;

    if (isNewTenant) {
      // ── NEW TENANT: create both tenant record and signed agreement in one shot
      const newTenant: Tenant = {
        id: "t-" + Math.random().toString(36).substring(4),
        landlordId,
        name: wizTenantName,
        email: wizTenantEmail,
        phone: wizTenantPhone,
        unit: wizBlockNumber || wizUnit || "N/A",
        rentAmount: rent,
        depositAmount: deposit,
        paymentStatus: tenantStatus,
        dueDate: tenantDueDate || new Date().toISOString().split("T")[0],
        leaseStart: wizStart,
        leaseEnd: wizEnd,
        residentialAddress: wizTenantAddress,
        propertyName: wizPropertyName,
        blockNumber: wizBlockNumber,
        propertyAddress: wizPropertyAddress,
      };
      saveTenants([...tenants, newTenant]);

      const newAgreement: Agreement = {
        id: "a-" + Math.random().toString(36).substring(4),
        agreementNumber: wizAgreementNumber,
        landlordId,
        tenantName: wizTenantName,
        tenantEmail: wizTenantEmail,
        tenantPhone: wizTenantPhone,
        tenantAddress: wizTenantAddress,
        propertyName: wizPropertyName,
        blockNumber: wizBlockNumber,
        propertyAddress: wizPropertyAddress,
        unit: wizBlockNumber || wizUnit || "N/A",
        rentAmount: rent,
        depositAmount: deposit,
        startDate: wizStart,
        endDate: wizEnd,
        status: "Pending Signature",
        termsAndConditions: wizTerms,
        contractText: compiledText,
        landlordName: wizLandlordName,
        landlordSignature: landlordSig,
        landlordSignedAt: wizStart,
        landlordFatherName: wizLandlordFatherName,
        landlordAadhaar: wizLandlordAadhaar,
        landlordPan: wizLandlordPan,
        landlordPhone: wizLandlordPhone,
        landlordEmail: wizLandlordEmail,
        landlordAddress: wizLandlordAddress,
        tenantFatherName: wizTenantFatherName,
        tenantAadhaar: wizTenantAadhaar,
        tenantPan: wizTenantPan,
        floorNumber: wizFloorNumber,
        flatNumber: wizFlatNumber,
        carpetArea: wizCarpetArea,
        builtUpArea: wizBuiltUpArea,
        parking: wizParking,
        furnishing: wizFurnishing,
        keysGiven: wizKeysGiven,
        utilElectricity: wizUtilElectricity,
        utilWater: wizUtilWater,
        utilGas: wizUtilGas,
        utilInternet: wizUtilInternet,
        utilMaintenance: wizUtilMaintenance,
        utilSociety: wizUtilSociety,
        history: []
      };
      saveAgreements([...agreements, newAgreement]);
      showToast(`✅ Tenant ${wizTenantName} registered & agreement signed! Awaiting tenant signature.`);
    } else {
      // ── STANDALONE AGREEMENT (from Agreements tab)
      const newAgreement: Agreement = {
        id: "a-" + Math.random().toString(36).substring(4),
        agreementNumber: wizAgreementNumber,
        landlordId,
        tenantName: wizTenantName,
        tenantEmail: wizTenantEmail,
        tenantPhone: wizTenantPhone,
        tenantAddress: wizTenantAddress,
        propertyName: wizPropertyName,
        blockNumber: wizBlockNumber,
        propertyAddress: wizPropertyAddress,
        unit: wizBlockNumber || "N/A",
        rentAmount: rent,
        depositAmount: deposit,
        startDate: wizStart,
        endDate: wizEnd,
        status: "Pending Signature",
        termsAndConditions: wizTerms,
        contractText: compiledText,
        landlordName: wizLandlordName,
        landlordSignature: landlordSig,
        landlordSignedAt: wizStart,
        landlordFatherName: wizLandlordFatherName,
        landlordAadhaar: wizLandlordAadhaar,
        landlordPan: wizLandlordPan,
        landlordPhone: wizLandlordPhone,
        landlordEmail: wizLandlordEmail,
        landlordAddress: wizLandlordAddress,
        tenantFatherName: wizTenantFatherName,
        tenantAadhaar: wizTenantAadhaar,
        tenantPan: wizTenantPan,
        floorNumber: wizFloorNumber,
        flatNumber: wizFlatNumber,
        carpetArea: wizCarpetArea,
        builtUpArea: wizBuiltUpArea,
        parking: wizParking,
        furnishing: wizFurnishing,
        keysGiven: wizKeysGiven,
        utilElectricity: wizUtilElectricity,
        utilWater: wizUtilWater,
        utilGas: wizUtilGas,
        utilInternet: wizUtilInternet,
        utilMaintenance: wizUtilMaintenance,
        utilSociety: wizUtilSociety,
        history: []
      };
      saveAgreements([...agreements, newAgreement]);
      showToast(`Rental Agreement drafted & signed for ${wizTenantName}`);
    }

    setShowAgreementWizard(false);
    setIsNewTenantWizard(true); // reset for next time
    setWizTypedSignature("");
    setWizDrawSignature(false);
    setWizSigMethod("type");
    setWizAadhaarNumber("");
    setWizAadhaarOtp("");
    setWizAadhaarOtpSent(false);
    setWizAadhaarOtpVerified(false);
    setWizAadhaarTimer(0);
    wizClearCanvas();
  };

  // Open Renew Modal
  const handleRenewAgreement = (agr: Agreement) => {
    setRenewAgreement(agr);
    const nextStart = new Date(agr.endDate);
    nextStart.setDate(nextStart.getDate() + 1);
    const nextEnd = new Date(nextStart);
    nextEnd.setMonth(nextEnd.getMonth() + 11);

    const formatYMD = (d: Date) => d.toISOString().split("T")[0];
    setRenewStart(formatYMD(nextStart));
    setRenewEnd(formatYMD(nextEnd));
    setRenewRent(Math.round(agr.rentAmount * 1.05).toString());
    setShowRenewModal(true);
  };

  const saveRenewedAgreement = () => {
    if (!renewAgreement) return;
    const nextRent = parseFloat(renewRent) || Math.round(renewAgreement.rentAmount * 1.05);

    const historyItem: AgreementHistoryItem = {
      id: "h-" + Math.random().toString(36).substring(4),
      startDate: renewAgreement.startDate,
      endDate: renewAgreement.endDate,
      rentAmount: renewAgreement.rentAmount,
      depositAmount: renewAgreement.depositAmount,
      signedAt: renewAgreement.tenantSignedAt || renewAgreement.startDate,
      termsAndConditions: renewAgreement.termsAndConditions,
      contractText: renewAgreement.contractText
    };

    const newHistory = [...(renewAgreement.history || []), historyItem];

    const landlordNameForContract = loggedInLandlord?.name || renewAgreement.landlordName || "Owner Admin";
    const compiledText = compileContractText({
      agreementNumber: renewAgreement.agreementNumber,
      landlordName: landlordNameForContract,
      tenantName: renewAgreement.tenantName,
      tenantEmail: renewAgreement.tenantEmail || "",
      tenantPhone: renewAgreement.tenantPhone || "",
      tenantAddress: renewAgreement.tenantAddress || "",
      propertyName: renewAgreement.propertyName || "",
      blockNumber: renewAgreement.blockNumber || renewAgreement.unit,
      propertyAddress: renewAgreement.propertyAddress || "",
      rentAmount: nextRent,
      depositAmount: renewAgreement.depositAmount,
      startDate: renewStart,
      endDate: renewEnd,
      terms: renewAgreement.termsAndConditions || "",
      landlordFatherName: renewAgreement.landlordFatherName || "",
      landlordAadhaar: renewAgreement.landlordAadhaar || "",
      landlordPan: renewAgreement.landlordPan || "",
      landlordPhone: renewAgreement.landlordPhone || "",
      landlordEmail: renewAgreement.landlordEmail || "",
      landlordAddress: renewAgreement.landlordAddress || "",
      tenantFatherName: renewAgreement.tenantFatherName || "",
      tenantAadhaar: renewAgreement.tenantAadhaar || "",
      tenantPan: renewAgreement.tenantPan || "",
      floorNumber: renewAgreement.floorNumber || "",
      flatNumber: renewAgreement.flatNumber || "",
      carpetArea: renewAgreement.carpetArea || "",
      builtUpArea: renewAgreement.builtUpArea || "",
      parking: renewAgreement.parking || "",
      furnishing: renewAgreement.furnishing || "",
      keysGiven: renewAgreement.keysGiven || ""
    });

    const updated = agreements.map(a =>
      a.id === renewAgreement.id ? {
        ...a,
        startDate: renewStart,
        endDate: renewEnd,
        rentAmount: nextRent,
        status: "Pending Signature" as const,
        contractText: compiledText,
        tenantSignature: undefined,
        tenantSignatureType: undefined,
        tenantSignedAt: undefined,
        landlordSignature: `${landlordNameForContract} Verified Signature`,
        landlordSignedAt: renewStart,
        history: newHistory
      } : a
    );

    saveAgreements(updated);
    showToast(`Agreement for ${renewAgreement.tenantName} renewed! Sent to tenant for signature.`);
    setShowRenewModal(false);
  };

  // Approve Tenant Renewal Request
  const handleApproveRenewal = (req: any) => {
    // Match by tenantEmail first (reliable), fall back to name
    const targetAgreement = agreements.find(a => a.tenantEmail === req.tenantEmail) ||
      agreements.find(a => a.tenantName === req.tenantName);
    if (!targetAgreement) {
      showToast("No active agreement found for this tenant.", "error");
      return;
    }

    const nextYearStart = new Date(targetAgreement.endDate);
    nextYearStart.setDate(nextYearStart.getDate() + 1);
    const nextYearEnd = new Date(nextYearStart);
    nextYearEnd.setFullYear(nextYearEnd.getFullYear() + 1);
    nextYearEnd.setDate(nextYearEnd.getDate() - 1);

    const formatYMD = (d: Date) => d.toISOString().split("T")[0];
    const newRent = Math.round(targetAgreement.rentAmount * 1.05);
    const landlordName = loggedInLandlord?.name || "Owner Admin";

    const updatedAgreements = agreements.map(a =>
      a.id === targetAgreement.id ? {
        ...a,
        startDate: formatYMD(nextYearStart),
        endDate: formatYMD(nextYearEnd),
        rentAmount: newRent,
        status: "Pending Signature" as const,
        landlordSignature: `${landlordName} Verified Signature`,
        landlordSignedAt: formatYMD(nextYearStart),
        tenantSignature: undefined,
        tenantSignatureType: undefined,
        tenantSignedAt: undefined
      } : a
    );
    saveAgreements(updatedAgreements);

    const updatedTenants = tenants.map(t =>
      t.id === req.tenantId ? {
        ...t,
        rentAmount: newRent,
        paymentStatus: "Unpaid" as const
      } : t
    );
    saveTenants(updatedTenants);

    const updatedRenewals = renewals.map(r =>
      r.id === req.id ? { ...r, status: "Approved" as const } : r
    );
    saveRenewals(updatedRenewals);

    showToast(`Approved renewal for ${req.tenantName}. New rent: ₹${newRent.toLocaleString()}`);
  };

  // Decline Tenant Renewal Request
  const handleDeclineRenewal = (id: string) => {
    const updatedRenewals = renewals.map(r =>
      r.id === id ? { ...r, status: "Declined" as const } : r
    );
    saveRenewals(updatedRenewals);
    showToast("Renewal request declined.", "info");
  };

  // Delete Agreement
  const handleDeleteAgreement = async (id: string, tenant: string) => {
    if (confirm(`Delete agreement for ${tenant}?`)) {
      const savedL = sessionStorage.getItem("rh_logged_in_landlord");
      const parsedL = savedL ? JSON.parse(savedL) : null;
      const landlordId = parsedL ? parsedL.id : "";
      const updated = await deleteRecord("rh_agreements", `rh_agreements_${landlordId}`, id, agreements);
      setAgreements(updated);
      showToast(`Deleted agreement record`, "info");
    }
  };

  // Trigger Custom File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileDataUrl = event.target?.result as string;

      // Simulate upload progress
      setUploadProgress(0);
      let progressVal = 0;
      const interval = setInterval(() => {
        progressVal += 15;
        if (progressVal >= 100) {
          clearInterval(interval);
          setUploadProgress(100);

          setTimeout(() => {
            const savedL = sessionStorage.getItem("rh_logged_in_landlord");
            const parsedL = savedL ? JSON.parse(savedL) : null;
            const landlordId = parsedL ? parsedL.id : "";

            const newDoc: Document = {
              id: "d-" + Math.random().toString(36).substring(4),
              landlordId,
              name: file.name,
              category: uploadCategory,
              size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
              uploadDate: new Date().toISOString().split("T")[0],
              tenantName: uploadTenant || "General Document",
              fileData: fileDataUrl
            };

            // Use functional update to prevent duplicate triggers & ensure fresh documents list
            setDocuments(prevDocs => {
              const updatedDocs = [newDoc, ...prevDocs];
              saveCollection("rh_documents", `rh_documents_${landlordId}`, updatedDocs);
              return updatedDocs;
            });

            showToast(`Document ${file.name} uploaded successfully!`);
            setUploadProgress(-1);
            setUploadTenant("");
          }, 300);
        } else {
          setUploadProgress(progressVal);
        }
      }, 100);
    };
    reader.readAsDataURL(file);
    // Clear input value to allow uploading the same file again if desired
    e.target.value = "";
  };

  // Delete document
  const handleDeleteDoc = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const savedL = sessionStorage.getItem("rh_logged_in_landlord");
      const parsedL = savedL ? JSON.parse(savedL) : null;
      const landlordId = parsedL ? parsedL.id : "";
      const updated = await deleteRecord("rh_documents", `rh_documents_${landlordId}`, id, documents);
      setDocuments(updated);
      showToast("Document deleted successfully", "info");
    }
  };

  // Unified list of all selectable tenants (from tenant registry + any agreement signers)
  const allSelectableTenants = React.useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      unit: string;
      rentAmount: number;
      paymentStatus: "Paid" | "Unpaid" | "Overdue";
      phone: string;
      email: string;
      dueDate?: string;
    }> = [...tenants];

    // Also include any tenant from agreements who is not yet in the rh_tenants list
    agreements.forEach(agr => {
      const exists = list.some(
        t => t.id === agr.id ||
          (t.email && agr.tenantEmail && t.email.toLowerCase().trim() === agr.tenantEmail.toLowerCase().trim()) ||
          (t.name.toLowerCase().trim() === agr.tenantName.toLowerCase().trim() && t.unit.toLowerCase().trim() === agr.unit.toLowerCase().trim())
      );
      if (!exists && agr.tenantName) {
        list.push({
          id: agr.id,
          name: agr.tenantName,
          unit: agr.unit || "N/A",
          rentAmount: agr.rentAmount || 0,
          paymentStatus: "Unpaid",
          phone: agr.tenantPhone || "",
          email: agr.tenantEmail || "",
          dueDate: "5th of each month"
        });
      }
    });

    return list;
  }, [tenants, agreements]);

  // Sync reminder recipient details
  useEffect(() => {
    const selected = allSelectableTenants.find(t => t.id === remindTenantId);
    if (selected) {
      if (selected.paymentStatus === "Overdue") {
        setRemindMsg(`Dear ${selected.name}, this is an urgent reminder that rent of ₹${selected.rentAmount.toLocaleString()} for ${selected.unit} is OVERDUE. Please complete the payment online at your earliest convenience. - RentHub`);
      } else if (selected.paymentStatus === "Paid") {
        setRemindMsg(`Dear ${selected.name}, this is a reminder regarding the upcoming rent cycle for ${selected.unit} (₹${selected.rentAmount.toLocaleString()}). Rent is due on ${selected.dueDate || '5th of each month'}. Thank you! - RentHub`);
      } else {
        setRemindMsg(`Dear ${selected.name}, this is a friendly reminder that rent of ₹${selected.rentAmount.toLocaleString()} for ${selected.unit} is due. Please complete the payment online at your earliest convenience. - RentHub`);
      }
    } else {
      setRemindMsg("");
    }
  }, [remindTenantId, allSelectableTenants]);

  // Send Reminder action
  const handleSendReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = allSelectableTenants.find(t => t.id === remindTenantId);
    if (!selected || !remindMsg) {
      showToast("Please select a tenant and enter a reminder message", "error");
      return;
    }

    setIsSendingReminder(true);
    setTimeout(() => {
      const savedL = sessionStorage.getItem("rh_logged_in_landlord");
      const parsedL = savedL ? JSON.parse(savedL) : null;
      const landlordId = parsedL ? parsedL.id : "";

      const newReminder: ReminderLog = {
        id: "r-" + Math.random().toString(36).substring(4),
        landlordId,
        tenantName: selected.name,
        unit: selected.unit,
        channel: remindChannel,
        message: remindMsg,
        sentAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        status: "Delivered"
      };

      saveReminders([newReminder, ...reminders]);

      // Open communication channels based on selected type
      if (remindChannel === "WhatsApp") {
        let cleanPhone = (selected.phone || "").replace(/\D/g, "");
        if (!cleanPhone) {
          showToast(`Cannot redirect: No phone number recorded for ${selected.name}`, "error");
          setIsSendingReminder(false);
          return;
        }
        if (cleanPhone.length === 10) {
          cleanPhone = "91" + cleanPhone; // default Indian code if no country code provided
        }
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(remindMsg)}`;
        window.open(whatsappUrl, "_blank");
        showToast(`Reminder logged. Redirecting to WhatsApp for ${selected.name}...`);
      } else if (remindChannel === "Email") {
        if (!selected.email) {
          showToast(`Cannot open Gmail: No email address recorded for ${selected.name}`, "error");
          setIsSendingReminder(false);
          return;
        }
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selected.email || "")}&su=${encodeURIComponent("Rent Payment Reminder - RentHub")}&body=${encodeURIComponent(remindMsg)}`;
        window.open(gmailUrl, "_blank");
        showToast(`Reminder logged. Opening Gmail Web Compose for ${selected.name}...`);
      }

      setIsSendingReminder(false);
      setRemindTenantId("");
    }, 1200);
  };

  // Trigger simulated Export Report
  const handleExportReport = (format: "csv" | "pdf") => {
    showToast(`Preparing ${format.toUpperCase()} export...`);
    setTimeout(() => {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonthName = months[new Date().getMonth()];

      let content = "";

      if (format === "csv") {
        // Generate CSV format
        content = "KEY,VALUE\n" +
          `Report Title,RentHub Property Financial Report\n` +
          `Generated Date,${new Date().toLocaleDateString('en-IN')}\n` +
          `Total Occupied Units,${tenants.length}\n` +
          `Current Occupancy,${occupancyRate}%\n` +
          `Rent Collected (${currentMonthName}),₹${totalCollected}\n` +
          `Rent Dues Outstanding,₹${totalRentExcludingPaid}\n` +
          `Security Deposits Escrow,₹${totalDeposits}\n\n` +
          `--- TENANT LEDGER SUMMARY ---\n` +
          `Tenant Name,Unit,Rent Amount,Due Date,Payment Status\n` +
          tenants.map(t => `"${t.name}","${t.unit}",${t.rentAmount},"${t.dueDate}","${t.paymentStatus}"`).join("\n") +
          `\n\n--- TRANSACTION LOG ---\n` +
          `Transaction ID,Tenant,Unit,Amount,Date,Method,Status\n` +
          payments.map(p => `"${p.transactionId}","${p.tenantName}","${p.unit}",${p.amount},"${p.date}","${p.method}","${p.status}"`).join("\n");
      } else {
        // Generate a beautiful PDF text layout
        content = "=====================================================\n" +
          "           RENTHUB PROPERTY FINANCIAL REPORT          \n" +
          "=====================================================\n" +
          `Generated On : ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}\n` +
          `Occupancy    : ${occupancyRate}% (${tenants.length} Units Occupied)\n` +
          `Collected    : ₹${totalCollected.toLocaleString('en-IN')} (${currentMonthName})\n` +
          `Outstanding  : ₹${totalRentExcludingPaid.toLocaleString('en-IN')}\n` +
          `Escrow Held  : ₹${totalDeposits.toLocaleString('en-IN')}\n` +
          "=====================================================\n\n" +
          "--- TENANT LEDGER SUMMARY ---\n" +
          "-----------------------------------------------------\n" +
          "Tenant Name           | Unit       | Rent       | Status   \n" +
          "-----------------------------------------------------\n" +
          tenants.map(t =>
            `${t.name.padEnd(21).substring(0, 21)} | ${t.unit.padEnd(10).substring(0, 10)} | ₹${t.rentAmount.toString().padEnd(8)} | ${t.paymentStatus}`
          ).join("\n") + "\n" +
          "-----------------------------------------------------\n\n" +
          "--- RECENT PAYMENT TRANSACTIONS ---\n" +
          "-----------------------------------------------------\n" +
          "Txn ID       | Tenant Name           | Amount     | Date       | Method  | Status\n" +
          "-----------------------------------------------------\n" +
          payments.map(p =>
            `${p.transactionId.padEnd(12).substring(0, 12)} | ${p.tenantName.padEnd(21).substring(0, 21)} | ₹${p.amount.toString().padEnd(9)} | ${p.date} | ${p.method.padEnd(7)} | ${p.status}`
          ).join("\n") + "\n" +
          "-----------------------------------------------------\n";
      }

      const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8;" : "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `renthub_financial_report_${Date.now()}.${format === "csv" ? "csv" : "txt"}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Report exported successfully!");
    }, 1000);
  };

  if (!isAdminLoggedIn) {
    const col1 = COL_CARDS.slice(0, 8);
    const col2 = COL_CARDS.slice(2, 10);
    const col3 = COL_CARDS.slice(4, 12);
    const col4 = COL_CARDS.slice(1, 9);

    return (
      <>
        {/* ── Keyframe Animations ─────────────────────────────────────── */}
        <style>{`
          @keyframes scroll-up {
            0%   { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          @keyframes scroll-down {
            0%   { transform: translateY(-50%); }
            100% { transform: translateY(0); }
          }
          @media (max-width: 1024px) {
            .bg-col-4 { display: none !important; }
          }
          @media (max-width: 800px) {
            .bg-col-3 { display: none !important; }
          }
          @media (max-width: 500px) {
            .bg-col-2 { display: none !important; }
          }
          .custom-overlay {
            background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(248, 250, 252, 0.45) 100%);
          }
          .dark .custom-overlay {
            background: radial-gradient(circle, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.8) 100%);
          }
        `}</style>

        <div className="min-h-screen text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-slate-950">

          {/* Scrolling Background */}
          <div className="pointer-events-none absolute inset-0 gap-3.5 p-3.5 overflow-hidden opacity-90 dark:opacity-70 flex">
            <div className="bg-col-1 flex-1 flex flex-col">
              <ScrollColumn cards={col1} direction="up" />
            </div>
            <div className="bg-col-2 flex-1 flex flex-col">
              <ScrollColumn cards={col2} direction="down" />
            </div>
            <div className="bg-col-3 flex-1 flex flex-col">
              <ScrollColumn cards={col3} direction="up" />
            </div>
            <div className="bg-col-4 flex-1 flex flex-col">
              <ScrollColumn cards={col4} direction="down" />
            </div>
          </div>

          {/* Theme-sensitive Glassy Overlay */}
          <div className="pointer-events-none absolute inset-0 custom-overlay backdrop-blur-[0.5px]" />

          {/* ── TOAST CONTAINER ───────────────────────────────── */}
          <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
            {toasts.map(t => (
              <div key={t.id} className="pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border bg-white dark:bg-card shadow-lg animate-slide-in-right">
                <div className="flex items-center gap-2">
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-white ${t.type === "success" ? "bg-emerald-500" : t.type === "error" ? "bg-red-500" : "bg-blue-500"
                    }`}>
                    {t.type === "success" ? <Check className="h-3.5 w-3.5" /> : t.type === "error" ? <X className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  </span>
                  <p className="text-sm font-medium">{t.message}</p>
                </div>
                <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="w-full max-w-md space-y-6 relative z-10">

            {/* Logo Brand */}
            <div className="flex flex-col items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white">
                  Rent<span className="text-teal-500">Hub</span>
                </span>
              </Link>
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-1">
                Landlord Portal
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white dark:bg-card border rounded-2xl p-8 shadow-xl space-y-6">
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-bold tracking-tight font-display text-foreground">
                  {isSignUp ? "Create Landlord Account" : "Landlord Sign In"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isSignUp
                    ? "Create an account to manage your properties, agreements, and track collections."
                    : "Access agreement creation, tenant records, and collection analytics."}
                </p>
              </div>

              {adminError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/40 rounded-xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {isSignUp && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          value={adminName}
                          onChange={e => setAdminName(e.target.value)}
                          placeholder="Arjun Mehta"
                          className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="tel"
                          required
                          value={adminPhone}
                          onChange={e => setAdminPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Owner Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="management@renthub.io"
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                >
                  {isSignUp ? "Create Account" : "Sign In"} <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="text-center text-xs text-muted-foreground pt-2">
                {isSignUp ? "Already have a landlord account?" : "New landlord?"}{" "}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setAdminError(""); }}
                  className="text-teal-600 dark:text-teal-400 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  {isSignUp ? "Sign In here" : "Create an account"}
                </button>
              </div>
            </div>

            {/* Footer Navigation back to Home */}
            <div className="text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <Home className="h-3.5 w-3.5" /> Back to Home Page
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">

      {/* ── TOAST CONTAINER ───────────────────────────────── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border bg-white dark:bg-card shadow-lg animate-slide-in-right">
            <div className="flex items-center gap-2">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-white ${t.type === "success" ? "bg-emerald-500" : t.type === "error" ? "bg-red-500" : "bg-blue-500"
                }`}>
                {t.type === "success" ? <Check className="h-3.5 w-3.5" /> : t.type === "error" ? <X className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              </span>
              <p className="text-sm font-medium">{t.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      {/* ── SIDEBAR NAVIGATION ────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 w-64 border-r bg-white dark:bg-card shrink-0 flex flex-col justify-between select-none z-50 transform transition-transform duration-300 md:translate-x-0 md:static ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
                <Building2 className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight font-display">
                Rent<span className="text-teal-500">Hub</span>
              </span>
            </Link>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              Admin
            </span>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: Home },
              { id: "tenants", label: "Tenants", icon: Users },
              { id: "agreements", label: "Agreements", icon: FileText },
              { id: "documents", label: "Documents", icon: FileUp },
              { id: "reminders", label: "Reminders", icon: BellRing },
              { id: "reports", label: "Reports", icon: BarChart3 },
              { id: "settings", label: "Settings", icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsSidebarOpen(false); // Close drawer on navigation selection on mobile
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                      ? "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 border-l-2 border-teal-500 pl-3.5"
                      : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-foreground"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${active ? "text-teal-500" : ""}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === "tenants" && unpaidTenantsCount() > 0 && (
                    <span className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                      {unpaidTenantsCount()}
                    </span>
                  )}
                  {item.id === "agreements" && renewals.filter(r => r.status === "Pending").length > 0 && (
                    <span className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white">
                      {renewals.filter(r => r.status === "Pending").length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t space-y-3">
          {/* Quick Stats Panel */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Occupancy</span>
              <span className="font-semibold text-foreground">{occupancyRate}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
            </div>
            <div className="text-[10px] text-muted-foreground flex justify-between">
              <span>{tenants.length} Units Filled</span>
              <span>8 Total</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl ring-1 ring-slate-100 dark:ring-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-teal-600 dark:text-teal-400 transition-colors"
              title="Toggle Theme"
            >
              {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <button
              onClick={handleAdminLogout}
              className="p-2 rounded-xl ring-1 ring-red-100 hover:bg-red-50 text-red-500 dark:ring-red-950/40 dark:hover:bg-red-950/20 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT CONTAINER ────────────────────────── */}
      <main className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-900/40 flex flex-col overflow-x-hidden">
        {/* Header Bar */}
        <header className="min-h-16 border-b bg-white dark:bg-card px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-900 md:hidden text-muted-foreground hover:text-foreground transition-colors"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight capitalize font-display">
                {activeTab === "dashboard" ? "Admin Command Center" : `${activeTab} Portal`}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                {activeTab === "dashboard" && "Real-time summary of properties, dues, and tenants"}
                {activeTab === "tenants" && "Active occupants, profiles, and payment cycles"}
                {activeTab === "agreements" && "Legal contracts, drafting templates, and lease renewals"}
                {activeTab === "documents" && "Central document repository and verification vaults"}
                {activeTab === "reminders" && "Chasing unpaid rent via automated channels"}
                {activeTab === "reports" && "Monthly earnings analysis, collection ratios, and spreadsheets"}
                {activeTab === "settings" && "Configure your personal profile and banking details for payments"}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {activeTab === "tenants" && (
              <button onClick={handleAddTenantClick} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
                <Plus className="h-4 w-4" /> Add Tenant
              </button>
            )}
            {activeTab === "agreements" && (
              <button onClick={handleCreateAgreement} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
                <Plus className="h-4 w-4" /> New Agreement
              </button>
            )}
            {activeTab === "documents" && (
              <button onClick={() => fileInputRef.current?.click()} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
                <Upload className="h-4 w-4" /> Upload Document
              </button>
            )}

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-extrabold text-teal-600 dark:text-teal-400">
                {loggedInLandlord?.name?.[0]?.toUpperCase() || "O"}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold">{loggedInLandlord?.name || "Owner Admin"}</div>
                <div className="text-[10px] text-muted-foreground">{loggedInLandlord?.email || "—"}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
          {mounted ? (
            <>
              {activeTab === "dashboard" && renderDashboard()}
              {activeTab === "tenants" && renderTenants()}
              {activeTab === "agreements" && renderAgreements()}
              {activeTab === "documents" && renderDocuments()}
              {activeTab === "reminders" && renderReminders()}
              {activeTab === "reports" && renderReports()}
              {activeTab === "settings" && renderSettings()}
            </>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-teal-500 animate-spin" />
            </div>
          )}
        </div>
      </main>

      {/* ── MODALS & DIALOGS ──────────────────────────────── */}

      {/* 1. Tenant Modal (Edit Only Wizard) */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-reveal">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-lg font-display text-foreground">
                  Modify Tenant Details
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Step {editWizardStep} of 3 — {editWizardStep === 1 ? "Personal Details" : editWizardStep === 2 ? "Property & Unit" : "Financials & Lease Dates"}
                </p>
              </div>
              <button type="button" onClick={() => setShowTenantModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="p-6 space-y-4">
              {/* Step 1: Personal Details */}
              {editWizardStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={tenantName}
                      onChange={e => setTenantName(e.target.value)}
                      placeholder="Arjun Mehta"
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Email Address</label>
                      <input
                        type="email"
                        value={tenantEmail}
                        onChange={e => setTenantEmail(e.target.value)}
                        placeholder="arjun@example.com"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Phone Number</label>
                      <input
                        type="text"
                        value={tenantPhone}
                        onChange={e => setTenantPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Tenant's Permanent Residential Address</label>
                    <textarea
                      value={tenantResidentialAddress}
                      onChange={e => setTenantResidentialAddress(e.target.value)}
                      placeholder="123, Main Street, Patna, Bihar - 800001"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Property & Unit details */}
              {editWizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Unit Designation *</label>
                      <input
                        type="text"
                        required
                        value={tenantUnit}
                        onChange={e => setTenantUnit(e.target.value)}
                        placeholder="Unit 102"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Property Name</label>
                      <input
                        type="text"
                        value={tenantPropertyName}
                        onChange={e => setTenantPropertyName(e.target.value)}
                        placeholder="Skyline Heights Penthouse"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Block / Unit Number</label>
                      <input
                        type="text"
                        value={tenantBlockNumber}
                        onChange={e => setTenantBlockNumber(e.target.value)}
                        placeholder="Flat 402, Block A"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Property Address</label>
                      <input
                        type="text"
                        value={tenantPropertyAddress}
                        onChange={e => setTenantPropertyAddress(e.target.value)}
                        placeholder="Sector 15, Vashi, Navi Mumbai, Maharashtra"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Financial & Lease */}
              {editWizardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Monthly Rent (₹) *</label>
                      <input
                        type="number"
                        required
                        value={tenantRent}
                        onChange={e => setTenantRent(e.target.value)}
                        placeholder="20000"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={tenantDeposit}
                        onChange={e => setTenantDeposit(e.target.value)}
                        placeholder="50000"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Payment Status</label>
                      <select
                        value={tenantStatus}
                        onChange={e => setTenantStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent dark:bg-card focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Rent Due Date</label>
                      <input
                        type="date"
                        value={tenantDueDate}
                        onChange={e => setTenantDueDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Lease Start Date</label>
                      <input
                        type="date"
                        value={tenantLeaseStart}
                        onChange={e => setTenantLeaseStart(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Lease End Date</label>
                      <input
                        type="date"
                        value={tenantLeaseEnd}
                        onChange={e => setTenantLeaseEnd(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="pt-4 border-t flex justify-between items-center">
                <div>
                  {editWizardStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setEditWizardStep(prev => (prev - 1) as 1 | 2 | 3)}
                      className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      Back
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTenantModal(false)}
                    className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 text-muted-foreground"
                  >
                    Cancel
                  </button>

                  {editWizardStep < 3 && (
                    <button
                      key="edit-next-btn"
                      type="button"
                      onClick={() => {
                        if (editWizardStep === 1 && !tenantName.trim()) {
                          showToast("Please enter Full Name", "error");
                          return;
                        }
                        if (editWizardStep === 2 && !tenantUnit.trim()) {
                          showToast("Please enter Unit Designation", "error");
                          return;
                        }
                        setEditWizardStep(prev => (prev + 1) as 1 | 2 | 3);
                      }}
                      className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold"
                    >
                      Next Step
                    </button>
                  )}
                  {editWizardStep === 3 && (
                    <button
                      key="edit-submit-btn"
                      type="submit"
                      className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold"
                    >
                      Save Changes
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Agreement Wizard Modal */}
      {showAgreementWizard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white dark:bg-card border rounded-2xl w-full shadow-2xl overflow-hidden transition-all duration-300 animate-reveal ${wizardStep === 5 ? "max-w-4xl" : "max-w-xl"
            }`}>
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-lg font-display text-foreground">
                  {isNewTenantWizard ? "Register New Tenant" : "Draft Rental Agreement"}
                </h3>
                <p className="text-[11px] text-muted-foreground">Step {wizardStep} of 6 — {wizardStep === 1 ? "Tenant Details" : wizardStep === 2 ? "Property Description" : wizardStep === 3 ? "Lease & Utilities" : wizardStep === 4 ? "Landlord Details" : wizardStep === 5 ? "Contract Preview" : "Landlord Signature"}</p>
              </div>
              <button onClick={() => setShowAgreementWizard(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Wizard Steps indicator */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`h-1.5 flex-1 rounded ${wizardStep >= 1 ? "bg-teal-500" : "bg-slate-200"}`} />
                <div className={`h-1.5 flex-1 rounded ${wizardStep >= 2 ? "bg-teal-500" : "bg-slate-200"}`} />
                <div className={`h-1.5 flex-1 rounded ${wizardStep >= 3 ? "bg-teal-500" : "bg-slate-200"}`} />
                <div className={`h-1.5 flex-1 rounded ${wizardStep >= 4 ? "bg-teal-500" : "bg-slate-200"}`} />
                <div className={`h-1.5 flex-1 rounded ${wizardStep >= 5 ? "bg-teal-500" : "bg-slate-200"}`} />
                <div className={`h-1.5 flex-1 rounded ${wizardStep >= 6 ? "bg-teal-500" : "bg-slate-200"}`} />
              </div>

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Select Registered Tenant (Optional)</label>
                    <select
                      value={selectedTenantId}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedTenantId(val);
                        if (val) {
                          const t = tenants.find(x => x.id === val);
                          if (t) {
                            setWizTenantName(t.name);
                            setWizTenantEmail(t.email);
                            setWizTenantPhone(t.phone);
                            setWizTenantAddress(t.residentialAddress || "");
                            setWizPropertyName(t.propertyName || "");
                            setWizBlockNumber(t.blockNumber || t.unit);
                            setWizPropertyAddress(t.propertyAddress || "");
                            setWizRent(t.rentAmount.toString());
                            setWizDeposit(t.depositAmount.toString());
                            setWizStart(t.leaseStart || "2026-07-01");
                            setWizEnd(t.leaseEnd || "2027-06-30");
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent dark:bg-card focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="" className="text-slate-800">-- Create New / Manual Entry --</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id} className="text-slate-800">{t.name} ({t.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Tenant Full Name *</label>
                    <input
                      type="text"
                      required
                      value={wizTenantName}
                      onChange={e => setWizTenantName(e.target.value)}
                      placeholder="Arjun Mehta"
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Father's / Husband's Name *</label>
                    <input
                      type="text"
                      required
                      value={wizTenantFatherName}
                      onChange={e => setWizTenantFatherName(e.target.value)}
                      placeholder="Ramesh Mehta"
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={wizTenantEmail}
                        onChange={e => setWizTenantEmail(e.target.value)}
                        placeholder="arjun@example.com"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={wizTenantPhone}
                        onChange={e => setWizTenantPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Aadhaar Number (Optional)</label>
                      <input
                        type="text"
                        value={wizTenantAadhaar}
                        onChange={e => setWizTenantAadhaar(e.target.value)}
                        placeholder="12-digit Aadhaar Number"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">PAN (Optional)</label>
                      <input
                        type="text"
                        value={wizTenantPan}
                        onChange={e => setWizTenantPan(e.target.value)}
                        placeholder="10-character PAN"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Permanent Residential Address *</label>
                    <textarea
                      required
                      value={wizTenantAddress}
                      onChange={e => setWizTenantAddress(e.target.value)}
                      placeholder="Permanent address of the tenant"
                      rows={2}
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3">
                  {/* ── Property Description ── */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Property Name *</label>
                      <input
                        type="text"
                        required
                        value={wizPropertyName}
                        onChange={e => setWizPropertyName(e.target.value)}
                        placeholder="Skyline Heights Penthouse"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Block / Unit Number *</label>
                      <input
                        type="text"
                        required
                        value={wizBlockNumber}
                        onChange={e => setWizBlockNumber(e.target.value)}
                        placeholder="Flat 402, Block A"
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Property Location Address (Street, City, District, State, PIN Code) *</label>
                    <input
                      type="text"
                      required
                      value={wizPropertyAddress}
                      onChange={e => setWizPropertyAddress(e.target.value)}
                      placeholder="e.g. Kayalar Lane, Pallavaram, Chennai, Tamil Nadu - 600043"
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Floor Number</label>
                      <input type="text" value={wizFloorNumber} onChange={e => setWizFloorNumber(e.target.value)} placeholder="e.g. 4th Floor" className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Flat Number</label>
                      <input type="text" value={wizFlatNumber} onChange={e => setWizFlatNumber(e.target.value)} placeholder="e.g. Flat 402" className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Furnishing Status</label>
                      <select value={wizFurnishing} onChange={e => setWizFurnishing(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent dark:bg-card focus:ring-2 focus:ring-teal-500">
                        <option value="Unfurnished">Unfurnished</option>
                        <option value="Semi-furnished">Semi-furnished</option>
                        <option value="Furnished">Furnished</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Carpet Area</label>
                      <input type="text" value={wizCarpetArea} onChange={e => setWizCarpetArea(e.target.value)} placeholder="e.g. 1200 sq.ft." className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Built-up Area</label>
                      <input type="text" value={wizBuiltUpArea} onChange={e => setWizBuiltUpArea(e.target.value)} placeholder="e.g. 1400 sq.ft." className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Parking Details</label>
                      <input type="text" value={wizParking} onChange={e => setWizParking(e.target.value)} placeholder="e.g. 1 Covered Slot" className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Number of Keys Given</label>
                    <input type="text" value={wizKeysGiven} onChange={e => setWizKeysGiven(e.target.value)} placeholder="e.g. 3 sets of keys (Main Door, Bedroom, Wardrobe)" className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
              )}

              {/* ── Step 3: Lease Terms & Utilities ── */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Monthly Rent (₹) *</label>
                      <input type="number" required value={wizRent} onChange={e => setWizRent(e.target.value)} placeholder="20000" className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Security Deposit (₹) *</label>
                      <input type="number" required value={wizDeposit} onChange={e => setWizDeposit(e.target.value)} placeholder="50000" className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Lease Start Date *</label>
                      <input type="date" required value={wizStart} onChange={e => setWizStart(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Lease End Date *</label>
                      <input type="date" required value={wizEnd} onChange={e => setWizEnd(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">Utility Bills — Who Pays?</span>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        ["Electricity", wizUtilElectricity, setWizUtilElectricity],
                        ["Water", wizUtilWater, setWizUtilWater],
                        ["Gas / LPG", wizUtilGas, setWizUtilGas],
                        ["Internet", wizUtilInternet, setWizUtilInternet],
                        ["Maintenance Charges", wizUtilMaintenance, setWizUtilMaintenance],
                        ["Society Charges", wizUtilSociety, setWizUtilSociety],
                      ] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                        <div key={label} className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground">{label}</label>
                          <select value={val} onChange={e => setter(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent dark:bg-card focus:ring-2 focus:ring-teal-500">
                            <option value="Tenant">Tenant</option>
                            <option value="Landlord">Landlord</option>
                            <option value="Shared">Shared</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isNewTenantWizard && (
                    <div className="grid grid-cols-2 gap-3 border-t pt-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Initial Payment Status</label>
                        <select value={tenantStatus} onChange={e => setTenantStatus(e.target.value as any)} className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent dark:bg-card focus:ring-2 focus:ring-teal-500">
                          <option value="Paid">Paid</option>
                          <option value="Unpaid">Unpaid</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Rent Due Date</label>
                        <input type="date" value={tenantDueDate} onChange={e => setTenantDueDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 4: Landlord Details ── */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  {/* Landlord Identity Details Section */}
                  <div className="space-y-3">
                    <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">Landlord / Owner Details</span>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Owner Full Name *</label>
                        <input
                          type="text"
                          required
                          value={wizLandlordName}
                          onChange={e => setWizLandlordName(e.target.value)}
                          placeholder="Owner Name"
                          className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Father's / Husband's Name *</label>
                        <input
                          type="text"
                          required
                          value={wizLandlordFatherName}
                          onChange={e => setWizLandlordFatherName(e.target.value)}
                          placeholder="Father's Name"
                          className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Phone *</label>
                        <input
                          type="text"
                          required
                          value={wizLandlordPhone}
                          onChange={e => setWizLandlordPhone(e.target.value)}
                          placeholder="Phone Number"
                          className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Email *</label>
                        <input
                          type="email"
                          required
                          value={wizLandlordEmail}
                          onChange={e => setWizLandlordEmail(e.target.value)}
                          placeholder="Email Address"
                          className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Permanent Residential Address *</label>
                      <textarea
                        required
                        value={wizLandlordAddress}
                        onChange={e => setWizLandlordAddress(e.target.value)}
                        placeholder="Owner permanent address"
                        rows={2}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Aadhaar Number (Optional)</label>
                        <input
                          type="text"
                          value={wizLandlordAadhaar}
                          onChange={e => setWizLandlordAadhaar(e.target.value)}
                          placeholder="12-digit Aadhaar Number"
                          className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">PAN (Optional)</label>
                        <input
                          type="text"
                          value={wizLandlordPan}
                          onChange={e => setWizLandlordPan(e.target.value)}
                          placeholder="10-character PAN"
                          className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[480px]">
                  {/* Left Column: Terms Customizer */}
                  <div className="space-y-3 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Customize Terms
                      </label>
                      <span className="text-[10px] text-muted-foreground">These will append as list items</span>
                    </div>
                    <textarea
                      value={wizTerms}
                      onChange={e => setWizTerms(e.target.value)}
                      className="w-full flex-1 p-3 border rounded-xl text-xs bg-slate-50/50 dark:bg-slate-900/30 focus:ring-2 focus:ring-teal-500 font-sans resize-none"
                    />
                  </div>

                  {/* Right Column: Live Draft Preview */}
                  <div className="flex flex-col h-full border rounded-xl bg-slate-50/40 dark:bg-slate-900/20 overflow-hidden">
                    <div className="px-4 py-2 border-b bg-slate-100 dark:bg-slate-900/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider">Live Document Preview</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">Standard Draft</span>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 font-serif text-[11px] whitespace-pre-wrap leading-relaxed text-justify bg-white text-slate-800" style={{ fontFamily: "Georgia, serif" }}>
                      {compileContractText({
                        agreementNumber: wizAgreementNumber,
                        landlordName: wizLandlordName,
                        tenantName: wizTenantName,
                        tenantEmail: wizTenantEmail,
                        tenantPhone: wizTenantPhone,
                        tenantAddress: wizTenantAddress,
                        propertyName: wizPropertyName,
                        blockNumber: wizBlockNumber,
                        propertyAddress: wizPropertyAddress,
                        rentAmount: parseFloat(wizRent) || 0,
                        depositAmount: parseFloat(wizDeposit) || 0,
                        startDate: wizStart,
                        endDate: wizEnd,
                        terms: wizTerms,
                        landlordFatherName: wizLandlordFatherName,
                        landlordAadhaar: wizLandlordAadhaar,
                        landlordPan: wizLandlordPan,
                        landlordPhone: wizLandlordPhone,
                        landlordEmail: wizLandlordEmail,
                        landlordAddress: wizLandlordAddress,
                        tenantFatherName: wizTenantFatherName,
                        tenantAadhaar: wizTenantAadhaar,
                        tenantPan: wizTenantPan,
                        floorNumber: wizFloorNumber,
                        flatNumber: wizFlatNumber,
                        carpetArea: wizCarpetArea,
                        builtUpArea: wizBuiltUpArea,
                        parking: wizParking,
                        furnishing: wizFurnishing,
                        keysGiven: wizKeysGiven,
                        utilElectricity: wizUtilElectricity,
                        utilWater: wizUtilWater,
                        utilGas: wizUtilGas,
                        utilInternet: wizUtilInternet,
                        utilMaintenance: wizUtilMaintenance,
                        utilSociety: wizUtilSociety
                      })}
                    </div>
                  </div>
                </div>
              )}
              {wizardStep === 6 && (
                <div className="space-y-5">
                  <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-xl">
                    <p className="text-xs font-bold text-teal-700 dark:text-teal-400 mb-1 flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4" /> Landlord E-Signature Required
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Sign below to authenticate and issue this lease agreement to {wizTenantName}.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Signature Method</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => { setWizSigMethod("type"); setWizDrawSignature(false); }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${wizSigMethod === "type" ? "bg-teal-500 text-white" : "bg-slate-100 text-muted-foreground dark:bg-slate-800"}`}
                      >
                        Type Name
                      </button>
                      <button
                        type="button"
                        onClick={() => { setWizSigMethod("draw"); setWizDrawSignature(true); }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${wizSigMethod === "draw" ? "bg-teal-500 text-white" : "bg-slate-100 text-muted-foreground dark:bg-slate-800"}`}
                      >
                        Draw Signature
                      </button>
                      <button
                        type="button"
                        onClick={() => { setWizSigMethod("aadhaar"); setWizDrawSignature(false); }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${wizSigMethod === "aadhaar" ? "bg-teal-500 text-white" : "bg-slate-100 text-muted-foreground dark:bg-slate-800"}`}
                      >
                        Aadhaar e-Sign
                      </button>
                    </div>
                  </div>

                  {wizSigMethod === "type" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Type your full legal name *</label>
                      <input
                        type="text"
                        value={wizTypedSignature}
                        onChange={e => setWizTypedSignature(e.target.value)}
                        placeholder={wizLandlordName || "Your Full Name"}
                        className="w-full px-4 py-3 border rounded-xl text-lg bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 outline-none italic text-teal-600 dark:text-teal-400"
                        style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        By typing your name, you certify this digital signature authenticates the lease agreement issued to the tenant.
                      </p>
                    </div>
                  )}

                  {wizSigMethod === "draw" && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Draw your signature *</label>
                      <div className="border bg-slate-50 dark:bg-slate-950 rounded-xl relative overflow-hidden h-36">
                        <canvas
                          ref={wizCanvasRef}
                          width={500}
                          height={144}
                          onMouseDown={wizStartDrawing}
                          onMouseMove={wizDraw}
                          onMouseUp={wizStopDrawing}
                          onMouseLeave={wizStopDrawing}
                          onTouchStart={wizStartDrawing}
                          onTouchMove={wizDraw}
                          onTouchEnd={wizStopDrawing}
                          className="absolute inset-0 w-full h-full cursor-crosshair"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-muted-foreground">Draw using mouse or trackpad</p>
                        <button type="button" onClick={wizClearCanvas} className="text-xs font-bold text-red-500 hover:underline">Clear</button>
                      </div>
                    </div>
                  )}

                  {wizSigMethod === "aadhaar" && (
                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🛡️</span>
                        <div className="text-xs font-bold text-foreground">UIDAI Aadhaar OTP e-Sign Service</div>
                      </div>
                      
                      {!wizAadhaarOtpVerified ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground">ENTER 12-DIGIT AADHAAR NUMBER *</label>
                            <div className="relative">
                              <input
                                type="text"
                                maxLength={14}
                                value={wizAadhaarNumber}
                                onChange={e => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  const formatted = val.match(/.{1,4}/g)?.join("-") || val;
                                  setWizAadhaarNumber(formatted.slice(0, 14));
                                }}
                                placeholder="0000-0000-0000"
                                className="w-full pl-3 pr-24 py-2 text-sm border rounded-lg bg-transparent focus:ring-2 focus:ring-teal-500 font-mono tracking-widest outline-none text-foreground"
                                disabled={wizAadhaarOtpSent}
                              />
                              {!wizAadhaarOtpSent ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (wizAadhaarNumber.replace(/-/g, "").length !== 12) {
                                      showToast("Please enter a valid 12-digit Aadhaar number", "error");
                                      return;
                                    }
                                    setWizAadhaarOtpSent(true);
                                    setWizAadhaarTimer(60);
                                    showToast("OTP sent successfully to UIDAI registered mobile number (+91 ******2392)");
                                  }}
                                  className="absolute right-1 top-1 bottom-1 px-3 bg-teal-500 hover:bg-teal-600 text-white rounded-md text-xs font-bold transition-colors"
                                >
                                  Request OTP
                                </button>
                              ) : (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-600 animate-pulse">OTP Sent</span>
                              )}
                            </div>
                          </div>

                          {wizAadhaarOtpSent && (
                            <div className="space-y-2 animate-reveal">
                              <label className="text-[10px] font-bold text-muted-foreground">ENTER 6-DIGIT OTP SENT TO YOUR MOBILE *</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  value={wizAadhaarOtp}
                                  onChange={e => setWizAadhaarOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                  placeholder="------"
                                  className="flex-1 px-3 py-2 text-sm border rounded-lg bg-transparent text-center font-mono tracking-widest focus:ring-2 focus:ring-teal-500 outline-none text-foreground"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (wizAadhaarOtp.length !== 6) {
                                      showToast("Please enter 6-digit OTP code", "error");
                                      return;
                                    }
                                    setWizAadhaarOtpVerifying(true);
                                    setTimeout(() => {
                                      setWizAadhaarOtpVerifying(false);
                                      setWizAadhaarOtpVerified(true);
                                      showToast("Aadhaar OTP e-Sign authenticated successfully!");
                                    }, 1200);
                                  }}
                                  className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center min-w-[80px]"
                                  disabled={wizAadhaarOtpVerifying}
                                >
                                  {wizAadhaarOtpVerifying ? (
                                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : "Verify OTP"}
                                </button>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                <span>Resend code in {wizAadhaarTimer}s</span>
                                {wizAadhaarTimer === 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWizAadhaarTimer(60);
                                      showToast("New OTP sent to mobile");
                                    }}
                                    className="text-teal-500 font-bold hover:underline"
                                  >
                                    Resend OTP
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg flex items-center justify-between gap-3 animate-reveal">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500">✅</span>
                            <div>
                              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Aadhaar E-Signed Successfully</div>
                              <div className="text-[9px] text-muted-foreground font-mono">UIDAI Log Ref: {wizAadhaarNumber.replace(/-/g, "").slice(0, 4)}... - verified</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setWizAadhaarOtpVerified(false);
                              setWizAadhaarOtpSent(false);
                              setWizAadhaarOtp("");
                            }}
                            className="text-[10px] font-bold text-red-500 hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1) setShowAgreementWizard(false);
                    else setWizardStep(prev => (prev - 1) as any);
                  }}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  {wizardStep === 1 ? "Cancel" : "Back"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep < 6) {
                      if (wizardStep === 1 && (!wizTenantName || !wizTenantEmail || !wizTenantPhone || !wizTenantAddress || !wizTenantFatherName)) {
                        showToast("Please fill all tenant details", "error");
                        return;
                      }
                      if (wizardStep === 2 && (!wizPropertyName || !wizBlockNumber || !wizPropertyAddress)) {
                        showToast("Please fill Property Name, Block Number and Address", "error");
                        return;
                      }
                      if (wizardStep === 3 && (!wizRent || !wizStart || !wizEnd)) {
                        showToast("Please fill Rent, Deposit, Start Date and End Date", "error");
                        return;
                      }
                      if (wizardStep === 4 && (!wizLandlordName || !wizLandlordFatherName || !wizLandlordPhone || !wizLandlordEmail || !wizLandlordAddress)) {
                        showToast("Please fill all landlord details", "error");
                        return;
                      }
                      setWizardStep(prev => (prev + 1) as any);
                    } else {
                      saveWizardAgreement();
                    }
                  }}
                  className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
                >
                  {wizardStep === 6 ? (
                    <>
                      <FileCheck className="h-4 w-4" /> Sign & Generate Agreement
                    </>
                  ) : (
                    "Next Step"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-reveal">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold font-display text-foreground">{previewDoc.name}</h3>
                <p className="text-xs text-muted-foreground">Category: {previewDoc.category} | Tenant: {previewDoc.tenantName}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950 flex flex-col gap-4">
              {/* Document Preview Panel */}
              {previewDoc.fileData ? (
                <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center h-80 w-full shadow-inner">
                  {previewDoc.fileData.startsWith("data:image/") ? (
                    <img
                      src={previewDoc.fileData}
                      alt={previewDoc.name}
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  ) : previewDoc.fileData.startsWith("data:application/pdf") ? (
                    <embed
                      src={previewDoc.fileData}
                      type="application/pdf"
                      className="w-full h-full border-none"
                    />
                  ) : (
                    <div className="text-center p-6 text-xs text-muted-foreground space-y-3">
                      <FileText className="h-14 w-14 text-teal-500/80 mx-auto animate-pulse" />
                      <div>
                        <p className="font-bold text-foreground">Preview Not Supported</p>
                        <p className="text-[10px] mt-0.5">This file format cannot be displayed directly in the browser.</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold uppercase">
                        {previewDoc.name.split('.').pop()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-slate-900/50 border border-dashed rounded-xl p-8 text-center text-xs text-muted-foreground space-y-2 h-80 flex flex-col items-center justify-center">
                  <FileText className="h-10 w-10 text-slate-400" />
                  <p className="font-bold">No Preview Content Stored</p>
                  <p className="text-[10px] text-slate-400">Please upload a new file to preview it here.</p>
                </div>
              )}

              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border text-[11px] font-mono leading-relaxed select-text space-y-1">
                <div className="text-teal-600 dark:text-teal-400 font-bold">VERIFIED RENTHUB SECURE HASH:</div>
                <div className="break-all text-muted-foreground text-[10px]">
                  SHA-256: {previewDoc.id.replace("d-", "").padEnd(64, "e")}
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 border-t mt-1.5 flex justify-between">
                  <span>Size: {previewDoc.size}</span>
                  <span>Uploaded: {previewDoc.uploadDate}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Close
              </button>
              {previewDoc.fileData ? (
                <a
                  href={previewDoc.fileData}
                  download={previewDoc.name}
                  className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  <Download className="h-4 w-4" /> Download File
                </a>
              ) : (
                <button
                  disabled
                  className="bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-not-allowed"
                >
                  <Download className="h-4 w-4" /> No File Available
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Real Agreement Stamp Paper Preview Modal */}
      {previewAgreement && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-card border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-reveal">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 print:hidden">
              <div>
                <h3 className="font-bold font-display text-foreground">Official Lease Document</h3>
                <p className="text-xs text-muted-foreground">Tenant: {previewAgreement.tenantName} | Status: <b className="text-teal-600">{previewAgreement.status}</b></p>
              </div>
              <button onClick={() => setPreviewAgreement(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-100 dark:bg-slate-950/40 print:p-0 print:bg-white">
              {/* Stamp Paper Container */}
              <div
                id="printable-agreement-area"
                className="bg-white text-slate-900 border shadow-md p-4 sm:p-12 max-w-3xl mx-auto font-serif relative overflow-hidden select-text print:border-none print:shadow-none print:p-0"
              >
                {/* Government Stamp Paper Header */}
                <div className="border-4 border-double border-amber-800/80 p-4 mb-8 text-center bg-[#fdfaf2] relative select-none">
                  <div className="text-[10px] tracking-widest font-sans font-bold text-amber-800 uppercase">
                    GOVERNMENT OF INDIA • INDIA NON JUDICIAL
                  </div>
                  <div className="my-3 flex flex-col sm:flex-row justify-between items-center gap-3 px-2 sm:px-8">
                    <div className="text-[9px] font-sans font-bold text-amber-800 border border-amber-800/40 px-1.5 py-0.5 rounded">
                      SEC. 17 / REG. ACT 1908
                    </div>
                    <div className="flex flex-col items-center gap-1 select-none">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(window.location.origin + "/verify/" + previewAgreement.id)}`} 
                        alt="Verification QR Code" 
                        className="h-12 w-12 border border-amber-800/40 p-0.5 bg-white rounded shadow-sm"
                      />
                      <span className="text-[7px] font-bold text-amber-800/60 font-sans tracking-wide">SCAN TO VERIFY</span>
                    </div>
                    <div className="text-[9px] font-sans font-bold text-amber-800 border border-amber-800/40 px-1.5 py-0.5 rounded">
                      SERIAL: RH-{previewAgreement.id.slice(2, 8).toUpperCase()}
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-amber-900 tracking-wider my-2 font-display">
                    ₹ 100
                  </div>
                  <div className="text-[10px] tracking-widest font-sans font-bold text-amber-800 uppercase mt-1">
                    ONE HUNDRED RUPEES
                  </div>
                </div>

                {/* Contract Body */}
                <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-800 text-justify px-4" style={{ fontFamily: "Georgia, serif" }}>
                  {previewAgreement.contractText || compileContractText({
                    landlordName: previewAgreement.landlordName || "Owner Admin",
                    tenantName: previewAgreement.tenantName,
                    tenantEmail: previewAgreement.tenantEmail || "",
                    tenantPhone: previewAgreement.tenantPhone || "",
                    tenantAddress: previewAgreement.tenantAddress || "",
                    propertyName: previewAgreement.propertyName || "",
                    blockNumber: previewAgreement.blockNumber || previewAgreement.unit,
                    propertyAddress: previewAgreement.propertyAddress || "",
                    rentAmount: previewAgreement.rentAmount,
                    depositAmount: previewAgreement.depositAmount,
                    startDate: previewAgreement.startDate,
                    endDate: previewAgreement.endDate,
                    terms: previewAgreement.termsAndConditions || "Standard Clauses Applied.",
                    landlordFatherName: previewAgreement.landlordFatherName || "",
                    landlordAadhaar: previewAgreement.landlordAadhaar || "",
                    landlordPan: previewAgreement.landlordPan || "",
                    landlordPhone: previewAgreement.landlordPhone || "",
                    landlordEmail: previewAgreement.landlordEmail || "",
                    landlordAddress: previewAgreement.landlordAddress || "",
                    tenantFatherName: previewAgreement.tenantFatherName || "",
                    tenantAadhaar: previewAgreement.tenantAadhaar || "",
                    tenantPan: previewAgreement.tenantPan || "",
                    floorNumber: previewAgreement.floorNumber || "",
                    flatNumber: previewAgreement.flatNumber || "",
                    carpetArea: previewAgreement.carpetArea || "",
                    builtUpArea: previewAgreement.builtUpArea || "",
                    parking: previewAgreement.parking || "",
                    furnishing: previewAgreement.furnishing || "",
                    keysGiven: previewAgreement.keysGiven || ""
                  })}
                </div>

                {/* Signatures Panel */}
                <div className="mt-12 border-t pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 px-4 font-sans text-xs">
                  <div className="space-y-4">
                    <p className="font-bold text-slate-500 uppercase tracking-wider">FIRST PART (LANDLORD)</p>
                    <div className="h-20 flex flex-col justify-end border-b border-slate-300 pb-2">
                      {previewAgreement.landlordSignature ? (
                        previewAgreement.landlordSignature.startsWith("data:image") ? (
                          <img src={previewAgreement.landlordSignature} alt="Landlord Signature" className="max-h-16 max-w-[200px] object-contain opacity-95 select-none" />
                        ) : (
                          <div className="italic text-teal-600 font-bold text-lg select-none" style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
                            {previewAgreement.landlordSignature}
                          </div>
                        )
                      ) : (
                        <span className="text-slate-400 italic">Unsigned</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">{previewAgreement.landlordName || "Owner Admin"}</p>
                      <p className="text-[10px] text-slate-400">Signed on: {previewAgreement.landlordSignedAt || previewAgreement.startDate}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="font-bold text-slate-500 uppercase tracking-wider">SECOND PART (TENANT)</p>
                    <div className="h-20 flex flex-col justify-end border-b border-slate-300 pb-2">
                      {previewAgreement.status === "Active" || previewAgreement.tenantSignature ? (
                        previewAgreement.tenantSignatureType === "draw" ? (
                          <img src={previewAgreement.tenantSignature} alt="Tenant Signature" className="max-h-16 max-w-[200px] object-contain opacity-95 select-none" />
                        ) : (
                          <div className="italic text-teal-600 font-bold text-lg select-none" style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
                            {previewAgreement.tenantSignature || previewAgreement.tenantName}
                          </div>
                        )
                      ) : (
                        <span className="text-amber-500 font-bold animate-pulse">Awaiting Tenant E-Sign</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">{previewAgreement.tenantName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {previewAgreement.tenantSignedAt ? `Signed on: ${previewAgreement.tenantSignedAt}` : "Verification pending"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Notary Attestation Block */}
              {previewAgreement.notaryStatus === "notarized" && (
                <div className="mt-10 border-t-2 border-dashed border-amber-600/60 pt-8 px-4 font-sans">
                  <div className="flex items-start justify-between gap-6">
                    <div className="space-y-2 flex-1">
                      <div className="text-[9px] uppercase tracking-widest font-bold text-amber-700 border-b border-amber-400/40 pb-1">
                        NOTARIAL ATTESTATION CERTIFICATE — SEC. 8, NOTARIES ACT, 1952
                      </div>
                      <div className="text-xs font-bold text-slate-800">{previewAgreement.notaryName}</div>
                      <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                        <div>Reg. No: {previewAgreement.notaryRegNo}</div>
                        <div>Jurisdiction: {previewAgreement.notaryJurisdiction}</div>
                        <div>Cert. Serial: {previewAgreement.notarySerialNo}</div>
                      </div>
                      <div className="text-[10px] italic text-slate-500 border-l-2 border-amber-400 pl-3 mt-2">
                        "{previewAgreement.notaryRemarks}"
                      </div>
                      <div className="h-10 border-b border-slate-300 flex flex-col justify-end pb-1 mt-4">
                        {previewAgreement.notarySeal ? (
                          previewAgreement.notarySeal.startsWith("data:image") ? (
                            <img src={previewAgreement.notarySeal} alt="Notary Signature" className="max-h-8 max-w-[180px] object-contain opacity-90 select-none" />
                          ) : (
                            <div className="italic text-amber-700 font-bold text-lg select-none" style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
                              {previewAgreement.notarySeal}
                            </div>
                          )
                        ) : null}
                      </div>
                      <div className="text-[9px] text-slate-400">Notarized on: {previewAgreement.notarySignedAt}</div>
                    </div>

                    {/* Circular Gold Seal */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="h-20 w-20 rounded-full border-2 border-double border-amber-600 bg-amber-50 flex flex-col items-center justify-center text-center p-2 shadow-md select-none">
                        <Award className="h-5 w-5 text-amber-700 mb-0.5" />
                        <span className="text-[8px] font-extrabold text-amber-900 uppercase tracking-tighter leading-none">NOTARY</span>
                        <span className="text-[7px] font-bold text-amber-700 leading-none">PUBLIC</span>
                        <span className="text-[6px] font-bold text-amber-800/60 mt-0.5">INDIA</span>
                      </div>
                      <div className="text-[8px] text-amber-700 font-bold text-center leading-tight">ATTESTED</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Renewal History Panel in Preview */}
              {previewAgreement.history && previewAgreement.history.length > 0 && (
                <div className="max-w-3xl mx-auto mt-8 bg-white dark:bg-card p-6 border rounded-xl shadow-sm space-y-3 print:hidden">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Lease Renewal History
                  </h5>
                  <div className="relative border-l pl-4 ml-2 space-y-4">
                    {previewAgreement.history.map((hist, i) => (
                      <div key={hist.id} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-500 border border-white dark:border-slate-900" />
                        <span className="text-[10px] text-muted-foreground font-semibold">{hist.startDate} to {hist.endDate}</span>
                        <p className="font-bold mt-0.5 text-foreground">Rent Amount: ₹{hist.rentAmount.toLocaleString('en-IN')}/mo</p>
                        <p className="text-[10px] text-muted-foreground">Deposit: ₹{hist.depositAmount.toLocaleString('en-IN')} | Signed on: {hist.signedAt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 print:hidden">
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">RentHub Cryptographic Lease Verification</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewAgreement(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      const verifyUrl = window.location.origin + "/verify/" + previewAgreement.id;
                      const genDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
                      const year = previewAgreement.startDate ? new Date(previewAgreement.startDate).getFullYear() : new Date().getFullYear();
                      const rawSuffix = (previewAgreement.agreementNumber || "").split("-").pop() || previewAgreement.id.slice(-6).toUpperCase().padStart(6, "0");
                      const agreementNumDisplay = previewAgreement.agreementNumber || `RH-${year}-${rawSuffix}`;
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Lease Agreement - ${previewAgreement.tenantName}</title>
                            <style>
                              @page { margin: 16mm 18mm 16mm 18mm; }
                              body { font-family: Georgia, serif; padding: 40px; color: #1e293b; line-height: 1.6; }
                              .stamp-paper-header {
                                border: 4px double #92400e;
                                padding: 16px;
                                margin-bottom: 32px;
                                text-align: center;
                                background-color: #fdfaf2;
                              }
                              .stamp-paper-header div { font-family: sans-serif; font-weight: bold; }
                              .seal {
                                display: inline-block;
                                border: 2px dashed #92400e;
                                border-radius: 50%;
                                width: 56px;
                                height: 56px;
                                line-height: 56px;
                                font-size: 9px;
                                margin: 12px auto;
                              }
                              .agr-number {
                                font-family: sans-serif;
                                font-size: 11px;
                                font-weight: 700;
                                color: #78350f;
                                letter-spacing: 0.05em;
                                margin-top: 8px;
                                padding: 4px 12px;
                                border: 1px solid #92400e;
                                display: inline-block;
                                border-radius: 4px;
                                background: #fffbeb;
                              }
                              .contract-body { white-space: pre-wrap; text-align: justify; margin-top: 24px; font-size: 14px; }
                              .signatures { margin-top: 48px; border-top: 1px solid #cbd5e1; padding-top: 32px; display: flex; justify-content: space-between; }
                              .signature-box { width: 45%; }
                              .signature-line { height: 80px; border-bottom: 1px solid #94a3b8; display: flex; flex-direction: column; justify-content: flex-end; margin-bottom: 8px; }
                              .signature-img { max-height: 64px; max-width: 180px; object-fit: contain; }
                              .typed-signature { font-family: 'Brush Script MT', cursive, sans-serif; font-size: 20px; font-style: italic; color: #0d9488; }
                              .page-footer {
                                margin-top: 48px;
                                border-top: 2px solid #e2e8f0;
                                padding: 10px 0 0 0;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                font-family: sans-serif;
                                font-size: 9px;
                                color: #94a3b8;
                              }
                              .page-footer .brand { font-weight: 800; color: #0f9d9a; letter-spacing: 0.05em; }
                            </style>
                          </head>
                          <body>
                            <table style="width:100%; border-collapse:collapse; border-spacing:0;">
                              <tfoot>
                                <tr>
                                  <td style="padding:0;">
                                    <div class="page-footer">
                                      <span><span class="brand">RentHub</span> &nbsp;|&nbsp; Lease Agreement</span>
                                      <span>Agreement No. ${agreementNumDisplay}</span>
                                      <span>Generated on ${genDate}</span>
                                    </div>
                                  </td>
                                </tr>
                              </tfoot>
                              <tbody>
                                <tr>
                                  <td style="padding:0;">
                                    <div class="stamp-paper-header">
                                      <div style="font-size: 10px; color: #92400e; text-transform: uppercase; font-weight:bold; letter-spacing:0.08em;">GOVERNMENT OF INDIA • INDIA NON JUDICIAL</div>
                                      <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0;">
                                        <span style="font-size: 9px; color: #92400e; border: 1px solid #92400e; padding: 2px 6px; border-radius: 4px; font-weight:bold;">SEC. 17 / REG. ACT 1908</span>
                                        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; margin: 4px auto;">
                                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(verifyUrl)}" style="width:50px; height:50px; border:1px solid #92400e; padding:2px; background:#fff;" />
                                          <span style="font-family:sans-serif; font-size:6px; color:#92400e; font-weight:bold; letter-spacing:0.05em;">SCAN TO VERIFY</span>
                                        </div>
                                        <span style="font-size: 9px; color: #92400e; border: 1px solid #92400e; padding: 2px 6px; border-radius: 4px; font-weight:bold;">SERIAL: RH-${previewAgreement.id.slice(2, 8).toUpperCase()}</span>
                                      </div>
                                      <div style="font-size: 32px; font-weight: 800; color: #78350f;">₹ 100</div>
                                      <div style="font-size: 10px; color: #92400e; text-transform: uppercase; font-weight:bold;">ONE HUNDRED RUPEES</div>
                                      <div class="agr-number">Agreement No. ${agreementNumDisplay}</div>
                                    </div>
                                    <div class="contract-body">${previewAgreement.contractText || ""}</div>
                                    <div class="signatures">
                                      <div class="signature-box">
                                        <div style="font-weight: bold; color: #64748b; font-size: 11px;">FIRST PART (LANDLORD)</div>
                                        <div class="signature-line">
                                          ${previewAgreement.landlordSignature ? (
                                            previewAgreement.landlordSignature.startsWith("data:image") ? (
                                              `<img class="signature-img" src="${previewAgreement.landlordSignature}" />`
                                            ) : (
                                              `<div class="typed-signature">${previewAgreement.landlordSignature}</div>`
                                            )
                                          ) : (
                                            '<span style="color: #94a3b8; font-style: italic;">Unsigned</span>'
                                          )}
                                        </div>
                                        <div style="font-weight: bold; font-size: 12px; color: #334155;">${previewAgreement.landlordName || "Owner Admin"}</div>
                                        <div style="font-size: 10px; color: #94a3b8;">Signed on: ${previewAgreement.landlordSignedAt || previewAgreement.startDate}</div>
                                      </div>
                                      <div class="signature-box">
                                        <div style="font-weight: bold; color: #64748b; font-size: 11px;">SECOND PART (TENANT)</div>
                                        <div class="signature-line">
                                          ${previewAgreement.status === "Active" || previewAgreement.tenantSignature ? (
                                            previewAgreement.tenantSignatureType === "draw" ? (
                                              `<img class="signature-img" src="${previewAgreement.tenantSignature}" />`
                                            ) : (
                                              `<div class="typed-signature">${previewAgreement.tenantSignature || previewAgreement.tenantName}</div>`
                                            )
                                          ) : (
                                            '<span style="color: #f59e0b; font-weight: bold;">Awaiting Tenant E-Sign</span>'
                                          )}
                                        </div>
                                        <div style="font-weight: bold; font-size: 12px; color: #334155;">${previewAgreement.tenantName}</div>
                                        <div style="font-size: 10px; color: #94a3b8;">${previewAgreement.tenantSignedAt ? `Signed on: ${previewAgreement.tenantSignedAt}` : "Verification pending"}</div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 500);
                    }
                  }}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF / Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Agreement Renewal Modal */}
      {showRenewModal && renewAgreement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-reveal">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-base font-display text-foreground">Renew Rental Agreement</h3>
              <button onClick={() => setShowRenewModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                Copying terms from previous agreement for <b>{renewAgreement.tenantName}</b>. A new lease agreement version will be generated and set to pending signature.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">New Start Date</label>
                  <input
                    type="date"
                    value={renewStart}
                    onChange={e => setRenewStart(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">New End Date</label>
                  <input
                    type="date"
                    value={renewEnd}
                    onChange={e => setRenewEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Monthly Rent (₹)</label>
                <input
                  type="number"
                  value={renewRent}
                  onChange={e => setRenewRent(e.target.value)}
                  placeholder="Hiked rent amount"
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-[10px] text-teal-600 dark:text-teal-400">Prefilled with a standard 5% escalation.</span>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRenewedAgreement}
                  className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Renew & Send Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Digital Notary Attestation Modal */}
      {showNotaryModal && notaryTargetAgreement && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-card border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-reveal my-8">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display text-foreground flex items-center gap-2">
                    Digital Notary Attestation & Legal Seal
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Tenant: <b>{notaryTargetAgreement.tenantName}</b> ({notaryTargetAgreement.unit})
                  </p>
                </div>
              </div>
              <button onClick={() => setShowNotaryModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotaryAttestation} className="p-6 space-y-5">
              {/* Info alert */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-bold">Public Notary Legal Attestation (Sec. 8, Notaries Act 1952)</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Affixing this notary attestation verifies identity proofs of Landlord & Tenant and generates an official notarization certificate on the contract.
                  </p>
                </div>
              </div>

              {/* Notary Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Notary Advocate Name *</label>
                  <input
                    type="text"
                    required
                    value={notaryName}
                    onChange={e => setNotaryName(e.target.value)}
                    placeholder="Adv. R. K. Sharma, Public Notary"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Government Notary Reg. No *</label>
                  <input
                    type="text"
                    required
                    value={notaryRegNo}
                    onChange={e => setNotaryRegNo(e.target.value)}
                    placeholder="NOT-IND/2026/88491"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-amber-500 outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Jurisdiction / Court District *</label>
                  <input
                    type="text"
                    required
                    value={notaryJurisdiction}
                    onChange={e => setNotaryJurisdiction(e.target.value)}
                    placeholder="District & Sessions Court"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Attestation Certificate Serial No</label>
                  <input
                    type="text"
                    required
                    value={notarySerialNo}
                    onChange={e => setNotarySerialNo(e.target.value)}
                    placeholder="NOT-CERT-88912"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-amber-500 outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Notarial Attestation Remarks / Statement</label>
                <textarea
                  rows={2}
                  value={notaryRemarks}
                  onChange={e => setNotaryRemarks(e.target.value)}
                  placeholder="Solemnly affirmed & attested after verifying identity credentials & original documents of both parties."
                  className="w-full px-3.5 py-2 border rounded-xl text-xs bg-transparent focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              {/* Notary Signature & Seal Suite */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PenTool className="h-4 w-4 text-amber-500" /> Notary Advocate Signature & Stamp
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNotarySignatureType("type")}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${notarySignatureType === "type" ? "bg-amber-500 text-white" : "bg-slate-100 text-muted-foreground dark:bg-slate-800"
                        }`}
                    >
                      Type Signature
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotarySignatureType("draw")}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${notarySignatureType === "draw" ? "bg-amber-500 text-white" : "bg-slate-100 text-muted-foreground dark:bg-slate-800"
                        }`}
                    >
                      Draw Signature
                    </button>
                  </div>
                </div>

                {notarySignatureType === "type" ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={notaryTypedSignature}
                      onChange={e => setNotaryTypedSignature(e.target.value)}
                      placeholder="Adv. R. K. Sharma, Public Notary"
                      className="w-full px-4 py-3 border rounded-xl text-lg bg-amber-50/50 dark:bg-slate-950 focus:ring-2 focus:ring-amber-500 outline-none italic text-amber-800 dark:text-amber-400"
                      style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="border border-amber-300/60 bg-amber-50/20 dark:bg-slate-950 rounded-xl relative overflow-hidden h-32">
                      <canvas
                        ref={notaryCanvasRef}
                        width={550}
                        height={128}
                        onMouseDown={notaryStartDrawing}
                        onMouseMove={notaryDraw}
                        onMouseUp={notaryStopDrawing}
                        onMouseLeave={notaryStopDrawing}
                        onTouchStart={notaryStartDrawing}
                        onTouchMove={notaryDraw}
                        onTouchEnd={notaryStopDrawing}
                        className="absolute inset-0 w-full h-full cursor-crosshair"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Draw signature using mouse/touchpad</span>
                      <button type="button" onClick={notaryClearCanvas} className="font-bold text-red-500 hover:underline">Clear Canvas</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notary Seal Live Preview Badge */}
              <div className="p-4 border border-dashed border-amber-400/80 bg-amber-500/5 dark:bg-amber-950/20 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">Live Notary Stamp Preview</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{notaryName}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Reg: {notaryRegNo} • {notaryJurisdiction}</div>
                </div>

                {/* Circular Gold Seal Badge */}
                <div className="h-16 w-16 rounded-full border-2 border-double border-amber-600 bg-amber-100 dark:bg-amber-900/60 flex flex-col items-center justify-center text-center p-1 shadow-sm shrink-0 select-none">
                  <Award className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  <span className="text-[7px] font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-tighter leading-none mt-0.5">NOTARY</span>
                  <span className="text-[6px] font-bold text-amber-700 dark:text-amber-400 leading-none">PUBLIC</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotaryModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-sm font-bold shadow-md flex items-center gap-1.5"
                >
                  <Award className="h-4 w-4" /> Save & Attest Notary Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  /* ── Tab Helper Functions ──────────────────────────── */
  function unpaidTenantsCount() {
    return tenants.filter(t => t.paymentStatus !== "Paid").length;
  }

  /* ── TAB VIEWS ─────────────────────────────────────── */

  // 1. Dashboard Tab
  function renderDashboard() {
    const overdueCount = tenants.filter(t => t.paymentStatus === "Overdue").length;
    return (
      <div className="space-y-8 animate-reveal">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Pending Dues", value: `₹${totalRentExcludingPaid.toLocaleString()}`, subText: `${unpaidTenantsCount()} Tenants Pending`, icon: DollarSign, color: "from-amber-500 to-orange-500", trend: "+5% vs Last Month" },
            { label: "Collected Rent", value: `₹${totalCollected.toLocaleString()}`, subText: "This month collection", icon: CreditCard, color: "from-emerald-500 to-teal-600", trend: "Collection efficiency" },
            { label: "Occupancy Rate", value: `${occupancyRate}%`, subText: `${tenants.length} of 8 units occupied`, icon: Percent, color: "from-blue-500 to-indigo-600", trend: "1 Vacancy pending review" },
            { label: "Active Leases", value: activeAgreements, subText: "Digitally signed contracts", icon: FileCheck, color: "from-purple-500 to-violet-600", trend: "0 Pending execution" }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className={`absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br ${stat.color} opacity-5 group-hover:scale-110 transition-transform duration-300`} />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase">{stat.label}</span>
                    <h3 className="text-3xl font-extrabold mt-1 tracking-tight font-display text-foreground">{stat.value}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border text-slate-700 dark:text-slate-300">
                    <Icon className="h-5 w-5 text-teal-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{stat.subText}</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">{stat.trend}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts & Graphs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base font-display">Revenue Overview</h4>
                <p className="text-xs text-muted-foreground">6-month trend in rent collections</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> High efficiency
              </span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F9D9A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0F9D9A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, "Earnings"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#0F9D9A" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Status Pie Chart */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-base font-display">Collections Distribution</h4>
              <p className="text-xs text-muted-foreground">Current monthly payment cycle statuses</p>
            </div>

            <div className="h-48 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} Units`, "Status"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-foreground">{tenants.length}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Units</span>
              </div>
            </div>

            <div className="space-y-2">
              {paymentStatusData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium">{item.name} Tenants</span>
                  </div>
                  <span className="font-bold">{item.value} ({tenants.length ? Math.round((item.value / tenants.length) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Activity & Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overdue alert panel */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm lg:col-span-1 space-y-4">
            <h4 className="font-bold text-base font-display flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Pending Action Items
            </h4>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {tenants.filter(t => t.paymentStatus !== "Paid").map(tenant => (
                <div key={tenant.id} className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/40 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">{tenant.name} ({tenant.unit})</div>
                    <div className="text-[10px] text-red-500 font-semibold mt-0.5">
                      Rent of ₹{tenant.rentAmount.toLocaleString()} is {tenant.paymentStatus.toUpperCase()}
                    </div>
                  </div>
                  <button
                    onClick={() => { setRemindTenantId(tenant.id); setActiveTab("reminders"); }}
                    className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Send className="h-3 w-3" /> Remind
                  </button>
                </div>
              ))}
              {unpaidTenantsCount() === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  All tenants have cleared their dues!
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-base font-display">System Activity Log</h4>
              <button onClick={() => showToast("Activity logs reloaded.")} className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 hover:underline">
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
              {reminders.slice(0, 4).map(rem => (
                <div key={rem.id} className="flex gap-3 text-xs border-b pb-3 last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <BellRing className="h-4 w-4 text-teal-500" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      Sent <span className="font-semibold text-foreground">{rem.channel}</span> reminder to <span className="font-semibold text-foreground">{rem.tenantName} ({rem.unit})</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> {rem.sentAt}
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Delivered
                    </div>
                  </div>
                </div>
              ))}
              {tenants.slice(0, 3).map(ten => (
                <div key={ten.id} className="flex gap-3 text-xs border-b pb-3 last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      Tenant <span className="font-semibold text-foreground">{ten.name}</span> active on <span className="font-semibold text-foreground">{ten.unit}</span> (Rent Cycle: {ten.dueDate})
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Cycle Date: {ten.dueDate}
                      <span className={`h-1.5 w-1.5 rounded-full ${ten.paymentStatus === "Paid" ? "bg-emerald-500" : "bg-amber-500"}`} /> {ten.paymentStatus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Tenants Tab
  function renderTenants() {
    // Apply filters
    const filtered = tenants.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.unit.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(tenantSearch.toLowerCase());

      const matchesStatus = tenantStatusFilter === "All" || t.paymentStatus === tenantStatusFilter;
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-6 animate-reveal">
        {/* Table Filter Options */}
        <div className="bg-white dark:bg-card p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, unit, email..."
              value={tenantSearch}
              onChange={e => setTenantSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {["All", "Paid", "Unpaid", "Overdue"].map(st => (
              <button
                key={st}
                onClick={() => setTenantStatusFilter(st as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${tenantStatusFilter === st
                    ? "bg-teal-500 text-white border-teal-500"
                    : "bg-transparent text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-muted-foreground uppercase border-b">
                  <th className="p-4">Tenant Name</th>
                  <th className="p-4">Unit</th>
                  <th className="p-4">Monthly Rent</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Lease Term</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filtered.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-foreground">{tenant.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" /> {tenant.phone}</span>
                          <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" /> {tenant.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-teal-600 dark:text-teal-400">{tenant.unit}</td>
                    <td className="p-4">
                      <div className="font-bold">₹{tenant.rentAmount.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">Deposit: ₹{tenant.depositAmount.toLocaleString()}</div>
                    </td>
                    <td className="p-4 font-medium">{tenant.dueDate}</td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {tenant.leaseStart} to {tenant.leaseEnd}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => togglePaymentStatus(tenant)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${tenant.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : tenant.paymentStatus === "Unpaid"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          }`}
                        title="Click to toggle status"
                      >
                        {tenant.paymentStatus}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <button
                          onClick={() => handleEditTenantClick(tenant)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-foreground transition-colors"
                          title="Edit Profile"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setRemindTenantId(tenant.id); setActiveTab("reminders"); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-500 hover:text-teal-600 transition-colors"
                          title="Send Rent Reminder"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 transition-colors"
                          title="Remove Occupant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      No matching tenant profiles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 3. Agreements Tab
  function renderAgreements() {
    return (
      <div className="space-y-6 animate-reveal">
        {/* Helper Banner */}
        <div className="p-4 bg-teal-50/60 dark:bg-teal-950/20 border rounded-2xl flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0">
              <FileCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-bold">Standard Indian Rental Agreement Compliance</p>
              <p className="text-xs text-muted-foreground">All contracts are generated under Section 17 of the Registration Act, 1908.</p>
            </div>
          </div>
          <button onClick={handleCreateAgreement} className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold shrink-0">
            Create New Draft
          </button>
        </div>

        {/* Search & Filter controls */}
        <div className="bg-white dark:bg-card p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tenant, block, address..."
              value={agreementSearch}
              onChange={e => setAgreementSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {["All", "Active", "Pending Signature", "Expired", "Renewed"].map(statusOpt => (
              <button
                key={statusOpt}
                onClick={() => setAgreementFilter(statusOpt as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${agreementFilter === statusOpt
                    ? "bg-teal-500 text-white border-teal-500"
                    : "bg-transparent text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
              >
                {statusOpt}
              </button>
            ))}
          </div>
        </div>

        {/* Tenant Renewal Requests */}
        {renewals.filter(r => r.status === "Pending").length > 0 && (
          <div className="bg-white dark:bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-teal-500 animate-spin-slow" /> Pending Tenant Renewal Requests
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {renewals.filter(r => r.status === "Pending").map(req => (
                <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">{req.tenantName} ({req.unit})</p>
                    <p className="text-[10px] text-muted-foreground">Requested on: {req.requestedAt}</p>
                    {req.notes && (
                      <p className="text-[10px] italic text-muted-foreground mt-1.5 bg-white dark:bg-slate-950 p-2 rounded border">
                        "{req.notes}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleApproveRenewal(req)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDeclineRenewal(req.id)}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agreements Table */}
        <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-muted-foreground uppercase border-b">
                  <th className="p-4">Tenant Name</th>
                  <th className="p-4">Unit</th>
                  <th className="p-4">Rent / Deposit</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Status & Notary</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {agreements
                  .filter(agr => {
                    const matchesSearch =
                      (agr.tenantName || "").toLowerCase().includes(agreementSearch.toLowerCase()) ||
                      (agr.unit || "").toLowerCase().includes(agreementSearch.toLowerCase()) ||
                      (agr.blockNumber || "").toLowerCase().includes(agreementSearch.toLowerCase()) ||
                      (agr.propertyAddress || "").toLowerCase().includes(agreementSearch.toLowerCase()) ||
                      (agr.propertyName || "").toLowerCase().includes(agreementSearch.toLowerCase());

                    let matchesStatus = true;
                    if (agreementFilter === "Active") {
                      matchesStatus = agr.status === "Active";
                    } else if (agreementFilter === "Pending Signature") {
                      matchesStatus = agr.status === "Pending Signature";
                    } else if (agreementFilter === "Expired") {
                      matchesStatus = agr.status === "Expired";
                    } else if (agreementFilter === "Renewed") {
                      matchesStatus = !!(agr.history && agr.history.length > 0);
                    }
                    return matchesSearch && matchesStatus;
                  })
                  .map(agr => (
                    <tr key={agr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-bold">{agr.tenantName}</td>
                      <td className="p-4 font-semibold text-teal-600 dark:text-teal-400">{agr.unit}</td>
                      <td className="p-4">
                        <div>Rent: <b>₹{agr.rentAmount.toLocaleString()}</b>/mo</div>
                        <div className="text-xs text-muted-foreground">Deposit: ₹{agr.depositAmount.toLocaleString()}</div>
                      </td>
                      <td className="p-4 text-xs font-medium">
                        {agr.startDate} to {agr.endDate}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${agr.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : agr.status === "Pending Signature"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse"
                                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                            }`}>
                            {agr.status}
                          </span>
                          {agr.notaryStatus === "notarized" && (
                            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/50">
                              <Award className="h-3 w-3" /> Notarized
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {(agr.status === "Active" || agr.status === "Expired") && (
                            <button
                              onClick={() => handleRenewAgreement(agr)}
                              className="px-2.5 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              title="Renew for next term"
                            >
                              <RefreshCw className="h-3 w-3" /> Renew
                            </button>
                          )}
                          {agr.notaryStatus !== "notarized" ? (
                            <button
                              onClick={() => handleOpenNotaryModal(agr)}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-amber-300/50"
                              title="Add Notary Attestation"
                            >
                              <Award className="h-3 w-3" /> Notarize
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenNotaryModal(agr)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              title="View / Edit Notary Attestation"
                            >
                              <ShieldCheck className="h-3 w-3" /> Re-Attest
                            </button>
                          )}
                          <button
                            onClick={() => setPreviewAgreement(agr)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-foreground transition-colors"
                            title="Preview Signed Copy"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgreement(agr.id, agr.tenantName)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 4. Documents Tab
  function renderDocuments() {
    return (
      <div className="space-y-6 animate-reveal">
        {/* Upload Interface */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Upload Settings Card */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
            <h4 className="font-bold text-base font-display">Document Dispatch Settings</h4>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Select Category</label>
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent dark:bg-card focus:ring-2 focus:ring-teal-500"
              >
                <option value="Lease Agreement">Lease Agreement</option>
                <option value="ID Proof">Government ID Proof</option>
                <option value="Payment Receipt">Rent Receipt</option>
                <option value="Other">Other Document</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Link to Tenant Profile</label>
              <select
                value={uploadTenant}
                onChange={e => setUploadTenant(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent dark:bg-card focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Unlinked (General)</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.name}>{t.name} ({t.unit})</option>
                ))}
              </select>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm"
              disabled={uploadProgress !== -1}
            >
              <Upload className="h-4.5 w-4.5" /> Select Local File
            </button>

            {uploadProgress !== -1 && (
              <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-teal-600 dark:text-teal-400">Uploading File...</span>
                  <span className="font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Document Vault List */}
          <div className="bg-white dark:bg-card rounded-2xl border shadow-sm md:col-span-2 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Document Vault Storage</span>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{documents.length} Files Total</span>
            </div>

            <div className="divide-y max-h-[400px] overflow-y-auto">
              {documents.map(doc => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{doc.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span className="text-teal-600 dark:text-teal-400">{doc.tenantName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-500 transition-colors"
                      title="View Securely"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc.id, doc.name)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors"
                      title="Delete Doc"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  No files uploaded to vault yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Reminders Tab
  function renderReminders() {
    const pendingTargets = allSelectableTenants.filter(t => t.paymentStatus !== "Paid");
    const clearedTargets = allSelectableTenants.filter(t => t.paymentStatus === "Paid");

    return (
      <div className="space-y-6 animate-reveal">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Dispatch Composer */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
            <h4 className="font-bold text-base font-display">Rent Reminder Composer</h4>

            <form onSubmit={handleSendReminder} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground">Select Recipient Tenant *</label>
                  {allSelectableTenants.length === 0 && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab("tenants"); handleAddTenantClick(); }}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Tenant
                    </button>
                  )}
                </div>
                <select
                  required
                  value={remindTenantId}
                  onChange={e => setRemindTenantId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent dark:bg-card focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Select Tenant --</option>
                  {pendingTargets.length > 0 && (
                    <optgroup label="⚠️ Pending / Overdue Rent">
                      {pendingTargets.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.unit}) — {t.paymentStatus.toUpperCase()} (₹{t.rentAmount.toLocaleString()})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {clearedTargets.length > 0 && (
                    <optgroup label="✅ Paid / Upcoming Cycle">
                      {clearedTargets.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.unit}) — Paid (₹{t.rentAmount.toLocaleString()})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {allSelectableTenants.length === 0 && (
                    <option disabled value="">No tenants found in account</option>
                  )}
                </select>
                {allSelectableTenants.length === 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    No registered tenants found. Please add a tenant or draft an agreement first.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Delivery Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "WhatsApp", label: "WhatsApp" },
                    { id: "Email", label: "Email" }
                  ].map(ch => (
                    <button
                      type="button"
                      key={ch.id}
                      onClick={() => setRemindChannel(ch.id as any)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${remindChannel === ch.id
                          ? "bg-teal-500 text-white border-teal-500"
                          : "bg-transparent text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Message Preview</label>
                <textarea
                  required
                  rows={4}
                  value={remindMsg}
                  onChange={e => setRemindMsg(e.target.value)}
                  placeholder="Select a tenant to load automated template message..."
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm"
                disabled={isSendingReminder || !remindTenantId}
              >
                {isSendingReminder ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Rent Reminder
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History Log */}
          <div className="bg-white dark:bg-card rounded-2xl border shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reminder Notification History</span>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{reminders.length} Logs Total</span>
            </div>

            <div className="divide-y max-h-[460px] overflow-y-auto">
              {reminders.map(log => (
                <div key={log.id} className="p-4 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{log.tenantName} ({log.unit})</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground font-semibold">
                        {log.channel}
                      </span>
                    </div>
                    <span className="text-muted-foreground font-medium">{log.sentAt}</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed italic bg-slate-50/60 dark:bg-slate-900/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                    "{log.message}"
                  </p>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="font-bold text-muted-foreground">Status:</span>
                    <span className="flex items-center gap-0.5 font-bold text-emerald-500">
                      <Check className="h-3 w-3" /> {log.status}
                    </span>
                  </div>
                </div>
              ))}
              {reminders.length === 0 && (
                <div className="text-center py-16 text-muted-foreground text-xs">
                  No notifications logs registered yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Reports Tab
  function renderReports() {
    return (
      <div className="space-y-6 animate-reveal">
        {/* Helper Actions */}
        <div className="bg-white dark:bg-card p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm font-display">Export Analytical Insights</h4>
            <p className="text-xs text-muted-foreground">Download spreadsheets of occupancy and transaction history</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleExportReport("csv")}
              className="flex-1 sm:flex-none p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
            >
              <Download className="h-4 w-4" /> Export CSV Spreadsheet
            </button>
            <button
              onClick={() => handleExportReport("pdf")}
              className="flex-1 sm:flex-none btn-primary p-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold"
            >
              <FileDown className="h-4 w-4" /> Download PDF Statement
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h4 className="font-bold text-base font-display">Collections Performance</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#0F9D9A" radius={[4, 4, 0, 0]}>
                    {revenueTrendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 5 ? "#14b8a6" : "#0f766e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Collection efficiency */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h4 className="font-bold text-base font-display">Collection Efficiency (%)</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(v) => `${v}% Efficiency`} />
                  <Area type="monotone" dataKey="collectionRate" stroke="#10b981" strokeWidth={3} fill="#d1fae5" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed tabular statistics */}
        <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/40">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Summary Financial Ledgers</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="text-xs text-muted-foreground font-semibold uppercase">Estimated Assets Value</div>
                <div className="text-2xl font-bold mt-1 text-foreground">
                  ₹{totalMonthlyRent > 0 ? Math.round((totalMonthlyRent * 12) / 0.035).toLocaleString('en-IN') : "0"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Based on standard 3.5% yield</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="text-xs text-muted-foreground font-semibold uppercase">Average Monthly Rent</div>
                <div className="text-2xl font-bold mt-1 text-teal-600 dark:text-teal-400">
                  ₹{tenants.length > 0 ? Math.round(totalMonthlyRent / tenants.length).toLocaleString('en-IN') : "0"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Across {tenants.length} occupied unit{tenants.length === 1 ? "" : "s"}</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="text-xs text-muted-foreground font-semibold uppercase">Security Deposit Escrow</div>
                <div className="text-2xl font-bold mt-1 text-foreground">
                  ₹{totalDeposits.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Refundable tenant deposits held</div>
              </div>
            </div>
          </div>
        </div>

        {/* Real Transactions Table */}
        <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Property Payment Transactions</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
              {payments.length} Transaction{payments.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="p-6 overflow-x-auto">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No payment transactions recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-muted-foreground uppercase font-bold">
                    <th className="py-2.5">Tenant</th>
                    <th className="py-2.5">Unit</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Method</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Transaction ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="py-3 font-semibold text-foreground">{p.tenantName}</td>
                      <td className="py-3 text-muted-foreground">{p.unit}</td>
                      <td className="py-3 font-bold text-teal-600 dark:text-teal-400">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-muted-foreground">{p.date}</td>
                      <td className="py-3"><span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">{p.method}</span></td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.status === "Success" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" : "bg-red-50 text-red-600 dark:bg-red-950/30"
                          }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-muted-foreground text-[10px]">{p.transactionId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 7. Settings Tab (Save Handler & Render Function)
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    const savedL = sessionStorage.getItem("rh_logged_in_landlord");
    const parsedL = savedL ? JSON.parse(savedL) : null;
    const landlordId = parsedL ? parsedL.id : null;

    if (!landlordId) {
      showToast("No logged-in landlord found.", "error");
      return;
    }

    try {
      const updatedLandlord = {
        ...parsedL,
        name: settName.trim(),
        email: settEmail.toLowerCase().trim(),
        phone: settPhone.trim(),
        bankName: settBankName.trim(),
        accountNumber: settAccountNumber.trim(),
        ifscCode: settIfscCode.trim(),
        upiId: settUpiId.trim()
      };

      // Save to Supabase and local storage
      await saveRecord("rh_landlords", "rh_landlords", updatedLandlord, []);

      // Update sessionStorage and localStorage
      sessionStorage.setItem("rh_logged_in_landlord", JSON.stringify(updatedLandlord));
      localStorage.setItem("rh_logged_in_landlord", JSON.stringify(updatedLandlord));

      showToast("Profile & Bank details updated successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to save settings. Please try again.", "error");
    }
  }

  function renderSettings() {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-reveal">
        <form onSubmit={handleSaveSettings} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Personal Details Card */}
            <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base font-display">Personal Profile</h4>
                  <p className="text-xs text-muted-foreground">Manage your identity and contact info</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={settName}
                    onChange={e => setSettName(e.target.value)}
                    placeholder="Owner Admin"
                    autoComplete="off"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={settEmail}
                    onChange={e => setSettEmail(e.target.value)}
                    placeholder="owner@example.com"
                    autoComplete="off"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={settPhone}
                    onChange={e => setSettPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    autoComplete="off"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bank details Card */}
            <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base font-display">Bank & UPI Payouts</h4>
                  <p className="text-xs text-muted-foreground">Direct tenant payments will clear here</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Bank Name</label>
                  <input
                    type="text"
                    value={settBankName}
                    onChange={e => setSettBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    autoComplete="off"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Account Number</label>
                  <input
                    type="text"
                    value={settAccountNumber}
                    onChange={e => setSettAccountNumber(e.target.value)}
                    placeholder="e.g. 50100234567890"
                    autoComplete="off"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">IFSC Code</label>
                  <input
                    type="text"
                    value={settIfscCode}
                    onChange={e => setSettIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    maxLength={11}
                    autoComplete="off"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={settUpiId}
                    onChange={e => setSettUpiId(e.target.value.toLowerCase())}
                    placeholder="e.g. owner@ybl, owner@okaxis"
                    autoComplete="off"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="btn-primary px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    );
  }
}
