import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2, FileText, CreditCard, BellRing, BarChart3,
  Check, Star, Menu, X, ArrowRight, Shield, Users, Home,
  PenLine, Wallet, UserPlus, Twitter, Linkedin, Instagram, Facebook,
  Sparkles, TrendingUp
} from "lucide-react";
import heroImg from "@/assets/hero-apartment.jpg";
import aboutImg from "@/assets/about-apartments.jpg";
import t1 from "@/assets/testimonial-1.jpg";
import t2 from "@/assets/testimonial-2.jpg";
import t3 from "@/assets/testimonial-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RentHub — Manage Rentals The Smart Way" },
      { name: "description", content: "Digital agreements, online payments, tenant management, and automated reminders — everything you need in one place." },
      { property: "og:title", content: "RentHub — Manage Rentals The Smart Way" },
      { property: "og:description", content: "The complete rental management platform for modern property owners." },
    ],
  }),
  component: Landing,
});

const nav = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "How It Works", href: "#how" },
  { label: "Contact Us", href: "#contact" },
];

const services = [
  { icon: Building2, title: "Property Management", desc: "Centralize every unit, tenant, and document in one elegant dashboard." },
  { icon: FileText, title: "Digital Agreements", desc: "Generate, share and sign legally-binding rental agreements in minutes." },
  { icon: CreditCard, title: "Online Payments", desc: "Accept rent via UPI, cards and netbanking with automatic reconciliation." },
  { icon: BellRing, title: "Payment Reminders", desc: "Automated nudges by SMS, email and WhatsApp — never chase rent again." },
  { icon: BarChart3, title: "Reports & Insights", desc: "Real-time analytics on income, occupancy and tenant performance." },
];

const steps = [
  { icon: UserPlus, title: "Register", desc: "Create your free account" },
  { icon: Home, title: "Add Property", desc: "List units in seconds" },
  { icon: FileText, title: "Create Agreement", desc: "Use smart templates" },
  { icon: PenLine, title: "Digital Signature", desc: "Sign from anywhere" },
  { icon: Wallet, title: "Collect Rent", desc: "Get paid on time" },
];

const stats = [
  { value: "500+", label: "Happy Clients", icon: Users },
  { value: "1200+", label: "Properties Managed", icon: Building2 },
  { value: "3000+", label: "Agreements Created", icon: FileText },
  { value: "₹2Cr+", label: "Rent Collected", icon: TrendingUp },
];

const checklist = [
  "Easy dashboard", "Automated rent collection", "Secure documents",
  "Smart notifications", "Digital signatures", "Tenant management",
];

