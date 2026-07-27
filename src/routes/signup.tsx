import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Home, Lock, Mail, User, Phone, ArrowRight, Eye, EyeOff, Sparkles, Shield } from "lucide-react";
import { saveRecord, syncCollection, supabase } from "../lib/supabase";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
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

function SignUpPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [tempLandlordData, setTempLandlordData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect to admin portal
    const isAdmin = sessionStorage.getItem("rh_admin_logged_in") === "true";
    if (isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !phone) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);

    try {
      // Check if landlord email already exists
      const emailFilter = `email=eq.${encodeURIComponent(email.toLowerCase().trim())}`;
      const existing = await supabase.from("rh_landlords").select("id", emailFilter) as any[];
      const emailExists = existing && existing.length > 0;
      
      if (emailExists) {
        setError("Email is already registered. Please sign in.");
        setLoading(false);
        return;
      }

      // Create new landlord object
      const newLandlord = {
        id: "l-" + Math.random().toString(36).substring(7),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        phone: phone.trim(),
        createdAt: new Date().toISOString()
      };

      // Save to Supabase and cache locally
      await saveRecord("rh_landlords", "rh_landlords", newLandlord, []);

      // Cache the new landlord data temporarily for OTP verification
      setTempLandlordData(newLandlord);
      
      setSuccess("Account created! Please verify your email.");
      setShowOtp(true);
      showToast("Your verification OTP is: 1234"); // Simulated email

    } catch (err: any) {
      console.error("Registration error:", err);
      setError(`Registration failed: ${err?.message || err || "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "1234") {
      setError("Invalid OTP. Please try '1234'.");
      return;
    }
    
    // Complete login
    sessionStorage.setItem("rh_admin_logged_in", "true");
    sessionStorage.setItem("rh_logged_in_landlord", JSON.stringify(tempLandlordData));
    
    setSuccess("Email verified successfully!");
    navigate({ to: "/admin" });
  };

  const showToast = (msg: string) => {
    // Simple toast for simulated OTP
    const el = document.createElement("div");
    el.className = "fixed top-4 right-4 bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl z-[9999] animate-fade-in";
    el.innerText = msg;
    document.body.appendChild(el);
    setTimeout(() => {
      el.classList.add("opacity-0", "transition-opacity", "duration-500");
      setTimeout(() => el.remove(), 500);
    }, 4000);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row relative overflow-hidden">
      {/* Mesh background effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20" style={{ background: "var(--gradient-mesh)" }} />

      {/* Left Pane - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative z-10 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-r border-teal-100/20">
        
        {/* Header logo */}
        <Link to="/" className="flex items-center gap-2 self-start mb-10">
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
            <Sparkles className="h-3.5 w-3.5" /> Start managing rentals today
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Create Landlord Account
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Sign up to centralize units, manage agreements, and collect rent online.
          </p>

          <form onSubmit={handleSignUp} className="mt-8 space-y-4">
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
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun Mehta"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60">
                  <Phone className="h-4.5 w-4.5" />
                </span>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
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
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full btn-primary py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md disabled:opacity-55"
            >
              {loading ? "Creating Account..." : "Create Account"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have a landlord account?{" "}
            <Link to="/signin" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 justify-center lg:justify-start mt-10 text-[11px] text-muted-foreground border-t pt-4 border-teal-100/10">
          <Shield className="h-3.5 w-3.5 text-teal-600" />
          <span>Secure, SSL-encrypted registration</span>
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
                We've sent a 4-digit code to <strong>{email}</strong>. Enter it below to verify your account.
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
              </form>
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
