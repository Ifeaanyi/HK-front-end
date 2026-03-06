import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role_title: '',
    timezone: 'Africa/Lagos'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const timezones = [
    'Africa/Lagos',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland',
    'America/Toronto',
    'Asia/Singapore',
    'Europe/Berlin'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', formData);

      const loginFormData = new FormData();
      loginFormData.append('username', formData.email);
      loginFormData.append('password', formData.password);

      const loginResponse = await api.post('/auth/login', loginFormData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      localStorage.setItem('token', loginResponse.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          setError(err.response.data.detail);
        } else if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail.map(e => e.msg).join(', '));
        } else {
          setError('Registration failed. Please try again.');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ backgroundColor: '#0A0F1E' }} className="min-h-screen flex items-center justify-center p-4">
      <div style={{ backgroundColor: '#111827', borderColor: '#1E2A3A' }} className="rounded-2xl border p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <img src="/logo.png" alt="Habit King" className="h-24 w-auto mx-auto mb-4" />
          <p style={{ color: '#8A9BB0' }} className="text-sm">Create your account and start building habits.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#1A0F0F', borderColor: '#4A1A1A', color: '#E07070' }} className="border px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ color: '#8A9BB0' }} className="block text-xs font-medium mb-2 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              style={{ backgroundColor: '#0A0F1E', borderColor: '#1E2A3A', color: '#F5F0E8' }}
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-yellow-600 transition"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label style={{ color: '#8A9BB0' }} className="block text-xs font-medium mb-2 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              style={{ backgroundColor: '#0A0F1E', borderColor: '#1E2A3A', color: '#F5F0E8' }}
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-yellow-600 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={{ color: '#8A9BB0' }} className="block text-xs font-medium mb-2 uppercase tracking-wider">
              Role / Title
            </label>
            <input
              type="text"
              name="role_title"
              required
              value={formData.role_title}
              onChange={handleChange}
              style={{ backgroundColor: '#0A0F1E', borderColor: '#1E2A3A', color: '#F5F0E8' }}
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-yellow-600 transition"
              placeholder="Data Scientist"
            />
          </div>

          <div>
            <label style={{ color: '#8A9BB0' }} className="block text-xs font-medium mb-2 uppercase tracking-wider">
              Timezone
            </label>
            <select
              name="timezone"
              required
              value={formData.timezone}
              onChange={handleChange}
              style={{ backgroundColor: '#0A0F1E', borderColor: '#1E2A3A', color: '#F5F0E8' }}
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-yellow-600 transition"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: '#8A9BB0' }} className="block text-xs font-medium mb-2 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              style={{ backgroundColor: '#0A0F1E', borderColor: '#1E2A3A', color: '#F5F0E8' }}
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-yellow-600 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#C9A84C', color: '#0A0F1E' }}
            className="w-full py-3 rounded-lg font-semibold text-sm tracking-wide hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ color: '#8A9BB0' }} className="text-center mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#C9A84C' }} className="font-semibold hover:opacity-80 transition">
            Log in
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;