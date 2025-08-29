import React, { useState, useEffect } from 'react';
import CheckInPage from './CheckInPage';
import apiClient from '../services/api';

const GuardView = ({ onLogout }) => {
  const [activeVisits, setActiveVisits] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const interval = setInterval(fetchActiveVisits, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCheckOut = async (visitId) => {
    try {
      await apiClient.patch(`/visitors/${visitId}/checkout`);
      fetchActiveVisits(); // Refresh the list immediately
    } catch (error) {
      alert('Failed to check out visitor.');
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src="/logo.png" alt="Company Logo" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold text-gray-800">Guard Station</h1>
          </div>
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
                    <span className="text-gray-800">{visit.Visitor.name}</span>
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
  );
};

export default GuardView;
