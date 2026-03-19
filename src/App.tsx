import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import JobMatchesPage from "./pages/JobMatchesPage";
import AutoApplyQueuePage from "./pages/AutoApplyQueuePage";
import AppliedJobsPage from "./pages/AppliedJobsPage";
import ResumeManagerPage from "./pages/ResumeManagerPage";
import AtsAnalyzerPage from "./pages/AtsAnalyzerPage";
import ResumeOptimizerPage from "./pages/ResumeOptimizerPage";
import PreferencesPage from "./pages/PreferencesPage";
import AnswerBankPage from "./pages/AnswerBankPage";
import SourceCapabilitiesPage from "./pages/SourceCapabilitiesPage";
import ConnectedAccountsPage from "./pages/ConnectedAccountsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/jobs" element={<JobMatchesPage />} />
                <Route path="/queue" element={<AutoApplyQueuePage />} />
                <Route path="/applied" element={<AppliedJobsPage />} />
                <Route path="/resumes" element={<ResumeManagerPage />} />
                <Route path="/ats" element={<AtsAnalyzerPage />} />
                <Route path="/optimizer" element={<ResumeOptimizerPage />} />
                <Route path="/preferences" element={<PreferencesPage />} />
                <Route path="/answers" element={<AnswerBankPage />} />
                <Route path="/sources" element={<SourceCapabilitiesPage />} />
                <Route path="/accounts" element={<ConnectedAccountsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
