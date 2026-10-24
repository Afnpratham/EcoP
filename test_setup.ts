import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "node:process";

try { loadEnvFile(".env.local"); } catch { /* optional local config */ }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Creating test user...");
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: `test-${Date.now()}@ecop.com`,
    password: "password123",
    user_metadata: { full_name: "Test Demo User" },
    email_confirm: true,
  });

  if (userError) {
    console.error("Error creating user:", userError);
    return;
  }
  console.log("Created user:", user.user.id);
  
  // Wait a moment for trigger to create profile
  await new Promise(r => setTimeout(r, 2000));
}

run();
