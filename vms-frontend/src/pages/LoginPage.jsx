import React, { useState } from 'react';
import apiClient, { setTenantSubdomain } from '../services/api';

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get('/public/tenants');
        if (mounted) setTenants(res.data || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load tenants', err);
      } finally {
        if (mounted) setLoadingTenants(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!subdomain) throw new Error('Please enter tenant subdomain');
      setTenantSubdomain(subdomain);
      const response = await apiClient.post('/auth/admin/login', { email, password });
      if (response.data?.admin?.name) {
        localStorage.setItem('adminName', response.data.admin.name);
      }
      onLoginSuccess(response.data.token);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Admin login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <img src="/logo.png" alt="Company Logo" className="mx-auto h-12 w-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">Select Tenant</label>
            <select id="subdomain" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="" disabled>{loadingTenants ? 'Loading tenants...' : 'Choose a tenant'}</option>
              {tenants.map(t => <option key={t.id} value={t.subdomain}>{t.name} ({t.subdomain})</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-center text-red-600">{error}</p>}
          <div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
