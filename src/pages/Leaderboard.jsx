import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function Leaderboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchLeaderboard(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      const userGroups = response.data.groups || [];
      setGroups(userGroups);
      
      if (userGroups.length > 0) {
        setSelectedGroup(userGroups[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/leaderboard`);
      setLeaderboard(response.data.leaderboard || []);
      setCurrentWinner(response.data.current_winner || null);
      console.log('Leaderboard data:', response.data.leaderboard);
      console.log('Current winner:', response.data.current_winner);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/groups', { name: newGroupName });
      setNewGroupName('');
      setShowCreateGroup(false);
      fetchGroups();
      alert(`Group created! Invite code: ${response.data.invite_code}`);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group');
    }
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/groups/join?invite_code=${inviteCode}`);
      setInviteCode('');
      setShowJoinGroup(false);
      fetchGroups();
      alert('Successfully joined group!');
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('Failed to join group: ' + (error.response?.data?.detail || 'Invalid code'));
    }
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Habit King 👑</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                ← Dashboard
              </button>
              <button
                onClick={() => navigate('/todos')}
                className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-pink-700 transition font-semibold text-sm"
              >
                📋 To-Do
              </button>
              <span className="text-sm text-gray-600">{user?.full_name}</span>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Hall of Fame Button */}
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 text-white mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h2 className="text-4xl font-bold mb-2">🏆 {currentMonth} LEADERBOARD</h2>
              {selectedGroup && (
                <p className="text-yellow-100 text-lg">{selectedGroup.name} • {leaderboard.length} Participants</p>
              )}
            </div>
            {selectedGroup && (
              <button
                onClick={() => navigate(`/hall-of-fame/${selectedGroup.id}`)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 flex items-center gap-2 border-2 border-white/30"
              >
                <span className="text-xl">🏆</span>
                Hall of Fame
              </button>
            )}
          </div>
        </div>

        {/* Current Winner Banner */}
        {currentWinner && (
          <div className="bg-gradient-to-r from-yellow-100 via-yellow-50 to-orange-100 border-2 border-yellow-400 rounded-2xl p-4 mb-6 shadow-md">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">👑</span>
              <div className="text-center">
                <div className="text-sm font-semibold text-yellow-700">CURRENT HABIT KING</div>
                <div className="text-xl font-black text-gray-800">{currentWinner.full_name}</div>
                <div className="text-xs text-gray-600">
                  {currentWinner.total_points} points • {currentWinner.win_path === 'primary' ? 'Primary Path' : 'Bonus Path'}
                </div>
              </div>
              <span className="text-3xl">👑</span>
            </div>
          </div>
        )}

        {/* Group Selection & Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Group</label>
              {groups.length > 0 ? (
                <select
                  value={selectedGroup?.id || ''}
                  onChange={(e) => {
                    const group = groups.find(g => g.id === e.target.value);
                    setSelectedGroup(group);
                  }}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-500 text-sm">No groups yet. Create or join one!</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateGroup(!showCreateGroup)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
              >
                + Create Group
              </button>
              <button
                onClick={() => setShowJoinGroup(!showJoinGroup)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold text-sm"
              >
                Join Group
              </button>
            </div>
          </div>

          {/* Create Group Form */}
          {showCreateGroup && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-3">Create New Group</h3>
              <form onSubmit={createGroup} className="flex gap-3">
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm"
                  placeholder="e.g., My Team, Study Group, Work Squad"
                  maxLength={50}
                />
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold">
                  Create
                </button>
              </form>
            </div>
          )}

          {/* Join Group Form */}
          {showJoinGroup && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-3">Join Existing Group</h3>
              <form onSubmit={joinGroup} className="flex gap-3">
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm uppercase"
                  placeholder="Enter invite code"
                  maxLength={8}
                />
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold">
                  Join
                </button>
              </form>
            </div>
          )}

          {/* Show Invite Code */}
          {selectedGroup && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Share this code with others to invite them:</p>
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-1 rounded border font-mono text-sm font-bold">{selectedGroup.invite_code}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedGroup.invite_code);
                    alert('Invite code copied!');
                  }}
                  className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        {selectedGroup && leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="p-4 text-left font-bold text-gray-700 w-16">#</th>
                  <th className="p-4 text-left font-bold text-gray-700">Name</th>
                  <th className="p-4 text-center font-bold text-gray-700">Habits</th>
                  <th className="p-4 text-center font-bold text-gray-700">Study</th>
                  <th className="p-4 text-center font-bold text-gray-700">To-Do</th>
                  <th className="p-4 text-center font-bold text-gray-700 bg-yellow-50">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((person, index) => {
                  const isCurrentUser = person.user_id === user?.id;
                  const isCurrentMonthWinner = currentWinner && currentWinner.user_id === person.user_id;
                  
                  return (
                    <tr
                      key={person.user_id}
                      className={`border-b transition-all ${
                        isCurrentUser ? 'bg-blue-50 border-blue-200' : 
                        isCurrentMonthWinner ? 'bg-yellow-50 border-yellow-200' : 
                        'hover:bg-gray-50'
                      } ${index < 3 ? 'font-semibold' : ''}`}
                    >
                      {/* Rank */}
                      <td className="p-4">
                        <div className={`text-2xl ${index < 3 ? '' : 'text-gray-600 text-lg'}`}>
                          {getMedalEmoji(index)}
                        </div>
                      </td>
                      {/* Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isCurrentMonthWinner && <span className="text-2xl">👑</span>}
                          <div>
                            <div className="font-semibold text-gray-900">
                              {person.full_name}
                              {isCurrentUser && <span className="ml-2 text-blue-600 text-xs">(You)</span>}
                              {isCurrentMonthWinner && <span className="ml-2 text-yellow-600 text-xs font-bold">KING</span>}
                            </div>
                            <div className="text-xs text-gray-500">{person.role_title}</div>
                          </div>
                        </div>
                      </td>
                      {/* Habits */}
                      <td className="p-4 text-center">
                        <div className="text-lg font-bold text-purple-600">{person.habit_points}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </td>
                      {/* Study */}
                      <td className="p-4 text-center">
                        <div className="text-lg font-bold text-blue-600">{person.study_hours}</div>
                        <div className="text-xs text-gray-500">hours</div>
                      </td>
                      {/* To-Do */}
                      <td className="p-4 text-center">
                        <div className="text-lg font-bold text-green-600">{person.todo_productivity}%</div>
                        <div className="text-xs text-gray-500">productivity</div>
                      </td>
                      {/* Total */}
                      <td className="p-4 text-center bg-yellow-50">
                        <div className="text-2xl font-bold text-gray-900">{person.total_points}</div>
                        <div className="text-xs text-gray-500">
                          {person.streak_bonus > 0 && `+${person.streak_bonus} streak`}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {selectedGroup && leaderboard.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-lg">No data yet. Start tracking habits to appear on the leaderboard!</p>
          </div>
        )}

        {/* No Groups State */}
        {!selectedGroup && groups.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Groups Yet</h3>
            <p className="text-gray-500 mb-6">Create a group to start competing with your team!</p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              + Create Your First Group
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-xl">💡</span>
            <div>
              <p className="font-semibold mb-1">How Points Work:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Habits:</strong> Team (2pts) + Personal (1pt each)</li>
                <li>• <strong>Study:</strong> Displayed as hours (not counted in total)</li>
                <li>• <strong>To-Do:</strong> Productivity % (completed ÷ total × 100)</li>
                <li>• <strong>Streaks:</strong> 7 days (+2pts) • 14 days (+5pts) • 21 days (+10pts) • 30 days (+20pts)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;