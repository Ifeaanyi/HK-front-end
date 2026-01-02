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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Friends 👥</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900 pb-2">Habits</button>
            <button onClick={() => navigate('/todos')} className="text-gray-600 hover:text-gray-900 pb-2">To-Do List</button>
            <button onClick={() => navigate('/leaderboard')} className="text-gray-600 hover:text-gray-900 pb-2">Leaderboard</button>
            <button className="text-purple-600 font-semibold border-b-2 border-purple-600 pb-2">Friends</button>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Friend</h2>
              <form onSubmit={sendFriendRequest}>
                <input
                  type="email"
                  placeholder="Friend's email"
                  value={addFriendEmail}
                  onChange={(e) => setAddFriendEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-3"
                  required
                />
                <button type="submit" className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
                  Send Request
                </button>
              </form>
            </div>

            {requests.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Friend Requests ({requests.length})</h2>
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{request.requester.full_name}</p>
                      <p className="text-sm text-gray-500">{request.requester.email}</p>
                      <p className="text-xs text-gray-400 mb-2">{request.requester.role_title}</p>
                      <div className="flex gap-2">
                        <button onClick={() => acceptRequest(request.id)} className="flex-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-semibold">Accept</button>
                        <button onClick={() => rejectRequest(request.id)} className="flex-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Friends ({friends.length})</h2>
            {friends.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No friends yet. Add friends to see their progress!</p>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => navigate(`/friends/${friend.id}/dashboard`)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer transition-all hover:border-purple-500 hover:bg-purple-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{friend.full_name}</p>
                        <p className="text-sm text-gray-500">{friend.role_title}</p>
                      </div>
                      <span className="text-sm font-semibold text-purple-600">🔥 {friend.current_streak}d</span>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      <span>📝 {friend.total_habits} habits</span>
                      <span>✅ {friend.total_todos} todos</span>
                    </div>
                    <p className="mt-2 text-xs text-purple-600">Click to view dashboard →</p>
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