import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/supabaseClient";

interface AuthState {
  session: Session | null;
  user: User | null;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
