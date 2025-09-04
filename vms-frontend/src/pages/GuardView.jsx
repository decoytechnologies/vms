import React, { useState, useEffect } from 'react';
import CheckInPage from './CheckInPage';
import apiClient from '../services/api';
import { X, Copy, Check, Sun, Moon } from 'lucide-react';

// --- Visitor Details Modal Component (for Guards) ---
const VisitorDetailsModal = ({ visitId, onClose, isDark = true }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visitor');
  const [copiedStates, setCopiedStates] = useState({});

  useEffect(() => {
    if (visitId) {
      apiClient.get(`/visitors/details/${visitId}`)
        .then(res => setDetails(res.data))
        .finally(() => setLoading(false));
    }
  }, [visitId]);

  const handleCopyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [field]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [field]: false })), 2000);
    });
  };

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
    <div onClick={onClose} className={`fixed inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'} flex items-center justify-center z-30 p-4`}>
      <div onClick={(e) => e.stopPropagation()} className={`${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white'} rounded-lg shadow-2xl w-full max-w-4xl h-[70vh] flex flex-col border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Visitor Details</h3>
          <button onClick={onClose} className={`${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}><X size={24} /></button>
        </div>
        
        {loading ? (
          <div className="flex-grow flex items-center justify-center"><p>Loading details...</p></div>
        ) : details ? (
          <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-y-auto">
            {/* Details Column */}
            <div className="md:col-span-1 space-y-4">
              <DetailItem label="Name" value={details.visitorName} />
              {/* Visitor email is no longer copyable */}
              <DetailItem label="Email" value={details.visitorEmail} />
              <DetailItem label="Phone (Masked)" value={details.visitorPhoneMasked} />
              <DetailItem label="Host" value={details.hostName} />
              {/* Host email is now displayed and is copyable */}
              <DetailItem label="Host Email" value={details.hostEmail} field="hostEmail" isCopyable={true} />
              <DetailItem label="Check-in Time" value={new Date(details.checkInTime).toLocaleString()} />
            </div>

            {/* Image Column */}
            <div className="md:col-span-2 flex flex-col">
              <div className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <nav className="-mb-px flex space-x-6">
                  <button onClick={() => setActiveTab('visitor')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'visitor' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Visitor Photo</button>
                  <button onClick={() => setActiveTab('id')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'id' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>ID Card</button>
                </nav>
              </div>
              <div className={`flex-grow mt-4 flex items-center justify-center rounded-lg overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <img 
                  src={activeTab === 'visitor' ? details.visitorPhotoUrl : details.idPhotoUrl} 
                  alt={activeTab === 'visitor' ? 'Visitor' : 'ID Card'} 
                  className="max-w-full max-h-full object-contain"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            </div>
          </div>
        ) : <div className="flex-grow flex items-center justify-center"><p>Could not load details.</p></div>}
      </div>
    </div>
  );
};


// --- Main Guard View Component ---
const GuardView = ({ onLogout }) => {
  const [activeVisits, setActiveVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('checkin');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '' });
  const showToast = (message, timeout = 2000) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), timeout);
  };
  const containerBg = isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';
  const tableHeadBg = isDark ? 'bg-slate-700' : 'bg-gray-200';
  const sidebarBg = isDark ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100' : 'bg-white text-slate-900 border-r border-slate-200';
  const tabActive = isDark ? 'bg-slate-700 text-slate-100 ring-1 ring-indigo-500/30' : 'bg-slate-200 text-slate-900 ring-1 ring-indigo-500/20';
  const tabHover = isDark ? 'hover:bg-slate-700/60 hover:text-slate-100' : 'hover:bg-slate-100 hover:text-slate-900';

  const fetchActiveVisits = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/visitors/active');
      setActiveVisits(response.data);
    } catch (error) {
      console.error("Failed to fetch active visitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVisits();
    const interval = setInterval(fetchActiveVisits, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckOut = async (visitId) => {
    try {
      await apiClient.patch(`/visitors/${visitId}/checkout`);
      fetchActiveVisits();
    } catch (error) {
      alert('Failed to check out visitor.');
    }
  };

  const guardName = typeof window !== 'undefined' ? localStorage.getItem('guardName') : null;

  // Filter active visits based on search term
  const filteredVisits = activeVisits.filter(visit => {
    if (searchTerm.length < 3) return true;
    const searchLower = searchTerm.toLowerCase();
    const visitorName = visit.Visitor.name.toLowerCase();
    const hostName = visit.Employee?.name?.toLowerCase() || '';
    const hostEmail = visit.Employee?.email?.toLowerCase() || '';
    return visitorName.includes(searchLower) || hostName.includes(searchLower) || hostEmail.includes(searchLower);
  });

  return (
    <>
      <div className={`${containerBg} min-h-screen font-sans`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className={`w-64 p-6 sticky top-0 h-screen shadow-xl flex flex-col ${sidebarBg}`}>
            {/* Logo */}
            <div className="mb-8 flex items-center justify-center">
              <img src={isDark ? '/darkthemelogo.png' : '/logo.png'} alt="Logo" className="h-16 w-auto" />
            </div>
            
            {/* Navigation Tabs */}
            <nav className="space-y-2 flex-grow">
              <button 
                onClick={() => setActiveTab('checkin')} 
                className={`w-full text-left px-4 py-3 rounded-lg transition duration-200 font-medium ${
                  activeTab === 'checkin' ? tabActive : tabHover
                }`}
              >
                Check In
              </button>
              <button 
                onClick={() => setActiveTab('checkout')} 
                className={`w-full text-left px-4 py-3 rounded-lg transition duration-200 font-medium ${
                  activeTab === 'checkout' ? tabActive : tabHover
                }`}
              >
                Check Out
              </button>
            </nav>
            
            {/* Bottom Actions */}
            <div className="mt-auto">
              <button 
                onClick={onLogout} 
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div></div>
              <h1 className="text-3xl font-bold">Guard Station</h1>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setIsDark(!isDark)} 
                  className={`${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'} p-2 rounded-full transition`} 
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <span className={`text-base font-medium opacity-90 truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {guardName || 'Guard'}
                </span>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'checkin' && (
              <div className={`${cardBg} p-6 rounded-lg shadow-lg border ${borderColor}`}>
                <CheckInPage isDark={isDark} />
              </div>
            )}

            {activeTab === 'checkout' && (
              <div className={`${cardBg} p-6 rounded-lg shadow-lg border ${borderColor}`}>
                <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-gray-700'}`}>Currently Inside</h2>
                
                {/* Search Bar */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search by visitor name, host name, or host email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {searchTerm.length > 0 && searchTerm.length < 3 && (
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Type at least 3 characters to search
                    </p>
                  )}
                </div>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>Loading...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredVisits.length > 0 ? filteredVisits.map(visit => {
                      const started = new Date(visit.checkInTimestamp);
                      const now = new Date();
                      const durationMs = now - started;
                      const hours = Math.floor(durationMs / 3600000);
                      const minutes = Math.floor((durationMs % 3600000) / 60000);
                      const lengthOfStay = `${hours}h ${minutes}m`;
                      const hostName = visit.Employee?.name;
                      const hostEmail = visit.Employee?.email;
                      return (
                        <div key={visit.id} className={`p-4 rounded-md border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <button 
                              onClick={() => setSelectedVisitId(visit.id)} 
                              className={`${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-blue-600 hover:text-blue-800'} hover:underline font-semibold text-left`}
                            >
                              {visit.Visitor.name}
                            </button>
                            <button 
                              onClick={() => handleCheckOut(visit.id)} 
                              className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-md transition"
                            >
                              Check Out
                            </button>
                          </div>
                          <div className={`text-sm space-y-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            <div>Stay: {lengthOfStay}</div>
                            <div>Host: {hostName || 'N/A'}</div>
                            {hostEmail && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{hostEmail}</span>
                                <button
                                  onClick={() => { navigator.clipboard.writeText(hostEmail); showToast('Email copied'); }}
                                  className={`${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} p-1 rounded transition`}
                                  title="Copy host email"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-8">
                        <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {searchTerm.length >= 3 ? 'No visitors found matching your search.' : 'No visitors are currently checked in.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      
      {selectedVisitId && <VisitorDetailsModal visitId={selectedVisitId} onClose={() => setSelectedVisitId(null)} isDark={isDark} />}
      
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg ${isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-900 text-white'}`}>
          {toast.message}
        </div>
      )}
    </>
  );
};

export default GuardView;