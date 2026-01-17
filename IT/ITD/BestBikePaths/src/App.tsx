import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/app/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import RecordTrip from "./pages/app/RecordTrip";
import ExplorePaths from "./pages/app/ExplorePaths";
import MyPaths from "./pages/app/MyPaths";
import Settings from "./pages/app/Settings";
import PathDetail from "./pages/app/PathDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="record" element={<RecordTrip />} />
            <Route path="explore" element={<ExplorePaths />} />
            <Route path="my-paths" element={<MyPaths />} />
            <Route path="settings" element={<Settings />} />
            <Route path="path/:id" element={<PathDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
