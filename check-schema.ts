import { createClient } from "@supabase/supabase-js";

// Note: Run this script with: node --env-file=.env check-schema.ts
// or ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in your environment.

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from("answer_bank").select("*").limit(1);
  if (error) {
    console.error("Error fetching answer_bank:", error);
  } else {
    console.log("Cols in answer_bank:", data.length > 0 ? Object.keys(data[0]) : "No rows, cannot infer. Try using RPC or fetch all.");
  }
}

checkSchema();
