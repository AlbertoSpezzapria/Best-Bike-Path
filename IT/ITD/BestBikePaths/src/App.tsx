import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/app/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import RecordTrip from "./pages/app/RecordTrip";
import ExplorePaths from "./pages/app/ExplorePaths";
import MyPaths from "./pages/app/MyPaths";
import Settings from "./pages/app/Settings";
import PathDetail from "./pages/app/PathDetail";
import Login from "./pages/Login";
import ActivityDetail from "./pages/app/ActivityDetail";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/supabaseClient";

const queryClient = new QueryClient();

const App = () => {
  const { setSession, setUser } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser]);

  return (
    <QueryClientProvider client={queryClient}>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="record" element={<RecordTrip />} />
              <Route path="explore" element={<ExplorePaths />} />
              <Route path="my-paths" element={<MyPaths />} />
              <Route path="settings" element={<Settings />} />
              <Route path="path/:id" element={<PathDetail />} />
              <Route path="activity/:id" element={<ActivityDetail />} />
            </Route>
            <Route path="/guest-app" element={<AppLayout />}>
              <Route index element={<ExplorePaths/>}/>
              <Route path="/guest-app/guest-path/:id" element={<PathDetail/>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
