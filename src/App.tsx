import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { TaskProvider } from './contexts/TaskContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import MyTasksPage from './pages/MyTasksPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <TaskProvider>
            <Toaster
              position="top-right"
              gutter={12}
              toastOptions={{
                duration: 3800,
                className: '!font-sans',
                style: {
                  background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                  color: '#f8fafc',
                  fontSize: '13px',
                  lineHeight: 1.45,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  maxWidth: 'min(360px, calc(100vw - 32px))',
                  boxShadow: '0 18px 45px -24px rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                },
                success: {
                  iconTheme: { primary: '#34d399', secondary: '#0f172a' },
                  style: { borderLeft: '4px solid #10b981' },
                },
                error: {
                  iconTheme: { primary: '#f87171', secondary: '#0f172a' },
                  style: { borderLeft: '4px solid #ef4444' },
                },
              }}
            />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/tasks" element={<MyTasksPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </TaskProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
