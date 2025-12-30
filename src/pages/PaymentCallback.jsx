import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://habit-king-production.up.railway.app/api/v1';

export default function PaymentCallback() {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference') || searchParams.get('trxref');

      if (!reference) {
        setStatus('error');
        setMessage('No payment reference found. Please try again.');
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/payments/verify/${reference}`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );

        if (response.data.success) {
          setStatus('success');
          setMessage('Payment successful! Welcome to Pro! 🎉');
        } else {
          setStatus('failed');
          setMessage(response.data.message || 'Payment was not successful. Please try again.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Failed to verify payment. Please contact support.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleContinue = () => {
    if (status === 'success') {
      window.location.href = '/dashboard';
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'verifying' && (
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-5xl">🎉</span>
            </div>
          )}
          {status === 'failed' && (
            <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-5xl">⚠️</span>
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-5xl">❌</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'verifying' && 'Verifying Payment'}
          {status === 'success' && 'Welcome to Pro! 👑'}
          {status === 'failed' && 'Payment Failed'}
          {status === 'error' && 'Something Went Wrong'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">{message}</p>

        {/* Success Details */}
        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">Your Pro features are now active:</p>
            <ul className="text-green-700 text-sm mt-2 space-y-1">
              <li>✓ Create & join groups</li>
              <li>✓ Leaderboard access</li>
              <li>✓ Hall of Fame</li>
              <li>✓ Add friends</li>
              <li>✓ Daily stats</li>
            </ul>
          </div>
        )}

        {/* Action Button */}
        {status !== 'verifying' && (
          <button
            onClick={handleContinue}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
              status === 'success'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status === 'success' ? 'Go to Dashboard 🚀' : 'Back to Dashboard'}
          </button>
        )}

        {/* Support Link */}
        {(status === 'failed' || status === 'error') && (
          <p className="text-sm text-gray-500 mt-4">
            Need help? Contact support at{' '}
            <a href="mailto:support@habitking.com" className="text-blue-600 hover:underline">
              support@habitking.com
            </a>
          </p>
        )}
      </div>
    </div>
  );
}