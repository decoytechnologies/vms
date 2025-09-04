import React, { useState, useEffect } from 'react';
import apiClient from '../services/api.js';
import { Download, UserPlus, Trash2, Edit, X, Search, Copy, Check, Sun, Moon, Upload } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Main Dashboard Component ---
const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('log');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const containerBg = isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';
  const tableHeadBg = isDark ? 'bg-slate-700' : 'bg-gray-200';
  const sidebarBg = isDark ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100' : 'bg-white text-slate-900 border-r border-slate-200';
  const tabActive = isDark ? 'bg-slate-700 text-slate-100 ring-1 ring-indigo-500/30' : 'bg-slate-200 text-slate-900 ring-1 ring-indigo-500/20';
  const tabHover = isDark ? 'hover:bg-slate-700/60 hover:text-slate-100' : 'hover:bg-slate-100 hover:text-slate-900';

  const openVisitorDetails = (visit) => {
    setSelectedVisit(visit);
    setIsDetailsModalOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reports':
        return <ReportsTab isDark={isDark} />;
      case 'guards':
        return <GuardManagementTab isDark={isDark} />;
      case 'employees':
        return <EmployeesTab isDark={isDark} />;
      case 'log':
      default:
        return <VisitorLogTab onOpenDetails={openVisitorDetails} isDark={isDark} />;
    }
  };

  const adminName = typeof window !== 'undefined' ? localStorage.getItem('adminName') : null;

  return (
    <div className={`${containerBg} min-h-screen font-sans`}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className={`w-64 p-6 sticky top-0 h-screen shadow-xl flex flex-col ${sidebarBg}`}>
        <div className="mb-8 flex items-center justify-center">
          <img src={isDark ? '/darkthemelogo.png' : '/logo.png'} alt="Logo" className="h-16 w-auto" />
        </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('log')} className={`w-full text-left px-4 py-2 rounded-lg transition duration-200 ${activeTab === 'log' ? tabActive : tabHover}`}>Visitor Log</button>
            <button onClick={() => setActiveTab('reports')} className={`w-full text-left px-4 py-2 rounded-lg transition duration-200 ${activeTab === 'reports' ? tabActive : tabHover}`}>Reports</button>
            <button onClick={() => setActiveTab('guards')} className={`w-full text-left px-4 py-2 rounded-lg transition duration-200 ${activeTab === 'guards' ? tabActive : tabHover}`}>Guard Management</button>
            <button onClick={() => setActiveTab('employees')} className={`w-full text-left px-4 py-2 rounded-lg transition duration-200 ${activeTab === 'employees' ? tabActive : tabHover}`}>Employees</button>
          </nav>
          <div className="mt-auto pt-4">
            <button onClick={onLogout} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition">Logout</button>
          </div>
        </aside>
        {/* Content */}
        <main className="flex-1 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold">Admin Portal</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setIsDark(!isDark)} className={`${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'} p-2 rounded-full transition`} aria-label="Toggle theme">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <span className="text-sm opacity-80 truncate">{adminName || 'Admin'}</span>
            </div>
          </div>
          <div>
            {renderTabContent()}
          </div>
        </main>
      </div>

      {isDetailsModalOpen && <VisitorDetailsModal visit={selectedVisit} onClose={() => setIsDetailsModalOpen(false)} />}
    </div>
  );
};

// --- Helper Components ---
const TabButton = ({ title, isActive, onClick }) => (
  <button onClick={onClick} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
    {title}
  </button>
);

const Card = ({ children, className, isDark }) => (
  <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} p-6 rounded-lg shadow-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'} ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, isDark }) => (
  <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-gray-700'}`}>{children}</h2>
);

