const SUPABASE_URL = "https://sgbahpkfxxsfjlfnyden.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYmFocGtmeHhzZmpsZm55ZGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NDYyNjAsImV4cCI6MjA5NzQyMjI2MH0.Irvxogy3op4NlWWmqsQuCRT7xvusPwnZsPibvLQIkmU";

async function run() {
  const emailFilter = `email=eq.${encodeURIComponent("msdibu3@gmail.com")}`;
  const url = `${SUPABASE_URL}/rest/v1/rh_landlords?select=*&${emailFilter}`;
  
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
  
  const response = await fetch(url, { headers });
  const data = await response.json();
  console.log("Supabase response:", data);
}

run();
