import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import App from './App';

// Full-screen centered spinner shown while token is being verified
function Spinner() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: 16,
      background: 'var(--bg)', color: 'var(--text3)',
    }}>
      <div style={{ fontSize: 28 }}>🌱</div>
      <div style={{ fontSize: 14 }}>Loading GrowthOS…</div>
    </div>
  );
}

// Protects every route inside App:
// - While token is being verified → show spinner (no flash to login)
// - Not logged in → redirect to /login
// - Logged in → render the app
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}

// Prevents logged-in users from seeing /login or /register again
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/" replace /> : children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes — redirect to / if already logged in */}
          <Route
            path="/login"
            element={<PublicRoute><Login /></PublicRoute>}
          />
          <Route
            path="/register"
            element={<PublicRoute><Register /></PublicRoute>}
          />

          {/* Protected routes — redirect to /login if not logged in */}
          <Route
            path="/*"
            element={<PrivateRoute><App /></PrivateRoute>}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
