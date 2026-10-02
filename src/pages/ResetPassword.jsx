import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0A0F1E' }} className="min-h-screen flex items-center justify-center p-4">
      <div style={{ backgroundColor: '#111827', borderColor: '#1E2A3A' }} className="rounded-2xl border p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Habit King" className="h-20 w-auto mx-auto mb-4" />
          <p style={{ color: '#8A9BB0' }} className="text-sm">Set a new password</p>
        </div>

        {!token ? (
          <div className="text-center">
            <p style={{ color: '#E07070' }} className="text-sm mb-4">Invalid reset link.</p>
            <Link to="/forgot-password" style={{ color: '#C9A84C' }} className="text-sm font-semibold">Request a new link</Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <p style={{ color: '#F5F0E8' }} className="text-base font-semibold mb-2">Password reset</p>
            <p style={{ color: '#8A9BB0' }} className="text-sm">Taking you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div style={{ backgroundColor: '#1A0F0F', borderColor: '#4A1A1A', color: '#E07070' }} className="border px-4 py-3 rounded-lg text-sm">{error}</div>}
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ backgroundColor: '#0A0F1E', borderColor: '#1E2A3A', color: '#F5F0E8' }}
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-yellow-600"
              placeholder="New password" minLength={6} />
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              style={{ backgroundColor: '#0A0F1E', borderColor: '#1E2A3A', color: '#F5F0E8' }}
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-yellow-600"
              placeholder="Confirm new password" minLength={6} />
            <button type="submit" disabled={loading}
              style={{ backgroundColor: '#C9A84C', color: '#0A0F1E' }}
              className="w-full py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}