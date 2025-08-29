import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import apiClient from '../services/api';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'user',
};

const CheckInPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeEmail: '',
  });
  const [visitorPhoto, setVisitorPhoto] = useState(null);
  const [idPhoto, setIdPhoto] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [visitorSuggestions, setVisitorSuggestions] = useState([]);
  
  const webcamRef = useRef(null);

  // Effect for autocomplete searches
  useEffect(() => {
    const handler = setTimeout(() => {
      // Returning visitor check by phone number
      if (formData.phone.length >= 3) {
        fetchVisitorSuggestions(formData.phone);
      } else {
        setVisitorSuggestions([]);
      }
      // Employee autocomplete
      if (formData.employeeEmail.length >= 3) {
        fetchEmployeeSuggestions(formData.employeeEmail);
      } else {
        setEmployeeSuggestions([]);
      }
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [formData.phone, formData.employeeEmail]);

  const fetchVisitorSuggestions = async (phoneQuery) => {
    try {
      const response = await apiClient.get(`/visitors/search-by-phone?phone=${phoneQuery}`);
      setVisitorSuggestions(response.data);
    } catch (error) {
      console.error("Failed to fetch visitor suggestions");
    }
  };

  const fetchEmployeeSuggestions = async (query) => {
    try {
      const response = await apiClient.get(`/employees/search?query=${query}`);
      setEmployeeSuggestions(response.data);
    } catch (error) {
      console.error("Failed to fetch employee suggestions");
    }
  };

  const handlePhoneChange = (e) => {
    const numericText = e.target.value.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setFormData({ ...formData, phone: numericText, name: '', email: '' }); // Clear details when phone changes
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const captureVisitorPhoto = useCallback(() => setVisitorPhoto(webcamRef.current.getScreenshot()), [webcamRef]);
  const captureIdPhoto = useCallback(() => setIdPhoto(webcamRef.current.getScreenshot()), [webcamRef]);
  
  const clearForm = () => {
    setFormData({ name: '', email: '', phone: '', employeeEmail: '' });
    setVisitorPhoto(null);
    setIdPhoto(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!visitorPhoto || !idPhoto) {
      setMessage({ type: 'error', text: 'Please capture both visitor and ID photos.' });
      return;
    }
    setLoading(true);
    const submissionData = new FormData();
    Object.keys(formData).forEach(key => submissionData.append(key, formData[key]));
    submissionData.append('visitorPhoto', dataURLtoFile(visitorPhoto, 'visitorPhoto.jpeg'));
    submissionData.append('idPhoto', dataURLtoFile(idPhoto, 'idPhoto.jpeg'));

    try {
      const response = await apiClient.post('/visitors/check-in', submissionData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: response.data.message });
      clearForm();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'An unexpected error occurred.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Visitor Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input type="tel" name="phone" value={formData.phone} onChange={handlePhoneChange} placeholder="Visitor's 10-Digit Phone (for lookup)" required className="w-full px-4 py-2 border rounded-lg" />
            {visitorSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                {visitorSuggestions.map(vis => (
                  <li key={vis.id} onMouseDown={() => { setFormData({ ...formData, phone: vis.phone, name: vis.name, email: vis.email }); setVisitorSuggestions([]); }} className="px-4 py-2 cursor-pointer hover:bg-gray-100">{vis.name} ({vis.phone})</li>
                ))}
              </ul>
            )}
          </div>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Visitor's Full Name" required className="w-full px-4 py-2 border rounded-lg" />
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Visitor's Email Address" required className="w-full px-4 py-2 border rounded-lg" />
          <div className="relative">
            <input type="email" name="employeeEmail" value={formData.employeeEmail} onChange={handleInputChange} placeholder="Host Employee's Email or Name" required className="w-full px-4 py-2 border rounded-lg" />
            {employeeSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                {employeeSuggestions.map(emp => (
                  <li key={emp.id} onMouseDown={() => { setFormData({ ...formData, employeeEmail: emp.email }); setEmployeeSuggestions([]); }} className="px-4 py-2 cursor-pointer hover:bg-gray-100">{emp.name} ({emp.email})</li>
                ))}
              </ul>
            )}
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
            {loading ? 'Submitting...' : 'Submit Check-In'}
          </button>
          
          {message.text && ( <div className={`p-3 rounded-lg text-center font-medium ${ message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}> {message.text} </div> )}
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Capture Photos</h2>
        <div className="bg-black rounded-lg overflow-hidden mb-4">
          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" videoConstraints={videoConstraints} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button type="button" onClick={captureVisitorPhoto} className="w-full bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800">Capture Visitor Photo</button>
          <button type="button" onClick={captureIdPhoto} className="w-full bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800">Capture ID Card Photo</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-600 mb-2">Visitor Preview:</h3>
            {visitorPhoto ? <img src={visitorPhoto} alt="Visitor" className="rounded-lg border" /> : <div className="border rounded-lg h-32 bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>}
          </div>
          <div>
            <h3 className="font-semibold text-gray-600 mb-2">ID Preview:</h3>
            {idPhoto ? <img src={idPhoto} alt="ID Card" className="rounded-lg border" /> : <div className="border rounded-lg h-32 bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;