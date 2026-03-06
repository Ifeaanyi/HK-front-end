import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const S = {
  bg: '#0D1B2A',
  surface: '#152338',
  border: '#1E3A5F',
  text: '#F5F0E8',
  muted: '#8A9BB0',
  gold: '#C9A84C',
  hover: '#1E3050',
  blue: '#1A4A7A',
  blueLight: '#2A6AAA',
};

function Leaderboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchLeaderboard(selectedGroup.id);
      fetchDailyStats(selectedGroup.id);
    }
  }, [selectedGroup, selectedMonth]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      const userGroups = response.data.groups || [];
      setGroups(userGroups);
      if (userGroups.length > 0) setSelectedGroup(userGroups[0]);
      setLoading(false);
    } catch (error) { console.error('Failed to fetch groups:', error); setLoading(false); }
  };

  const fetchLeaderboard = async (groupId) => {
    try {
      const monthStr = selectedMonth.getFullYear() + '-' + String(selectedMonth.getMonth() + 1).padStart(2, '0');
      const response = await api.get('/groups/' + groupId + '/leaderboard?month=' + monthStr);
      setLeaderboard(response.data.leaderboard || []);
      setCurrentWinner(response.data.current_winner || null);
    } catch (error) { console.error('Failed to fetch leaderboard:', error); }
  };

  const fetchDailyStats = async (groupId) => {
    try {
      const response = await api.get('/groups/' + groupId + '/daily-stats');
      setDailyStats(response.data);
    } catch (error) { console.error('Failed to fetch daily stats:', error); }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/groups', { name: newGroupName });
      setNewGroupName(''); setShowCreateGroup(false); fetchGroups();
      alert('Group created! Invite code: ' + response.data.invite_code);
    } catch (error) { alert('Failed to create group'); }
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups/join?invite_code=' + inviteCode);
      setInviteCode(''); setShowJoinGroup(false); fetchGroups();
      alert('Successfully joined group!');
    } catch (error) { alert('Failed to join group: ' + (error.response?.data?.detail || 'Invalid code')); }
  };

  const removeMember = async (memberId, memberName) => {
    if (!confirm('Remove ' + memberName + ' from the group?')) return;
    try {
      await api.delete('/groups/' + selectedGroup.id + '/members/' + memberId);
      fetchLeaderboard(selectedGroup.id);
    } catch (error) { alert('Failed to remove member: ' + (error.response?.data?.detail || 'Unknown error')); }
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return String(index + 1);
  };

  const goToPreviousMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));

  const goToNextMonth = () => {
    const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    if (nextMonth <= new Date()) setSelectedMonth(nextMonth);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear();
  };

  const displayMonth = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isGroupCreator = selectedGroup && selectedGroup.created_by === user?.id;

  if (loading) {
    return (
      <div style={{ backgroundColor: S.bg }} className="min-h-screen flex items-center justify-center">
        <p style={{ color: S.muted }} className="text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: S.bg, minHeight: '100vh' }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }} className="sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <img src="/logo.png" alt="Habit King" className="h-16 w-auto" />
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              style={{ color: S.gold, border: `1px solid ${S.border}` }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg hover:border-yellow-600 transition">
              ← Dashboard
            </button>
            <button onClick={() => navigate('/todos')}
              style={{ border: `1px solid ${S.border}`, color: S.muted }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg hover:border-yellow-600 hover:text-yellow-500 transition">
              To-Do
            </button>
            <span style={{ color: S.muted }} className="text-xs">{user?.full_name}</span>
            <button onClick={logout}
              style={{ border: `1px solid #4A1A1A`, color: '#E07070' }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-red-900 hover:bg-opacity-20 transition">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* HEADER BANNER */}
        <div style={{ backgroundColor: S.blue, border: `1px solid ${S.blueLight}` }} className="rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={goToPreviousMonth}
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: S.text }}
              className="px-4 py-2 rounded-xl text-sm font-bold hover:bg-opacity-20 transition">
              ← Prev
            </button>
            <div className="text-center">
              <h2 style={{ color: S.text }} className="text-3xl font-bold mb-1">{displayMonth.toUpperCase()} LEADERBOARD</h2>
              {selectedGroup && <p style={{ color: S.muted }} className="text-sm">{selectedGroup.name} · {leaderboard.length} Participants</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={goToNextMonth} disabled={isCurrentMonth()}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: isCurrentMonth() ? S.muted : S.text }}
                className="px-4 py-2 rounded-xl text-sm font-bold transition disabled:cursor-not-allowed">
                Next →
              </button>
              {selectedGroup && (
                <button onClick={() => navigate('/hall-of-fame/' + selectedGroup.id)}
                  style={{ backgroundColor: S.gold, color: S.bg }}
                  className="px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition">
                  Hall of Fame
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CURRENT WINNER */}
        {currentWinner && (
          <div style={{ backgroundColor: '#1A1400', border: `1px solid ${S.gold}` }} className="rounded-2xl p-4 mb-6 text-center">
            <p style={{ color: S.muted }} className="text-xs uppercase tracking-widest mb-1">Current Habit King</p>
            <p style={{ color: S.gold }} className="text-2xl font-black">{currentWinner.full_name}</p>
            <p style={{ color: S.muted }} className="text-xs mt-1">{currentWinner.total_points} points · {currentWinner.win_path === 'primary' ? 'Primary Path' : 'Bonus Path'}</p>
          </div>
        )}

        {/* DAILY STATS */}
        {selectedGroup && dailyStats && isCurrentMonth() && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label "Today's Leader", value: dailyStats.todays_leader?.full_name, sub: dailyStats.todays_leader?.total_points + ' points' },
              { label: 'Most Productive', value: dailyStats.most_productive_today?.full_name, sub: dailyStats.most_productive_today?.todo_productivity + '% productivity' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-xl p-4">
                <p style={{ color: S.muted }} className="text-xs uppercase tracking-wider mb-2">{label}</p>
                <p style={{ color: S.text }} className="text-base font-bold">{value || '—'}</p>
                <p style={{ color: S.muted }} className="text-xs mt-1">{sub}</p>
              </div>
            ))}
            <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-xl p-4">
              <p style={{ color: S.muted }} className="text-xs uppercase tracking-wider mb-2">Most Daily Wins</p>
              <div className="space-y-1">
                {dailyStats.most_daily_wins?.slice(0, 3).map((w, i) => (
                  <div key={i} className="flex justify-between">
                    <span style={{ color: S.text }} className="text-xs">{getMedalEmoji(i)} {w.full_name}</span>
                    <span style={{ color: S.muted }} className="text-xs">{w.days}d</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PATH TO VICTORY */}
        {selectedGroup && (
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-xl p-4 mb-6">
            <p style={{ color: S.muted }} className="text-xs uppercase tracking-widest mb-3">Path to Victory</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div style={{ backgroundColor: S.blue, border: `1px solid ${S.blueLight}` }} className="rounded-lg p-3">
                <p style={{ color: S.text }} className="font-bold mb-2">Primary Path</p>
                <p style={{ color: S.muted }}>· 65%+ productivity</p>
                <p style={{ color: S.muted }}>· 3 or fewer missed days</p>
                <p style={{ color: S.muted }}>· 130+ activities</p>
              </div>
              <div style={{ backgroundColor: '#0A1A0A', border: `1px solid #2A5A2A` }} className="rounded-lg p-3">
                <p style={{ color: S.text }} className="font-bold mb-2">Bonus Path</p>
                <p style={{ color: S.muted }}>· 260+ points</p>
                <p style={{ color: S.muted }}>· 80%+ productivity</p>
                <p style={{ color: S.muted }}>· 130+ activities</p>
              </div>
            </div>
          </div>
        )}

        {/* GROUP SELECTION */}
        <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <label style={{ color: S.muted }} className="block text-xs uppercase tracking-wider mb-2">Select Group</label>
              {groups.length > 0 ? (
                <select value={selectedGroup?.id || ''} onChange={(e) => setSelectedGroup(groups.find(g => g.id === e.target.value))}
                  style={{ backgroundColor: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                  className="w-full max-w-md px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-yellow-600">
                  {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              ) : (
                <p style={{ color: S.muted }} className="text-sm">No groups yet. Create or join one!</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCreateGroup(!showCreateGroup)}
                style={{ backgroundColor: S.gold, color: S.bg }}
                className="px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition">
                + Create
              </button>
              <button onClick={() => setShowJoinGroup(!showJoinGroup)}
                style={{ backgroundColor: 'transparent', border: `1px solid ${S.border}`, color: S.muted }}
                className="px-4 py-2 rounded-lg text-xs font-medium hover:border-yellow-600 hover:text-yellow-500 transition">
                Join
              </button>
              {isGroupCreator && selectedGroup && (
                <button onClick={async () => {
                  if (!confirm('Make everyone in this group friends?')) return;
                  try {
                    const response = await api.post('/groups/' + selectedGroup.id + '/auto-friend-all');
                    alert(response.data.message);
                  } catch (error) { alert('Failed: ' + (error.response?.data?.detail || 'Unknown error')); }
                }}
                  style={{ backgroundColor: 'transparent', border: `1px solid ${S.border}`, color: S.muted }}
                  className="px-4 py-2 rounded-lg text-xs font-medium hover:border-yellow-600 hover:text-yellow-500 transition">
                  Auto-Friend All
                </button>
              )}
            </div>
          </div>

          {showCreateGroup && (
            <div style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }} className="mt-4 p-4 rounded-lg">
              <form onSubmit={createGroup} className="flex gap-3">
                <input type="text" required value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                  style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, color: S.text }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-yellow-600"
                  placeholder="Group name" maxLength={50} />
                <button type="submit" style={{ backgroundColor: S.gold, color: S.bg }} className="px-5 py-2 rounded-lg text-sm font-bold">Create</button>
              </form>
            </div>
          )}

          {showJoinGroup && (
            <div style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }} className="mt-4 p-4 rounded-lg">
              <form onSubmit={joinGroup} className="flex gap-3">
                <input type="text" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, color: S.text }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm uppercase focus:outline-none focus:border-yellow-600"
                  placeholder="Invite code" maxLength={8} />
                <button type="submit" style={{ backgroundColor: S.gold, color: S.bg }} className="px-5 py-2 rounded-lg text-sm font-bold">Join</button>
              </form>
            </div>
          )}

          {selectedGroup && (
            <div style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }} className="mt-4 p-3 rounded-lg flex items-center gap-3">
              <p style={{ color: S.muted }} className="text-xs">Invite code:</p>
              <code style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, color: S.gold }} className="px-3 py-1 rounded font-mono text-sm font-bold">{selectedGroup.invite_code}</code>
              <button onClick={() => { navigator.clipboard.writeText(selectedGroup.invite_code); alert('Copied!'); }}
                style={{ color: S.muted }} className="text-xs hover:text-yellow-500 transition">Copy</button>
            </div>
          )}
        </div>

        {/* LEADERBOARD TABLE */}
        {selectedGroup && leaderboard.length > 0 && (
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: S.blue, borderBottom: `1px solid ${S.border}` }}>
                  <th style={{ color: S.muted }} className="p-4 text-left text-xs uppercase tracking-wider w-16">#</th>
                  <th style={{ color: S.muted }} className="p-4 text-left text-xs uppercase tracking-wider">Name</th>
                  <th style={{ color: S.muted }} className="p-4 text-center text-xs uppercase tracking-wider">Habits</th>
                  <th style={{ color: S.muted }} className="p-4 text-center text-xs uppercase tracking-wider">Study</th>
                  <th style={{ color: S.muted }} className="p-4 text-center text-xs uppercase tracking-wider">To-Do</th>
                  <th style={{ color: S.gold }} className="p-4 text-center text-xs uppercase tracking-wider">Total</th>
                  {isGroupCreator && <th style={{ color: S.muted }} className="p-4 text-center text-xs uppercase tracking-wider w-20">Action</th>}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((person, index) => {
                  const isCurrentUser = person.user_id === user?.id;
                  const isWinner = currentWinner && currentWinner.user_id === person.user_id;
                  return (
                    <tr key={person.user_id}
                      style={{
                        backgroundColor: isCurrentUser ? '#0D2A4A' : isWinner ? '#1A1400' : 'transparent',
                        borderBottom: `1px solid ${S.border}`
                      }}>
                      <td className="p-4">
                        <span className={index < 3 ? 'text-xl' : 'text-sm'} style={{ color: S.muted }}>
                          {getMedalEmoji(index)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isWinner && <span style={{ color: S.gold }}>👑</span>}
                          <div>
                            <div style={{ color: S.text }} className="font-semibold text-sm">
                              {person.full_name}
                              {isCurrentUser && <span style={{ color: S.blueLight }} className="ml-2 text-xs">(You)</span>}
                              {isWinner && <span style={{ color: S.gold }} className="ml-2 text-xs font-bold">KING</span>}
                            </div>
                            <div style={{ color: S.muted }} className="text-xs">{person.role_title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div style={{ color: S.blueLight }} className="text-base font-bold">{person.habit_points}</div>
                        <div style={{ color: S.muted }} className="text-xs">pts</div>
                      </td>
                      <td className="p-4 text-center">
                        <div style={{ color: '#6A9FBF' }} className="text-base font-bold">{person.study_hours}</div>
                        <div style={{ color: S.muted }} className="text-xs">hrs</div>
                      </td>
                      <td className="p-4 text-center">
                        <div style={{ color: '#6DBF8A' }} className="text-base font-bold">{person.todo_productivity}%</div>
                        {person.todo_bonus > 0 && <div style={{ color: S.muted }} className="text-xs">+{person.todo_bonus} pts</div>}
                      </td>
                      <td className="p-4 text-center">
                        <div style={{ color: S.gold }} className="text-xl font-black">{person.total_points}</div>
                        {person.streak_bonus > 0 && <div style={{ color: S.muted }} className="text-xs">+{person.streak_bonus} streak</div>}
                      </td>
                      {isGroupCreator && (
                        <td className="p-4 text-center">
                          {!isCurrentUser ? (
                            <button onClick={() => removeMember(person.user_id, person.full_name)}
                              style={{ color: '#E07070' }} className="text-xs hover:opacity-80 transition">Remove</button>
                          ) : <span style={{ color: S.border }}>—</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* EMPTY STATES */}
        {selectedGroup && leaderboard.length === 0 && (
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-2xl p-12 text-center">
            <p style={{ color: S.muted }} className="text-sm">No data yet. Start tracking habits to appear on the leaderboard.</p>
          </div>
        )}

        {!selectedGroup && groups.length === 0 && (
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-2xl p-12 text-center">
            <p style={{ color: S.text }} className="text-xl font-bold mb-2">No Groups Yet</p>
            <p style={{ color: S.muted }} className="text-sm mb-6">Create a group to start competing with your team.</p>
            <button onClick={() => setShowCreateGroup(true)} style={{ backgroundColor: S.gold, color: S.bg }} className="px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition">
              + Create Your First Group
            </button>
          </div>
        )}

        {/* HOW POINTS WORK */}
        <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="mt-6 rounded-xl p-4">
          <p style={{ color: S.muted }} className="text-xs uppercase tracking-widest mb-3">How Points Work</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs" style={{ color: S.muted }}>
            <span>· Habits: Team (2pts) + Personal (1pt)</span>
            <span>· Study: 1hr = 1pt, 30min = 0.5pt</span>
            <span>· To-Do: % completed</span>
            <span>· 7-day streak: +2pts</span>
            <span>· 14-day streak: +5pts</span>
            <span>· 21-day streak: +10pts</span>
            <span>· 30-day streak: +20pts</span>
            <span>· All 5 goals: +15pts</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Leaderboard;