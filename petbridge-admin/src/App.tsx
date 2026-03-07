import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Animals from './pages/Animals';
import Users from './pages/Users';
const Adoptions = () => <div className="p-6">Adoptions Page</div>;
const Reports = () => <div className="p-6">Reports Page</div>;

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<AdminLayout><Outlet /></AdminLayout>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/animals" element={<Animals />} />
              <Route path="/adoptions" element={<Adoptions />} />
              <Route path="/users" element={<Users />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
