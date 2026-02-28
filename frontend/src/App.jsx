import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Directory from "./pages/Directory";
import Leaves from "./pages/Leaves";
import SalaryManagement from "./pages/SalaryManagement";
import Reports from "./pages/Reports";
import Appraisal from "./pages/Appraisal";
import Admin from "./pages/Admin";
import Holidays from "./pages/Holidays";
import TASDashboard from "./pages/TASDashboard";
import JobCreate from "./pages/JobCreate";
import JobDetails from "./pages/JobDetails";
import CandidateDatabase from "./pages/CandidateDatabase";
import TakeAssessment from "./pages/TakeAssessment";

import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Onboarding from "./pages/Onboarding";
import RosterManagement from "./pages/RosterManagement";
import MyRoster from "./pages/MyRoster";
import MySalarySlips from "./pages/MySalarySlips";
import BrandingSettings from "./pages/BrandingSettings";
import AssetManagement from "./pages/AssetManagement";
import OfficeManagement from "./pages/OfficeManagement";
import OfficeVisitApprovals from "./pages/OfficeVisitApprovals";
import Offboarding from "./pages/Offboarding";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Service Desk
import ServiceDeskPortal from "./pages/servicedesk/ServiceDeskPortal";
import IncidentManagement from "./pages/servicedesk/IncidentManagement";
import ChangeManagement from "./pages/servicedesk/ChangeManagement";
import ProblemManagement from "./pages/servicedesk/ProblemManagement";
import CMDB from "./pages/servicedesk/CMDB";
import KEDB from "./pages/servicedesk/KEDB";
import SLADashboard from "./pages/servicedesk/SLADashboard";
import ServiceDeskAdmin from "./pages/servicedesk/ServiceDeskAdmin";
import ServiceDeskDashboard from "./pages/servicedesk/ServiceDeskDashboard";
import ServiceDeskReports from "./pages/servicedesk/ServiceDeskReports";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/salary" element={<SalaryManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/appraisal" element={<Appraisal />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/holidays" element={<Holidays />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* TAS Routes */}
            <Route path="/talent" element={<TASDashboard />} />
            <Route path="/talent/create-job" element={<JobCreate />} />
            <Route path="/talent/job/:id" element={<JobDetails />} />
            <Route path="/talent/assessment/:id" element={<TakeAssessment />} />
            <Route path="/talent/candidates" element={<CandidateDatabase />} />
            <Route path="/roster" element={<RosterManagement />} />
            <Route path="/my-roster" element={<MyRoster />} />
            <Route path="/salary-slips" element={<MySalarySlips />} />
            <Route path="/branding" element={<BrandingSettings />} />
            <Route path="/assets" element={<AssetManagement />} />
            <Route path="/offices" element={<OfficeManagement />} />
            <Route path="/office-visits" element={<OfficeVisitApprovals />} />
            <Route path="/offboarding" element={<Offboarding />} />

            {/* Service Desk Routes */}
            <Route path="/servicedesk" element={<ServiceDeskPortal />} />
            <Route path="/servicedesk/dashboard" element={<ServiceDeskDashboard />} />
            <Route path="/servicedesk/incidents" element={<IncidentManagement />} />
            <Route path="/servicedesk/changes" element={<ChangeManagement />} />
            <Route path="/servicedesk/problems" element={<ProblemManagement />} />
            <Route path="/servicedesk/cmdb" element={<CMDB />} />
            <Route path="/servicedesk/kedb" element={<KEDB />} />
            <Route path="/servicedesk/sla" element={<SLADashboard />} />
            <Route path="/servicedesk/reports" element={<ServiceDeskReports />} />
            <Route path="/servicedesk/admin" element={<ServiceDeskAdmin />} />

            <Route path="/documents" element={<div className="text-white p-4">Documents Module Mock</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
