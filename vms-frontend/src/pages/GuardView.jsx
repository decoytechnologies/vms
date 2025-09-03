import React, { useState, useEffect, createContext, useContext } from 'react';
import CheckInPage from './CheckInPage';
import apiClient from '../services/api';
import { X, Copy, Check, Sun, Moon, LogOut, UserCheck } from 'lucide-react';

// --- Theme Context for Guard View ---
const GuardThemeContext = createContext();

const useGuardTheme = () => {
  const context = useContext(GuardThemeContext);
  if (!context) {
    throw new Error('useGuardTheme must be used within a GuardThemeProvider');
  }
  return context;
};

// --- Theme Provider for Guard View ---
const GuardThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // Default to dark theme for guards
  
  const toggleTheme = () => {
    setIsDark(!isDark);
  };
  
  return (
    <GuardThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </GuardThemeContext.Provider>
  );
};

// --- Visitor Details Modal Component (for Guards) ---
const VisitorDetailsModal = ({ visitId, onClose, onCheckOut }) => {
  const { isDark } = useGuardTheme();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visitor');
  const [copiedStates, setCopiedStates] = useState({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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

  const handleCheckOutFromModal = async () => {
    setIsCheckingOut(true);
    try {
      await apiClient.patch(`/visitors/${visitId}/checkout`);
      onCheckOut && onCheckOut(visitId);
      onClose();
    } catch (error) {
      alert('Failed to check out visitor.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const DetailItem = ({ label, value, field, isCopyable = false }) => (
    <div>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <div className="flex items-center justify-between">
        <p className={`font-semibold break-all ${isDark ? 'text-white' : 'text-gray-800'}`}>{value}</p>
        {isCopyable && (
          <button 
            onClick={() => handleCopyToClipboard(value, field)} 
            className={`ml-2 p-1 rounded-md transition-colors duration-200 ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            {copiedStates[field] ? <Check size={16} className="text-green-500" /> : <Copy size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30 p-4">
      <div onClick={(e) => e.stopPropagation()} className={`rounded-lg shadow-2xl w-full max-w-4xl h-[70vh] flex flex-col transition-colors duration-200 ${
        isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Visitor Details</h3>
          <div className="flex items-center space-x-3">
            {details && (
              <button 
                onClick={handleCheckOutFromModal}
                disabled={isCheckingOut}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isCheckingOut
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <UserCheck size={18} />
                <span>{isCheckingOut ? 'Checking Out...' : 'Check Out'}</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Loading details...</p>
          </div>
        ) : details ? (
          <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-y-auto">
            {/* Details Column */}
            <div className="md:col-span-1 space-y-4">
              <DetailItem label="Name" value={details.visitorName} />
              <DetailItem label="Email" value={details.visitorEmail} />
              <DetailItem label="Phone (Masked)" value={details.visitorPhoneMasked} />
              <DetailItem label="Host" value={details.hostName} />
              <DetailItem label="Host Email" value={details.hostEmail} field="hostEmail" isCopyable={true} />
              <DetailItem label="Check-in Time" value={new Date(details.checkInTime).toLocaleString()} />
            </div>

            {/* Image Column */}
            <div className="md:col-span-2 flex flex-col">
              <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <nav className="-mb-px flex space-x-6">
                  <button 
                    onClick={() => setActiveTab('visitor')} 
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === 'visitor' 
                        ? 'border-blue-500 text-blue-600' 
                        : isDark 
                          ? 'border-transparent text-gray-400 hover:text-gray-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Visitor Photo
                  </button>
                  <button 
                    onClick={() => setActiveTab('id')} 
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === 'id' 
                        ? 'border-blue-500 text-blue-600' 
                        : isDark 
                          ? 'border-transparent text-gray-400 hover:text-gray-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    ID Card
                  </button>
                </nav>
              </div>
              <div className={`flex-grow mt-4 flex items-center justify-center rounded-lg overflow-hidden ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <img 
                  src={activeTab === 'visitor' ? details.visitorPhotoUrl : details.idPhotoUrl} 
                  alt={activeTab === 'visitor' ? 'Visitor' : 'ID Card'} 
                  className="max-w-full max-h-full object-contain"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Could not load details.</p>
          </div>
        )}
      </div>
    </div>
  );
};


// --- Main Guard View Component ---
const GuardView = ({ onLogout }) => {
  const { isDark, toggleTheme } = useGuardTheme();
  const [activeVisits, setActiveVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [guardInfo, setGuardInfo] = useState({ name: 'Guard User' }); // Default guard name

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

  const calculateDuration = (checkInTime) => {
    const now = new Date();
    const checkIn = new Date(checkInTime);
    const durationMs = now - checkIn;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, isLongStay: hours >= 5 };
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

  return (
    <>
      <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-slate-100'}`}>
        <header className={`shadow-md transition-colors duration-200 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Guard Station</h1>
            
            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Toggle Theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-green-600' : 'bg-green-500'
                } text-white font-bold`}>
                  G
                </div>
                <div className="hidden md:block">
                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{guardInfo.name}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Security Guard</div>
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
          </nav>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CheckInPage isDark={isDark} />
            </div>
            <div className={`p-6 rounded-lg shadow-lg transition-colors duration-200 ${
              isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Currently Inside ({activeVisits.length})
              </h2>
              {loading ? (
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Loading...</p>
              ) : (
                <ul className="space-y-3">
                  {activeVisits.length > 0 ? activeVisits.map(visit => {
                    const duration = calculateDuration(visit.checkInTimestamp);
                    return (
                      <li key={visit.id} className={`p-3 rounded-md border transition-colors duration-200 ${
                        duration.isLongStay 
                          ? isDark 
                            ? 'bg-red-900/20 border-red-700' 
                            : 'bg-red-50 border-red-200'
                          : isDark 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <button 
                              onClick={() => setSelectedVisitId(visit.id)} 
                              className="text-blue-600 hover:underline font-semibold text-left block"
                            >
                              {visit.Visitor.name}
                            </button>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Visiting: <span className="font-medium">{visit.Employee?.name || 'N/A'}</span>
                            </p>
                            <div className="flex items-center mt-1 text-xs">
                              <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                                {duration.hours}h {duration.minutes}m inside
                              </span>
                              {duration.isLongStay && (
                                <span className="ml-2 px-2 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                                  LONG STAY!
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleCheckOut(visit.id)} 
                            className="bg-green-500 text-white text-sm font-bold py-1 px-3 rounded-md hover:bg-green-600 transition-colors duration-200 ml-3"
                          >
                            Check Out
                          </button>
                        </div>
                      </li>
                    );
                  }) : (
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      No visitors are currently checked in.
                    </p>
                  )}
                </ul>
              )}
            </div>
          </div>
        </main>
      </div>
      {selectedVisitId && (
        <VisitorDetailsModal 
          visitId={selectedVisitId} 
          onClose={() => setSelectedVisitId(null)}
          onCheckOut={fetchActiveVisits}
        />
      )}
    </>
  );
};

// Wrap GuardView with Theme Provider
const GuardViewWithTheme = ({ onLogout }) => (
  <GuardThemeProvider>
    <GuardView onLogout={onLogout} />
  </GuardThemeProvider>
);

export default GuardViewWithTheme;