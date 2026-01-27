import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Mancano le variabili d'ambiente VITE_SUPABASE_URL o VITE_SUPABASE_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseKey);