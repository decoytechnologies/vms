import React, { useState, useEffect, createContext, useContext } from 'react';
import apiClient from '../services/api.js';
import { 
  Download, 
  UserPlus, 
  Trash2, 
  Edit, 
  X, 
  Search, 
  Copy, 
  Check, 
  Users, 
  Shield, 
  FileText, 
  Settings,
  Sun,
  Moon,
  LogOut,
  Plus
} from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Theme Context ---
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// --- Theme Provider ---
const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // Default to dark theme

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// --- Main Dashboard Component ---
const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('log');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const openVisitorDetails = (visit) => {
    setSelectedVisit(visit);
    setIsDetailsModalOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reports':
        return <ReportsTab />;
      case 'guards':
        return <GuardManagementTab />;
      case 'admins':
        return <AdminManagementTab />;
      case 'log':
      default:
        return <VisitorLogTab onOpenDetails={openVisitorDetails} />;
    }
  };

  return (
    <ThemeProvider>
      <AdminDashboardContent 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onLogout={onLogout}
        renderTabContent={renderTabContent}
        openVisitorDetails={openVisitorDetails}
        selectedVisit={selectedVisit}
        isDetailsModalOpen={isDetailsModalOpen}
        setIsDetailsModalOpen={setIsDetailsModalOpen}
      />
    </ThemeProvider>
  );
};

// --- Admin Dashboard Content ---
const AdminDashboardContent = ({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  renderTabContent,
  selectedVisit,
  isDetailsModalOpen,
  setIsDetailsModalOpen
}) => {
  const { isDark, toggleTheme } = useTheme();

  const sidebarItems = [
    { id: 'log', title: 'Visitor Log', icon: FileText },
    { id: 'reports', title: 'Reports', icon: Download },
    { id: 'guards', title: 'Guard Management', icon: Shield },
    { id: 'admins', title: 'Admin Management', icon: Users },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar - Always Visible */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header - Simplified */}
          <div className={`flex items-center p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
              <h1 className="text-2xl font-bold">VMS</h1>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                        activeTab === item.id
                          ? isDark 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-100 text-blue-700'
                          : isDark
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content - Always with left margin for sidebar */}
      <div className="ml-64">
        {/* Top Header - Simplified */}
        <header className={`sticky top-0 z-40 ${isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between px-6 py-4">
            {/* User Info and Actions */}
            <div className="flex items-center space-x-4 ml-auto">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-blue-600' : 'bg-blue-500'
                } text-white font-bold`}>
                  A
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium">Admin User</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Administrator</div>
                </div>
                <button
                  onClick={onLogout}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDark 
                      ? 'text-red-400 hover:bg-red-900/20' 
                      : 'text-red-500 hover:bg-red-50'
                  }`}
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {renderTabContent()}
        </main>
      </div>

      {/* Visitor Details Modal */}
      {isDetailsModalOpen && (
        <VisitorDetailsModal 
          visit={selectedVisit} 
          onClose={() => setIsDetailsModalOpen(false)} 
        />
      )}
    </div>
  );
};

// --- Helper Components ---
const TabButton = ({ title, isActive, onClick }) => {
  const { isDark } = useTheme();
  return (
    <button 
      onClick={onClick} 
      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
        isActive 
          ? 'border-blue-500 text-blue-600' 
          : isDark 
            ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {title}
    </button>
  );
};

const Card = ({ children, className }) => {
  const { isDark } = useTheme();
  return (
    <div className={`p-6 rounded-lg shadow-lg transition-colors duration-200 ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    } ${className}`}>
      {children}
    </div>
  );
};

const CardTitle = ({ children }) => {
  const { isDark } = useTheme();
  return (
    <h2 className={`text-xl font-semibold mb-4 transition-colors duration-200 ${
      isDark ? 'text-white' : 'text-gray-700'
    }`}>{children}</h2>
  );
};