const testimonials = [
  { name: "Arjun Mehta", role: "Property Owner, Mumbai", img: t1, quote: "RentHub transformed how I manage 14 units. Rent collection is fully automated and I get paid on the 1st, every time." },
  { name: "Priya Sharma", role: "Landlord, Bangalore", img: t2, quote: "The digital agreements alone saved me dozens of trips. My tenants love the experience and so do I." },
  { name: "Rahul Verma", role: "Real Estate Investor, Pune", img: t3, quote: "Finally a platform that feels built for serious owners. The reports give me visibility I never had before." },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
        <Home className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
        Rent<span style={{ color: "var(--teal-500)" }}>Hub</span>
      </span>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto mt-4 max-w-7xl px-4">
        <nav className="glass-card flex items-center justify-between rounded-2xl px-5 py-3">
          <Logo />
          <ul className="hidden items-center gap-8 lg:flex">
            {nav.map((n) => (
              <li key={n.label}>
                <a href={n.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{n.label}</a>
              </li>
            ))}
          </ul>
          <div className="hidden items-center gap-3 lg:flex">
            <button className="btn-secondary rounded-xl px-4 py-2 text-sm font-semibold">Login</button>
            <button className="btn-primary rounded-xl px-5 py-2 text-sm font-semibold">Register</button>
          </div>
          <button onClick={() => setOpen(!open)} className="lg:hidden" aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </nav>
        {open && (
          <div className="glass-card mt-2 rounded-2xl p-5 lg:hidden">
            <ul className="space-y-3">
              {nav.map((n) => <li key={n.label}><a href={n.href} onClick={() => setOpen(false)} className="block text-sm font-medium">{n.label}</a></li>)}
            </ul>
            <div className="mt-4 flex gap-2">
              <button className="btn-secondary flex-1 rounded-xl px-4 py-2 text-sm font-semibold">Login</button>
              <button className="btn-primary flex-1 rounded-xl px-4 py-2 text-sm font-semibold">Register</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-36 pb-20 lg:pt-44 lg:pb-28" style={{ background: "var(--gradient-soft)" }}>
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl" style={{ background: "var(--teal-100)" }} />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-xs font-semibold" style={{ color: "var(--teal-600)", borderColor: "#CFEDEC" }}>
            <Sparkles className="h-3.5 w-3.5" /> India's most loved rental platform
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl xl:text-6xl">
            Manage Rentals
            <br />
            <span className="whitespace-nowrap" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              The Smart Way
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Digital Agreements, Online Payments, Tenant Management, Automated Reminders — Everything You Need In One Place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn-primary inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold">
              Get Started <ArrowRight className="h-4 w-4" />
            </button>
            <button className="btn-secondary rounded-2xl px-7 py-4 text-base font-semibold">Explore Services</button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {["Secure & Reliable", "Digital Agreements", "Online Payments"].map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: "var(--teal-100)", color: "var(--teal-600)" }}>
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {b}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="aspect-square w-[110%] rounded-full" style={{ background: "radial-gradient(circle, #0F9D9A 0%, #0B7D79 70%)", opacity: 0.95 }} />
          </div>
          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-30px_rgba(11,125,121,0.5)]">
            <img src={heroImg} alt="Modern luxury apartment building" width={1200} height={1200} className="h-[520px] w-full object-cover" />
          </div>
          <div className="glass-card animate-float absolute left-2 bottom-8 rounded-2xl p-4 sm:left-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="teal-icon grid h-12 w-12 place-items-center rounded-2xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Trusted by</div>
                <div className="text-2xl font-extrabold leading-none text-foreground">500+</div>
                <div className="text-xs font-medium text-muted-foreground">Property Owners</div>
              </div>
            </div>
          </div>
          <div className="glass-card animate-float absolute right-2 top-6 rounded-2xl px-4 py-3 sm:right-4" style={{ animationDelay: "1.5s" }}>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-muted-foreground">Bank-grade</div>
                <div className="text-sm font-bold text-foreground">Security</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <div className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ background: "var(--teal-50)", color: "var(--teal-600)" }}>{kicker}</div>
      <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Services() {
  return (
    <section id="services" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionTitle kicker="Our Services" title="Everything you need to run rentals" sub="A complete toolkit built for modern landlords and property managers." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="card-soft p-8">
              <div className="teal-icon mb-6 grid h-14 w-14 place-items-center rounded-2xl">
                <s.icon className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--teal-600)" }}>
                Learn more <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="relative py-24 lg:py-32" style={{ background: "var(--gradient-soft)" }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionTitle kicker="How It Works" title="From signup to rent collected in 5 simple steps" />
        <div className="relative">
          <svg className="pointer-events-none absolute left-0 right-0 top-9 hidden h-2 w-full lg:block" preserveAspectRatio="none" viewBox="0 0 1000 4">
            <line x1="40" y1="2" x2="960" y2="2" stroke="#0F9D9A" strokeWidth="2" strokeDasharray="4 8" strokeLinecap="round" className="animate-dash" />
          </svg>
          <ol className="relative grid gap-10 lg:grid-cols-5">
            {steps.map((step, i) => (
              <li key={step.title} className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-[var(--shadow-card)] ring-1 ring-teal-100">
                    <step.icon className="h-8 w-8" style={{ color: "var(--teal-600)" }} />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: "var(--gradient-primary)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </div>
                <h3 className="mt-6 font-bold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-[2rem] px-6 py-14 text-white sm:px-12 lg:py-20" style={{ background: "var(--gradient-banner)", boxShadow: "var(--shadow-elegant)" }}>
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur sm:mx-0">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{s.value}</div>
                <div className="mt-1 text-sm font-medium text-white/80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 lg:grid-cols-2">
        <div className="relative">
          <div className="overflow-hidden rounded-[2rem] shadow-[var(--shadow-card)]">
            <img src={aboutImg} alt="Modern apartment complex" loading="lazy" width={1280} height={900} className="h-[500px] w-full object-cover" />
          </div>
          <div className="glass-card absolute -bottom-6 -right-4 rounded-2xl p-5 sm:-right-8">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "var(--gradient-primary)" }}>
                <Star className="h-6 w-6 text-white" fill="white" />
              </div>
              <div>
                <div className="text-2xl font-extrabold">4.9/5</div>
                <div className="text-xs text-muted-foreground">Average rating</div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ background: "var(--teal-50)", color: "var(--teal-600)" }}>About Platform</div>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Built For Property Owners Who Value Simplicity</h2>
          <p className="mt-5 text-lg text-muted-foreground">RentHub takes the friction out of property management with an elegant, owner-first experience. No spreadsheets, no follow-ups, no surprises.</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-teal-100/60">
                <span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: "var(--gradient-primary)" }}>
                  <Check className="h-4 w-4 text-white" strokeWidth={3} />
                </span>
                <span className="font-medium">{c}</span>
              </li>
            ))}
          </ul>
          <button className="btn-primary mt-8 inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 font-semibold">
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-24 lg:py-32" style={{ background: "var(--gradient-soft)" }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionTitle kicker="Testimonials" title="Loved by property owners across India" />
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="card-soft p-8">
              <div className="flex gap-1" style={{ color: "var(--teal-500)" }}>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4" fill="currentColor" />)}
              </div>
              <blockquote className="mt-5 text-base leading-relaxed text-foreground">"{t.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img src={t.img} alt={t.name} loading="lazy" width={48} height={48} className="h-12 w-12 rounded-full object-cover ring-2 ring-teal-100" />
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-white p-10 text-center ring-1 ring-teal-100 sm:p-16" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full opacity-40 blur-3xl" style={{ background: "var(--teal-100)" }} />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to simplify your rentals?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">Join 500+ property owners managing rentals the smart way.</p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <button className="btn-primary inline-flex items-center gap-2 rounded-2xl px-7 py-4 font-semibold">Get Started Free <ArrowRight className="h-4 w-4" /></button>
            <button className="btn-secondary rounded-2xl px-7 py-4 font-semibold">Talk to Sales</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contact" className="border-t bg-white pt-16 pb-8" style={{ borderColor: "rgba(15,157,154,0.15)" }}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">The complete rental management platform for modern property owners.</p>
            <div className="mt-5 flex gap-3">
              {[Twitter, Linkedin, Instagram, Facebook].map((Icon, i) => (
                <a key={i} href="#" aria-label="social" className="grid h-9 w-9 place-items-center rounded-xl ring-1 ring-teal-100 transition-colors hover:bg-teal-50" style={{ color: "var(--teal-600)" }}>
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {nav.map((n) => <li key={n.label}><a href={n.href} className="hover:text-foreground">{n.label}</a></li>)}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold">Services</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {services.map((s) => <li key={s.title}>{s.title}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>hello@renthub.io</li>
              <li>+91 80 4567 8900</li>
              <li>WeWork Galaxy, Bangalore<br />Karnataka 560001, India</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground" style={{ borderColor: "rgba(15,157,154,0.15)" }}>
          <div>© {new Date().getFullYear()} RentHub. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Services />
      <HowItWorks />
      <Stats />
      <About />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
