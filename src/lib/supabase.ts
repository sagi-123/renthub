const SUPABASE_URL = "https://sgbahpkfxxsfjlfnyden.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYmFocGtmeHhzZmpsZm55ZGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NDYyNjAsImV4cCI6MjA5NzQyMjI2MH0.Irvxogy3op4NlWWmqsQuCRT7xvusPwnZsPibvLQIkmU";

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Supabase API warning: ${response.statusText} - ${errorText}`);
      throw new Error(`Supabase API error: ${response.statusText}`);
    }
    if (response.status === 204) return null;
    return response.json();
  } catch (err) {
    console.error(`Fetch failed for ${path}:`, err);
    throw err;
  }
}

// SCHEMA_COLUMNS exactly matches the live Supabase database columns (verified 2026-07-03).
// All columns now exist in the DB — data is fully cloud-backed.
const SCHEMA_COLUMNS: Record<string, string[]> = {
  rh_tenants: [
    "id", "landlordId", "name", "email", "phone", "unit", "rentAmount",
    "depositAmount", "paymentStatus", "dueDate", "leaseStart", "leaseEnd",
    "residentialAddress", "propertyName", "blockNumber", "propertyAddress", "createdAt"
  ],
  rh_agreements: [
    "id", "landlordId", "tenantName", "unit", "rentAmount", "depositAmount",
    "startDate", "endDate", "status",
    "tenantEmail", "tenantPhone", "tenantAddress",
    "propertyName", "blockNumber", "propertyAddress",
    "termsAndConditions", "contractText",
    "landlordName", "landlordSignature", "landlordSignedAt",
    "tenantSignature", "tenantSignatureType", "tenantSignedAt",
    "landlordFatherName", "landlordAadhaar", "landlordPan", "landlordPhone", "landlordEmail", "landlordAddress",
    "tenantFatherName", "tenantAadhaar", "tenantPan",
    "floorNumber", "flatNumber", "carpetArea", "builtUpArea", "parking", "furnishing", "keysGiven",
    "notaryStatus", "notaryName", "notaryRegNo", "notaryJurisdiction", "notarySignedAt", "notarySeal", "notarySerialNo", "notaryRemarks",
    "history", "createdAt"
  ],
  rh_documents: [
    "id", "landlordId", "name", "category", "size", "uploadDate", "tenantName", "fileData", "createdAt"
  ],
  rh_reminders: [
    "id", "landlordId", "tenantName", "unit", "message", "channel", "sentAt", "status", "createdAt"
  ],
  rh_landlords: [
    "id", "name", "email", "password", "phone", "bankName", "accountNumber", "ifscCode", "upiId", "createdAt"
  ],
  rh_payments: [
    "id", "landlordId", "tenantId", "tenantName", "unit", "amount", "date", "method", "status", "transactionId", "createdAt"
  ],
  rh_renewals: [
    "id", "landlordId", "tenantId", "tenantName", "unit", "requestedAt", "status", "notes", "createdAt"
  ]
};

function sanitizePayload(table: string, data: any, fillMissingWithNull = false): any {
  const allowed = SCHEMA_COLUMNS[table];
  if (!allowed) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizePayload(table, item, fillMissingWithNull));
  }
  
  if (typeof data === "object" && data !== null) {
    const sanitized: any = {};
    for (const key of allowed) {
      if (key in data) {
        sanitized[key] = data[key];
      } else if (fillMissingWithNull) {
        sanitized[key] = null;
      }
    }
    return sanitized;
  }
  return data;
}

export const supabase = {
  from: (table: string) => ({
    select: async (query = "*", filter = "") => {
      let path = `${table}?select=${encodeURIComponent(query)}`;
      if (filter) {
        path += `&${filter}`;
      }
      return supabaseFetch(path, {
        method: "GET",
      });
    },
    insert: async (data: any) => {
      const sanitized = sanitizePayload(table, data, true);
      return supabaseFetch(table, {
        method: "POST",
        body: JSON.stringify(sanitized),
        headers: {
          "Prefer": "return=representation",
        },
      });
    },
    upsert: async (data: any) => {
      const sanitized = sanitizePayload(table, data, true);
      return supabaseFetch(table, {
        method: "POST",
        body: JSON.stringify(sanitized),
        headers: {
          "Prefer": "resolution=merge-duplicates,return=representation",
        },
      });
    },
    update: async (data: any, match: Record<string, any>) => {
      const sanitized = sanitizePayload(table, data, false);
      const matchQuery = Object.entries(match)
        .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
        .join("&");
      return supabaseFetch(`${table}?${matchQuery}`, {
        method: "PATCH",
        body: JSON.stringify(sanitized),
        headers: {
          "Prefer": "return=representation",
        },
      });
    },
    delete: async (match: Record<string, any>) => {
      const matchQuery = Object.entries(match)
        .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
        .join("&");
      return supabaseFetch(`${table}?${matchQuery}`, {
        method: "DELETE",
        headers: {
          "Prefer": "return=representation",
        },
      });
    },
  }),
};

/* ── Sync & Cache Helpers ────────────────────────────────────────────────── */

// Helper to fetch data with localStorage caching and initial seeding
export async function syncCollection<T extends { id: string }>(
  tableName: string,
  localKey: string,
  initialSeed: T[],
  filter = ""
): Promise<T[]> {
  // Load local cache first — used to enrich Supabase data with fields
  // the DB may not have (e.g. contractText, tenantAddress, propertyName).
  const cachedStr = localStorage.getItem(localKey);
  const cachedList: T[] = cachedStr ? JSON.parse(cachedStr) : [];

  try {
    // Try fetching from Supabase
    const dbData = await supabase.from(tableName).select("*", filter) as T[];
    
    // If successful and has data, merge with local cache to preserve rich fields
    if (dbData && dbData.length > 0) {
      const merged = dbData.map(dbItem => {
        const cachedItem = cachedList.find(c => c.id === dbItem.id);
        if (!cachedItem) return dbItem;
        // Start with the locally-cached version (has all rich fields like contractText),
        // then overlay only non-null values returned by Supabase.
        const result: any = { ...cachedItem };
        for (const key of Object.keys(dbItem as any)) {
          const val = (dbItem as any)[key];
          if (val !== null && val !== undefined) {
            result[key] = val;
          }
        }
        return result as T;
      });
      localStorage.setItem(localKey, JSON.stringify(merged));
      return merged;
    }
    
    // If DB returns empty but we have local records, return the local cache (keeps local edits/in-flight writes safe)
    if (dbData && dbData.length === 0 && cachedList.length > 0) {
      return cachedList;
    }

    // No filter: seed the table with initial data if both DB and local are empty
    if (dbData && dbData.length === 0 && initialSeed.length > 0) {
      console.log(`Seeding table ${tableName} with initial data...`);
      await supabase.from(tableName).insert(initialSeed);
      localStorage.setItem(localKey, JSON.stringify(initialSeed));
      return initialSeed;
    }
  } catch (error) {
    console.warn(`Supabase sync failed for ${tableName}, falling back to localStorage.`);
  }

  // Fallback to localStorage (only reached when Supabase is unreachable)
  if (cachedList.length > 0) {
    return cachedList;
  }

  // Seed local storage with initial data if empty
  localStorage.setItem(localKey, JSON.stringify(initialSeed));
  return initialSeed;
}

// Helper to save a single record
export async function saveRecord<T extends { id: string }>(
  tableName: string,
  localKey: string,
  record: T,
  currentList: T[]
): Promise<T[]> {
  const index = currentList.findIndex(item => item.id === record.id);
  let updatedList: T[];
  if (index >= 0) {
    updatedList = [...currentList];
    updatedList[index] = record;
  } else {
    updatedList = [record, ...currentList];
  }

  // Update localStorage first for immediate responsiveness
  localStorage.setItem(localKey, JSON.stringify(updatedList));

  // Try updating/inserting on Supabase in the background
  try {
    await supabase.from(tableName).upsert(record);
  } catch (error) {
    console.error(`Failed to upload to Supabase table ${tableName}:`, error);
  }

  return updatedList;
}

// Helper to save a complete collection
export async function saveCollection<T extends { id: string }>(
  tableName: string,
  localKey: string,
  list: T[]
): Promise<void> {
  localStorage.setItem(localKey, JSON.stringify(list));
  try {
    // Perform upsert of all records
    if (list.length > 0) {
      await supabase.from(tableName).upsert(list);
    }
  } catch (error) {
    console.error(`Failed to update collection on Supabase table ${tableName}:`, error);
  }
}

// Helper to delete a record
export async function deleteRecord<T extends { id: string }>(
  tableName: string,
  localKey: string,
  id: string,
  currentList: T[]
): Promise<T[]> {
  const updatedList = currentList.filter(item => item.id !== id);
  localStorage.setItem(localKey, JSON.stringify(updatedList));

  try {
    await supabase.from(tableName).delete({ id });
  } catch (error) {
    console.error(`Failed to delete record from Supabase table ${tableName}:`, error);
  }

  return updatedList;
}
