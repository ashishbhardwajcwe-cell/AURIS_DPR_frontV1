import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Privacy from './pages/Privacy.jsx';
import Confidentiality from './pages/Confidentiality.jsx';
import Login from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Upload from './pages/Upload.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Pricing from './pages/Pricing.jsx';
import AdminJobs from './pages/AdminJobs.jsx';
import AdminJobDetail from './pages/AdminJobDetail.jsx';
import AdminClients from './pages/AdminClients.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/confidentiality" element={<Confidentiality />} />

        {/* Authenticated client */}
        <Route element={<ProtectedRoute />}>
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<Navigate to="/admin/jobs" replace />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/jobs" element={<AdminJobs />} />
            <Route path="/admin/jobs/:jobId" element={<AdminJobDetail />} />
            <Route path="/admin/clients" element={<AdminClients />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
