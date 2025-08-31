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

const CardTitle = ({ children }) => (
  <h2 className="text-xl font-semibold text-gray-700 mb-4">{children}</h2>
);

// --- Visitor Log Tab Component ---
const VisitorLogTab = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    apiClient.get('/admin/visits').then(res => setVisits(res.data)).finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    try {
      const response = await apiClient.get('/admin/reports/download-log', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `visitor-report-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download report.');
    }
  };
  
  const openVisitorDetails = (visit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <CardTitle>Full Visitor Log</CardTitle>
          <button onClick={handleDownload} className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
            <Download size={18} />
            <span>Download CSV</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Visitor</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Host Employee</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Check-in</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Check-out</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Length of Stay</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
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
                  const minutes = Math.floor((durationMs % 3600000) / 60000);
                  lengthOfStay = `${hours}h ${minutes}m`;
                }
                return (
                  <tr key={visit.id} className="border-b hover:bg-gray-50">
                    <td className="text-left py-3 px-4">
                      <button onClick={() => openVisitorDetails(visit)} className="text-blue-600 hover:underline font-semibold">{visit.Visitor?.name || 'N/A'}</button>
                    </td>
                    <td className="text-left py-3 px-4">{visit.Employee?.name || 'N/A'}</td>
                    <td className="text-left py-3 px-4">{new Date(visit.checkInTimestamp).toLocaleString()}</td>
                    <td className="text-left py-3 px-4">{visit.actualCheckOutTimestamp ? new Date(visit.actualCheckOutTimestamp).toLocaleString() : 'Still Inside'}</td>
                    <td className="text-left py-3 px-4">{lengthOfStay}</td>
                    <td className="text-left py-3 px-4">
                      <span className={`py-1 px-3 rounded-full text-xs font-medium ${ visit.status === 'CHECKED_IN' ? 'bg-green-200 text-green-800' : visit.status === 'PENDING_APPROVAL' ? 'bg-yellow-200 text-yellow-800' : visit.status === 'CHECKED_OUT' ? 'bg-gray-200 text-gray-800' : 'bg-red-200 text-red-800'}`}>
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
      {isModalOpen && <VisitorDetailsModal visit={selectedVisit} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

// --- Reports Tab Component ---
const ReportsTab = () => {
  const [endOfDayReport, setEndOfDayReport] = useState(null);
  const [historyReport, setHistoryReport] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleShowReport = async () => {
    const res = await apiClient.get('/admin/reports/end-of-day');
    setEndOfDayReport(res.data);
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
    const res = await apiClient.get(`/admin/reports/history-by-employee?email=${email}`);
    setHistoryReport(res.data);
  };

  const ReportList = ({ title, data, color }) => (
    <div>
      <h3 className={`text-lg font-semibold mb-2 text-${color}-600`}>{title} ({data.length})</h3>
      <ul className="space-y-2">
        {data.map(visit => (
          <li key={visit.id} className="p-2 bg-gray-50 rounded-md text-sm">
            <strong>{visit.Visitor.name}</strong> (Host: {visit.Employee.name})
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>End-of-Day Status</CardTitle>
          <button onClick={handleShowReport} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Generate Report</button>
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
            <input type="email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="Enter host employee's email" className="w-full px-4 py-2 border border-gray-300 rounded-lg"/>
            <button onClick={() => handleHistorySearch(searchEmail)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Search</button>
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
              {suggestions.map(emp => (
                <li key={emp.id} onMouseDown={() => handleHistorySearch(emp.email)} className="px-4 py-2 cursor-pointer hover:bg-gray-100">{emp.name} ({emp.email})</li>
              ))}
            </ul>
          )}
        </div>
        {historyReport && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold">History for: {historyReport.employee.name}</h3>
            <ul className="mt-4 space-y-3">
              {historyReport.visits.length > 0 ? historyReport.visits.map(visit => (
                <li key={visit.id} className="p-3 bg-gray-50 rounded-md border">
                  <p className="font-semibold">{visit.Visitor.name}</p>
                  <p className="text-sm text-gray-500">{new Date(visit.checkInTimestamp).toLocaleString()}</p>
                </li>
              )) : <p>No history found.</p>}
            </ul>
          </div>
        )}
      </Card>
    </div>
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

  const handleSave = async (guardData) => {
    try {
      if (editingGuard) {
        await apiClient.put(`/admin/guards/${editingGuard.id}`, guardData);
      } else {
        await apiClient.post('/admin/guards', guardData);
      }
      fetchGuards();
    } catch (error) {
      alert(`Failed to save guard: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsModalOpen(false);
      setEditingGuard(null);
    }
  };
  
  const handleDelete = async (guardId) => {
    if (window.confirm("Are you sure you want to delete this guard?")) {
      try {
        await apiClient.delete(`/admin/guards/${guardId}`);
        fetchGuards();
      } catch (error) {
        alert('Failed to delete guard.');
      }
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
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Name</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Email</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Phone</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
              ) : guards.map(guard => (
                <tr key={guard.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{guard.name}</td>
                  <td className="py-3 px-4">{guard.email || 'N/A'}</td>
                  <td className="py-3 px-4">{guard.phone || 'N/A'}</td>
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
const GuardModal = ({ guard, onSave, onClose }) => {
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
    if (!dataToSave.pin) delete dataToSave.pin; // Don't send empty pin
    onSave(dataToSave);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">{guard ? 'Edit Guard' : 'Add New Guard'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-2 border rounded-lg" />
          <input type="email" placeholder="Email (Optional)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          <input type="tel" placeholder="10-Digit Phone (Optional)" value={formData.phone} onChange={handlePhoneChange} className="w-full px-4 py-2 border rounded-lg" />
          <input type="password" placeholder={guard ? 'New PIN (Optional)' : 'PIN'} value={formData.pin} onChange={(e) => setFormData({...formData, pin: e.target.value})} required={!guard} className="w-full px-4 py-2 border rounded-lg" />
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-lg">Save Guard</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VisitorDetailsModal = ({ visit, onClose }) => {
  const [imageUrls, setImageUrls] = useState({ visitorPhotoUrl: null, idPhotoUrl: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visit) {
      apiClient.get(`/admin/visits/${visit.id}/images`)
        .then(res => setImageUrls(res.data))
        .finally(() => setLoading(false));
    }
  }, [visit]);
  
  if (!visit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Visit Details: {visit.Visitor?.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-lg mb-2">Visitor Photo</h4>
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              {loading ? <p>Loading...</p> : <img src={imageUrls.visitorPhotoUrl} alt="Visitor" className="w-full h-full object-cover rounded-lg" />}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">ID Card Photo</h4>
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              {loading ? <p>Loading...</p> : <img src={imageUrls.idPhotoUrl} alt="ID Card" className="w-full h-full object-cover rounded-lg" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AdminDashboard;

