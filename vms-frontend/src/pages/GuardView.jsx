import React, { useState, useEffect } from 'react';
import CheckInPage from './CheckInPage';
import apiClient from '../services/api';
import { X, Copy, Check } from 'lucide-react';

// --- Visitor Details Modal Component (for Guards) ---
const VisitorDetailsModal = ({ visitId, onClose }) => {
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
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30 p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[70vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-800">Visitor Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
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
              <div className="border-b">
                <nav className="-mb-px flex space-x-6">
                  <button onClick={() => setActiveTab('visitor')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'visitor' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Visitor Photo</button>
                  <button onClick={() => setActiveTab('id')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'id' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>ID Card</button>
                </nav>
              </div>
              <div className="flex-grow mt-4 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
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

  return (
    <>
      <div className="bg-slate-100 min-h-screen">
        <header className="bg-white shadow-md">
          <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Guard Station</h1>
            <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">Logout</button>
          </nav>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CheckInPage />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Currently Inside</h2>
              {loading ? <p>Loading...</p> : (
                <ul className="space-y-3">
                  {activeVisits.length > 0 ? activeVisits.map(visit => (
                    <li key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                      <button onClick={() => setSelectedVisitId(visit.id)} className="text-blue-600 hover:underline font-semibold text-left">
                        {visit.Visitor.name}
                      </button>
                      <button onClick={() => handleCheckOut(visit.id)} className="bg-green-500 text-white text-sm font-bold py-1 px-3 rounded-md hover:bg-green-600">
                        Check Out
                      </button>
                    </li>
                  )) : <p className="text-gray-500">No visitors are currently checked in.</p>}
                </ul>
              )}
            </div>
          </div>
        </main>
      </div>
      {selectedVisitId && <VisitorDetailsModal visitId={selectedVisitId} onClose={() => setSelectedVisitId(null)} />}
    </>
  );
};

export default GuardView;