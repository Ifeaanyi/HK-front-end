import { useState, useEffect } from 'react';
import api from '../utils/api';

const S = {
  surface: '#152338', border: '#1E3A5F', text: '#F5F0E8',
  muted: '#8A9BB0', gold: '#C9A84C', green: '#00C853', red: '#E07070',
};

export default function JoinRequests({ groupId, isCreator }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!isCreator || !groupId) { setLoading(false); return; }
    try {
      const res = await api.get('/groups/' + groupId + '/join-requests');
      setRequests(res.data.requests || []);
    } catch (e) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [groupId, isCreator]);

  const decide = async (requestId, action) => {
    try {
      await api.post('/groups/join-requests/' + requestId + '/' + action);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (e) {
      alert(e.response?.data?.detail || 'Action failed');
    }
  };

  if (!isCreator || loading || requests.length === 0) return null;

  return (
    <div style={{ backgroundColor: S.surface, border: `1px solid ${S.gold}` }} className="rounded-2xl p-5 mb-6">
      <p style={{ color: S.gold }} className="text-xs font-bold uppercase tracking-widest mb-4">
        Join Requests ({requests.length})
      </p>
      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.request_id} style={{ backgroundColor: '#0D1B2A', border: `1px solid ${S.border}` }} className="rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p style={{ color: S.text }} className="text-sm font-semibold truncate">{r.full_name}</p>
              <p style={{ color: S.muted }} className="text-xs truncate">{r.role_title}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => decide(r.request_id, 'approve')}
                style={{ backgroundColor: S.green, color: '#0A0F1E' }}
                className="text-xs px-3 py-1.5 rounded-lg font-bold">Approve</button>
              <button onClick={() => decide(r.request_id, 'reject')}
                style={{ backgroundColor: 'transparent', border: `1px solid ${S.red}`, color: S.red }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}