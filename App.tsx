import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import WelcomePage from './components/WelcomePage'; // New Welcome Page
import Login from './components/Login';
// Register component will be used by DashboardPage for admin registration
// import Register from './components/Register'; 
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<Login />} />
          {/* Public /register route removed. Admin registration will be under /app/admin/register */}
          {/* <Route path="/register" element={<Register />} /> */}
          
          {/* All application-specific routes are now under /app and protected */}
          <Route 
            path="/app/*" 
            element={
              <ProtectedRoute>
                {/* DashboardPage will handle its own internal routing based on the full path */}
                <DashboardPageRoutes />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect root to welcome page */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          
          {/* Fallback for any other unmatched routes, redirect to welcome */}
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

// Helper component to define routes rendered by DashboardPage
const DashboardPageRoutes: React.FC = () => {
  // The DashboardPage component itself will use useLocation() to determine what to render.
  // We just need to ensure it's hit for any /app/* path.
  // The actual path matching logic for specific dashboards (admin/employee etc.) is inside DashboardPage.
  // For this routing setup, DashboardPage needs to be aware that its base path is now /app.
  return <DashboardPage />;
}

export default App;