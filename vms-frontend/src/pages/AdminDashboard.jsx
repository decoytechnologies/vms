import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Download, UserPlus, Trash2, Edit, X } from 'lucide-react';

// --- Main Dashboard Component ---
const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('log');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reports':
        return <ReportsTab />;
      case 'guards':
        return <GuardManagementTab />;
      case 'log':
      default:
        return <VisitorLogTab />;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
          </div>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition">Logout</button>
        </nav>
        <div className="container mx-auto px-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <TabButton title="Visitor Log" isActive={activeTab === 'log'} onClick={() => setActiveTab('log')} />
            <TabButton title="Reports" isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
            <TabButton title="Guard Management" isActive={activeTab === 'guards'} onClick={() => setActiveTab('guards')} />
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
};

// --- Helper Components ---
const TabButton = ({ title, isActive, onClick }) => (
  <button onClick={onClick} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
    {title}
  </button>
);

const Card = ({ children, className }) => (
    <div className={`bg-white p-6 rounded-lg shadow-lg ${className}`}>
        {children}
    </div>
);

// --- Visitor Log Tab Component ---
const VisitorLogTab = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/visits').then(res => setVisits(res.data)).finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    try {
      const response = await apiClient.get('/admin/reports/download-log', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `visitor-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download report.');
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Full Visitor Log</h2>
        <button onClick={handleDownload} className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition">
          <Download size={18} />
          <span>Download CSV</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Visitor</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Host Employee</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Check-in</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Check-out</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Length of Stay</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {loading ? (
                <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
            ) : visits.map(visit => {
              let lengthOfStay = 'N/A';
              if (visit.actualCheckOutTimestamp) {
                const durationMs = new Date(visit.actualCheckOutTimestamp) - new Date(visit.checkInTimestamp);
                const hours = Math.floor(durationMs / 3600000);
                const minutes = Math.round((durationMs % 3600000) / 60000);
                lengthOfStay = `${hours}h ${minutes}m`;
              }
              return (
                <tr key={visit.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">{visit.Visitor?.name || 'N/A'}</td>
                  <td className="py-3 px-4">{visit.Employee?.name || 'N/A'}</td>
                  <td className="py-3 px-4">{new Date(visit.checkInTimestamp).toLocaleString()}</td>
                  <td className="py-3 px-4">{visit.actualCheckOutTimestamp ? new Date(visit.actualCheckOutTimestamp).toLocaleString() : 'Still Inside'}</td>
                  <td className="py-3 px-4">{lengthOfStay}</td>
                  <td className="py-3 px-4">
                    <span className={`py-1 px-3 rounded-full text-xs font-medium ${ visit.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' : visit.status === 'CHECKED_OUT' ? 'bg-gray-200 text-gray-600' : 'bg-yellow-100 text-yellow-700' }`}>
                      {visit.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// --- Reports Tab Component ---
const ReportsTab = () => {
    return (
        <div className="space-y-8">
            <EndOfDayReport />
            <VisitorHistoryReport />
        </div>
    );
};

const EndOfDayReport = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleShowReport = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/reports/end-of-day');
            setReport(response.data);
        } finally {
            setLoading(false);
        }
    };

    const ReportList = ({ title, data, color }) => (
        <div>
            <h3 className={`text-lg font-semibold mb-2 text-${color}-600`}>{title} <span className="text-gray-500 font-medium">({data.length})</span></h3>
            {data.length > 0 ? (
                <ul className="space-y-2">{data.map(visit => <li key={visit.id} className="p-2 bg-gray-50 rounded-md text-sm"><strong>{visit.Visitor.name}</strong> (Host: {visit.Employee.name})</li>)}</ul>
            ) : <p className="text-sm text-gray-500">No visitors in this category.</p>}
        </div>
    );

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">End-of-Day Status</h2>
                <button onClick={handleShowReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-blue-400">
                    {loading ? 'Generating...' : 'Generate Today\'s Report'}
                </button>
            </div>
            {report && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                    <ReportList title="Visitors Still Inside" data={report.stillInside} color="green" />
                    <ReportList title="Visitors Who Have Left" data={report.haveLeft} color="gray" />
                </div>
            )}
        </Card>
    );
};

