import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://habit-king-production.up.railway.app/api/v1';

const TIMEZONES = [
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
  { value: "Africa/Cairo", label: "Africa/Cairo (EET)" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
  { value: "Europe/Moscow", label: "Europe/Moscow (MSK)" },
  { value: "America/New_York", label: "America/New York (EST)" },
  { value: "America/Chicago", label: "America/Chicago (CST)" },
  { value: "America/Denver", label: "America/Denver (MST)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PST)" },
  { value: "America/Toronto", label: "America/Toronto (EST)" },
  { value: "America/Vancouver", label: "America/Vancouver (PST)" },
  { value: "America/Sao_Paulo", label: "America/Sao Paulo (BRT)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST)" },
  { value: "Australia/Melbourne", label: "Australia/Melbourne (AEST)" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (NZST)" },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [timezone, setTimezone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(API_URL + '/users/me', {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      const userData = response.data;
      setFullName(userData.full_name || '');
      setRoleTitle(userData.role_title || '');
      setTimezone(userData.timezone || 'Africa/Lagos');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.patch(
        API_URL + '/users/profile',
        { full_name: fullName, role_title: roleTitle, timezone: timezone },
        { headers: { Authorization: 'Bearer ' + getToken() } }
      );
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => { window.location.reload(); }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Habit King 👑</h1>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700">← Dashboard</button>
              <span className="text-gray-700">{user?.full_name || 'User'}</span>
              <button onClick={logout} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">Logout</button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">⚙️</span>
            <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
          </div>
          {message.text && (
            <div className={message.type === 'success' ? 'mb-6 p-4 rounded-lg bg-green-50 text-green-800 border border-green-200' : 'mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200'}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Enter your full name" minLength={2} maxLength={100} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role / Job Title</label>
              <input type="text" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="e.g., Software Engineer, Product Manager" minLength={2} maxLength={100} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">This affects when your daily habits reset and streak calculations</p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subscription</label>
              <div className="flex items-center gap-2">
                {user?.subscription_tier === 'pro' ? (
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white">✨ PRO Member</span>
                    {user?.subscription_end_date && (
                      <div>
                        <p className="text-xs text-gray-600">Expires: {new Date(user.subscription_end_date).toLocaleDateString()}</p>
                        <button type="button" onClick={() => window.open('https://paystack.com/pay/habitking', '_blank')} className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-1">Renew Subscription →</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">Free Plan</span>
                    <button type="button" onClick={() => navigate('/dashboard')} className="text-sm text-purple-600 hover:text-purple-700 font-medium">Upgrade to Pro →</button>
                  </>
                )}
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={saving} className={saving ? 'w-full py-3 px-4 rounded-lg font-semibold text-white transition bg-gray-400 cursor-not-allowed' : 'w-full py-3 px-4 rounded-lg font-semibold text-white transition bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-2 text-sm text-blue-800">
            <span className="text-xl">💡</span>
            <div>
              <p className="font-semibold mb-1">About Timezones</p>
              <p>Your timezone determines when your daily habits reset (at midnight in your timezone) and affects streak calculations. Make sure to select your current location for accurate tracking.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}