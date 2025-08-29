import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const AdminDashboard = ({ onLogout }) => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [historyReport, setHistoryReport] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await apiClient.get('/admin/visits');
        setVisits(response.data);
      } catch (err) {
        setError('Failed to load visitor data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, []);

  useEffect(() => {
    if (searchEmail.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await apiClient.get(`/admin/employees/search?query=${searchEmail}`);
        setSuggestions(response.data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Failed to fetch suggestions");
      }
    };

    const debounceTimeout = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchEmail]);

  const handleShowReport = async () => {
    setReportLoading(true);
    setReport(null);
    try {
      const response = await apiClient.get('/admin/reports/end-of-day');
      setReport(response.data);
    } catch (err) {
      setError('Failed to generate end-of-day report.');
    } finally {
      setReportLoading(false);
    }
  };

  const fetchHistoryReport = async (emailToSearch) => {
    setHistoryLoading(true);
    setHistoryReport(null);
    setHistoryError('');
    try {
      const response = await apiClient.get(`/admin/reports/history-by-employee?email=${emailToSearch}`);
      setHistoryReport(response.data);
    } catch (err) {
      setHistoryError(err.response?.data?.message || 'Failed to generate history report.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistorySearch = async (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    fetchHistoryReport(searchEmail);
  };

  const handleSuggestionClick = (email) => {
    setSearchEmail(email);
    setShowSuggestions(false);
    fetchHistoryReport(email);
  };

  const ReportSection = ({ title, data, color }) => (
    <div>
      <h3 className={`text-lg font-semibold mb-2 text-${color}-600`}>{title} ({data.length})</h3>
      {data.length > 0 ? (
        <ul className="space-y-2">
          {data.map(visit => (
            <li key={visit.id} className="p-2 bg-gray-50 rounded-md text-sm">
              <strong>{visit.Visitor.name}</strong> (Host: {visit.Employee.name})
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-gray-500">No visitors in this category.</p>}
    </div>
  );

  return (
    <div className="bg-slate-100 min-h-screen">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition">Logout</button>
        </nav>
      </header>
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* End of Day Report Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">End-of-Day Status</h2>
            <button onClick={handleShowReport} disabled={reportLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-blue-400">
              {reportLoading ? 'Generating...' : 'Generate Today\'s Report'}
            </button>
          </div>
          {report && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <ReportSection title="Visitors Still Inside" data={report.stillInside} color="green" />
              <ReportSection title="Visitors Who Have Left" data={report.haveLeft} color="gray" />
            </div>
          )}
        </div>

        {/* Visitor History by Employee Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Visitor History by Employee</h2>
          <form onSubmit={handleHistorySearch} className="relative">
            <div className="flex items-center space-x-4">
              <input 
                type="email" 
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Start typing an employee's name or email..." 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoComplete="off"
              />
              <button type="submit" disabled={historyLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-blue-400">
                {historyLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full md:w-3/4 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map(employee => (
                  <li 
                    key={employee.id}
                    onMouseDown={() => handleSuggestionClick(employee.email)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-sm text-gray-500">{employee.email}</p>
                  </li>
                ))}
              </ul>
            )}
          </form>

          {historyReport && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Showing History for: {historyReport.employee.name}
              </h3>
              <ul className="mt-4 space-y-3">
                {historyReport.visits.length > 0 ? historyReport.visits.map(visit => (
                  <li key={visit.id} className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-semibold text-gray-700">{visit.Visitor.name}</p>
                    <p className="text-sm text-gray-500">{visit.Visitor.email} | {visit.Visitor.phone}</p>
                    <p className="text-sm text-gray-500">
                      Checked in at: {new Date(visit.checkInTimestamp).toLocaleString()} | Status: {visit.status.replace('_', ' ')}
                    </p>
                  </li>
                )) : <p className="text-sm text-gray-500">No visitor history found for this employee.</p>}
              </ul>
            </div>
          )}
          {historyError && <p className="mt-4 text-red-500">{historyError}</p>}
        </div>

        {/* Full Visitor Log Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Full Visitor Log</h2>
          {loading && <p>Loading visitors...</p>}
          {error && !loading && <p className="text-red-500">{error}</p>}
          
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Visitor</th>
                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Contact</th>
                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Host Employee</th>
                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Check-in Time</th>
                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {visits.length > 0 ? visits.map((visit) => (
                    <tr key={visit.id} className="border-b hover:bg-gray-50">
                      <td className="text-left py-3 px-4">{visit.Visitor?.name || 'N/A'}</td>
                      <td className="text-left py-3 px-4">{visit.Visitor?.email || 'N/A'}</td>
                      <td className="text-left py-3 px-4">{visit.Employee?.name || 'N/A'}</td>
                      <td className="text-left py-3 px-4">{new Date(visit.checkInTimestamp).toLocaleString()}</td>
                      <td className="text-left py-3 px-4">
                        <span className={`py-1 px-3 rounded-full text-xs font-medium ${
                          visit.status === 'CHECKED_IN' ? 'bg-green-200 text-green-800' :
                          visit.status === 'PENDING_APPROVAL' ? 'bg-yellow-200 text-yellow-800' :
                          visit.status === 'CHECKED_OUT' ? 'bg-gray-200 text-gray-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {visit.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">No visitor data found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
