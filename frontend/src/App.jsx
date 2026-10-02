import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import { LoginPage, RegisterPage } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import { PublicJobBoard, ApplyPage } from './pages/PublicJobs';
import Admin from './pages/Admin';
import Pricing from './pages/Pricing';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e5e3f5', borderTopColor: '#5b51f8', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/jobs" element={<PublicJobBoard />} />
          <Route path="/jobs/:id/apply" element={<ApplyPage />} />
          <Route path="/admin" element={<Admin />} />

          {/* Protected */}
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/my-jobs" element={<Protected><Jobs /></Protected>} />
          <Route path="/my-jobs/:id" element={<Protected><JobDetail /></Protected>} />
          <Route path="/pricing" element={<Protected><Pricing /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 13, fontFamily: 'Inter, sans-serif' } }} />
    </AuthProvider>
  );
}