const VisitorHistoryReport = () => {
    const [historyReport, setHistoryReport] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (searchEmail.length < 3) {
            setSuggestions([]);
            return;
        }
        const handler = setTimeout(() => {
            apiClient.get(`/admin/employees/search?query=${searchEmail}`)
                .then(res => setSuggestions(res.data));
        }, 300);
        return () => clearTimeout(handler);
    }, [searchEmail]);

    const fetchHistory = async (email) => {
        setHistoryLoading(true);
        setHistoryReport(null);
        setHistoryError('');
        try {
            const response = await apiClient.get(`/admin/reports/history-by-employee?email=${email}`);
            setHistoryReport(response.data);
        } catch (err) {
            setHistoryError(err.response?.data?.message || 'Failed to generate history report.');
        } finally {
            setHistoryLoading(false);
        }
    };
    
    const handleFormSubmit = (e) => {
        e.preventDefault();
        setShowSuggestions(false);
        fetchHistory(searchEmail);
    };

    const handleSuggestionClick = (email) => {
        setSearchEmail(email);
        setShowSuggestions(false);
        fetchHistory(email);
    };

    return (
        <Card>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Visitor History by Employee</h2>
            <form onSubmit={handleFormSubmit} className="relative">
                <div className="flex items-center space-x-4">
                    <input
                        type="email"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Start typing an employee's name or email..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        autoComplete="off"
                    />
                    <button type="submit" disabled={historyLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        {historyLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full md:w-3/4 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map(employee => (
                            <li key={employee.id} onMouseDown={() => handleSuggestionClick(employee.email)} className="px-4 py-2 cursor-pointer hover:bg-gray-100">
                                <p className="font-semibold">{employee.name}</p>
                                <p className="text-sm text-gray-500">{employee.email}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </form>

            {historyReport && (
                 <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800">Showing History for: {historyReport.employee.name}</h3>
                    <ul className="mt-4 space-y-3">
                        {historyReport.visits.length > 0 ? historyReport.visits.map(visit => (
                            <li key={visit.id} className="p-3 bg-gray-50 rounded-md border">
                                <p className="font-semibold text-gray-700">{visit.Visitor.name}</p>
                                <p className="text-sm text-gray-500">{visit.Visitor.email} | {visit.Visitor.phone}</p>
                                <p className="text-sm text-gray-500">Checked in at: {new Date(visit.checkInTimestamp).toLocaleString()}</p>
                            </li>
                        )) : <p>No visitor history found.</p>}
                    </ul>
                </div>
            )}
            {historyError && <p className="mt-4 text-red-500">{historyError}</p>}
        </Card>
    );
};


// --- Guard Management Tab Component ---
const GuardManagementTab = () => {
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

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingGuard(null);
    fetchGuards();
  };

  const handleDelete = async (guardId) => {
    if (window.confirm('Are you sure you want to delete this guard?')) {
      try {
        await apiClient.delete(`/admin/guards/${guardId}`);
        fetchGuards();
      } catch (error) {
        alert('Failed to delete guard.');
      }
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Manage Guard Accounts</h2>
        <button onClick={() => { setEditingGuard(null); setIsModalOpen(true); }} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
          <UserPlus size={18} />
          <span>Add New Guard</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Name</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Email</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Phone</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {loading ? (
                <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
            ) : guards.map(guard => (
              <tr key={guard.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">{guard.name}</td>
                <td className="py-3 px-4">{guard.email || 'N/A'}</td>
                <td className="py-3 px-4">{guard.phone || 'N/A'}</td>
                <td className="py-3 px-4 flex items-center space-x-3">
                  <button onClick={() => { setEditingGuard(guard); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(guard.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && <GuardModal guard={editingGuard} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
    </Card>
  );
};


// --- Guard Modal Component ---
const GuardModal = ({ guard, onClose, onSave }) => {
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
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (guard) { // Editing existing guard
                await apiClient.put(`/admin/guards/${guard.id}`, formData);
            } else { // Creating new guard
                await apiClient.post('/admin/guards', formData);
            }
            onSave();
        } catch (error) {
            alert(`Failed to save guard: ${error.response?.data?.message || 'Please try again'}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">{guard ? 'Edit Guard' : 'Add New Guard'}</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Guard's Name" required className="w-full p-2 border rounded" />
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email (Optional)" className="w-full p-2 border rounded" />
                    <input name="phone" value={formData.phone} onChange={handlePhoneChange} placeholder="10-Digit Phone (Optional)" className="w-full p-2 border rounded" maxLength="10" />
                    <input name="pin" type="password" value={formData.pin} onChange={handleChange} placeholder={guard ? 'New PIN (leave blank to keep unchanged)' : 'PIN'} required={!guard} className="w-full p-2 border rounded" />
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Cancel</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save Guard</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default AdminDashboard;

