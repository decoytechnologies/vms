import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { Sun, Moon, Search as SearchIcon, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';

const SuperAdminDashboard = ({ onLogout }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');

  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', name: '', phone: '', password: '' });
  const [adminError, setAdminError] = useState('');

  // Theme
  const [isDark, setIsDark] = useState(true);
  const containerBg = isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';
  const tableHeadBg = isDark ? 'bg-slate-700' : 'bg-slate-100';
  const primaryBtn = isDark ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700';
  const neutralBtn = isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300';
  const sidebarBg = isDark
    ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100'
    : 'bg-white text-slate-900 border-r border-slate-200';
  const tabActive = isDark ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-slate-900';
  const tabHover = isDark ? 'hover:bg-slate-700/60' : 'hover:bg-slate-100';
  const themeToggleBtn = isDark
    ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200';

  // Toasts
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
  const showToast = (message, type = 'success', timeout = 2500) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: '', type, visible: false }), timeout);
  };

  // Pagination & search
  const [tenantPage, setTenantPage] = useState(1);
  const [tenantPageSize] = useState(10);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantTotal, setTenantTotal] = useState(0);

  const [adminPage, setAdminPage] = useState(1);
  const [adminPageSize] = useState(10);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminTotal, setAdminTotal] = useState(0);

  // Edit modals state
  const [tenantEditOpen, setTenantEditOpen] = useState(false);
  const [tenantEdit, setTenantEdit] = useState(null);
  const [adminEditOpen, setAdminEditOpen] = useState(false);
  const [adminEdit, setAdminEdit] = useState(null);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/superadmin/tenants', { params: { page: tenantPage, pageSize: tenantPageSize, search: tenantSearch } });
      const data = res.data;
      const items = Array.isArray(data) ? data : (data?.items || []);
      const total = Array.isArray(data) ? data.length : (data?.total || 0);
      setTenants(items);
      setTenantTotal(total);
    } catch (e) {
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async (tenantId) => {
    if (!tenantId) { setAdmins([]); return; }
    setAdminsLoading(true);
    setAdminError('');
    try {
      const res = await apiClient.get(`/superadmin/tenants/${tenantId}/admins`, { params: { page: adminPage, pageSize: adminPageSize, search: adminSearch } });
      const data = res.data;
      const items = Array.isArray(data) ? data : (data?.items || []);
      const total = Array.isArray(data) ? data.length : (data?.total || 0);
      setAdmins(items);
      setAdminTotal(total);
    } catch (e) {
      setAdminError(e.response?.data?.message || 'Failed to load admins');
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => { loadTenants(); }, [tenantPage, tenantSearch]);
  useEffect(() => { setAdminPage(1); }, [selectedTenantId, adminSearch]);
  useEffect(() => { loadAdmins(selectedTenantId); }, [selectedTenantId, adminPage, adminSearch]);

  const createTenant = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!/^[A-Za-z ]+$/.test(name)) throw new Error('Name must contain only letters and spaces.');
      if (!/^[a-z0-9-]+$/.test(subdomain)) throw new Error('Subdomain must be lowercase letters, digits, or hyphens.');
      await apiClient.post('/superadmin/tenants', { name, subdomain });
      setName('');
      setSubdomain('');
      showToast('Tenant created');
      loadTenants();
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to create tenant';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  const toggleActive = async (tenant) => {
    await apiClient.patch(`/superadmin/tenants/${tenant.id}`, { isActive: !tenant.isActive });
    showToast('Tenant status updated');
    loadTenants();
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');
    try {
      if (!/^[A-Za-z ]+$/.test(adminForm.name)) throw new Error('Name must contain only letters and spaces.');
      if (!/^\S+@\S+\.\S+$/.test(adminForm.email)) throw new Error('Invalid email format.');
      if (adminForm.phone && !/^\d{10}$/.test(adminForm.phone)) throw new Error('Phone must be 10 digits.');
      await apiClient.post(`/superadmin/tenants/${selectedTenantId}/admins`, adminForm);
      setAdminForm({ email: '', name: '', phone: '', password: '' });
      showToast('Admin created');
      loadAdmins(selectedTenantId);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to create admin';
      setAdminError(msg);
      showToast(msg, 'error');
    }
  };

  const deleteAdmin = async (adminId) => {
    if (!window.confirm('Delete this admin?')) return;
    try {
      await apiClient.delete(`/superadmin/tenants/${selectedTenantId}/admins/${adminId}`);
      showToast('Admin deleted');
      loadAdmins(selectedTenantId);
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to delete admin';
      setAdminError(msg);
      showToast(msg, 'error');
    }
  };

  // Tab state for sidebar navigation
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'admins'

  return (
    <div className={`min-h-screen ${containerBg}`}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className={`w-64 p-6 sticky top-0 h-screen shadow-xl flex flex-col ${sidebarBg}`}>
          <div className="mb-8 flex items-center justify-center">
            <img src={isDark ? '/darkthemelogo.png' : '/logo.png'} alt="Logo" className="h-16 w-auto" />
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('tenants')} className={`w-full text-left px-4 py-2 rounded-lg transition ${activeTab === 'tenants' ? tabActive : tabHover}`}>Tenants</button>
            <button onClick={() => setActiveTab('admins')} className={`w-full text-left px-4 py-2 rounded-lg transition ${activeTab === 'admins' ? tabActive : tabHover}`}>Tenant Admins</button>
          </nav>
          <div className="mt-auto space-y-4 flex flex-col items-center">
            <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition ${themeToggleBtn}`} aria-label="Toggle theme">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={onLogout} className={`${primaryBtn} w-full text-white font-semibold py-2 px-4 rounded-lg transition`}>Logout</button>
          </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-8 space-y-8">
          <div className="mb-2">
            <h1 className="text-2xl font-bold">Super Admin</h1>
          </div>
          {activeTab === 'tenants' && (
          <section className={`${cardBg} p-6 rounded-xl shadow-lg border ${borderColor}`}>
            <h2 className="text-lg font-semibold mb-4">Create Tenant</h2>
            <form onSubmit={createTenant} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className={`border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-white'} rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
              <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="Subdomain" required className={`border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-white'} rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
              <button type="submit" className={`${primaryBtn} text-white rounded px-4 py-2`}>Create</button>
            </form>
            {error && <p className="text-red-400 mt-2">{error}</p>}
          </section>
          )}
          {activeTab === 'tenants' && (
          <section className={`${cardBg} p-6 rounded-xl shadow-lg border ${borderColor}`}>
            <h2 className="text-lg font-semibold mb-4">Tenants</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input value={tenantSearch} onChange={(e) => setTenantSearch(e.target.value)} placeholder="Search tenants..." className={`pl-9 pr-3 py-2 rounded border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-white'} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
              </div>
              <div className="flex items-center space-x-2">
                <button disabled={tenantPage <= 1} onClick={() => setTenantPage(p => Math.max(p - 1, 1))} className={`p-2 rounded border ${borderColor} ${neutralBtn} disabled:opacity-50`}><ChevronLeft size={16} /></button>
                <span className="text-sm">Page {tenantPage} of {Math.max(1, Math.ceil(tenantTotal / tenantPageSize))}</span>
                <button disabled={tenantPage >= Math.ceil(tenantTotal / tenantPageSize)} onClick={() => setTenantPage(p => p + 1)} className={`p-2 rounded border ${borderColor} ${neutralBtn} disabled:opacity-50`}><ChevronRight size={16} /></button>
              </div>
            </div>
            {loading ? <p>Loading...</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={`${tableHeadBg}`}><tr><th className="text-left p-2">Name</th><th className="text-left p-2">Subdomain</th><th className="text-left p-2">Active</th><th className="p-2"/></tr></thead>
                  <tbody>
                    {tenants.map(t => (
                      <tr key={t.id} className={`border-t ${borderColor} ${isDark ? 'hover:bg-slate-700/40' : 'hover:bg-slate-100'}`}>
                        <td className="p-2">{t.name}</td>
                        <td className="p-2">{t.subdomain}</td>
                        <td className="p-2">{t.isActive ? 'Yes' : 'No'}</td>
                        <td className="p-2 text-right flex items-center justify-end gap-2">
                          <button onClick={() => toggleActive(t)} className={`px-3 py-1 ${primaryBtn} text-white rounded`}>Toggle Active</button>
                          <button onClick={() => { setTenantEdit(t); setTenantEditOpen(true); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-md"><Edit size={16} /><span className="text-sm">Edit</span></button>
                          <button onClick={async () => { if (window.confirm(`Delete tenant ${t.name}? This cannot be undone.`)) { try { await apiClient.delete(`/superadmin/tenants/${t.id}`); showToast('Tenant deleted'); loadTenants(); } catch (e) { showToast(e.response?.data?.message || 'Failed to delete tenant', 'error'); } } }} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          )}
          {activeTab === 'admins' && (
          <section className={`${cardBg} p-6 rounded-xl shadow-lg border ${borderColor}`}>
            <h2 className="text-lg font-semibold mb-4">Tenant Admins</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium">Select Tenant</label>
                <select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} className={`w-full px-3 py-2 border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-white'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                  <option value="" disabled>Select a tenant</option>
                  {tenants.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>)}
                </select>
              </div>
            </div>
            {selectedTenantId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Create Admin</h3>
                  <form onSubmit={createAdmin} className="space-y-3">
                    <input type="text" placeholder="Name" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} required className={`w-full px-3 py-2 border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-white'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    <input type="email" placeholder="Email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} required className={`w-full px-3 py-2 border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-white'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    <input type="tel" placeholder="Mobile Number (10 digits)" value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} className={`w-full px-3 py-2 border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-white'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    <input type="password" placeholder="Password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} required className={`w-full px-3 py-2 border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-white'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    <button type="submit" className={`${primaryBtn} text-white rounded px-4 py-2`}>Add Admin</button>
                  </form>
                  {adminError && <p className="text-red-400 mt-2">{adminError}</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Existing Admins</h3>
                    <div className="flex items-center space-x-2">
                      <div className="relative w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} placeholder="Search admins..." className={`w-full pl-9 pr-3 py-2 rounded border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-white'} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button disabled={adminPage <= 1} onClick={() => setAdminPage(p => Math.max(p - 1, 1))} className={`p-2 rounded border ${borderColor} ${neutralBtn} disabled:opacity-50`}><ChevronLeft size={16} /></button>
                        <span className="text-sm whitespace-nowrap">Page {adminPage} of {Math.max(1, Math.ceil(adminTotal / adminPageSize))}</span>
                        <button disabled={adminPage >= Math.ceil(adminTotal / adminPageSize)} onClick={() => setAdminPage(p => p + 1)} className={`p-2 rounded border ${borderColor} ${neutralBtn} disabled:opacity-50`}><ChevronRight size={16} /></button>
                      </div>
                    </div>
                  </div>
                  {adminsLoading ? <p>Loading admins...</p> : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className={`${tableHeadBg}`}><tr><th className="text-left p-2">Name</th><th className="text-left p-2">Email</th><th className="p-2"/></tr></thead>
                        <tbody>
                          {admins.map(a => (
                            <tr key={a.id} className={`border-t ${borderColor} ${isDark ? 'hover:bg-slate-700/40' : 'hover:bg-slate-100'}`}>
                              <td className="p-2">{a.name}</td>
                              <td className="p-2">{a.email}</td>
                              <td className="p-2 text-right flex items-center justify-end gap-2">
                                <button onClick={() => { setAdminEdit({ ...a }); setAdminEditOpen(true); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-md"><Edit size={16} /><span className="text-sm">Edit</span></button>
                                <button onClick={() => deleteAdmin(a.id)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md"><Trash2 size={16} /><span className="text-sm">Delete</span></button>
                              </td>
                            </tr>
                          ))}
                          {admins.length === 0 && (
                            <tr><td className="p-2 text-slate-400" colSpan="3">No admins yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
          )}
          {tenantEditOpen && (
            <TenantEditModal
              isDark={isDark}
              tenant={tenantEdit}
              onClose={() => setTenantEditOpen(false)}
              onSave={async (updates) => {
                try {
                  await apiClient.patch(`/superadmin/tenants/${tenantEdit.id}`, updates);
                  showToast('Tenant updated');
                  setTenantEditOpen(false);
                  loadTenants();
                } catch (e) {
                  showToast(e.response?.data?.message || 'Failed to update tenant', 'error');
                }
              }}
            />
          )}
          {adminEditOpen && (
            <AdminEditModal
              isDark={isDark}
              admin={adminEdit}
              onClose={() => setAdminEditOpen(false)}
              onSave={async (updates) => {
                try {
                  await apiClient.patch(`/superadmin/tenants/${selectedTenantId}/admins/${adminEdit.id}`, updates);
                  showToast('Admin updated');
                  setAdminEditOpen(false);
                  loadAdmins(selectedTenantId);
                } catch (e) {
                  showToast(e.response?.data?.message || 'Failed to update admin', 'error');
                }
              }}
            />
          )}
        </main>
      </div>
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;

// --- Tenant Edit Modal ---
const TenantEditModal = ({ isDark, tenant, onClose, onSave }) => {
  const [form, setForm] = useState({ name: tenant?.name || '', subdomain: tenant?.subdomain || '' });
  const canSave = form.name && form.subdomain;
  return (
    <div className={`fixed inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'} flex items-center justify-center z-30 p-6`}>
      <div className={`${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white'} p-6 rounded-xl shadow-2xl w-full max-w-md border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit Tenant</h3>
          <button onClick={onClose} className={`${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>✕</button>
        </div>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'border-slate-200'}`} />
          <input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} placeholder="Subdomain" className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'border-slate-200'}`} />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className={`${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} px-4 py-2 rounded`}>Cancel</button>
            <button disabled={!canSave} onClick={() => onSave(form)} className={`px-4 py-2 rounded text-white ${canSave ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-400 cursor-not-allowed'}`}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Admin Edit Modal ---
const AdminEditModal = ({ isDark, admin, onClose, onSave }) => {
  const [form, setForm] = useState({ name: admin?.name || '', email: admin?.email || '', phone: admin?.phone || '', password: '' });
  const isValidName = /^[A-Za-z ]+$/.test(form.name);
  const isValidEmail = /^\S+@\S+\.\S+$/.test(form.email);
  const isValidPhone = !form.phone || /^\d{10}$/.test(form.phone);
  const canSave = isValidName && isValidEmail && isValidPhone;
  return (
    <div className={`fixed inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'} flex items-center justify-center z-30 p-6`}>
      <div className={`${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white'} p-6 rounded-xl shadow-2xl w-full max-w-md border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit Admin</h3>
          <button onClick={onClose} className={`${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>✕</button>
        </div>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'border-slate-200'}`} />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'border-slate-200'}`} />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} placeholder="Phone (10 digits)" className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'border-slate-200'}`} />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="New Password (optional)" className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'border-slate-200'}`} />
          <div className="flex justify-between text-xs">
            {!isValidName && <span className="text-red-400">Name: letters and spaces only</span>}
            {!isValidEmail && <span className="text-red-400">Invalid email</span>}
            {!isValidPhone && <span className="text-red-400">Phone must be 10 digits</span>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className={`${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} px-4 py-2 rounded`}>Cancel</button>
            <button disabled={!canSave} onClick={() => onSave({ name: form.name, email: form.email, phone: form.phone, password: form.password || undefined })} className={`px-4 py-2 rounded text-white ${canSave ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-400 cursor-not-allowed'}`}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};


