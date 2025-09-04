import React, { useState } from 'react';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import GuardLoginPage from './pages/GuardLoginPage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import GuardView from './pages/GuardView';
import './index.css';

// Modernized Role Selector Component
const RoleSelector = ({ onSelect }) => (
  <div className="flex flex-col md:flex-row h-screen font-sans">
    {/* Left side with image and quote */}
    <div className="w-full md:w-1/2 bg-gray-800 text-white flex flex-col justify-between p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554469384-e52fac157c28?q=80&w=2574&auto=format&fit=crop')" }}></div>
      <div className="relative z-10">
        <h1 className="text-3xl font-bold">VMS</h1>
        <p className="text-lg text-gray-300">Visitor Management System</p>
      </div>
      <div className="relative z-10">
        <blockquote className="text-xl italic">
          "The first impression is the last impression. Let's make it a secure and welcoming one."
        </blockquote>
      </div>
    </div>

    {/* Right side with selection */}
    <div className="w-full md:w-1/2 flex items-center justify-center bg-slate-50 p-12">
      <div className="w-full max-w-xs text-center">
        <img src="/logo.png" alt="Company Logo" className="mx-auto h-16 w-auto mb-8" />
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Your Role</h2>
        <div className="space-y-4">
          <button onClick={() => onSelect('admin')} className="w-full text-lg bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:-translate-y-1">
            I am an Administrator
          </button>
          <button onClick={() => onSelect('guard')} className="w-full text-lg bg-gray-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-gray-800 transition-transform transform hover:-translate-y-1">
            I am a Guard
          </button>
          <button onClick={() => onSelect('superadmin')} className="w-full text-lg bg-emerald-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-emerald-700 transition-transform transform hover:-translate-y-1">
            I am a Super Admin
          </button>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const [guardToken, setGuardToken] = useState(localStorage.getItem('guardToken'));
  const [role, setRole] = useState(null);
  const [superadminToken, setSuperadminToken] = useState(localStorage.getItem('superadminToken'));

  const handleAdminLogin = (token) => {
    localStorage.setItem('adminToken', token);
    setAdminToken(token);
  };
  
  const handleGuardLogin = (token) => {
    localStorage.setItem('guardToken', token);
    setGuardToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('guardToken');
    localStorage.removeItem('superadminToken');
    setAdminToken(null);
    setGuardToken(null);
    setSuperadminToken(null);
    setRole(null);
  };

  if (superadminToken) return <SuperAdminDashboard onLogout={handleLogout} />;
  if (adminToken) return <AdminDashboard onLogout={handleLogout} />;
  if (guardToken) return <GuardView onLogout={handleLogout} />;
  
  if (role === 'admin') return <LoginPage onLoginSuccess={handleAdminLogin} />;
  if (role === 'guard') return <GuardLoginPage onLoginSuccess={handleGuardLogin} />;
  if (role === 'superadmin') return <SuperAdminLoginPage onLoginSuccess={(token) => { localStorage.setItem('superadminToken', token); setSuperadminToken(token); }} />;

  return <RoleSelector onSelect={setRole} />;
}

export default App;