// --- Visitor Log Tab Component ---
const VisitorLogTab = ({ onOpenDetails }) => {
  const { isDark } = useTheme();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false);

  useEffect(() => {
    apiClient.get('/admin/visits').then(res => setVisits(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Card>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <CardTitle>Full Visitor Log</CardTitle>
          <button onClick={() => setDownloadModalOpen(true)} className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
            <Download size={18} />
            <span>Download Report</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`min-w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-200'}>
              <tr>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Visitor</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Host Employee</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Check-in</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Check-out</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Length of Stay</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'text-gray-300' : 'text-gray-700'}>
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
                  <tr key={visit.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="text-left py-3 px-4">
                      <button onClick={() => onOpenDetails(visit)} className="text-blue-600 hover:underline font-semibold">{visit.Visitor?.name || 'N/A'}</button>
                    </td>
                    <td className="text-left py-3 px-4">{visit.Employee?.name || 'N/A'}</td>
                    <td className="text-left py-3 px-4">{new Date(visit.checkInTimestamp).toLocaleString()}</td>
                    <td className="text-left py-3 px-4">{visit.actualCheckOutTimestamp ? new Date(visit.actualCheckOutTimestamp).toLocaleString() : 'Still Inside'}</td>
                    <td className="text-left py-3 px-4">{lengthOfStay}</td>
                    <td className="text-left py-3 px-4">
                      <span className={`py-1 px-3 rounded-full text-xs font-medium ${ visit.status === 'CHECKED_IN' ? 'bg-green-200 text-green-800' : visit.status === 'PENDING_APPROVAL' ? 'bg-yellow-200 text-yellow-800' : visit.status === 'CHECKED_OUT' ? 'bg-gray-200 text-gray-800' : 'bg-red-200 text-red-800'}`}>
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
const ReportsTab = () => {
  const { isDark } = useTheme();
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
          <li key={visit.id} className={`p-2 rounded-md text-sm transition-colors duration-200 ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <strong className={isDark ? 'text-white' : 'text-gray-900'}>{visit.Visitor.name}</strong>
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}> (Host: {visit.Employee.name})</span>
          </li>
        )) : <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No visitors in this category.</p>}
      </ul>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>End-of-Day Status</CardTitle>
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
      <Card>
        <CardTitle>Visitor History by Employee</CardTitle>
        <div className="relative">
          <div className="flex items-center space-x-4">
            <input 
              type="email" 
              value={searchEmail} 
              onChange={(e) => setSearchEmail(e.target.value)} 
              placeholder="Enter host employee's name or email" 
              className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            />
            <button 
              onClick={() => handleHistorySearch(searchEmail)} 
              disabled={historyLoading} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg disabled:bg-blue-400 transition-colors duration-200"
            >
                {historyLoading ? '...' : <Search size={20} />}
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg transition-colors duration-200 ${
              isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              {suggestions.map(emp => (
                <li 
                  key={emp.id} 
                  onMouseDown={() => handleHistorySearch(emp.email)} 
                  className={`px-4 py-2 cursor-pointer transition-colors duration-200 ${
                    isDark 
                      ? 'hover:bg-gray-700 text-white' 
                      : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{emp.name}</span> 
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}> ({emp.email})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {historyReport && (
          <div className={`mt-6 border-t pt-4 transition-colors duration-200 ${
            isDark ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              History for: {historyReport.employee.name}
            </h3>
            <ul className="mt-2 space-y-2">
                {historyReport.visits.length > 0 ? historyReport.visits.map(visit => (
                    <li key={visit.id} className={`p-2 rounded text-sm transition-colors duration-200 ${
                      isDark ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                        <strong className={isDark ? 'text-white' : 'text-gray-900'}>{visit.Visitor.name}</strong>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}> on {new Date(visit.checkInTimestamp).toLocaleDateString()}</span>
                    </li>
                )) : <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No visits found.</p>}
            </ul>
          </div>
        )}
        {historyError && <p className="text-red-500 mt-2">{historyError}</p>}
      </Card>
    </div>
  );
};

// --- Guard Management Tab Component ---
const GuardManagementTab = () => {
  const { isDark } = useTheme();
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

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>Manage Guard Accounts</CardTitle>
          <button onClick={() => { setEditingGuard(null); setIsModalOpen(true); }} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            <UserPlus size={18} /><span>Add New Guard</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`min-w-full transition-colors duration-200 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-200'}>
              <tr>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Phone</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
              ) : guards.map(guard => (
                <tr key={guard.id} className={`border-b transition-colors duration-200 ${
                  isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <td className="py-3 px-4">{guard.name}</td>
                  <td className="py-3 px-4">{guard.email || 'N/A'}</td>
                  <td className="py-3 px-4">{guard.phone || 'N/A'}</td>
                  <td className="py-3 px-4 flex space-x-4">
                    <button onClick={() => { setEditingGuard(guard); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700 transition-colors duration-200">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(guard.id)} className="text-red-500 hover:text-red-700 transition-colors duration-200">
                      <Trash2 size={18} />
                    </button>
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

// --- Admin Management Tab Component ---
const AdminManagementTab = () => {
  const { isDark } = useTheme();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/admins');
      setAdmins(res.data);
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      alert("Could not load the list of admins. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSave = async (adminData) => {
    try {
        if (editingAdmin) {
          await apiClient.put(`/admin/admins/${editingAdmin.id}`, adminData);
        } else {
          await apiClient.post('/admin/admins', adminData);
        }
        fetchAdmins();
        setIsModalOpen(false);
        setEditingAdmin(null);
    } catch (error) {
        alert('Failed to save admin. Please check the details and try again.');
    }
  };
  
  const handleDelete = async (adminId) => {
    if (window.confirm("Are you sure you want to delete this admin? This action cannot be undone.")) {
      await apiClient.delete(`/admin/admins/${adminId}`);
      fetchAdmins();
    }
  };

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>Manage Admin Accounts</CardTitle>
          <button onClick={() => { setEditingAdmin(null); setIsModalOpen(true); }} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            <UserPlus size={18} /><span>Add New Admin</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`min-w-full transition-colors duration-200 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-200'}>
              <tr>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Phone</th>
                <th className={`text-left py-3 px-4 uppercase font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
              ) : admins.map(admin => (
                <tr key={admin.id} className={`border-b transition-colors duration-200 ${
                  isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <td className="py-3 px-4">{admin.name}</td>
                  <td className="py-3 px-4">{admin.email || 'N/A'}</td>
                  <td className="py-3 px-4">{admin.phone || 'N/A'}</td>
                  <td className="py-3 px-4 flex space-x-4">
                    <button onClick={() => { setEditingAdmin(admin); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700 transition-colors duration-200">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(admin.id)} className="text-red-500 hover:text-red-700 transition-colors duration-200">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {isModalOpen && <AdminModal admin={editingAdmin} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};


// --- Modal Components ---
const GuardModal = ({ guard, onSave, onClose }) => {
  const { isDark } = useTheme();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className={`p-8 rounded-lg shadow-2xl w-full max-w-md transition-colors duration-200 ${
        isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {guard ? 'Edit Guard' : 'Add New Guard'}
          </h3>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
            className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          />
          <input 
            type="email" 
            placeholder="Email (Optional)" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          />
          <input 
            type="tel" 
            placeholder="10-Digit Phone (Optional)" 
            value={formData.phone} 
            onChange={handlePhoneChange} 
            className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          />
          <input 
            type="password" 
            placeholder={guard ? 'New PIN (Leave blank to keep same)' : 'PIN'} 
            value={formData.pin} 
            onChange={(e) => setFormData({...formData, pin: e.target.value})} 
            required={!guard} 
            className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          />
          <div className="flex justify-end space-x-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className={`py-2 px-4 rounded-lg transition-colors duration-200 ${
                isDark 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="py-2 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              Save Guard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminModal = ({ admin, onSave, onClose }) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    phone: admin?.phone || '',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className={`p-8 rounded-lg shadow-2xl w-full max-w-md transition-colors duration-200 ${
        isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {admin ? 'Edit Admin' : 'Add New Admin'}
          </h3>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
            className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          />
          <input 
            type="email" 
            placeholder="Email (Optional)" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          />
          <input 
            type="tel" 
            placeholder="10-Digit Phone (Optional)" 
            value={formData.phone} 
            onChange={handlePhoneChange} 
            className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          />
          <input 
            type="password" 
            placeholder={admin ? 'New PIN (Leave blank to keep same)' : 'PIN'} 
            value={formData.pin} 
            onChange={(e) => setFormData({...formData, pin: e.target.value})} 
            required={!admin} 
            className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          />
          <div className="flex justify-end space-x-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className={`py-2 px-4 rounded-lg transition-colors duration-200 ${
                isDark 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="py-2 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              Save Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VisitorDetailsModal = ({ visit, onClose }) => {
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
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30 p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-800">Visit Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-y-auto">
          {/* Details Column */}
          <div className="md:col-span-1 space-y-4">
            <h4 className="text-lg font-bold border-b pb-2">Visitor Information</h4>
            <DetailItem label="Name" value={visit.Visitor?.name} />
            <DetailItem label="Email" value={visit.Visitor?.email} field="visitorEmail" isCopyable={true} />
            <DetailItem label="Phone" value={visit.Visitor?.phone} />
            
            <h4 className="text-lg font-bold border-b pb-2 pt-4">Host Information</h4>
            <DetailItem label="Host Name" value={visit.Employee?.name} />
            <DetailItem label="Host Email" value={visit.Employee?.email} field="hostEmail" isCopyable={true} />

            <h4 className="text-lg font-bold border-b pb-2 pt-4">Visit Timeline</h4>
            <DetailItem label="Check-in Time" value={new Date(visit.checkInTimestamp).toLocaleString()} />
            <DetailItem label="Check-out Time" value={visit.actualCheckOutTimestamp ? new Date(visit.actualCheckOutTimestamp).toLocaleString() : 'N/A'} />
            <DetailItem label="Length of Stay" value={lengthOfStay} />
            <DetailItem label="Status" value={visit.status.replace(/_/g, ' ')} />
          </div>

          {/* Image Column */}
          <div className="md:col-span-2 flex flex-col">
            <div className="border-b">
              <nav className="-mb-px flex space-x-6">
                <TabButton title="Visitor Photo" isActive={activeImageTab === 'visitor'} onClick={() => setActiveImageTab('visitor')} />
                <TabButton title="ID Card Photo" isActive={activeImageTab === 'id'} onClick={() => setActiveImageTab('id')} />
              </nav>
            </div>
            <div className="flex-grow mt-4 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
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
    const { isDark } = useTheme();
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
            <div onClick={e => e.stopPropagation()} className={`p-8 rounded-lg shadow-2xl w-full max-w-2xl transition-colors duration-200 ${
                isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Configure Report</h3>
                    <button 
                        onClick={onClose} 
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="mb-6">
                    <label className={`block font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Date Range:</label>
                    <div className="flex items-center space-x-4">
                        <DatePicker 
                            selected={startDate} 
                            onChange={date => setStartDate(date)} 
                            className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
                                isDark 
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                            }`}
                        />
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>to</span>
                        <DatePicker 
                            selected={endDate} 
                            onChange={date => setEndDate(date)} 
                            className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 ${
                                isDark 
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                            }`}
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className={`block font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Include Columns:</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {allColumns.map(col => (
                            <label key={col} className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-colors duration-200 ${
                                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                            }`}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedColumns.has(col)} 
                                    onChange={() => handleColumnToggle(col)} 
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{col}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="mb-8">
                    <label className={`block font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Format:</label>
                    <div className="flex items-center space-x-4">
                        <label className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-colors duration-200 ${
                            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}>
                            <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} />
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>CSV</span>
                        </label>
                        <label className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-colors duration-200 ${
                            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}>
                            <input type="radio" name="format" value="pdf" checked={format === 'pdf'} onChange={() => setFormat('pdf')} />
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>PDF</span>
                        </label>
                    </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className={`py-2 px-4 rounded-lg transition-colors duration-200 ${
                            isDark 
                                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleDownload} 
                        disabled={isDownloading} 
                        className={`py-2 px-6 rounded-lg transition-colors duration-200 ${
                            isDownloading
                                ? isDark 
                                    ? 'bg-blue-700 text-gray-300' 
                                    : 'bg-blue-400 text-gray-200'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } disabled:cursor-not-allowed`}
                    >
                        {isDownloading ? 'Generating...' : 'Download'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

