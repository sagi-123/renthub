import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Building2, User, Lock, ArrowRight, Home, CreditCard,
  FileText, Download, LogOut, Sun, Moon, Check, X,
  AlertCircle, Shield, FileCheck, RefreshCw, Send,
  HelpCircle, Sparkles, Receipt, PenTool, CheckCircle2, Phone, Mail, Menu
} from "lucide-react";
import { syncCollection, saveCollection, saveRecord, supabase } from "../lib/supabase";
import { createRazorpayOrder } from "../lib/api/razorpay";
import { sendOtpEmail } from "../lib/api/email";

export const Route = createFileRoute("/tenant")({
  component: TenantPortal,
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
  createdAt?: string;
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
  history?: AgreementHistoryItem[];
}

interface PaymentRecord {
  id: string;
  landlordId?: string;
  tenantId: string;
  tenantName: string;
  unit: string;
  amount: number;
  date: string;
  method: "UPI" | "Card" | "Netbanking";
  status: "Success" | "Failed";
  transactionId: string;
}

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


interface RenewalRequest {
  id: string;
  landlordId?: string;
  tenantId: string;
  tenantName: string;
  unit: string;
  requestedAt: string;
  status: "Pending" | "Approved" | "Declined";
  notes?: string;
}

const INITIAL_TENANTS: Tenant[] = [];
const INITIAL_AGREEMENTS: Agreement[] = [];
const INITIAL_PAYMENTS: PaymentRecord[] = [];

/* ── Payment Validation Helpers ────────────────────────── */
const validateLuhn = (cardNumber: string): boolean => {
  const sanitized = cardNumber.replace(/\D/g, "");
  if (sanitized.length < 13 || sanitized.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const validateExpiry = (expiry: string): boolean => {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
  const [monthStr, yearStr] = expiry.split("/");
  const month = parseInt(monthStr, 10);
  const year = parseInt("20" + yearStr, 10);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
};

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

function TenantPortal() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const { dark, toggle: toggleDark } = useDarkMode();
  const [activeTab, setActiveTab] = useState<"dashboard" | "payments" | "agreement" | "settings">("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ── Database State ────────────────────────────────── */
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [renewals, setRenewals] = useState<RenewalRequest[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [landlordInfo, setLandlordInfo] = useState<any>(null);
  const [isMobileDev, setIsMobileDev] = useState(false);

  useEffect(() => {
    setIsMobileDev(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Load Razorpay Checkout SDK on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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

  /* ── Sign-In State ─────────────────────────────────── */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantUnit, setTenantUnit] = useState("");
  const [tenantRent, setTenantRent] = useState("");
  const [landlordEmail, setLandlordEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [tempTenantData, setTempTenantData] = useState<any>(null); // for sign-up landlord linking

  /* ── Interactive Modal States ──────────────────────── */
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<"UPI" | "Card" | "Netbanking">("UPI");
  const [payProgress, setPayProgress] = useState(-1);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [payStep, setPayStep] = useState<"method" | "details" | "otp">("method");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState(""); // shown on-screen when RESEND_API_KEY not set
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [upiOption, setUpiOption] = useState<"intent" | "qr">("intent");
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");
  const [upiTxnId, setUpiTxnId] = useState("");
  const [lastTxnId, setLastTxnId] = useState("");
  const [cardOtp, setCardOtp] = useState("");
  const [upiPendingVerification, setUpiPendingVerification] = useState(false);
  const [isCreatingRazorpayOrder, setIsCreatingRazorpayOrder] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{1,4}/g);
    return matches ? matches.join(" ").substring(0, 19) : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const openPaymentModal = () => {
    setPayStep("method");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardName("");
    setSelectedBank("");
    setOtpCode("");
    setUpiTxnId("");
    setLastTxnId("");
    setCardOtp("");
    setUpiPendingVerification(false);
    setShowPayModal(true);
  };

  const [showSignModal, setShowSignModal] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");
  const [drawSignature, setDrawSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalNotes, setRenewalNotes] = useState("");
  const [renewalRequested, setRenewalRequested] = useState(false);

  /* ── Toast Notifications ───────────────────────────── */
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "info" | "error" }[]>([]);
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  /* ── Supabase & LocalStorage Synchronizer ─────────────────────── */
  useEffect(() => {
    async function loadData() {
      setMounted(true);

      const sessionTenant = sessionStorage.getItem("rh_logged_in_tenant");
      const parsedTenant = sessionTenant ? JSON.parse(sessionTenant) : null;

      if (!parsedTenant) {
        setTenants([]);
        setAgreements([]);
        setPayments([]);
        setRenewals([]);
        setLandlordInfo(null);
        return;
      }

      const tenantIdSuffix = `_${parsedTenant.id}`;
      const tenantEmailLower = parsedTenant.email.toLowerCase().trim();
      const landlordId = parsedTenant.landlordId || "";
      const tenantFilter = `tenantId=eq.${encodeURIComponent(parsedTenant.id)}`;
      const emailFilter = `email=eq.${encodeURIComponent(tenantEmailLower)}`;

      // ── Tenants ──────────────────────────────────────────────────────
      let syncedTenants = await syncCollection<Tenant>(
        "rh_tenants", `rh_tenants${tenantIdSuffix}`, INITIAL_TENANTS, emailFilter
      );

      // Sync landlord's local edits directly if they share the same browser storage
      if (landlordId) {
        const landlordTenantsStr = localStorage.getItem(`rh_tenants_${landlordId}`);
        if (landlordTenantsStr) {
          const landlordTenants = JSON.parse(landlordTenantsStr) as Tenant[];
          const landlordVersion = landlordTenants.find(
            t => t.email && t.email.toLowerCase().trim() === tenantEmailLower
          );
          if (landlordVersion) {
            // ⚠️ Detect re-registration: landlord has a NEWER ID for this email
            if (landlordVersion.id !== parsedTenant.id) {
              // Clear stale caches for the old tenant ID
              localStorage.removeItem(`rh_tenants_${parsedTenant.id}`);
              localStorage.removeItem(`rh_agreements_${parsedTenant.id}`);
              localStorage.removeItem(`rh_payments_${parsedTenant.id}`);
              localStorage.removeItem(`rh_renewals_${parsedTenant.id}`);
              // Update session with the new tenant record
              sessionStorage.setItem("rh_logged_in_tenant", JSON.stringify(landlordVersion));
              // Restart loadData with the new tenant — trigger re-run via syncTrigger
              setSyncTrigger(prev => prev + 1);
              return;
            }
            if (syncedTenants.length > 0) {
              syncedTenants = syncedTenants.map(st =>
                st.id === landlordVersion.id || (st.email && st.email.toLowerCase().trim() === landlordVersion.email.toLowerCase().trim())
                  ? { ...st, ...landlordVersion }
                  : st
              );
            } else {
              syncedTenants = [landlordVersion];
            }
          }
        }
      }
      setTenants(syncedTenants);

      // ── Agreements ───────────────────────────────────────────────────
      // Strategy: filter by landlordId on Supabase (core column — always exists),
      // then narrow down client-side to only THIS tenant's agreements.
      // This is more reliable than filtering by tenantEmail which may not be a DB column.
      let syncedAgreements: Agreement[] = [];

      if (landlordId) {
        const landlordAgreementFilter = `landlordId=eq.${encodeURIComponent(landlordId)}`;
        let allLandlordAgreements = await syncCollection<Agreement>(
          "rh_agreements", `rh_agreements${tenantIdSuffix}`, INITIAL_AGREEMENTS, landlordAgreementFilter
        );

        // Merge with landlord's local storage copy to pick up latest edits/signatures
        const landlordAgreementsStr = localStorage.getItem(`rh_agreements_${landlordId}`);
        if (landlordAgreementsStr) {
          const landlordAgreements = JSON.parse(landlordAgreementsStr) as Agreement[];
          landlordAgreements.forEach(la => {
            const idx = allLandlordAgreements.findIndex(a => a.id === la.id);
            if (idx >= 0) {
              allLandlordAgreements[idx] = { ...allLandlordAgreements[idx], ...la };
            } else {
              allLandlordAgreements.push(la);
            }
          });
        }

        // Filter client-side: match by tenantEmail first, then fall back to tenantName
        syncedAgreements = allLandlordAgreements.filter(a =>
          (a.tenantEmail && a.tenantEmail.toLowerCase().trim() === tenantEmailLower) ||
          a.tenantName === parsedTenant.name
        );
      } else {
        // Fallback: try direct tenantEmail filter (for self-registered tenants without landlordId)
        const agreementFilter = `tenantEmail=eq.${encodeURIComponent(tenantEmailLower)}`;
        const allMatched = await syncCollection<Agreement>(
          "rh_agreements", `rh_agreements${tenantIdSuffix}`, INITIAL_AGREEMENTS, agreementFilter
        );
        syncedAgreements = allMatched;
      }
      setAgreements(syncedAgreements);

      // ── Payments ─────────────────────────────────────────────────────
      let syncedPayments = await syncCollection<PaymentRecord>(
        "rh_payments", `rh_payments${tenantIdSuffix}`, INITIAL_PAYMENTS, tenantFilter
      );
      if (syncedPayments.length === 0 && landlordId) {
        const landlordPaymentsStr = localStorage.getItem(`rh_payments_${landlordId}`);
        if (landlordPaymentsStr) {
          const landlordPayments = JSON.parse(landlordPaymentsStr) as PaymentRecord[];
          syncedPayments = landlordPayments.filter(p => p.tenantId === parsedTenant.id);
        }
      }
      setPayments(syncedPayments);

      // ── Renewals ──────────────────────────────────────────────────────
      let syncedRenewals = await syncCollection<RenewalRequest>(
        "rh_renewals", `rh_renewals${tenantIdSuffix}`, [], tenantFilter
      );
      if (syncedRenewals.length === 0 && landlordId) {
        const landlordRenewalsStr = localStorage.getItem(`rh_renewals_${landlordId}`);
        if (landlordRenewalsStr) {
          const landlordRenewals = JSON.parse(landlordRenewalsStr) as RenewalRequest[];
          syncedRenewals = landlordRenewals.filter(r => r.tenantId === parsedTenant.id);
        }
      }
      setRenewals(syncedRenewals);

      setCurrentTenant(parsedTenant);

      if (parsedTenant && parsedTenant.landlordId) {
        setLandlordInfo(null); // Clear stale info before fetching new
        try {
          const lIdFilter = `id=eq.${encodeURIComponent(parsedTenant.landlordId)}`;
          const landlords = await supabase.from("rh_landlords").select("*", lIdFilter) as any[];
          if (landlords && landlords.length > 0) {
            setLandlordInfo(landlords[0]);
          } else {
            // fallback: check local storage for rh_logged_in_landlord or rh_landlords list
            const savedL = sessionStorage.getItem("rh_logged_in_landlord") || localStorage.getItem("rh_logged_in_landlord");
            if (savedL) {
              const parsedL = JSON.parse(savedL);
              if (parsedL.id === parsedTenant.landlordId) {
                setLandlordInfo(parsedL);
              }
            } else {
              const localLandlordsStr = localStorage.getItem("rh_landlords");
              if (localLandlordsStr) {
                const localLandlords = JSON.parse(localLandlordsStr) as any[];
                const match = localLandlords.find(l => l.id === parsedTenant.landlordId);
                if (match) {
                  setLandlordInfo(match);
                }
              }
            }
          }
        } catch (e) {
          console.warn("Failed to fetch landlord details:", e);
        }
      }
    }
    loadData();
  }, [currentTenant?.id, syncTrigger]);

  // Sync currentTenant updates back from local storage if database changes
  useEffect(() => {
    if (currentTenant) {
      const fresh = tenants.find(t => t.id === currentTenant.id || (t.email && t.email.toLowerCase().trim() === currentTenant.email.toLowerCase().trim()));
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(currentTenant)) {
        setCurrentTenant(fresh);
        sessionStorage.setItem("rh_logged_in_tenant", JSON.stringify(fresh));
      }
    }
  }, [tenants, currentTenant]);

  /* ── Database Saving Functions ─────────────────────── */
  const saveTenants = (newTenants: Tenant[]) => {
    setTenants(newTenants);
    const tenantId = currentTenant ? currentTenant.id : "";
    const landlordId = currentTenant ? currentTenant.landlordId : "";
    saveCollection("rh_tenants", `rh_tenants_${tenantId}`, newTenants);

    // Perfect sync back to the landlord's tenant cache key on the same browser
    if (landlordId) {
      const landlordTenantsStr = localStorage.getItem(`rh_tenants_${landlordId}`);
      if (landlordTenantsStr) {
        let landlordTenants = JSON.parse(landlordTenantsStr) as Tenant[];
        newTenants.forEach(nt => {
          const idx = landlordTenants.findIndex(lt => lt.id === nt.id || lt.email.toLowerCase().trim() === nt.email.toLowerCase().trim());
          if (idx >= 0) {
            landlordTenants[idx] = { ...landlordTenants[idx], ...nt };
          } else {
            landlordTenants.push(nt);
          }
        });
        saveCollection("rh_tenants", `rh_tenants_${landlordId}`, landlordTenants);
      }
    }
  };

  const saveAgreements = (newAgreements: Agreement[]) => {
    setAgreements(newAgreements);
    const tenantId = currentTenant ? currentTenant.id : "";
    const landlordId = currentTenant ? currentTenant.landlordId : "";
    saveCollection("rh_agreements", `rh_agreements_${tenantId}`, newAgreements);

    // Perfect sync back to the landlord's agreement cache key on the same browser
    if (landlordId) {
      const landlordAgreementsStr = localStorage.getItem(`rh_agreements_${landlordId}`);
      if (landlordAgreementsStr) {
        let landlordAgreements = JSON.parse(landlordAgreementsStr) as Agreement[];
        newAgreements.forEach(na => {
          const idx = landlordAgreements.findIndex(la => la.id === na.id);
          if (idx >= 0) {
            landlordAgreements[idx] = { ...landlordAgreements[idx], ...na };
          } else {
            landlordAgreements.push(na);
          }
        });
        saveCollection("rh_agreements", `rh_agreements_${landlordId}`, landlordAgreements);
      }
    }
  };

  const savePayments = (newPayments: PaymentRecord[]) => {
    setPayments(newPayments);
    const tenantId = currentTenant ? currentTenant.id : "";
    const landlordId = currentTenant ? currentTenant.landlordId : "";
    saveCollection("rh_payments", `rh_payments_${tenantId}`, newPayments);

    // Perfect sync back to the landlord's payments cache key on the same browser
    if (landlordId) {
      const landlordPaymentsStr = localStorage.getItem(`rh_payments_${landlordId}`);
      let landlordPayments = landlordPaymentsStr ? JSON.parse(landlordPaymentsStr) as PaymentRecord[] : [];
      newPayments.forEach(np => {
        const idx = landlordPayments.findIndex(lp => lp.id === np.id);
        if (idx >= 0) {
          landlordPayments[idx] = np;
        } else {
          landlordPayments.unshift(np);
        }
      });
      saveCollection("rh_payments", `rh_payments_${landlordId}`, landlordPayments);
    }
  };

  const saveRenewals = (newRenewals: RenewalRequest[]) => {
    setRenewals(newRenewals);
    const tenantId = currentTenant ? currentTenant.id : "";
    const landlordId = currentTenant ? currentTenant.landlordId : "";
    saveCollection("rh_renewals", `rh_renewals_${tenantId}`, newRenewals);

    // Perfect sync back to the landlord's renewals cache key on the same browser
    if (landlordId) {
      const landlordRenewalsStr = localStorage.getItem(`rh_renewals_${landlordId}`);
      let landlordRenewals = landlordRenewalsStr ? JSON.parse(landlordRenewalsStr) : [];
      newRenewals.forEach(nr => {
        const idx = landlordRenewals.findIndex((lr: any) => lr.id === nr.id);
        if (idx >= 0) {
          landlordRenewals[idx] = nr;
        } else {
          landlordRenewals.unshift(nr);
        }
      });
      saveCollection("rh_renewals", `rh_renewals_${landlordId}`, landlordRenewals);
    }
  };

  /* ── Actions & Handlers ────────────────────────────── */

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      setLoginError("Please enter your registered email address.");
      return;
    }

    const emailLower = loginEmail.toLowerCase().trim();

    try {
      // 1. Try Supabase first — get ALL records for this email, pick the NEWEST one
      const emailFilter = `email=eq.${encodeURIComponent(emailLower)}&order=createdAt.desc`;
      const tenantsList = await supabase.from("rh_tenants").select("*", emailFilter) as Tenant[];

      if (tenantsList && tenantsList.length > 0) {
        // Take the most recently created record (newest registration)
        const tenant = tenantsList[0];

        // Clear stale personal caches for ANY older tenant IDs with this email
        tenantsList.slice(1).forEach(oldRecord => {
          localStorage.removeItem(`rh_tenants_${oldRecord.id}`);
          localStorage.removeItem(`rh_agreements_${oldRecord.id}`);
          localStorage.removeItem(`rh_payments_${oldRecord.id}`);
          localStorage.removeItem(`rh_renewals_${oldRecord.id}`);
        });
        // Also clear the personal cache for this tenant ID to force a fresh load
        localStorage.removeItem(`rh_tenants_${tenant.id}`);
        localStorage.removeItem(`rh_agreements_${tenant.id}`);

        setCurrentTenant(tenant);
        sessionStorage.setItem("rh_logged_in_tenant", JSON.stringify(tenant));
        setLoginError("");
        setLoginEmail("");
        showToast(`Welcome back, ${tenant.name}!`);
        return;
      }
    } catch (_) {
      // Supabase unreachable — fall through to localStorage
    }

    // 2. Fallback: search landlord master lists FIRST (most up-to-date),
    // then personal caches. Always prefer the record with the latest createdAt.
    let localTenant: Tenant | null = null;
    let latestCreatedAt = "";

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("rh_tenants_")) {
          const items = JSON.parse(localStorage.getItem(key) || "[]") as Tenant[];
          const found = items.find(t => t.email && t.email.toLowerCase().trim() === emailLower);
          if (found) {
            const foundAt = found.createdAt || "";
            // Pick the newest record by createdAt
            if (!localTenant || foundAt > latestCreatedAt) {
              localTenant = found;
              latestCreatedAt = foundAt;
            }
          }
        }
      }
    } catch (_) { }

    if (localTenant) {
      // Clear stale personal cache to force fresh sync on load
      localStorage.removeItem(`rh_tenants_${localTenant.id}`);
      localStorage.removeItem(`rh_agreements_${localTenant.id}`);
      setCurrentTenant(localTenant);
      sessionStorage.setItem("rh_logged_in_tenant", JSON.stringify(localTenant));
      setLoginError("");
      setLoginEmail("");
      showToast(`Welcome back, ${localTenant.name}!`);
    } else {
      setLoginError("Tenant email not found. Please contact your Landlord to register your email or sign up below.");
    }
  };

  const handleTenantSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !tenantName || !tenantPhone || !tenantUnit || !tenantRent || !landlordEmail) {
      setLoginError("All fields are required, including your Landlord's email.");
      return;
    }
    try {
      // 1. Look up landlord by email to get their landlordId
      const landlordFilter = `email=eq.${encodeURIComponent(landlordEmail.toLowerCase().trim())}`;
      const landlords = await supabase.from("rh_landlords").select("*", landlordFilter) as any[];
      const landlord = landlords && landlords[0];
      if (!landlord) {
        setLoginError("Landlord email not found. Please enter your landlord's registered email address.");
        return;
      }

      // 2. Check if tenant email already exists
      const tenantEmailFilter = `email=eq.${encodeURIComponent(loginEmail.toLowerCase().trim())}`;
      const existingTenants = await supabase.from("rh_tenants").select("id", tenantEmailFilter) as any[];
      const emailExists = existingTenants && existingTenants.length > 0;
      if (emailExists) {
        setLoginError("Email is already registered. Please sign in.");
        return;
      }

      // 3. Create tenant record linked to the landlord
      const newTenant: Tenant = {
        id: "t-" + Math.random().toString(36).substring(7),
        landlordId: landlord.id,
        name: tenantName.trim(),
        email: loginEmail.toLowerCase().trim(),
        phone: tenantPhone.trim(),
        unit: tenantUnit.trim(),
        rentAmount: Number(tenantRent),
        depositAmount: Number(tenantRent) * 1.5,
        paymentStatus: "Unpaid",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        leaseStart: new Date().toISOString().split('T')[0],
        leaseEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      // Cache the new tenant data temporarily for OTP verification
      setTempTenantData({
        newTenant,
        landlord
      });

      showToast(`Account linked to ${landlord.name || "your landlord"}! Please verify email.`);
      setShowOtp(true);
      showToast("Your verification OTP is: 1234"); // Simulated email

    } catch (err) {
      console.error(err);
      setLoginError("Registration failed. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "1234") {
      setLoginError("Invalid OTP. Please try '1234'.");
      return;
    }

    const { newTenant, landlord } = tempTenantData;

    try {
      const landlordTenantsStr = localStorage.getItem(`rh_tenants_${landlord.id}`);
      const landlordTenants = landlordTenantsStr ? JSON.parse(landlordTenantsStr) as Tenant[] : [];
      const updated = await saveRecord("rh_tenants", `rh_tenants_${landlord.id}`, newTenant, landlordTenants);
      setTenants(updated);
      setCurrentTenant(newTenant);
      sessionStorage.setItem("rh_logged_in_tenant", JSON.stringify(newTenant));
      setLoginError("");
      setLoginEmail("");
      setLandlordEmail("");
      setTenantName("");
      setTenantPhone("");
      setTenantUnit("");
      setTenantRent("");
      setShowOtp(false);
      setTempTenantData(null);
      showToast("Email verified successfully!");
    } catch (err) {
      console.error(err);
      setLoginError("Failed to save verified tenant.");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    if (isSignUp) {
      handleTenantSignUp(e);
    } else {
      handleLogin(e);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    sessionStorage.removeItem("rh_logged_in_tenant");
    setCurrentTenant(null);
    setLandlordInfo(null);
    setActiveTab("dashboard");
    showToast("Logged out successfully.", "info");
  };

  const initiateRazorpayCheckout = async () => {
    if (!currentTenant) return;
    setIsCreatingRazorpayOrder(true);
    try {
      const res = await createRazorpayOrder({
        data: {
          amount: currentTenant.rentAmount,
          receiptId: "rcpt_" + Math.random().toString(36).substring(4),
          landlordAccountId: landlordInfo?.razorpay_account_id,
          unitName: currentTenant.unit
        }
      });

      if (res.success && res.orderId) {
        const options = {
          key: res.keyId,
          amount: res.amount,
          currency: "INR",
          name: "RentHub Payments",
          description: `Rent Payment for Unit ${currentTenant.unit}`,
          order_id: res.orderId,
          handler: function (response: any) {
            handlePayRent(response.razorpay_payment_id);
          },
          prefill: {
            name: currentTenant.name,
            email: currentTenant.email,
            contact: currentTenant.phone
          },
          theme: {
            color: "#0d9488"
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else if (res.mockOrderId) {
        showToast("Demo Checkout: Razorpay Keys missing in .env. Simulating checkout...", "info");
        setTimeout(() => {
          handlePayRent(res.mockOrderId);
        }, 1500);
      } else {
        showToast(res.error || "Failed to create Razorpay checkout order.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to communicate with Razorpay services.", "error");
    } finally {
      setIsCreatingRazorpayOrder(false);
    }
  };

  // Pay Rent Handler
  const handlePayRent = (overrideTxnId?: string) => {
    if (!currentTenant) return;
    setPayProgress(0);
    setPaymentSuccess(false);

    // Build real/realistic transaction ID based on method
    const txnId = overrideTxnId || (payMethod === "UPI"
      ? upiTxnId.trim()
      : "CRD-" + Math.floor(100000000000 + Math.random() * 900000000000));
    setLastTxnId(txnId);

    const interval = setInterval(() => {
      setPayProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Update Tenant Status to Paid
            const updatedTenants = tenants.map(t =>
              t.id === currentTenant.id ? { ...t, paymentStatus: "Paid" as const } : t
            );
            saveTenants(updatedTenants);

            // Record Payment
            const newPayment: PaymentRecord = {
              id: "p-" + Math.random().toString(36).substring(4),
              landlordId: currentTenant.landlordId || "",
              tenantId: currentTenant.id,
              tenantName: currentTenant.name,
              unit: currentTenant.unit,
              amount: currentTenant.rentAmount,
              date: new Date().toISOString().split("T")[0],
              method: payMethod,
              status: "Success",
              transactionId: txnId
            };
            savePayments([newPayment, ...payments]);

            setPaymentSuccess(true);
            setPayProgress(-1);
            showToast(`Rent of ₹${currentTenant.rentAmount.toLocaleString()} paid successfully!`);
          }, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  // Signature Pad Helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = dark ? "#2fcfcc" : "#0F9D9A";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Submit Digital Signature
  const handleSignAgreement = () => {
    if (!currentTenant) return;
    if (!drawSignature && !typedSignature.trim()) {
      showToast("Please type your name to sign.", "error");
      return;
    }

    let sigValue: string = typedSignature.trim();
    let sigType: "type" | "draw" = "type";

    if (drawSignature) {
      const canvas = canvasRef.current;
      if (!canvas) {
        showToast("Signature canvas not found.", "error");
        return;
      }
      sigValue = canvas.toDataURL("image/png");
      sigType = "draw";
    }

    // Match agreement by email first (reliable), then name fallback
    const updatedAgreements = agreements.map(a => {
      const matches =
        (a.tenantEmail && a.tenantEmail.toLowerCase() === currentTenant.email.toLowerCase()) ||
        a.tenantName === currentTenant.name;
      if (!matches) return a;
      return {
        ...a,
        status: "Active" as const,
        tenantSignature: sigValue,
        tenantSignatureType: sigType,
        tenantSignedAt: a.startDate,
      };
    });
    saveAgreements(updatedAgreements);

    setShowSignModal(false);
    setTypedSignature("");
    showToast("Agreement signed successfully! Your lease is now Active.");
  };

  // Submit Renewal Request
  const handleRequestRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    const newRequest: RenewalRequest = {
      id: "ren-" + Math.random().toString(36).substring(4),
      landlordId: currentTenant.landlordId || "",
      tenantId: currentTenant.id,
      tenantName: currentTenant.name,
      unit: currentTenant.unit,
      requestedAt: new Date().toISOString().split("T")[0],
      status: "Pending",
      notes: renewalNotes
    };

    saveRenewals([newRequest, ...renewals]);
    setRenewalNotes("");
    setShowRenewalModal(false);
    setRenewalRequested(true);
    showToast("Lease renewal request sent to the owner.");
  };

  // Download receipt simulated action
  const handleDownloadReceipt = (record: PaymentRecord) => {
    showToast(`Downloading receipt for ${record.unit}...`);
    setTimeout(() => {
      const content = "RentHub Rent Payment Receipt\n" +
        "=====================================\n" +
        `Receipt ID: RCPT-${record.id.toUpperCase()}\n` +
        `Transaction ID: ${record.transactionId}\n` +
        `Date of Payment: ${record.date}\n` +
        `Status: ${record.status}\n\n` +
        `Received From: ${record.tenantName}\n` +
        `Designated Unit: ${record.unit}\n` +
        `Amount Paid: INR ${record.amount.toLocaleString()}\n` +
        `Payment Method: ${record.method}\n\n` +
        "Thank you for paying your rent on time!\n" +
        "RentHub Automated Payment System";

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `renthub_receipt_${record.unit.replace(/\s+/g, "_")}_${record.date}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Receipt downloaded successfully!");
    }, 1000);
  };

  // Helper selectors for the current tenant
  // Match agreement by email (more reliable than name) with fallback to name
  const tenantAgreement = currentTenant
    ? (agreements.find(a => a.tenantEmail === currentTenant.email) ||
      agreements.find(a => a.tenantName === currentTenant.name))
    : null;
  const tenantPayments = currentTenant ? payments.filter(p => p.tenantId === currentTenant.id) : [];
  const tenantRenewalRequest = currentTenant ? renewals.find(r => r.tenantId === currentTenant.id) : null;

  if (!mounted) {
    return (
      <div className="h-screen bg-background text-foreground flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  /* ──────────────────────────────────────────────────── */
  /* ── 1. LOGIN SCREEN ───────────────────────────────── */
  /* ──────────────────────────────────────────────────── */
  if (!currentTenant) {
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
                Tenant Portal
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white dark:bg-card border rounded-2xl p-8 shadow-xl space-y-6">
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-bold tracking-tight font-display text-foreground">
                  {isSignUp ? "Register Tenant Profile" : "Tenant Sign In"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isSignUp
                    ? "Enter your details to create your tenant account and start tracking payments."
                    : "Enter your email address to access agreements, receipts, and pay rent."}
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/40 rounded-xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {isSignUp && (
                  <>
                    {/* Landlord linking — must be first so tenants can be scoped */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Landlord's Email Address</label>
                      <div className="relative">
                        <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          value={landlordEmail}
                          onChange={e => setLandlordEmail(e.target.value)}
                          placeholder="landlord@example.com"
                          className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Enter your landlord's registered email to link your account.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          value={tenantName}
                          onChange={e => setTenantName(e.target.value)}
                          placeholder="Priya Patel"
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
                          value={tenantPhone}
                          onChange={e => setTenantPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Unit / Apartment Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          value={tenantUnit}
                          onChange={e => setTenantUnit(e.target.value)}
                          placeholder="Apartment 4B"
                          className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Monthly Rent Amount (INR)</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="number"
                          required
                          value={tenantRent}
                          onChange={e => setTenantRent(e.target.value)}
                          placeholder="25000"
                          className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                >
                  {isSignUp ? "Register Account" : "Sign In"} <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="text-center text-xs text-muted-foreground pt-2">
                {isSignUp ? "Already have a tenant profile?" : "New tenant?"}{" "}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setLoginError(""); }}
                  className="text-teal-600 dark:text-teal-400 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  {isSignUp ? "Sign In here" : "Register profile"}
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

        {/* OTP Verification Modal */}
        {showOtp && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in text-center">
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Verify your email</h3>
              <p className="text-xs text-muted-foreground mb-6">
                We've sent a 4-digit code to <strong>{loginEmail}</strong>. Enter it below to verify your account.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <input
                    required
                    type="text"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP (1234)"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn-primary py-3 rounded-xl font-bold text-sm shadow-md"
                >
                  Verify & Continue
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtp(false)}
                  className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground font-semibold"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ──────────────────────────────────────────────────── */
  /* ── 2. PORTAL WORKSPACE ───────────────────────────── */
  /* ──────────────────────────────────────────────────── */
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
              Tenant
            </span>
          </div>

          {/* Tenant Quick Info */}
          <div className="p-4 border-b flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-teal-500 text-white font-bold flex items-center justify-center">
              {currentTenant.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold truncate">{currentTenant.name}</div>
              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">{currentTenant.unit}</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: Home },
              { id: "payments", label: "Rent & Receipts", icon: CreditCard },
              { id: "agreement", label: "Lease Agreement", icon: FileText },
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
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                    ? "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 border-l-2 border-teal-500 pl-3.5"
                    : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-foreground"
                    }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${active ? "text-teal-500" : ""}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl ring-1 ring-slate-100 dark:ring-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-teal-600 dark:text-teal-400 transition-colors"
              title="Toggle Theme"
            >
              {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <button
              onClick={handleLogout}
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
        <header className="min-h-20 border-b bg-white dark:bg-card px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm sticky top-0 z-30">
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
                {activeTab === "dashboard" && "Renter Command Center"}
                {activeTab === "payments" && "Rent Billing & Vault"}
                {activeTab === "agreement" && "Signed Lease & Legal Agreements"}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                {activeTab === "dashboard" && "Real-time summary of lease terms, rent schedules, and quick actions"}
                {activeTab === "payments" && "Complete your monthly payments and download receipt statement ledgers"}
                {activeTab === "agreement" && "Check lease compliance, sign pending contracts, or request renewals"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap md:flex-nowrap">
            {currentTenant.paymentStatus !== "Paid" && (
              <button
                onClick={openPaymentModal}
                className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <CreditCard className="h-4 w-4" /> Pay Rent
              </button>
            )}

            {tenantAgreement?.status === "Pending Signature" && (
              <button
                onClick={() => setShowSignModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all shadow-md animate-pulse hover:scale-[1.02] active:scale-[0.98]"
              >
                <PenTool className="h-4 w-4" /> Sign Lease
              </button>
            )}

            <div className="hidden sm:block h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-bold flex items-center justify-center text-sm border border-teal-200 dark:border-teal-900/50">
                {currentTenant.name.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold">{currentTenant.name}</div>
                <div className="text-[10px] text-muted-foreground">{currentTenant.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-8 space-y-8 max-w-6xl w-full mx-auto">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "payments" && renderPayments()}
          {activeTab === "agreement" && renderAgreement()}
        </div>
      </main>

      {/* ──────────────────────────────────────────────────── */}
      {/* ── 3. MODALS & WIZARDS ───────────────────────────── */}
      {/* ──────────────────────────────────────────────────── */}

      {/* A. Pay Rent Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-reveal">

            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg font-display text-foreground">Secure Rent Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {!paymentSuccess && payProgress === -1 ? (
                <>
                  {/* Step 1: Pay Method Selector */}
                  {payStep === "method" && (
                    <div className="space-y-6">
                      <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Amount Due</p>
                            <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">
                              ₹{currentTenant.rentAmount.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-foreground">{currentTenant.unit}</p>
                            <p className="text-[10px] text-muted-foreground">Due on: {currentTenant.dueDate}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-teal-100 dark:border-teal-900/50 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">UPI Payment — GPay, PhonePe, BHIM, Paytm</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t flex justify-end gap-2">
                        <button
                          onClick={() => setShowPayModal(false)}
                          className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setPayStep("details")}
                          className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                        >
                          Proceed to Pay
                        </button>
                      </div>
                    </div>
                  )}


                  {/* Step 2: UPI details screen */}
                  {payStep === "details" && payMethod === "UPI" && (() => {
                    const recipientUpi = landlordInfo?.upiId || "renthub@ybl";
                    const recipientName = landlordInfo?.name || "RentHub";
                    const upiUrl = `upi://pay?pa=${encodeURIComponent(recipientUpi)}&pn=${encodeURIComponent(recipientName)}&am=${currentTenant.rentAmount}&cu=INR&tn=Rent%20for%20Unit%20${encodeURIComponent(currentTenant.unit)}`;
                    return (
                      <div className="space-y-6">
                        {upiPendingVerification ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2 text-xs text-amber-800 dark:text-amber-300">
                              <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                Payment Verification Pending
                              </p>
                              <p className="leading-relaxed">
                                We have launched your selected UPI app. Please complete the transaction in GPay/PhonePe and enter the 12-digit transaction ID (UTR) below to confirm your payment.
                              </p>
                            </div>

                            <div className="space-y-2.5">
                              <label className="text-xs font-bold text-muted-foreground block">Confirm Transaction ID (UTR)</label>
                              <input
                                type="text"
                                maxLength={12}
                                value={upiTxnId}
                                onChange={e => setUpiTxnId(e.target.value.replace(/[^0-9]/g, "").substring(0, 12))}
                                placeholder="e.g. 314567890123"
                                className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                              />
                            </div>

                            <div className="pt-4 border-t flex justify-between gap-2">
                              <button
                                onClick={() => setUpiPendingVerification(false)}
                                className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                              >
                                Back
                              </button>
                              <button
                                onClick={() => {
                                  if (!/^[0-9]{12}$/.test(upiTxnId)) {
                                    showToast("Please enter a valid 12-digit UPI transaction ID (UTR)", "error");
                                    return;
                                  }
                                  handlePayRent();
                                }}
                                className="btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
                              >
                                Confirm & Submit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Display landlord UPI ID if available */}
                            {landlordInfo?.upiId && (
                              <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-950/20 rounded-xl flex justify-between items-center text-xs">
                                <div>
                                  <span className="text-muted-foreground">Recipient UPI:</span>
                                  <p className="font-bold text-teal-600 dark:text-teal-400 font-mono mt-0.5 select-all">{landlordInfo.upiId}</p>
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground">{landlordInfo.name}</span>
                              </div>
                            )}

                            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                              <button
                                onClick={() => setUpiOption("intent")}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${upiOption === "intent" ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground"
                                  }`}
                              >
                                Pay via UPI App
                              </button>
                              <button
                                onClick={() => setUpiOption("qr")}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${upiOption === "qr" ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground"
                                  }`}
                              >
                                Scan QR Code
                              </button>
                            </div>

                            {upiOption === "intent" ? (
                              <div className="space-y-4">
                                {!isMobileDev ? (
                                  <div className="py-6 px-4 bg-slate-50 dark:bg-slate-900/40 border rounded-2xl text-center space-y-2">
                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Mobile Device Required</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                      App launch is only available on mobile devices. Please scan the QR code to pay.
                                    </p>
                                    <button
                                      onClick={() => setUpiOption("qr")}
                                      className="mt-2 text-xs font-bold text-teal-600 hover:text-teal-500 underline"
                                    >
                                      Switch to Scan QR Code
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <label className="text-xs font-bold text-muted-foreground block text-center">Tap any UPI App to Pay</label>
                                    <div className="grid grid-cols-2 gap-3.5">
                                      {[
                                        { id: "gpay", name: "Google Pay", scheme: "upi://" },
                                        { id: "phonepe", name: "PhonePe", scheme: "phonepe://" },
                                        { id: "paytm", name: "Paytm", scheme: "paytmmp://" },
                                        { id: "bhim", name: "BHIM UPI", scheme: "upi://" }
                                      ].map(app => (
                                        <button
                                          key={app.id}
                                          onClick={() => {
                                            setSelectedUpiApp(app.id);
                                            const targetUrl = upiUrl.replace("upi://", app.scheme);
                                            window.location.href = targetUrl;
                                            showToast(`Launching ${app.name}...`, "info");

                                            setTimeout(() => {
                                              setUpiPendingVerification(true);
                                            }, 1000);
                                          }}
                                          className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${selectedUpiApp === app.id
                                            ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-bold"
                                            : "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-muted-foreground"
                                            }`}
                                        >
                                          <div className={`h-2.5 w-2.5 rounded-full ${selectedUpiApp === app.id ? "bg-teal-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`} />
                                          <span className="text-xs font-semibold">{app.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4 flex flex-col items-center justify-center">
                                <div className="p-3 bg-white border shadow-sm rounded-2xl flex flex-col items-center justify-center font-sans">
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}`}
                                    alt="RentHub UPI Payment QR Code"
                                    className="h-40 w-40 object-contain"
                                  />
                                  <div className="mt-2 text-[9px] tracking-widest font-sans font-bold text-slate-400 uppercase">
                                    SCAN TO PAY UPI
                                  </div>
                                </div>

                                <div className="text-center text-xs text-muted-foreground max-w-xs leading-relaxed">
                                  Open BHIM, GPay, PhonePe, Paytm, or any banking app to scan this QR code and pay.
                                </div>

                                {/* UTR Verification Field for QR Code */}
                                <div className="w-full mt-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 space-y-3 text-left">
                                  <label className="text-xs font-bold text-foreground block">
                                    Confirm Transaction ID (UTR)
                                  </label>
                                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Once payment is completed in your app, copy and enter the 12-digit transaction ID (UTR) below to notify your landlord:
                                  </p>
                                  <input
                                    type="text"
                                    maxLength={12}
                                    value={upiTxnId}
                                    onChange={e => setUpiTxnId(e.target.value.replace(/[^0-9]/g, "").substring(0, 12))}
                                    placeholder="e.g. 314567890123"
                                    className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                                  />
                                  <button
                                    onClick={() => {
                                      if (!/^[0-9]{12}$/.test(upiTxnId)) {
                                        showToast("Please enter a valid 12-digit UPI transaction ID (UTR)", "error");
                                        return;
                                      }
                                      handlePayRent();
                                    }}
                                    className="w-full btn-primary py-2.5 rounded-xl font-bold text-sm mt-1"
                                  >
                                    Verify & Submit Payment
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="pt-2 border-t flex justify-between gap-2">
                              <button
                                onClick={() => setPayStep("method")}
                                className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                              >
                                Back
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Card step removed — real card payments handled by Razorpay */}
                  {payStep === "details" && payMethod === "Card" && (
                    <div className="space-y-4">
                      {/* Virtual Card Preview */}
                      <div className="w-full h-40 bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden select-none font-mono">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[9px] tracking-widest uppercase opacity-65">RentHub Pay</p>
                            <p className="text-xs font-sans mt-0.5">Secure Credit Card</p>
                          </div>
                          <div className="text-right font-sans font-bold text-sm tracking-wider text-teal-400">
                            {cardNumber.startsWith("4") ? "VISA" : cardNumber.startsWith("5") ? "Mastercard" : "RUPAY"}
                          </div>
                        </div>

                        <div className="text-base tracking-widest my-2">
                          {cardNumber || "•••• •••• •••• ••••"}
                        </div>

                        <div className="flex justify-between items-end text-xs">
                          <div>
                            <p className="text-[8px] uppercase opacity-50 tracking-wider">Card Holder</p>
                            <p className="font-semibold uppercase tracking-wider truncate max-w-[150px] font-sans">
                              {cardName || "YOUR NAME"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] uppercase opacity-50 tracking-wider">Expires</p>
                            <p className="font-semibold">{cardExpiry || "MM/YY"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Card Inputs Form */}
                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-muted-foreground">Cardholder Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter Cardholder Name"
                            value={cardName}
                            onChange={e => setCardName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl bg-transparent focus:ring-2 focus:ring-teal-500 uppercase"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-muted-foreground">Card Number</label>
                          <input
                            type="text"
                            required
                            placeholder="4000 1234 5678 9010"
                            maxLength={19}
                            value={cardNumber}
                            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                            className="w-full px-3 py-2 border rounded-xl bg-transparent focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-muted-foreground">Expiry Date</label>
                            <input
                              type="text"
                              required
                              placeholder="MM/YY"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                              className="w-full px-3 py-2 border rounded-xl bg-transparent focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-muted-foreground">CVV</label>
                            <input
                              type="password"
                              required
                              placeholder="•••"
                              maxLength={3}
                              value={cardCvv}
                              onChange={e => setCardCvv(e.target.value.replace(/[^0-9]/g, ""))}
                              className="w-full px-3 py-2 border rounded-xl bg-transparent focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t flex justify-between gap-2">
                        <button
                          onClick={() => setPayStep("method")}
                          className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          Back
                        </button>
                        <button
                          onClick={async () => {
                            if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
                              showToast("Please fill all card details", "error");
                              return;
                            }
                            if (!validateLuhn(cardNumber)) {
                              showToast("Invalid Card Number. Please check card originality.", "error");
                              return;
                            }
                            if (!validateExpiry(cardExpiry)) {
                              showToast("Card expiry date is invalid or has expired.", "error");
                              return;
                            }
                            if (cardCvv.length < 3) {
                              showToast("CVV must be 3 digits.", "error");
                              return;
                            }

                            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
                            setCardOtp(generatedOtp);
                            setDevOtp("");
                            setIsSendingOtp(true);
                            showToast("Authenticating card details...", "info");

                            try {
                              const emailResult = await sendOtpEmail({
                                data: {
                                  toEmail: currentTenant.email,
                                  tenantName: currentTenant.name,
                                  otp: generatedOtp,
                                  rentAmount: currentTenant.rentAmount,
                                  unit: currentTenant.unit
                                }
                              });

                              if (emailResult.devMode && emailResult.otp) {
                                // No RESEND_API_KEY — show OTP visibly on screen
                                setDevOtp(emailResult.otp);
                                showToast("Dev mode: OTP shown on screen (add RESEND_API_KEY to .env for real emails).", "info");
                              } else if (emailResult.success) {
                                showToast(`OTP sent to ${currentTenant.email}. Check your inbox.`, "success");
                              } else {
                                // Email failed but we still show OTP on screen as fallback
                                setDevOtp(generatedOtp);
                                showToast("Email delivery failed. OTP shown on screen.", "info");
                              }
                            } catch (err) {
                              console.error("OTP dispatch error:", err);
                              setDevOtp(generatedOtp);
                              showToast("Could not send email. OTP shown on screen.", "info");
                            } finally {
                              setIsSendingOtp(false);
                              setPayStep("otp");
                            }
                          }}
                          className={`btn-primary px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${isSendingOtp ? "opacity-60 cursor-not-allowed" : ""}`}
                          disabled={isSendingOtp}
                        >
                          {isSendingOtp ? "Sending OTP..." : "Proceed to OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Card OTP verification */}
                  {payStep === "otp" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border rounded-xl text-xs text-teal-800 dark:text-teal-300 space-y-2.5">
                        <p className="font-bold flex items-center gap-1.5 text-teal-700 dark:text-teal-400">
                          <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                          3D-Secure 2.0 Verification
                        </p>
                        {devOtp ? (
                          <>
                            <p className="leading-relaxed">
                              Email delivery is in <b>dev mode</b> (no <code>RESEND_API_KEY</code> in .env). Your OTP is shown below:
                            </p>
                            <div className="mt-1 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl text-center">
                              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest mb-1">Your OTP Code</p>
                              <p className="font-mono text-2xl font-black tracking-[0.3em] text-amber-700 dark:text-amber-300 select-all">{devOtp}</p>
                            </div>
                          </>
                        ) : (
                          <p className="leading-relaxed">
                            A one-time security code has been sent to your email <b className="font-mono">{currentTenant.email}</b>. Please check your inbox (and spam folder).
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground leading-normal border-t border-teal-200 dark:border-teal-900/60 pt-2">
                          The OTP expires in 5 minutes. Enter it below to confirm your payment.
                        </p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="space-y-1 text-center">
                          <label className="font-bold text-muted-foreground block">Enter 6-Digit OTP</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter Code"
                            maxLength={6}
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                            className="w-40 mx-auto text-center tracking-widest font-mono text-lg px-3 py-2 border rounded-xl bg-transparent focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t flex justify-between gap-2">
                        <button
                          onClick={() => setPayStep("details")}
                          className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => {
                            if (otpCode !== cardOtp) {
                              showToast("Incorrect OTP. Please enter the valid security key received in your registered contacts.", "error");
                              return;
                            }
                            handlePayRent();
                          }}
                          className="btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
                        >
                          Verify & Complete Payment
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : payProgress !== -1 ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="h-10 w-10 text-teal-500 animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="font-bold text-sm">Processing Secure Transaction...</p>
                    <p className="text-xs text-muted-foreground">Please do not refresh or close this dialog.</p>
                  </div>
                  <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full transition-all" style={{ width: `${payProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center space-y-4">
                  <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
                    <Check className="h-7 w-7" strokeWidth={3} />
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="font-bold text-lg">Payment Successful!</h4>
                    <p className="text-xs text-muted-foreground">
                      Transaction receipt generated and synchronized with landlord system.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border w-full text-xs font-mono space-y-1 select-text">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-bold text-emerald-500">SUCCESS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold">₹{currentTenant.rentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-bold">{payMethod}</span>
                    </div>
                    {lastTxnId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Txn Ref ID:</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400 select-all font-mono">{lastTxnId}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowPayModal(false);
                      setPaymentSuccess(false);
                    }}
                    className="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* B. Sign Agreement Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-reveal">

            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-lg font-display text-foreground">E-Signature Verification</h3>
                <p className="text-[10px] text-muted-foreground">Legally compliant signature lock system</p>
              </div>
              <button onClick={() => setShowSignModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Signature Type</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setDrawSignature(false)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${!drawSignature ? "bg-teal-500 text-white" : "bg-slate-100 text-muted-foreground dark:bg-slate-800"
                      }`}
                  >
                    Type Name
                  </button>
                  <button
                    onClick={() => setDrawSignature(true)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${drawSignature ? "bg-teal-500 text-white" : "bg-slate-100 text-muted-foreground dark:bg-slate-800"
                      }`}
                  >
                    Draw Signature
                  </button>
                </div>
              </div>

              {!drawSignature ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Type your full name to sign *</label>
                  <input
                    type="text"
                    required
                    value={typedSignature}
                    onChange={e => setTypedSignature(e.target.value)}
                    placeholder={currentTenant.name}
                    className="w-full px-4 py-3 border rounded-xl text-lg font-cursive bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 outline-none italic text-teal-600 dark:text-teal-400"
                    style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    By typing your name, you certify this digital imprint acts as your legally-binding hand signature on the rental agreement.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground">Draw inside the canvas below *</label>
                  <div className="border bg-slate-50 dark:bg-slate-950 rounded-xl relative overflow-hidden h-44">
                    <canvas
                      ref={canvasRef}
                      width={440}
                      height={176}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="absolute inset-0 w-full h-full cursor-crosshair"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-muted-foreground">Draw using trackpad or mouse</p>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      Clear Canvas
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-950/50 rounded-xl text-[10px] text-muted-foreground leading-relaxed">
                <Shield className="h-4.5 w-4.5 text-teal-500 float-left mr-2 mt-0.5" />
                Your signature matches our encryption ledger. Under Section 65B of the Indian Evidence Act, 1872, this record holds full admissibility.
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignAgreement}
                  className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold"
                >
                  Sign and Authenticate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C. Request Renewal Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-reveal">

            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg font-display text-foreground">Request Lease Renewal</h3>
              <button onClick={() => setShowRenewalModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRequestRenewal} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Current Rent Yield</label>
                <input
                  type="text"
                  disabled
                  value={`₹${currentTenant.rentAmount.toLocaleString()}/month`}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Lease End Date</label>
                <input
                  type="text"
                  disabled
                  value={currentTenant.leaseEnd}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Notes for Landlord (Optional)</label>
                <textarea
                  rows={4}
                  value={renewalNotes}
                  onChange={e => setRenewalNotes(e.target.value)}
                  placeholder="I would like to request a lease renewal for another 11 months. Let me know if you need updated ID documentation."
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-transparent focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-950/40 rounded-xl text-[10px] text-amber-700 dark:text-amber-400">
                Landlords standard renewal policy triggers a 5% inflation rent adjustment. Your requested notes will be logged in the admin panel.
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  /* ──────────────────────────────────────────────────── */
  /* ── 4. TAB SUB VIEWS ───────────────────────────────── */
  /* ──────────────────────────────────────────────────── */

  // TAB 1: Dashboard Overview
  function renderDashboard() {
    const tenant = currentTenant!;
    const isUnpaid = tenant.paymentStatus !== "Paid";
    return (
      <div className="space-y-8 animate-reveal">

        {/* Urgent Action Rent banner */}
        {isUnpaid ? (
          <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="space-y-1 relative z-10 text-center md:text-left">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/20 tracking-wider">
                Action Required
              </span>
              <h3 className="text-xl font-bold font-display mt-2">
                Monthly Rent is {tenant.paymentStatus.toUpperCase()}
              </h3>
              <p className="text-xs text-white/80">
                An amount of ₹{tenant.rentAmount.toLocaleString()} is due on {tenant.dueDate} for {tenant.unit}.
              </p>
            </div>
            <button
              onClick={openPaymentModal}
              className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-6 py-3 rounded-xl text-sm shadow-md shrink-0 relative z-10 transition-colors duration-200"
            >
              Pay Rent Online
            </button>
          </div>
        ) : (
          <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/20 tracking-wider">
                Account Current
              </span>
              <h3 className="text-xl font-bold font-display mt-2">Rent Paid & Settled</h3>
              <p className="text-xs text-white/85">
                Thank you! Your payment for the current billing cycle has been verified and registered. Next cycle starts: {tenant.dueDate}.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("payments")}
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm shrink-0 transition-colors"
            >
              View Receipt History
            </button>
          </div>
        )}

        {/* Dashboard Grid Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "My Unit", value: tenant.unit, subText: "Active Rented Space", icon: Home },
            { label: "Monthly Rent", value: `₹${tenant.rentAmount.toLocaleString()}`, subText: "Due 5th of each month", icon: CreditCard },
            { label: "Security Deposit", value: `₹${tenant.depositAmount.toLocaleString()}`, subText: "Held in landlord escrow", icon: Shield },
            { label: "Lease Renewal", value: tenant.leaseEnd, subText: "End of active contract", icon: FileText }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm flex justify-between items-start hover:shadow-md transition-shadow">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase">{stat.label}</span>
                  <h3 className="text-2xl font-extrabold mt-1 tracking-tight font-display text-foreground">{stat.value}</h3>
                  <p className="text-[10px] text-muted-foreground mt-2 font-medium">{stat.subText}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border text-teal-500">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Info panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Agreement Status */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h4 className="font-bold text-base font-display">Active Lease Agreement</h4>
            {tenantAgreement ? (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-xs">Agreement Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tenantAgreement.status === "Active"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 animate-pulse"
                    }`}>
                    {tenantAgreement.status}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-xs">Start Date</span>
                  <span className="font-semibold">{tenantAgreement.startDate}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-xs">End Date</span>
                  <span className="font-semibold">{tenantAgreement.endDate}</span>
                </div>

                {tenantAgreement.status === "Pending Signature" ? (
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PenTool className="h-4 w-4" /> Sign Lease Agreement
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab("agreement")}
                    className="w-full btn-secondary font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" /> View Signed Agreement
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No active agreement found in ledger.
              </div>
            )}
          </div>

          {/* Landlord & Payout Details */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h4 className="font-bold text-base font-display">Landlord & Payout Details</h4>
            {landlordInfo ? (
              <div className="space-y-4 text-xs">
                <div className="flex flex-col gap-1 pb-2 border-b">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Landlord Contact</span>
                  <span className="font-semibold text-foreground text-sm">{landlordInfo.name}</span>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" /> {landlordInfo.phone || "—"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><Mail className="h-3 w-3 truncate max-w-[120px]" /> {landlordInfo.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold block">Settlement Details</span>
                  {landlordInfo.accountNumber ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-[10px]">Bank:</span>
                        <span className="font-bold text-foreground text-[11px] truncate max-w-[110px]">{landlordInfo.bankName || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-[10px]">A/C:</span>
                        <span className="font-bold text-foreground text-[11px] select-all">{landlordInfo.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-[10px]">IFSC:</span>
                        <span className="font-bold text-foreground text-[11px] select-all uppercase">{landlordInfo.ifscCode || "—"}</span>
                      </div>
                      {landlordInfo.upiId && (
                        <div className="flex justify-between border-t pt-1.5 mt-1.5">
                          <span className="text-muted-foreground text-[10px]">UPI:</span>
                          <span className="font-bold text-teal-600 dark:text-teal-400 text-[11px] select-all truncate max-w-[130px]">{landlordInfo.upiId}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-950/40 rounded-xl text-[10px] text-amber-700 dark:text-amber-400">
                      Bank details not configured by landlord yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Loading landlord details...
              </div>
            )}
          </div>

          {/* Recent Payments log */}
          <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-base font-display">Recent Payments Ledger</h4>
              <button
                onClick={() => setActiveTab("payments")}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                View Vault
              </button>
            </div>

            <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
              {tenantPayments.map(p => (
                <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Rent Paid (₹{p.amount.toLocaleString()})</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">Paid via {p.method} on {p.date}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadReceipt(p)}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-950 border rounded-lg text-teal-600 dark:text-teal-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Receipt
                  </button>
                </div>
              ))}

              {tenantPayments.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-xs">
                  No completed payments recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TAB 2: Rent Payments & Receipts
  function renderPayments() {
    const tenant = currentTenant!;
    return (
      <div className="space-y-6 animate-reveal">
        {/* Payment Summary Header */}
        <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Current Billing Status</span>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${tenant.paymentStatus === "Paid" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
              <span className="text-lg font-bold">{tenant.paymentStatus}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Rent Billing Amount</span>
            <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">
              ₹{tenant.rentAmount.toLocaleString()}
            </div>
          </div>

          <div className="text-right">
            {tenant.paymentStatus !== "Paid" ? (
              <button
                onClick={openPaymentModal}
                className="w-full md:w-auto btn-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <CreditCard className="h-4.5 w-4.5" /> Pay Now
              </button>
            ) : (
              <div className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/40 p-2.5 rounded-xl text-center">
                Fully paid for this month
              </div>
            )}
          </div>
        </div>

        {/* Payment History Vault */}
        <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">My Transaction History</span>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{tenantPayments.length} Payments Total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-muted-foreground uppercase border-b">
                  <th className="p-4">Billing Date</th>
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {tenantPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-semibold">{p.date}</td>
                    <td className="p-4 font-mono text-xs">{p.transactionId}</td>
                    <td className="p-4 text-xs font-medium text-muted-foreground">{p.method}</td>
                    <td className="p-4 font-bold">₹{p.amount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDownloadReceipt(p)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-500 rounded-lg transition-colors"
                        title="Download Statement"
                      >
                        <Download className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {tenantPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                      No payments found. Payments made online will show up here.
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

  // TAB 3: Lease Agreement View & Sign & Renewal
  function renderAgreement() {
    if (!tenantAgreement) {
      return (
        <div className="bg-white dark:bg-card p-12 rounded-2xl border shadow-sm text-center max-w-md mx-auto space-y-3">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
          <h4 className="font-bold text-base font-display">No lease agreements available</h4>
          <p className="text-xs text-muted-foreground">
            Please check with the landlord to issue your rental contract details.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-reveal">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stamp Paper Container */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-card p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-4 print:hidden">
              <div>
                <h4 className="font-bold text-sm font-display">Official Lease Document</h4>
                <p className="text-xs text-muted-foreground">Status: <span className="text-teal-600 font-bold">{tenantAgreement.status}</span></p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const agr = tenantAgreement;
                    if (!agr) return;
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      const genDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
                      const year = agr.startDate ? new Date(agr.startDate).getFullYear() : new Date().getFullYear();
                      const rawSuffix = (agr.agreementNumber || "").split("-").pop() || agr.id.slice(-6).toUpperCase().padStart(6, "0");
                      const agreementNumDisplay = agr.agreementNumber || `RH-${year}-${rawSuffix}`;
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Lease Agreement - ${agr.tenantName}</title>
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
                              .signature-img { max-height: 64px; max-width: 180px; }
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
                                      <div style="font-family: sans-serif; font-size: 10px; color: #92400e; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em;">GOVERNMENT OF INDIA • INDIA NON JUDICIAL</div>
                                      <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 32px;">
                                        <span style="font-family: sans-serif; font-size: 9px; color: #92400e; border: 1px solid #92400e; padding: 2px 6px; border-radius: 4px; font-weight: bold;">SEC. 17 / REG. ACT 1908</span>
                                        <div style="display: inline-block; border: 2px dashed #92400e; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 9px; font-family: sans-serif; color: rgba(146,64,14,0.4); font-weight: bold; text-align: center;">STATE SEAL</div>
                                        <span style="font-family: sans-serif; font-size: 9px; color: #92400e; border: 1px solid #92400e; padding: 2px 6px; border-radius: 4px; font-weight: bold;">SERIAL: RH-${agr.id.slice(2, 8).toUpperCase()}</span>
                                      </div>
                                      <div style="font-size: 32px; font-weight: 800; color: #78350f;">₹ 100</div>
                                      <div style="font-family: sans-serif; font-size: 10px; color: #92400e; text-transform: uppercase; font-weight: bold;">ONE HUNDRED RUPEES</div>
                                      <div class="agr-number">Agreement No. ${agreementNumDisplay}</div>
                                    </div>
                                    <div class="contract-body">${agr.contractText || ""}</div>
                                    <div class="signatures">
                                      <div class="signature-box">
                                        <div style="font-weight: bold; color: #64748b; font-size: 11px; font-family: sans-serif;">FIRST PART (LANDLORD)</div>
                                        <div class="signature-line">
                                          ${agr.landlordSignature
                          ? agr.landlordSignature.startsWith("data:image")
                            ? `<img class="signature-img" src="${agr.landlordSignature}" />`
                            : `<div class="typed-signature">${agr.landlordSignature}</div>`
                          : '<span style="font-family:sans-serif;color:#94a3b8;font-style:italic;">Unsigned</span>'
                        }
                                        </div>
                                        <div style="font-weight: bold; font-size: 12px; color: #334155; font-family: sans-serif;">${agr.landlordName || "Owner Admin"}</div>
                                        <div style="font-size: 10px; color: #94a3b8; font-family: sans-serif;">Signed on: ${agr.landlordSignedAt || agr.startDate}</div>
                                      </div>
                                      <div class="signature-box">
                                        <div style="font-weight: bold; color: #64748b; font-size: 11px; font-family: sans-serif;">SECOND PART (TENANT)</div>
                                        <div class="signature-line">
                                          ${agr.status === "Active" || agr.tenantSignature
                          ? agr.tenantSignatureType === "draw"
                            ? `<img class="signature-img" src="${agr.tenantSignature}" />`
                            : `<div class="typed-signature">${agr.tenantSignature || agr.tenantName}</div>`
                          : '<span style="font-family:sans-serif;color:#f59e0b;font-weight:bold;">Awaiting Tenant E-Sign</span>'
                        }
                                        </div>
                                        <div style="font-weight: bold; font-size: 12px; color: #334155; font-family: sans-serif;">${agr.tenantName}</div>
                                        <div style="font-size: 10px; color: #94a3b8; font-family: sans-serif;">${agr.tenantSignedAt ? `Signed on: ${agr.tenantSignedAt}` : "Verification pending"}</div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            ${agr.notaryStatus === "notarized" ? `
                            <div style="margin-top:48px; border-top:2px dashed #b45309; padding-top:32px; font-family:sans-serif;">
                              <table style="width:100%; border-collapse:collapse;">
                                <tr>
                                  <td style="vertical-align:top; padding-right:24px;">
                                    <div style="font-size:8px; text-transform:uppercase; letter-spacing:0.1em; font-weight:900; color:#b45309; border-bottom:1px solid #fde68a; padding-bottom:6px; margin-bottom:10px;">
                                      NOTARIAL ATTESTATION CERTIFICATE — SEC. 8, NOTARIES ACT, 1952
                                    </div>
                                    <div style="font-size:12px; font-weight:700; color:#1e293b; margin-bottom:4px;">${agr.notaryName || ""}</div>
                                    <div style="font-size:9.5px; color:#64748b; font-family:monospace; line-height:1.8;">
                                      <div>Reg. No: ${agr.notaryRegNo || ""}</div>
                                      <div>Jurisdiction: ${agr.notaryJurisdiction || ""}</div>
                                      <div>Cert. Serial: ${agr.notarySerialNo || ""}</div>
                                    </div>
                                    <div style="font-size:9px; font-style:italic; color:#64748b; border-left:3px solid #f59e0b; padding-left:8px; margin:10px 0;">
                                      "${agr.notaryRemarks || ""}"
                                    </div>
                                    <div style="margin-top:20px; border-bottom:1px solid #cbd5e1; padding-bottom:4px; min-height:36px;">
                                      ${agr.notarySeal && agr.notarySeal.startsWith("data:image")
                                        ? `<img src="${agr.notarySeal}" style="max-height:32px; max-width:180px; object-fit:contain; opacity:0.9;" />`
                                        : `<span style="font-family:'Brush Script MT',cursive; font-size:22px; color:#b45309; font-weight:700;">${agr.notarySeal || ""}</span>`
                                      }
                                    </div>
                                    <div style="font-size:8px; color:#94a3b8; margin-top:4px;">Notarized on: ${agr.notarySignedAt || ""}</div>
                                  </td>
                                  <td style="vertical-align:top; text-align:center; width:100px;">
                                    <div style="width:88px; height:88px; border-radius:50%; border:3px double #b45309; background:#fffbeb; display:flex; flex-direction:column; align-items:center; justify-content:center; margin:0 auto; box-shadow: 0 2px 8px #fde68a80;">
                                      <div style="font-size:22px; color:#b45309;">⚖</div>
                                      <div style="font-size:7px; font-weight:900; text-transform:uppercase; color:#78350f; letter-spacing:0.05em;">NOTARY</div>
                                      <div style="font-size:6px; font-weight:700; color:#b45309;">PUBLIC</div>
                                      <div style="font-size:5px; font-weight:700; color:#92400e80; margin-top:2px;">INDIA</div>
                                    </div>
                                    <div style="font-size:7.5px; color:#b45309; font-weight:900; margin-top:6px; letter-spacing:0.1em; text-transform:uppercase;">ATTESTED</div>
                                  </td>
                                </tr>
                              </table>
                            </div>
                            ` : ""}
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
                  className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" /> Download PDF / Print
                </button>
              </div>
            </div>

            {/* Stamp Paper Frame */}
            <div
              id="printable-tenant-agreement"
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
                  <div className="h-14 w-14 border-2 border-dashed border-amber-800/40 rounded-full flex items-center justify-center text-[9px] font-sans font-extrabold text-amber-800/30">
                    STATE SEAL
                  </div>
                  <div className="text-[9px] font-sans font-bold text-amber-800 border border-amber-800/40 px-1.5 py-0.5 rounded">
                    SERIAL: RH-{tenantAgreement.id.slice(2, 8).toUpperCase()}
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-amber-900 tracking-wider my-2 font-display">
                  ₹ 100
                </div>
                <div className="text-[10px] tracking-widest font-sans font-bold text-amber-800 uppercase mt-1">
                  ONE HUNDRED RUPEES
                </div>
                {/* Agreement Number Badge */}
                <div className="mt-2 inline-block text-[10px] font-sans font-bold text-amber-900 border border-amber-800/50 px-3 py-1 rounded bg-amber-50/80 tracking-wide">
                  Agreement No. {tenantAgreement.agreementNumber || `RH-${tenantAgreement.startDate ? new Date(tenantAgreement.startDate).getFullYear() : new Date().getFullYear()}-${tenantAgreement.id.slice(-6).toUpperCase().padStart(6, '0')}`}
                </div>
              </div>

              {/* Contract Body */}
              <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-800 text-justify px-4" style={{ fontFamily: "Georgia, serif" }}>
                {tenantAgreement.contractText}
              </div>

              {/* Signatures Panel */}
              <div className="mt-12 border-t pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 px-4 font-sans text-xs">
                <div className="space-y-4">
                  <p className="font-bold text-slate-500 uppercase tracking-wider">FIRST PART (LANDLORD)</p>
                  <div className="h-20 flex flex-col justify-end border-b border-slate-300 pb-2">
                    {tenantAgreement.landlordSignature ? (
                      tenantAgreement.landlordSignature.startsWith("data:image") ? (
                        <img src={tenantAgreement.landlordSignature} alt="Landlord Signature" className="max-h-16 max-w-[200px] object-contain opacity-95 select-none" />
                      ) : (
                        <div className="italic text-teal-600 font-bold text-lg select-none" style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
                          {tenantAgreement.landlordSignature}
                        </div>
                      )
                    ) : (
                      <span className="text-slate-400 italic">Unsigned</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{tenantAgreement.landlordName || "Owner Admin"}</p>
                    <p className="text-[10px] text-slate-400">Signed on: {tenantAgreement.landlordSignedAt || tenantAgreement.startDate}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-slate-500 uppercase tracking-wider">SECOND PART (TENANT)</p>
                  <div className="h-20 flex flex-col justify-end border-b border-slate-300 pb-2">
                    {tenantAgreement.status === "Active" || tenantAgreement.tenantSignature ? (
                      tenantAgreement.tenantSignatureType === "draw" ? (
                        <img src={tenantAgreement.tenantSignature} alt="Tenant Signature" className="max-h-16 max-w-[200px] object-contain opacity-95 select-none" />
                      ) : (
                        <div className="italic text-teal-600 font-bold text-lg select-none" style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
                          {tenantAgreement.tenantSignature || tenantAgreement.tenantName}
                        </div>
                      )
                    ) : (
                      <span className="text-amber-500 font-bold animate-pulse">Awaiting Tenant E-Sign</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{tenantAgreement.tenantName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {tenantAgreement.tenantSignedAt ? `Signed on: ${tenantAgreement.tenantSignedAt}` : "Verification pending"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Page Footer (visible on screen and in print) */}
              <div className="mt-10 pt-4 border-t border-slate-200 flex justify-between items-center font-sans text-[9px] text-slate-400 px-4 print:flex">
                <span><span className="font-bold text-teal-600">RentHub</span> &nbsp;|&nbsp; Lease Agreement</span>
                <span>Agreement No. {tenantAgreement.agreementNumber || `RH-${tenantAgreement.startDate ? new Date(tenantAgreement.startDate).getFullYear() : new Date().getFullYear()}-${tenantAgreement.id.slice(-6).toUpperCase().padStart(6, '0')}`}</span>
                <span>Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Renewal History Timeline */}
            {tenantAgreement.history && tenantAgreement.history.length > 0 && (
              <div className="bg-white dark:bg-card p-6 border rounded-2xl shadow-sm space-y-4 print:hidden">
                <h5 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Lease Renewal History
                </h5>
                <div className="relative border-l pl-4 ml-2 space-y-6">
                  {tenantAgreement.history.map((hist) => (
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

          {/* Right sidebar details */}
          <div className="space-y-6 print:hidden">
            {tenantAgreement.status === "Pending Signature" && (
              <div className="bg-white dark:bg-card p-6 rounded-2xl border border-amber-200 dark:border-amber-950/40 shadow-sm space-y-4">
                <h4 className="font-bold text-base font-display flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5" /> Signature Required
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This lease agreement requires your digital signature to become active. You can choose to type or draw your signature.
                </p>
                <button
                  onClick={() => setShowSignModal(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors shadow-md animate-pulse"
                >
                  <PenTool className="h-4.5 w-4.5" /> Sign Agreement Now
                </button>
              </div>
            )}

            {/* Lease clauses info */}
            <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-3">
              <h4 className="font-bold text-base font-display flex items-center gap-1.5">
                <Shield className="h-5 w-5 text-teal-500" /> Key Lease Conditions
              </h4>
              <div className="text-xs text-muted-foreground leading-relaxed space-y-3">
                <div className="flex gap-2">
                  <Check className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                  <span><b>Inflation escalation:</b> Standard 5% increment is applied upon agreement renewal.</span>
                </div>
                <div className="flex gap-2">
                  <Check className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                  <span><b>Notice period:</b> 2-month prior written notice required for vacation.</span>
                </div>
                <div className="flex gap-2">
                  <Check className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                  <span><b>Lock-in Period:</b> 11-month minimum lock-in policy applies.</span>
                </div>
              </div>
            </div>

            {/* Request renewal card */}
            <div className="bg-white dark:bg-card p-6 rounded-2xl border shadow-sm space-y-4">
              <h4 className="font-bold text-base font-display">Lease Renewal Options</h4>

              {tenantRenewalRequest ? (
                <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-950/30 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>Renewal Request:</span>
                    <span className="text-teal-600 dark:text-teal-400 uppercase font-bold">
                      {tenantRenewalRequest.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Submitted on: {tenantRenewalRequest.requestedAt}
                  </p>
                  {tenantRenewalRequest.notes && (
                    <p className="text-[10px] italic text-muted-foreground mt-1 border-t pt-1">
                      "{tenantRenewalRequest.notes}"
                    </p>
                  )}
                </div>
              ) : renewalRequested ? (
                <div className="p-3.5 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 rounded-xl text-xs font-medium text-center text-teal-600 dark:text-teal-400">
                  Renewal request submitted successfully
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Approaching your lease end? Request a lease term extension from your landlord directly.
                  </p>
                  <button
                    onClick={() => setShowRenewalModal(true)}
                    className="w-full btn-secondary font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="h-4 w-4" /> Request Lease Renewal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
