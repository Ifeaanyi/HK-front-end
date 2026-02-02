import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://habit-king-production.up.railway.app/api/v1';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [addFriendEmail, setAddFriendEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends/requests`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/friends/request`,
        { friend_email: addFriendEmail },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setMessage(`✅ ${response.data.message}`);
      setAddFriendEmail('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.detail || 'Failed to send request'}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      await axios.post(
        `${API_URL}/friends/accept/${friendshipId}`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchFriends();
      fetchRequests();
      setMessage('✅ Friend request accepted!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const rejectRequest = async (friendshipId) => {
    try {
      await axios.post(
        `${API_URL}/friends/reject/${friendshipId}`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchRequests();
      setMessage('✅ Friend request rejected');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const unfriendUser = async (friendId, friendName) => {
    if (!confirm(`Remove ${friendName} from your friends?`)) return;

    try {
      const response = await axios.delete(
        `${API_URL}/friends/unfriend/${friendId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setMessage(`✅ ${response.data.message}`);
      fetchFriends();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.detail || 'Failed to unfriend'}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Futuristic Header */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white text-xl">👥</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">CONNECTIONS</h1>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-all border border-gray-700"
            >
              ← RETURN
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white pb-2 text-sm font-medium transition-colors">HABITS</button>
            <button onClick={() => navigate('/todos')} className="text-gray-400 hover:text-white pb-2 text-sm font-medium transition-colors">TO-DO</button>
            <button onClick={() => navigate('/leaderboard')} className="text-gray-400 hover:text-white pb-2 text-sm font-medium transition-colors">LEADERBOARD</button>
            <button className="text-white font-semibold border-b-2 border-purple-500 pb-2 text-sm">FRIENDS</button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm border ${message.includes('✅') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'} animate-pulse`}>
            <p className="text-center font-semibold">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Add Friend Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 text-lg">+</span>
                </div>
                <h2 className="text-xl font-bold text-white">ADD CONNECTION</h2>
              </div>
              <form onSubmit={sendFriendRequest} className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={addFriendEmail}
                  onChange={(e) => setAddFriendEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
                <button 
                  type="submit" 
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-500 hover:to-blue-500 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  SEND REQUEST
                </button>
              </form>
            </div>

            {/* Friend Requests */}
            {requests.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 text-lg">{requests.length}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">PENDING REQUESTS</h2>
                </div>
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="bg-black/50 border border-gray-800 rounded-xl p-4 hover:border-purple-500/50 transition-all">
                      <p className="font-bold text-white text-lg">{request.requester.full_name}</p>
                      <p className="text-sm text-gray-400">{request.requester.email}</p>
                      <p className="text-xs text-gray-500 mb-4">{request.requester.role_title}</p>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => acceptRequest(request.id)} 
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm font-bold transition-all transform hover:scale-[1.02]"
                        >
                          ACCEPT
                        </button>
                        <button 
                          onClick={() => rejectRequest(request.id)} 
                          className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm font-bold transition-all transform hover:scale-[1.02]"
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Friends List */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-lg">{friends.length}</span>
              </div>
              <h2 className="text-xl font-bold text-white">MY NETWORK</h2>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-4xl">👥</span>
                </div>
                <p className="text-gray-500 text-lg">No connections yet</p>
                <p className="text-gray-600 text-sm mt-2">Add friends to track progress together</p>
              </div>
            ) : (
              <div className="space-y-4">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-black/50 border border-gray-800 rounded-xl p-5 hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">{friend.full_name}</p>
                        <p className="text-sm text-gray-400">{friend.role_title}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-orange-500/20 rounded-lg border border-orange-500/30">
                          <span className="text-sm font-bold text-orange-400">🔥 {friend.current_streak}d</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            unfriendUser(friend.id, friend.full_name);
                          }}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-xs font-bold transition-all border border-red-500/30"
                          title="Unfriend"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-6 text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <span className="text-purple-400">📝</span> {friend.total_habits} habits
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-blue-400">✅</span> {friend.total_todos} todos
                      </span>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/friends/${friend.id}/dashboard`)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-400 rounded-lg hover:from-purple-600/30 hover:to-blue-600/30 text-sm font-bold transition-all border border-purple-500/30"
                    >
                      VIEW DASHBOARD →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}