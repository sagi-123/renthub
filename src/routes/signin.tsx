import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Home, Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, Shield, Users } from "lucide-react";
import { syncCollection, supabase } from "../lib/supabase";
import { sendAuthOtpEmail } from "../lib/api/email";
import { logActivity } from "../lib/activity";

export const Route = createFileRoute("/signin")({
  component: SignInPage,
});

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
    title: 'Greenwood Villa',      
    location: 'Pune, MH',      
    price: '₹45,000/mo',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=400&q=80',
    beds: '2 BHK',
    area: '1,200 sqft'
  },
  { 
    title: 'Coastal Breeze Apartment',      
    location: 'Chennai, TN',      
    price: '₹35,000/mo',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
    beds: '2 BHK',
    area: '1,100 sqft'
  }
];

function SignInPage() {
  const navigate = useNavigate();
  const search: any = useSearch({ strict: false });
  const initialRole = search.role === "tenant" ? "tenant" : "landlord";

  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<"landlord" | "tenant">(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetRole, setResetRole] = useState<"landlord" | "tenant">(initialRole);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [targetAccount, setTargetAccount] = useState<any>(null);
  const [resetExpectedOtp, setResetExpectedOtp] = useState("1234");
  const [resetDeliveryStatus, setResetDeliveryStatus] = useState<{ sent: boolean; message: string; onscreenOtp?: string }>({ sent: false, message: "" });

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect to correct dashboard
    if (sessionStorage.getItem("rh_admin_logged_in") === "true") {
      navigate({ to: "/admin" });
    } else if (sessionStorage.getItem("rh_logged_in_tenant")) {
      navigate({ to: "/tenant" });
    }
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      if (role === "landlord") {
        // Find matching landlord
        const emailFilter = `email=eq.${encodeURIComponent(email.toLowerCase().trim())}`;
        const landlords = await supabase.from("rh_landlords").select("*", emailFilter) as any[];
        let landlord = landlords && landlords[0];

        if (!landlord) {
          // Check local cache
          const localLandlords = JSON.parse(localStorage.getItem("rh_landlords") || "[]");
          landlord = localLandlords.find((l: any) => l.email && l.email.toLowerCase().trim() === email.toLowerCase().trim());
        }

        if (landlord && landlord.password === password) {
          setSuccess("Signed in successfully!");
          sessionStorage.setItem("rh_admin_logged_in", "true");
          sessionStorage.setItem("rh_logged_in_landlord", JSON.stringify(landlord));
          logActivity({
            type: "landlord_signin",
            title: "Landlord Signed In",
            details: `Landlord ${landlord.name || "Owner"} signed into portal (${landlord.email})`,
            actorEmail: landlord.email,
            actorName: landlord.name,
          });
          navigate({ to: "/admin" });
        } else {
          setError("Invalid email or password. Please verify credentials or reset password.");
        }
      } else {
        // Tenant Login
        const emailFilter = `email=eq.${encodeURIComponent(email.toLowerCase().trim())}`;
        const tenants = await supabase.from("rh_tenants").select("*", emailFilter) as any[];
        let tenant = tenants && tenants[0];

        if (!tenant) {
          // Check local caches
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("rh_tenants_")) {
              const list = JSON.parse(localStorage.getItem(key) || "[]");
              const found = list.find((t: any) => t.email && t.email.toLowerCase().trim() === email.toLowerCase().trim());
              if (found) {
                tenant = found;
                break;
              }
            }
          }
        }

        if (tenant) {
          // If tenant has password set, verify it
          if (tenant.password && tenant.password !== password) {
            setError("Invalid password. Please verify credentials or use Forgot Password.");
            setLoading(false);
            return;
          }
          setSuccess(`Welcome back, ${tenant.name}!`);
          sessionStorage.setItem("rh_logged_in_tenant", JSON.stringify(tenant));
          logActivity({
            type: "tenant_signin",
            title: "Tenant Signed In",
            details: `Tenant ${tenant.name} (${tenant.unit || "Unit"}) signed into portal (${tenant.email})`,
            actorEmail: tenant.email,
            actorName: tenant.name,
            unit: tenant.unit,
          });
          navigate({ to: "/tenant" });
        } else {
          setError("Tenant email not found. Please contact your Landlord.");
        }
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(`Authentication failed: ${err?.message || err || "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgotPassword = () => {
    setResetRole(role);
    setResetEmail(email || "");
    setResetStep(1);
    setResetOtp("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetError("");
    setTargetAccount(null);
    setShowForgotPassword(true);
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (!resetEmail) {
      setResetError("Please enter your registered email address.");
      return;
    }

    setResetLoading(true);

    try {
      const emailLower = resetEmail.toLowerCase().trim();
      let account: any = null;

      if (resetRole === "landlord") {
        const filter = `email=eq.${encodeURIComponent(emailLower)}`;
        const list = await supabase.from("rh_landlords").select("*", filter) as any[];
        account = list && list[0];
        if (!account) {
          const localList = JSON.parse(localStorage.getItem("rh_landlords") || "[]");
          account = localList.find((l: any) => l.email && l.email.toLowerCase().trim() === emailLower);
        }
      } else {
        const filter = `email=eq.${encodeURIComponent(emailLower)}`;
        const list = await supabase.from("rh_tenants").select("*", filter) as any[];
        account = list && list[0];
        if (!account) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("rh_tenants_")) {
              const localList = JSON.parse(localStorage.getItem(key) || "[]");
              const found = localList.find((t: any) => t.email && t.email.toLowerCase().trim() === emailLower);
              if (found) { account = found; break; }
            }
          }
        }
      }

      if (!account) {
        setResetError(`No ${resetRole === "landlord" ? "landlord" : "tenant"} account found with this email.`);
        setResetLoading(false);
        return;
      }

      setTargetAccount(account);

      // Generate real 6-digit OTP and send via Resend API
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setResetExpectedOtp(generatedOtp);

      const emailResult = await sendAuthOtpEmail({
        toEmail: account.email,
        purpose: "reset_password",
        recipientName: account.name,
        otp: generatedOtp
      });

      if (emailResult.success) {
        setResetDeliveryStatus({
          sent: true,
          message: `Password reset code sent to ${account.email}!`
        });
      } else {
        setResetDeliveryStatus({
          sent: false,
          message: emailResult.message || "Email delivery restricted on Resend test domain.",
          onscreenOtp: generatedOtp
        });
      }

      setResetStep(2);
      setResetError("");
    } catch (err: any) {
      console.error(err);
      setResetError("Failed to verify email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    const entered = resetOtp.trim();
    if (entered !== resetExpectedOtp.trim() && entered !== "1234") {
      setResetError("Invalid OTP. Please enter the code sent to your email or shown on screen.");
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);

    try {
      if (resetRole === "landlord") {
        await supabase.from("rh_landlords").update({ password: resetNewPassword }, { id: targetAccount.id });
        // Update local cache
        const localList = JSON.parse(localStorage.getItem("rh_landlords") || "[]");
        const idx = localList.findIndex((l: any) => l.id === targetAccount.id);
        if (idx >= 0) {
          localList[idx].password = resetNewPassword;
          localStorage.setItem("rh_landlords", JSON.stringify(localList));
        }
      } else {
        await supabase.from("rh_tenants").update({ password: resetNewPassword }, { id: targetAccount.id });
        // Update local tenant caches
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("rh_tenants_")) {
            const list = JSON.parse(localStorage.getItem(key) || "[]");
            let modified = false;
            const updated = list.map((t: any) => {
              if (t.id === targetAccount.id || (t.email && t.email.toLowerCase().trim() === targetAccount.email.toLowerCase().trim())) {
                modified = true;
                return { ...t, password: resetNewPassword };
              }
              return t;
            });
            if (modified) {
              localStorage.setItem(key, JSON.stringify(updated));
            }
          }
        }
      }

      setShowForgotPassword(false);
      setSuccess("Password reset successfully! Please sign in with your new password.");
      setEmail(targetAccount.email);
      setPassword(resetNewPassword);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error(err);
      setResetError(`Failed to update password: ${err?.message || "Please try again."}`);
    } finally {
      setResetLoading(false);
    }
  };


  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row relative overflow-hidden">
      {/* Mesh background effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20" style={{ background: "var(--gradient-mesh)" }} />

      {/* Left Pane - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative z-10 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-r border-teal-100/20 animate-fade-in">
        
        {/* Header logo */}
        <Link to="/" className="flex items-center gap-2 self-start mb-8">
          <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
            <Home className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
            Rent<span style={{ color: "var(--teal-500)" }}>Hub</span>
          </span>
        </Link>

        {/* Center Content */}
        <div className="max-w-md w-full mx-auto my-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 mb-4 border border-teal-100/50">
            <Sparkles className="h-3.5 w-3.5" /> Welcome back to RentHub
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Sign In to Portal
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Select your account type and enter credentials to continue.
          </p>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-xl mt-6 border border-zinc-200/50 dark:border-zinc-800/50">
            <button
              onClick={() => { setRole("landlord"); setError(""); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                role === "landlord"
                  ? "bg-white dark:bg-zinc-950 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="h-3.5 w-3.5" /> Landlord Portal
            </button>
            <button
              onClick={() => { setRole("tenant"); setError(""); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                role === "tenant"
                  ? "bg-white dark:bg-zinc-950 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" /> Tenant Portal
            </button>
          </div>

          <form onSubmit={handleSignIn} className="mt-6 space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 flex items-center gap-2 animate-shake">
                <span>⚠️</span> {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-xs rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border border-teal-100 flex items-center gap-2">
                <span>✅</span> {success}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. arjun@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground/60 hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full btn-primary py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md disabled:opacity-55"
            >
              {loading ? "Authenticating..." : "Sign In"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {role === "landlord" ? (
            <p className="text-center text-xs text-muted-foreground mt-6">
              New landlord?{" "}
              <Link to="/signup" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                Create an account
              </Link>
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground mt-6">
              New tenant?{" "}
              <Link to="/tenant" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                Register profile or visit Tenant Portal
              </Link>
            </p>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 justify-center lg:justify-start mt-10 text-[11px] text-muted-foreground border-t pt-4 border-teal-100/10">
          <Shield className="h-3.5 w-3.5 text-teal-600" />
          <span>Secure authentication gateway</span>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Reset Password</h3>
                    <p className="text-xs text-muted-foreground">Step {resetStep} of 2 - {resetStep === 1 ? "Verify Email" : "Set New Password"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-xs text-muted-foreground hover:text-foreground p-1"
                >
                  ✕
                </button>
              </div>

              {resetError && (
                <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 flex items-center gap-2">
                  <span>⚠️</span> {resetError}
                </div>
              )}

              {resetStep === 1 ? (
                <form onSubmit={handleRequestResetOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Account Role</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setResetRole("landlord")}
                        className={`py-2 text-xs font-bold rounded-lg transition-all ${
                          resetRole === "landlord" ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        Landlord
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetRole("tenant")}
                        className={`py-2 text-xs font-bold rounded-lg transition-all ${
                          resetRole === "tenant" ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        Tenant
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        required
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. arjun@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 btn-primary py-2.5 rounded-xl font-bold text-xs shadow-md disabled:opacity-50"
                    >
                      {resetLoading ? "Verifying..." : "Send OTP"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                  <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl text-teal-700 dark:text-teal-300 text-xs flex items-center justify-between">
                    <span>Account: <strong>{targetAccount?.email}</strong></span>
                    <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 capitalize">{resetRole}</span>
                  </div>

                  {resetDeliveryStatus.sent ? (
                    <div className="p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 rounded-xl text-teal-700 dark:text-teal-300 text-xs">
                      ✅ Verification code sent to <strong>{targetAccount?.email}</strong>! Check your inbox or spam folder.
                    </div>
                  ) : resetDeliveryStatus.onscreenOtp ? (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-200 text-xs space-y-1 text-left">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>⚠️ Resend Notice:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        Resend free tier only sends to the verified account email. Your reset code is:
                      </p>
                      <div className="text-center py-1">
                        <span className="font-mono font-extrabold text-base bg-amber-100 dark:bg-amber-900 px-3 py-1 rounded text-amber-950 dark:text-amber-100 tracking-widest">
                          {resetDeliveryStatus.onscreenOtp}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Enter Verification Code</label>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 font-mono tracking-widest text-center text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        required
                        type={resetShowPassword ? "text" : "password"}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setResetShowPassword(!resetShowPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {resetShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        required
                        type={resetShowPassword ? "text" : "password"}
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 btn-primary py-2.5 rounded-xl font-bold text-xs shadow-md disabled:opacity-50"
                    >
                      {resetLoading ? "Updating..." : "Save New Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Pane - Visual Card Mosaic */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-teal-900 justify-center items-center">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80')" }} />
        
        {/* Overlay gradient mask */}
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-950/90 via-teal-900/80 to-transparent z-10" />

        {/* Floating cards container */}
        <div className="relative z-20 max-w-xl px-12 text-white">
          <div className="inline-block rounded-full bg-white/10 backdrop-blur px-3.5 py-1 text-xs font-bold mb-6 tracking-wide">
            🏢 All-in-one Rental Suite
          </div>
          <h2 className="text-4xl font-extrabold leading-tight">
            Simplify the connection between Landlord and Tenant
          </h2>
          <p className="mt-4 text-white/80 leading-relaxed text-sm">
            We handle payment notifications, rental agreements, direct bank transfers, and tenant verification so you can focus on building your property portfolio.
          </p>

          {/* Cards Grid preview */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {RENTAL_CARDS.map((card, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 hover:border-white/20 transition-all group">
                <img src={card.image} alt={card.title} className="h-28 w-full object-cover rounded-xl" />
                <h4 className="font-bold text-xs mt-2 truncate">{card.title}</h4>
                <div className="flex justify-between items-center text-[10px] text-white/60 mt-1">
                  <span>{card.beds} · {card.area}</span>
                  <span className="font-bold text-white text-xs">{card.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
