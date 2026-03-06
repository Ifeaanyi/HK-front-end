import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          setError(err.response.data.detail);
        } else {
          setError('Login failed. Please check your credentials.');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0A0F1E' }} className="min-h-screen flex items-center justify-center p-4">
      <div style={{ backgroundColor: '#111827', borderColor: '#1E2A3A' }} className="rounded-2xl border p-8 w-full max-w-md">
        
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Habit King" className="h-24 w-auto mx-auto mb-4" />
          <p style={{ color: '#8A9BB0' }} className="text-sm">Welcome back. Log in to continue.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#1A0F0F', borderColor: '#4A1A1A', color: '#E07070' }} className="border px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ color: '#8A9BB0' }} className="block text-xs font-medium mb-2 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ backgroundColor: '#0A0F1E', borderColor: '#1E2A3A', color: '#F5F0E8' }}
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-yellow-600 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={{ color: '#8A9BB0' }} className="block text-xs font-medium mb-2 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ color: '#8A9BB0' }} className="text-center mt-6 text-sm">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#C9A84C' }} className="font-semibold hover:opacity-80 transition">
            Sign up
          </Link>
        </p>

        <p className="text-center mt-3 text-sm">
          <Link to="/forgot-password" style={{ color: '#8A9BB0' }} className="hover:opacity-80 transition">
            Forgot password?
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;