// --- Visitor Log Tab Component ---
const VisitorLogTab = ({ onOpenDetails, isDark }) => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false);

  useEffect(() => {
    apiClient.get('/admin/visits').then(res => setVisits(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Card isDark={isDark}>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <CardTitle isDark={isDark}>Full Visitor Log</CardTitle>
          <button onClick={() => setDownloadModalOpen(true)} className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
            <Download size={18} />
            <span>Download Report</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`min-w-full ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <thead className={`${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Visitor</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Host Employee</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Check-in</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Check-out</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Length of Stay</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
              </tr>
            </thead>
            <tbody className={`${isDark ? 'text-slate-100' : 'text-gray-700'}`}>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
              ) : visits.map(visit => {
                let lengthOfStay = 'N/A';
                if (visit.actualCheckOutTimestamp) {
                  const durationMs = new Date(visit.actualCheckOutTimestamp) - new Date(visit.checkInTimestamp);
                  const hours = Math.floor(durationMs / 3600000);
                  const minutes = Math.floor((durationMs % 3600000) / 60000);
                  lengthOfStay = `${hours}h ${minutes}m`;
                }
                return (
                  <tr key={visit.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/40' : 'hover:bg-gray-50'}`}>
                    <td className="text-left py-3 px-4">
                      <button onClick={() => onOpenDetails(visit)} className={`${isDark ? 'text-indigo-400' : 'text-blue-600'} hover:underline font-semibold`}>{visit.Visitor?.name || 'N/A'}</button>
                    </td>
                    <td className="text-left py-3 px-4">{visit.Employee?.name || 'N/A'}</td>
                    <td className="text-left py-3 px-4">{new Date(visit.checkInTimestamp).toLocaleString()}</td>
                    <td className="text-left py-3 px-4">{visit.actualCheckOutTimestamp ? new Date(visit.actualCheckOutTimestamp).toLocaleString() : 'Still Inside'}</td>
                    <td className="text-left py-3 px-4">{lengthOfStay}</td>
                    <td className="text-left py-3 px-4">
                      <span className={`py-1 px-3 rounded-full text-xs font-medium ${ visit.status === 'CHECKED_IN' ? (isDark ? 'bg-green-700 text-green-100' : 'bg-green-200 text-green-800') : visit.status === 'PENDING_APPROVAL' ? (isDark ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-200 text-yellow-800') : visit.status === 'CHECKED_OUT' ? (isDark ? 'bg-slate-600 text-slate-100' : 'bg-gray-200 text-gray-800') : (isDark ? 'bg-red-700 text-red-100' : 'bg-red-200 text-red-800') }`}>
                        {visit.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {isDownloadModalOpen && <DownloadReportModal onClose={() => setDownloadModalOpen(false)} />}
    </>
  );
};

// --- Reports Tab Component ---
const ReportsTab = ({ isDark }) => {
  const [endOfDayReport, setEndOfDayReport] = useState(null);
  const [historyReport, setHistoryReport] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const handleShowReport = async () => {
    setReportLoading(true);
    const res = await apiClient.get('/admin/reports/end-of-day');
    setEndOfDayReport(res.data);
    setReportLoading(false);
  };

  useEffect(() => {
    if (searchEmail.length < 3) {
      setSuggestions([]);
      return;
    }
    const handler = setTimeout(() => {
      apiClient.get(`/admin/employees/search?query=${searchEmail}`).then(res => setSuggestions(res.data));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchEmail]);

  const handleHistorySearch = async (email) => {
    setSearchEmail(email);
    setSuggestions([]);
    setHistoryLoading(true);
    setHistoryError('');
    try {
        const res = await apiClient.get(`/admin/reports/history-by-employee?email=${email}`);
        setHistoryReport(res.data);
    } catch (error) {
        setHistoryError(error.response?.data?.message || 'Failed to find history.');
    } finally {
        setHistoryLoading(false);
    }
  };

  const ReportList = ({ title, data, color }) => (
    <div>
      <h3 className={`text-lg font-semibold mb-2 text-${color}-600`}>{title} ({data.length})</h3>
      <ul className="space-y-2">
        {data.length > 0 ? data.map(visit => (
          <li key={visit.id} className="p-2 bg-gray-50 rounded-md text-sm">
            <strong>{visit.Visitor.name}</strong> (Host: {visit.Employee.name})
          </li>
        )) : <p className="text-sm text-gray-500">No visitors in this category.</p>}
      </ul>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card isDark={isDark}>
        <div className="flex justify-between items-center mb-4">
          <CardTitle isDark={isDark}>End-of-Day Status</CardTitle>
          <button onClick={handleShowReport} disabled={reportLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-blue-400">
            {reportLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
        {endOfDayReport && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
            <ReportList title="Visitors Still Inside" data={endOfDayReport.stillInside} color="green" />
            <ReportList title="Visitors Who Have Left" data={endOfDayReport.haveLeft} color="gray" />
          </div>
        )}
      </Card>
      <Card isDark={isDark}>
        <CardTitle isDark={isDark}>Visitor History by Employee</CardTitle>
        <div className="relative">
          <div className="flex items-center space-x-4">
            <input type="email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="Enter host employee's name or email" className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-300'}`}/>
            <button onClick={() => handleHistorySearch(searchEmail)} disabled={historyLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg disabled:bg-blue-400">
                {historyLoading ? '...' : <Search size={20} />}
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white'}`}>
              {suggestions.map(emp => (
                <li key={emp.id} onMouseDown={() => handleHistorySearch(emp.email)} className={`px-4 py-2 cursor-pointer ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                    {emp.name} <span className="text-gray-500">({emp.email})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {historyReport && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold">History for: {historyReport.employee.name}</h3>
            <ul className="mt-2 space-y-2">
                {historyReport.visits.length > 0 ? historyReport.visits.map(visit => (
                    <li key={visit.id} className={`p-2 rounded text-sm ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                        <strong>{visit.Visitor.name}</strong> on {new Date(visit.checkInTimestamp).toLocaleDateString()}
                    </li>
                )) : <p>No visits found.</p>}
            </ul>
          </div>
        )}
        {historyError && <p className="text-red-500 mt-2">{historyError}</p>}
      </Card>
    </div>
  );
};

// --- Guard Management Tab Component ---
const GuardManagementTab = ({ isDark }) => {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuard, setEditingGuard] = useState(null);

  const fetchGuards = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/guards');
      setGuards(res.data);
    } catch (error) {
      console.error("Failed to fetch guards:", error);
      alert("Could not load the list of guards. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  const handleSave = async (guardData) => {
    try {
        if (editingGuard) {
          await apiClient.put(`/admin/guards/${editingGuard.id}`, guardData);
        } else {
          await apiClient.post('/admin/guards', guardData);
        }
        fetchGuards();
        setIsModalOpen(false);
        setEditingGuard(null);
    } catch (error) {
        alert('Failed to save guard. Please check the details and try again.');
    }
  };
  
  const handleDelete = async (guardId) => {
    if (window.confirm("Are you sure you want to delete this guard? This action cannot be undone.")) {
      await apiClient.delete(`/admin/guards/${guardId}`);
      fetchGuards();
    }
  };

  const handleToggleActive = async (guard) => {
    try {
      await apiClient.put(`/admin/guards/${guard.id}`, { isActive: !guard.isActive });
      fetchGuards();
    } catch (error) {
      alert('Failed to update guard status.');
    }
  };

  return (
    <>
      <Card isDark={isDark}>
        <div className="flex justify-between items-center mb-4">
          <CardTitle isDark={isDark}>Manage Guard Accounts</CardTitle>
          <button onClick={() => { setEditingGuard(null); setIsModalOpen(true); }} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            <UserPlus size={18} /><span>Add New Guard</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`min-w-full ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <thead className={`${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Name</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Email</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Phone</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Active</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className={`${isDark ? 'text-slate-100' : 'text-gray-700'}`}>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
              ) : guards.map(guard => (
                <tr key={guard.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/40' : 'hover:bg-gray-50'}`}>
                  <td className="py-3 px-4">{guard.name}</td>
                  <td className="py-3 px-4">{guard.email || 'N/A'}</td>
                  <td className="py-3 px-4">{guard.phone || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(guard)}
                      className={`${guard.isActive ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-500 hover:bg-slate-400'} text-white text-xs font-semibold px-3 py-1 rounded-full transition`}
                    >
                      {guard.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4 flex space-x-4">
                    <button onClick={() => { setEditingGuard(guard); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(guard.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {isModalOpen && <GuardModal guard={editingGuard} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};


// --- Modal Components ---
const GuardModal = ({ guard, onSave, onClose, isDark = true }) => {
  const [formData, setFormData] = useState({
    name: guard?.name || '',
    email: guard?.email || '',
    phone: guard?.phone || '',
    pin: '',
  });

  const handlePhoneChange = (e) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 10) {
      setFormData({ ...formData, phone: numericValue });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (!dataToSave.pin) delete dataToSave.pin;
    onSave(dataToSave);
  };
  
  return (
    <div className={`fixed inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'} flex items-center justify-center z-30 p-6`}>
      <div className={`${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white'} p-8 rounded-xl shadow-2xl w-full max-w-md border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">{guard ? 'Edit Guard' : 'Add New Guard'}</h3>
          <button onClick={onClose} className={`${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'border-slate-700 bg-slate-800' : ''}`} />
          <input type="email" placeholder="Email (Optional)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'border-slate-700 bg-slate-800' : ''}`} />
          <input type="tel" placeholder="10-Digit Phone (Optional)" value={formData.phone} onChange={handlePhoneChange} className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'border-slate-700 bg-slate-800' : ''}`} />
          <input type="password" placeholder={guard ? 'New PIN (Leave blank to keep same)' : 'PIN'} value={formData.pin} onChange={(e) => setFormData({...formData, pin: e.target.value})} required={!guard} className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'border-slate-700 bg-slate-800' : ''}`} />
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className={`py-2 px-4 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Cancel</button>
            <button type="submit" className="py-2 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg">Save Guard</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VisitorDetailsModal = ({ visit, onClose, isDark = true }) => {
  const [imageUrls, setImageUrls] = useState({ visitorPhotoUrl: null, idPhotoUrl: null });
  const [loading, setLoading] = useState(true);
  const [activeImageTab, setActiveImageTab] = useState('visitor');
  const [copiedStates, setCopiedStates] = useState({});

  useEffect(() => {
    if (visit) {
      apiClient.get(`/admin/visits/${visit.id}/images`)
        .then(res => setImageUrls(res.data))
        .finally(() => setLoading(false));
    }
  }, [visit]);

  const handleCopyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [field]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [field]: false })), 2000);
    });
  };
  
  if (!visit) return null;
  
  let lengthOfStay = 'Still Inside';
  if (visit.actualCheckOutTimestamp) {
    const durationMs = new Date(visit.actualCheckOutTimestamp) - new Date(visit.checkInTimestamp);
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    lengthOfStay = `${hours}h ${minutes}m`;
  }

  const DetailItem = ({ label, value, field, isCopyable = false }) => (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-800 break-all">{value}</p>
        {isCopyable && (
          <button onClick={() => handleCopyToClipboard(value, field)} className="ml-2 p-1 rounded-md hover:bg-gray-200 transition">
            {copiedStates[field] ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div onClick={onClose} className={`fixed inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'} flex items-center justify-center z-30 p-6`}>
      <div onClick={(e) => e.stopPropagation()} className={`${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Visit Details</h3>
          <button onClick={onClose} className={`${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}><X size={24} /></button>
        </div>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-y-auto">
          {/* Details Column */}
          <div className="md:col-span-1 space-y-4">
            <h4 className={`text-lg font-bold border-b pb-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>Visitor Information</h4>
            <DetailItem label="Name" value={visit.Visitor?.name} />
            <DetailItem label="Email" value={visit.Visitor?.email} field="visitorEmail" isCopyable={true} />
            <DetailItem label="Phone" value={visit.Visitor?.phone} />
            
            <h4 className={`text-lg font-bold border-b pb-2 pt-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>Host Information</h4>
            <DetailItem label="Host Name" value={visit.Employee?.name} />
            <DetailItem label="Host Email" value={visit.Employee?.email} field="hostEmail" isCopyable={true} />

            <h4 className={`text-lg font-bold border-b pb-2 pt-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>Visit Timeline</h4>
            <DetailItem label="Check-in Time" value={new Date(visit.checkInTimestamp).toLocaleString()} />
            <DetailItem label="Check-out Time" value={visit.actualCheckOutTimestamp ? new Date(visit.actualCheckOutTimestamp).toLocaleString() : 'N/A'} />
            <DetailItem label="Length of Stay" value={lengthOfStay} />
            <DetailItem label="Status" value={visit.status.replace(/_/g, ' ')} />
          </div>

          {/* Image Column */}
          <div className="md:col-span-2 flex flex-col">
            <div className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <nav className="-mb-px flex space-x-6">
                <TabButton title="Visitor Photo" isActive={activeImageTab === 'visitor'} onClick={() => setActiveImageTab('visitor')} />
                <TabButton title="ID Card Photo" isActive={activeImageTab === 'id'} onClick={() => setActiveImageTab('id')} />
              </nav>
            </div>
            <div className={`flex-grow mt-4 flex items-center justify-center rounded-lg overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              {loading ? (
                <p>Loading image...</p>
              ) : (
                <img 
                  src={activeImageTab === 'visitor' ? imageUrls.visitorPhotoUrl : imageUrls.idPhotoUrl} 
                  alt={activeImageTab === 'visitor' ? 'Visitor Photo' : 'ID Card Photo'} 
                  className="max-w-full max-h-full object-contain"
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DownloadReportModal = ({ onClose }) => {
    const allColumns = [ 'Visitor Name', 'Visitor Email', 'Visitor Phone', 'Host Name', 'Host Email', 'Check-in Time', 'Check-out Time', 'Length of Stay', 'Status' ];
    const [selectedColumns, setSelectedColumns] = useState(new Set(allColumns));
    const [format, setFormat] = useState('csv');
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    const [endDate, setEndDate] = useState(new Date());
    const [isDownloading, setIsDownloading] = useState(false);

    const handleColumnToggle = (column) => {
        const newSelected = new Set(selectedColumns);
        if (newSelected.has(column)) newSelected.delete(column);
        else newSelected.add(column);
        setSelectedColumns(newSelected);
    };

    const handleDownload = async () => {
        if (selectedColumns.size === 0) {
            alert("Please select at least one column.");
            return;
        }
        setIsDownloading(true);
        try {
            const response = await apiClient.post('/admin/reports/download-log', {
                format,
                columns: Array.from(selectedColumns),
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `visitor-report-${new Date().toISOString().slice(0, 10)}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            onClose();
        } catch (error) {
            alert('Failed to download report. There may be no data in the selected date range.');
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
            <div onClick={e => e.stopPropagation()} className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">Configure Report</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                
                <div className="mb-6">
                    <label className="block font-semibold mb-2">Date Range:</label>
                    <div className="flex items-center space-x-4">
                        <DatePicker selected={startDate} onChange={date => setStartDate(date)} className="w-full px-4 py-2 border rounded-lg" />
                        <span className="text-gray-500">to</span>
                        <DatePicker selected={endDate} onChange={date => setEndDate(date)} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block font-semibold mb-2">Include Columns:</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {allColumns.map(col => (
                            <label key={col} className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" checked={selectedColumns.has(col)} onChange={() => handleColumnToggle(col)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                <span>{col}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block font-semibold mb-2">Format:</label>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} /><span>CSV</span></label>
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="format" value="pdf" checked={format === 'pdf'} onChange={() => setFormat('pdf')} /><span>PDF</span></label>
                    </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={handleDownload} disabled={isDownloading} className="py-2 px-6 bg-blue-600 text-white rounded-lg disabled:bg-blue-400">
                        {isDownloading ? 'Generating...' : 'Download'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

// --- Employees Tab Component ---
const EmployeesTab = ({ isDark }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: null, name: '', email: '', phone: '', department: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/employees');
      setEmployees(res.data);
    } catch (e) {
      alert('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const resetForm = () => setForm({ id: null, name: '', email: '', phone: '', department: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await apiClient.put(`/admin/employees/${form.id}`, { name: form.name, email: form.email, phone: form.phone, department: form.department || null });
      } else {
        await apiClient.post('/admin/employees', { name: form.name, email: form.email, phone: form.phone, department: form.department || null });
      }
      resetForm();
      fetchEmployees();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleEdit = (emp) => setForm({ id: emp.id, name: emp.name, email: emp.email, phone: emp.phone || '', department: emp.department || '' });
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try { await apiClient.delete(`/admin/employees/${id}`); fetchEmployees(); } catch { alert('Failed to delete'); }
  };

  const downloadTemplate = async () => {
    const res = await apiClient.get('/admin/employees/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', 'employee-template.csv'); document.body.appendChild(link); link.click(); link.remove();
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/admin/employees/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadResult(res.data);
      setShowUploadModal(true);
      fetchEmployees();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to upload CSV');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <Card isDark={isDark}>
        <div className="flex justify-between items-center mb-4">
          <CardTitle isDark={isDark}>Employees</CardTitle>
          <div className="flex items-center gap-3">
            <button onClick={downloadTemplate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg"><Download size={16} /> Template</button>
            <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg cursor-pointer">
              <Upload size={16} /> {isUploading ? 'Uploading...' : 'Upload CSV'}
              <input type="file" accept=".csv" onChange={handleUpload} className="hidden" disabled={isUploading} />
            </label>
          </div>
        </div>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" required className={`px-3 py-2 border rounded ${isDark ? 'bg-slate-900 border-slate-700' : ''}`} />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" required className={`px-3 py-2 border rounded ${isDark ? 'bg-slate-900 border-slate-700' : ''}`} />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} placeholder="Phone (optional)" className={`px-3 py-2 border rounded ${isDark ? 'bg-slate-900 border-slate-700' : ''}`} />
          <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Department (optional)" className={`px-3 py-2 border rounded ${isDark ? 'bg-slate-900 border-slate-700' : ''}`} />
          <div className="flex items-center gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full">{form.id ? 'Update' : 'Add'}</button>
            {form.id && <button type="button" onClick={resetForm} className={`py-2 px-4 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Clear</button>}
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className={`min-w-full ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <thead className={`${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Name</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Email</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Phone</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Department</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className={`${isDark ? 'text-slate-100' : 'text-gray-700'}`}>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/40' : 'hover:bg-gray-50'}`}>
                  <td className="py-3 px-4">{emp.name}</td>
                  <td className="py-3 px-4">{emp.email}</td>
                  <td className="py-3 px-4">{emp.phone || '—'}</td>
                  <td className="py-3 px-4">{emp.department || '—'}</td>
                  <td className="py-3 px-4 flex space-x-4">
                    <button onClick={() => handleEdit(emp)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(emp.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showUploadModal && uploadResult && (
        <div className={`fixed inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'} flex items-center justify-center z-30 p-6`}>
          <div className={`${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white'} p-6 rounded-xl shadow-2xl w-full max-w-md border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Upload Summary</h3>
              <button onClick={() => setShowUploadModal(false)} className={`${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}><X size={20} /></button>
            </div>
            <div className="space-y-2">
              <p>Inserted: <strong>{uploadResult.inserted}</strong></p>
              <p>Duplicates: <strong>{uploadResult.duplicates}</strong></p>
              {uploadResult.duplicateEmails?.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Duplicate Emails:</p>
                  <ul className="list-disc ml-5 text-sm opacity-80">
                    {uploadResult.duplicateEmails.map(email => <li key={email}>{email}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

