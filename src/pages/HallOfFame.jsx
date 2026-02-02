import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';

const API_URL = import.meta.env.VITE_API_URL || 'https://habit-king-production.up.railway.app';

function HallOfFame() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hallOfFameData, setHallOfFameData] = useState(null);
  const [error, setError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchHallOfFame();
  }, [groupId]);

  const fetchHallOfFame = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/groups/${groupId}/hall-of-fame`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHallOfFameData(response.data);
      setLoading(false);
      
      // Check if there's a current month winner
      checkForCelebration(response.data);
    } catch (err) {
      console.error('Hall of Fame error:', err);
      setError(err.response?.data?.detail || 'Failed to load Hall of Fame');
      setLoading(false);
    }
  };

  const checkForCelebration = (data) => {
    if (!data.champions || data.champions.length === 0) return;
    
    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Check if latest champion is from current month or last month
    const latestChampion = data.champions[0]; // Already sorted newest first
    const championMonth = latestChampion.month;
    
    // Get last month
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Show celebration if winner is from current month or last month
    if (championMonth === currentMonth || championMonth === lastMonth) {
      // Check if we've shown celebration this session
      const celebrationKey = `celebration_shown_${groupId}_${championMonth}`;
      const hasShown = sessionStorage.getItem(celebrationKey);
      
      if (!hasShown) {
        setShowCelebration(true);
        sessionStorage.setItem(celebrationKey, 'true');
        triggerConfetti();
      }
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const dismissCelebration = () => {
    setShowCelebration(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Hall of Fame...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/leaderboard')}
            className="bg-yellow-500 text-white px-6 py-3 rounded-xl hover:bg-yellow-600 transition-colors"
          >
            Back to Leaderboard
          </button>
        </div>
      </div>
    );
  }

  const { champions, records, user_stats } = hallOfFameData;
  const latestChampion = champions.length > 0 ? champions[0] : null;
  const isUserTheWinner = currentUser && latestChampion && latestChampion.user_id === currentUser.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Celebration Banner */}
      {showCelebration && latestChampion && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-8 py-6 rounded-2xl shadow-2xl max-w-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                {isUserTheWinner ? (
                  <>
                    <div className="text-5xl mb-2">🎊 CONGRATULATIONS! 🎊</div>
                    <div className="text-2xl font-black mb-1">YOU ARE THE HABIT KING!</div>
                    <div className="text-lg">{formatMonth(latestChampion.month)}</div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-2">👑 ALL HAIL THE NEW CHAMPION! 👑</div>
                    <div className="text-2xl font-black mb-1">{latestChampion.full_name}</div>
                    <div className="text-lg">Habit King for {formatMonth(latestChampion.month)}</div>
                  </>
                )}
              </div>
              <button
                onClick={dismissCelebration}
                className="ml-4 text-white/80 hover:text-white text-3xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white py-12 px-4 shadow-2xl">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/leaderboard')}
            className="mb-6 flex items-center text-white/90 hover:text-white transition-colors"
          >
            <span className="text-2xl mr-2">←</span>
            <span className="font-medium">Back to Leaderboard</span>
          </button>
          <h1 className="text-5xl font-black mb-2 flex items-center">
            <span className="text-6xl mr-4">🏆</span>
            HALL OF FAME
          </h1>
          <p className="text-yellow-100 text-lg">Legends are made here • v1.0.0</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        
        {/* YOUR LEGACY */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-8 border border-gray-200">
          <h2 className="text-3xl font-bold mb-6 flex items-center text-gray-800">
            <span className="text-4xl mr-3">👑</span>
            YOUR LEGACY
          </h2>
          
          {user_stats.total_championships > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border-2 border-yellow-300">
                <div className="text-yellow-600 text-sm font-semibold mb-2">Championships</div>
                <div className="text-5xl font-black text-yellow-700">{user_stats.total_championships}</div>
                <div className="text-yellow-600 text-xs mt-2">Times Crowned</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300">
                <div className="text-blue-600 text-sm font-semibold mb-2">Best Month</div>
                <div className="text-2xl font-bold text-blue-700">
                  {user_stats.best_month ? formatMonth(user_stats.best_month.month) : 'N/A'}
                </div>
                <div className="text-blue-600 text-lg font-semibold mt-1">
                  {user_stats.best_month ? `${user_stats.best_month.points} pts` : ''}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300">
                <div className="text-purple-600 text-sm font-semibold mb-2">All-Time Rank</div>
                <div className="text-5xl font-black text-purple-700">#{user_stats.all_time_rank}</div>
                <div className="text-purple-600 text-xs mt-2">of {champions.length} competitors</div>
              </div>
            </div>
          ) : (
            <div>
              {user_stats.best_month ? (
                <div>
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-2">📈</div>
                    <h3 className="text-2xl font-bold text-gray-700">Your Best Performance</h3>
                    <p className="text-gray-500">Keep pushing - your crown awaits!</p>
                  </div>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-5 border-2 border-yellow-300">
                      <div className="text-yellow-600 text-xs font-semibold mb-2">Best Month</div>
                      <div className="text-2xl font-bold text-yellow-700">
                        {formatMonth(user_stats.best_month.month)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border-2 border-blue-300">
                      <div className="text-blue-600 text-xs font-semibold mb-2">Total Points</div>
                      <div className="text-4xl font-black text-blue-700">{user_stats.best_month.points}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border-2 border-green-300">
                      <div className="text-green-600 text-xs font-semibold mb-2">Productivity</div>
                      <div className="text-4xl font-black text-green-700">{user_stats.best_month.productivity}%</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border-2 border-purple-300">
                      <div className="text-purple-600 text-xs font-semibold mb-2">Activities</div>
                      <div className="text-4xl font-black text-purple-700">{user_stats.best_month.total_activities}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-8xl mb-4">🌟</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-3">Your Journey Begins</h3>
                  <p className="text-gray-500 text-lg max-w-md mx-auto">
                    "Every champion was once a contender that refused to give up."
                  </p>
                  <p className="text-yellow-600 font-semibold mt-4">Start your legacy today!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ALL-TIME RECORDS */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
          <h2 className="text-3xl font-bold mb-8 flex items-center text-gray-800">
            <span className="text-4xl mr-3">📊</span>
            ALL-TIME RECORDS
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Most Championships */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">👑</span>
                <span className="text-xs font-bold text-yellow-700 bg-yellow-200 px-3 py-1 rounded-full">DYNASTY</span>
              </div>
              <div className="text-3xl font-black text-gray-800 mb-1">
                {records.most_championships.name || 'No Record'}
              </div>
              <div className="text-yellow-600 text-xl font-bold">
                {records.most_championships.count > 0 ? `${records.most_championships.count}x Champion` : 'Awaiting...'}
              </div>
            </div>

            {/* Highest Points */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">⚡</span>
                <span className="text-xs font-bold text-red-700 bg-red-200 px-3 py-1 rounded-full">PEAK</span>
              </div>
              <div className="text-3xl font-black text-gray-800 mb-1">
                {records.highest_points.name || 'No Record'}
              </div>
              <div className="text-red-600 text-xl font-bold">
                {records.highest_points.points > 0 ? `${records.highest_points.points} points` : 'Awaiting...'}
              </div>
              {records.highest_points.month && (
                <div className="text-red-500 text-sm mt-1">{formatMonth(records.highest_points.month)}</div>
              )}
            </div>

            {/* Perfect Productivity */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">💯</span>
                <span className="text-xs font-bold text-green-700 bg-green-200 px-3 py-1 rounded-full">PERFECTION</span>
              </div>
              <div className="text-3xl font-black text-gray-800 mb-1">
                {records.perfect_productivity.name || 'No Record'}
              </div>
              <div className="text-green-600 text-xl font-bold">
                {records.perfect_productivity.productivity > 0 ? `${records.perfect_productivity.productivity}% productivity` : 'Awaiting...'}
              </div>
              {records.perfect_productivity.month && (
                <div className="text-green-500 text-sm mt-1">{formatMonth(records.perfect_productivity.month)}</div>
              )}
            </div>

            {/* Most Activities */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">🎯</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-200 px-3 py-1 rounded-full">GRIND</span>
              </div>
              <div className="text-3xl font-black text-gray-800 mb-1">
                {records.most_activities.name || 'No Record'}
              </div>
              <div className="text-blue-600 text-xl font-bold">
                {records.most_activities.activities > 0 ? `${records.most_activities.activities} activities` : 'Awaiting...'}
              </div>
              {records.most_activities.month && (
                <div className="text-blue-500 text-sm mt-1">{formatMonth(records.most_activities.month)}</div>
              )}
            </div>
          </div>
        </div>

        {/* CHAMPIONS CHRONICLE */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
          <h2 className="text-3xl font-bold mb-8 flex items-center text-gray-800">
            <span className="text-4xl mr-3">📜</span>
            CHAMPIONS CHRONICLE
          </h2>
          
          {champions.length > 0 ? (
            <div className="space-y-4">
              {champions.map((champion, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 hover:border-yellow-400 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl">🏆</span>
                      <div>
                        <div className="text-2xl font-black text-gray-800">{champion.full_name}</div>
                        <div className="text-gray-500 text-sm">{champion.role_title}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-yellow-600">{formatMonth(champion.month)}</div>
                      <div className="text-xs font-semibold text-gray-500">{champion.total_championships}x Champion</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-black text-yellow-600">{champion.total_points}</div>
                      <div className="text-xs text-gray-500">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-green-600">{champion.todo_productivity}%</div>
                      <div className="text-xs text-gray-500">Productivity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-red-600">{champion.missed_days}</div>
                      <div className="text-xs text-gray-500">Missed Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-blue-600">{champion.total_activities}</div>
                      <div className="text-xs text-gray-500">Activities</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                      champion.win_path === 'primary' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {champion.win_path === 'primary' ? '🎯 Primary Path' : '⚡ Bonus Path'}
                    </span>
                    <span className="text-xs text-gray-400">
                      Crowned {new Date(champion.crowned_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-8xl mb-4">📜</div>
              <p className="text-gray-500 text-lg">No champions yet. Be the first to make history!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default HallOfFame;