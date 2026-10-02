import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0A0F1E' }} className="min-h-screen flex items-center justify-center p-4">
      <div style={{ backgroundColor: '#111827', borderColor: '#1E2A3A' }} className="rounded-2xl border p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Habit King" className="h-20 w-auto mx-auto mb-4" />
          <p style={{ color: '#8A9BB0' }} className="text-sm">Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <p style={{ color: '#F5F0E8' }} className="text-base font-semibold mb-2">Check your email</p>
            <p style={{ color: '#8A9BB0' }} className="text-sm mb-6">If that email is registered, we've sent a reset link. It expires in 1 hour.</p>
            <Link to="/login" style={{ color: '#C9A84C' }} className="text-sm font-semibold">← Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div style={{ backgroundColor: '#1A0F0F', borderColor: '#4A1A1A', color: '#E07070' }} className="border px-4 py-3 rounded-lg text-sm">{error}</div>}
            <p style={{ color: '#8A9BB0' }} className="text-sm">Enter your email and we'll send you a link to reset your password.</p>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ backgroundColor: '#0A0F1E', borderColor: '#1E2A3A', color: '#F5F0E8' }}
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-yellow-600"
              placeholder="you@example.com" />
            <button type="submit" disabled={loading}
              style={{ backgroundColor: '#C9A84C', color: '#0A0F1E' }}
              className="w-full py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition disabled:opacity-50">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <Link to="/login" style={{ color: '#8A9BB0' }} className="block text-center text-sm hover:text-yellow-500 transition">← Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}