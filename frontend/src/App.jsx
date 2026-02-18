import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
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
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

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

          <Route path="/documents" element={<div className="text-white p-4">Documents Module Mock</div>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
