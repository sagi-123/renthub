-- ── Setup all tables for RentHub ──────────────────────────────────────────
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/sgbahpkfxxsfjlfnyden/sql

-- 1. LANDLORDS TABLE (Create this first so others can reference it)
CREATE TABLE IF NOT EXISTS public.rh_landlords (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "upiId" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rh_landlords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read, write, update on rh_landlords" ON public.rh_landlords FOR ALL USING (true) WITH CHECK (true);


-- 2. TENANTS TABLE
CREATE TABLE IF NOT EXISTS public.rh_tenants (
    "id" TEXT PRIMARY KEY,
    "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "unit" TEXT NOT NULL,
    "rentAmount" NUMERIC NOT NULL,
    "depositAmount" NUMERIC NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "dueDate" TEXT,
    "leaseStart" TEXT,
    "leaseEnd" TEXT,
    "residentialAddress" TEXT,
    "propertyName" TEXT,
    "blockNumber" TEXT,
    "propertyAddress" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rh_tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read, write, update, delete on rh_tenants" ON public.rh_tenants FOR ALL USING (true) WITH CHECK (true);


-- 3. AGREEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.rh_agreements (
    "id" TEXT PRIMARY KEY,
    "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE,
    "tenantName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "rentAmount" NUMERIC NOT NULL,
    "depositAmount" NUMERIC NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "status" TEXT NOT NULL,
    "tenantEmail" TEXT,
    "tenantPhone" TEXT,
    "tenantAddress" TEXT,
    "propertyName" TEXT,
    "blockNumber" TEXT,
    "propertyAddress" TEXT,
    "termsAndConditions" TEXT,
    "contractText" TEXT,
    "landlordName" TEXT,
    "landlordSignature" TEXT,
    "landlordSignedAt" TEXT,
    "tenantSignature" TEXT,
    "tenantSignatureType" TEXT,
    "tenantSignedAt" TEXT,
    "landlordFatherName" TEXT,
    "landlordAadhaar" TEXT,
    "landlordPan" TEXT,
    "landlordPhone" TEXT,
    "landlordEmail" TEXT,
    "landlordAddress" TEXT,
    "tenantFatherName" TEXT,
    "tenantAadhaar" TEXT,
    "tenantPan" TEXT,
    "floorNumber" TEXT,
    "flatNumber" TEXT,
    "carpetArea" TEXT,
    "builtUpArea" TEXT,
    "parking" TEXT,
    "furnishing" TEXT,
    "keysGiven" TEXT,
    "notaryStatus" TEXT,
    "notaryName" TEXT,
    "notaryRegNo" TEXT,
    "notaryJurisdiction" TEXT,
    "notarySignedAt" TEXT,
    "notarySeal" TEXT,
    "notarySerialNo" TEXT,
    "notaryRemarks" TEXT,
    "history" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rh_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read, write, update, delete on rh_agreements" ON public.rh_agreements FOR ALL USING (true) WITH CHECK (true);


-- 4. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.rh_documents (
    "id" TEXT PRIMARY KEY,
    "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "size" TEXT,
    "uploadDate" TEXT,
    "tenantName" TEXT,
    "fileData" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rh_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read, write, update, delete on rh_documents" ON public.rh_documents FOR ALL USING (true) WITH CHECK (true);


-- 5. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.rh_reminders (
    "id" TEXT PRIMARY KEY,
    "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE,
    "tenantName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rh_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read, write, update, delete on rh_reminders" ON public.rh_reminders FOR ALL USING (true) WITH CHECK (true);


-- 6. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.rh_payments (
    "id" TEXT PRIMARY KEY,
    "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE,
    "tenantId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "amount" NUMERIC NOT NULL,
    "date" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rh_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read, write, update, delete on rh_payments" ON public.rh_payments FOR ALL USING (true) WITH CHECK (true);


-- 7. RENEWALS TABLE
CREATE TABLE IF NOT EXISTS public.rh_renewals (
    "id" TEXT PRIMARY KEY,
    "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE,
    "tenantId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "requestedAt" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rh_renewals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read, write, update, delete on rh_renewals" ON public.rh_renewals FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION PATH FOR EXISTING DATABASE INSTALLATIONS
-- ─────────────────────────────────────────────────────────────────────────────
-- Run these statements in the Supabase SQL editor to upgrade your existing tables:
--
-- ALTER TABLE public.rh_tenants ADD COLUMN IF NOT EXISTS "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE;
-- ALTER TABLE public.rh_tenants ADD COLUMN IF NOT EXISTS "residentialAddress" TEXT;
-- ALTER TABLE public.rh_tenants ADD COLUMN IF NOT EXISTS "propertyName" TEXT;
-- ALTER TABLE public.rh_tenants ADD COLUMN IF NOT EXISTS "blockNumber" TEXT;
-- ALTER TABLE public.rh_tenants ADD COLUMN IF NOT EXISTS "propertyAddress" TEXT;
--
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "tenantEmail" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "tenantPhone" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "tenantAddress" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "propertyName" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "blockNumber" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "propertyAddress" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "termsAndConditions" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "contractText" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "landlordName" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "landlordSignature" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "landlordSignedAt" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "tenantSignature" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "tenantSignatureType" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "tenantSignedAt" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "landlordFatherName" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "landlordAadhaar" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "landlordPan" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "landlordPhone" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "landlordEmail" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "landlordAddress" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "tenantFatherName" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "tenantAadhaar" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "tenantPan" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "floorNumber" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "flatNumber" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "carpetArea" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "builtUpArea" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "parking" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "furnishing" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "keysGiven" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "notaryStatus" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "notaryName" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "notaryRegNo" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "notaryJurisdiction" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "notarySignedAt" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "notarySeal" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "notarySerialNo" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "notaryRemarks" TEXT;
-- ALTER TABLE public.rh_agreements ADD COLUMN IF NOT EXISTS "history" JSONB DEFAULT '[]'::jsonb;
--
-- ALTER TABLE public.rh_documents ADD COLUMN IF NOT EXISTS "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE;
-- ALTER TABLE public.rh_documents ADD COLUMN IF NOT EXISTS "fileData" TEXT;
-- ALTER TABLE public.rh_reminders ADD COLUMN IF NOT EXISTS "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE;
-- ALTER TABLE public.rh_payments ADD COLUMN IF NOT EXISTS "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE;
-- ALTER TABLE public.rh_renewals ADD COLUMN IF NOT EXISTS "landlordId" TEXT REFERENCES public.rh_landlords("id") ON DELETE CASCADE;
--
-- ALTER TABLE public.rh_landlords ADD COLUMN IF NOT EXISTS "bankName" TEXT;
-- ALTER TABLE public.rh_landlords ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
-- ALTER TABLE public.rh_landlords ADD COLUMN IF NOT EXISTS "ifscCode" TEXT;
-- ALTER TABLE public.rh_landlords ADD COLUMN IF NOT EXISTS "upiId" TEXT;
