const SUPABASE_URL = "https://sgbahpkfxxsfjlfnyden.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYmFocGtmeHhzZmpsZm55ZGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NDYyNjAsImV4cCI6MjA5NzQyMjI2MH0.Irvxogy3op4NlWWmqsQuCRT7xvusPwnZsPibvLQIkmU";

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/rh_landlords`;
  
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=representation",
  };
  
  const data = {
    id: "l-" + Math.random().toString(36).substring(7),
    name: "Test User",
    email: "msdibu3@gmail.com",
    password: "sajumauji",
    phone: "1234567890",
    createdAt: new Date().toISOString()
  };

  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(data) });
  if (!response.ok) {
     console.log("Error:", response.status, await response.text());
  } else {
     console.log("Success:", await response.json());
  }
}

run();
