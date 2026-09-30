import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const S = {
  bg: '#0A0F1E', surface: '#111827', border: '#1E2A3A',
  text: '#F5F0E8', muted: '#8A9BB0', gold: '#C9A84C',
};

export default function JoinGroup() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('working'); // working | done | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Not logged in -> remember the code, send them to sign up, then come back
    if (!token) {
      localStorage.setItem('pendingJoinCode', code);
      navigate('/register');
      return;
    }

    // Logged in -> send the join request
    (async () => {
      try {
        const res = await api.post('/groups/request-join?invite_code=' + code);
        setMessage(res.data.message || 'Request sent.');
        setStatus('done');
      } catch (err) {
        setMessage(err.response?.data?.detail || 'Could not process this invite.');
        setStatus('error');
      }
    })();
  }, [code, navigate]);

  return (
    <div style={{ backgroundColor: S.bg, minHeight: '100vh' }} className="flex flex-col items-center justify-center p-6">
      <img src="/logo.png" alt="Habit King" className="h-20 w-auto mb-8" />
      <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-2xl p-8 w-full max-w-md text-center">
        {status === 'working' && (
          <>
            <div className="text-4xl mb-4">👑</div>
            <p style={{ color: S.muted }} className="text-sm">Joining your group...</p>
          </>
        )}
        {status === 'done' && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <p style={{ color: S.text }} className="text-base font-bold mb-2">Almost there</p>
            <p style={{ color: S.muted }} className="text-sm mb-6">{message}</p>
            <button onClick={() => navigate('/dashboard')} style={{ backgroundColor: S.gold, color: S.bg }}
              className="w-full py-3 rounded-xl font-black text-sm hover:opacity-90 transition">
              Go to Dashboard →
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <p style={{ color: S.text }} className="text-base font-bold mb-2">Hmm</p>
            <p style={{ color: S.muted }} className="text-sm mb-6">{message}</p>
            <button onClick={() => navigate('/dashboard')} style={{ backgroundColor: S.gold, color: S.bg }}
              className="w-full py-3 rounded-xl font-black text-sm hover:opacity-90 transition">
              Go to Dashboard →
            </button>
          </>
        )}
      </div>
    </div>
  );
}