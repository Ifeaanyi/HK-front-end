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
      checkForCelebration(response.data);
    } catch (err) {
      console.error('Hall of Fame error:', err);
      setError(err.response?.data?.detail || 'Failed to load Hall of Fame');
      setLoading(false);
    }
  };

  const checkForCelebration = (data) => {
    if (!data.champions || data.champions.length === 0) return;
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const latestChampion = data.champions[0];
    const championMonth = latestChampion.month;
    
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (championMonth === currentMonth || championMonth === lastMonth) {
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
      if (timeLeft <= 0) return clearInterval(interval);
      
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const dismissCelebration = () => setShowCelebration(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 text-sm tracking-wide">LOADING HALL OF FAME...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl border border-red-500/30 p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">ACCESS DENIED</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/leaderboard')}
            className="bg-yellow-500 text-black px-6 py-3 rounded-xl hover:bg-yellow-400 transition-all font-bold"
          >
            RETURN TO LEADERBOARD
          </button>
        </div>
      </div>
    );
  }

  const { champions, records, user_stats } = hallOfFameData;
  const latestChampion = champions.length > 0 ? champions[0] : null;
  const isUserTheWinner = currentUser && latestChampion && latestChampion.user_id === currentUser.id;

  return (
    <div className="min-h-screen bg-black">
      {/* Celebration Banner */}
      {showCelebration && latestChampion && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-black px-12 py-8 rounded-2xl shadow-2xl border-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                {isUserTheWinner ? (
                  <>
                    <div className="text-6xl mb-2">👑</div>
                    <div className="text-3xl font-black mb-2">YOU ARE THE HABIT KING</div>
                    <div className="text-xl font-bold">{formatMonth(latestChampion.month)}</div>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-2">👑</div>
                    <div className="text-3xl font-black mb-2">{latestChampion.full_name}</div>
                    <div className="text-xl font-bold">HABIT KING • {formatMonth(latestChampion.month)}</div>
                  </>
                )}
              </div>
              <button onClick={dismissCelebration} className="ml-4 text-black/60 hover:text-black text-4xl font-bold">×</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-yellow-500/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate('/leaderboard')}
            className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors group"
          >
            <span className="text-2xl mr-2 group-hover:-translate-x-1 transition-transform">←</span>
            <span className="font-medium tracking-wide">RETURN TO LEADERBOARD</span>
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
              <span className="text-4xl">🏆</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight">HALL OF FAME</h1>
          </div>
          <p className="text-gray-400 text-sm tracking-wide ml-20">WHERE LEGENDS ARE IMMORTALIZED</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        
        {/* YOUR LEGACY */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-2xl">👑</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">YOUR LEGACY</h2>
          </div>
          
          {user_stats.total_championships > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/30">
                <div className="text-yellow-400 text-xs font-bold mb-2 tracking-wide">CHAMPIONSHIPS</div>
                <div className="text-6xl font-black text-yellow-500">{user_stats.total_championships}</div>
                <div className="text-yellow-400/60 text-xs mt-2 tracking-wide">TIMES CROWNED</div>
              </div>
              
              <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30">
                <div className="text-blue-400 text-xs font-bold mb-2 tracking-wide">BEST MONTH</div>
                <div className="text-xl font-bold text-blue-400">
                  {user_stats.best_month ? formatMonth(user_stats.best_month.month).toUpperCase() : 'N/A'}
                </div>
                <div className="text-3xl font-black text-blue-500 mt-1">
                  {user_stats.best_month ? `${user_stats.best_month.points}` : ''}
                </div>
                <div className="text-blue-400/60 text-xs mt-1">POINTS</div>
              </div>
              
              <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/30">
                <div className="text-purple-400 text-xs font-bold mb-2 tracking-wide">ALL-TIME RANK</div>
                <div className="text-6xl font-black text-purple-500">#{user_stats.all_time_rank}</div>
                <div className="text-purple-400/60 text-xs mt-2 tracking-wide">OF {champions.length}</div>
              </div>
            </div>
          ) : (
            <div>
              {user_stats.best_month ? (
                <div>
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">📈</div>
                    <h3 className="text-2xl font-black text-white mb-2">YOUR BEST PERFORMANCE</h3>
                    <p className="text-gray-500 text-sm tracking-wide">THE CROWN AWAITS</p>
                  </div>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-yellow-500/10 rounded-xl p-5 border border-yellow-500/30">
                      <div className="text-yellow-400 text-xs font-bold mb-2">MONTH</div>
                      <div className="text-lg font-bold text-yellow-500">{formatMonth(user_stats.best_month.month).toUpperCase()}</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/30">
                      <div className="text-blue-400 text-xs font-bold mb-2">POINTS</div>
                      <div className="text-4xl font-black text-blue-500">{user_stats.best_month.points}</div>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/30">
                      <div className="text-green-400 text-xs font-bold mb-2">PRODUCTIVITY</div>
                      <div className="text-4xl font-black text-green-500">{user_stats.best_month.productivity}%</div>
                    </div>
                    <div className="bg-purple-500/10 rounded-xl p-5 border border-purple-500/30">
                      <div className="text-purple-400 text-xs font-bold mb-2">ACTIVITIES</div>
                      <div className="text-4xl font-black text-purple-500">{user_stats.best_month.total_activities}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">🌟</div>
                  <h3 className="text-3xl font-black text-white mb-4">YOUR JOURNEY BEGINS</h3>
                  <p className="text-gray-500 text-lg max-w-md mx-auto tracking-wide">
                    "EVERY CHAMPION WAS ONCE A CONTENDER WHO REFUSED TO GIVE UP"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ALL-TIME RECORDS */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">ALL-TIME RECORDS</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/30 hover:border-yellow-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">👑</span>
                <span className="text-xs font-bold text-yellow-400 bg-yellow-500/20 px-3 py-1 rounded-full">DYNASTY</span>
              </div>
              <div className="text-2xl font-black text-white mb-2">{records.most_championships.name || 'AWAITING CHAMPION'}</div>
              <div className="text-yellow-500 text-xl font-bold">
                {records.most_championships.count > 0 ? `${records.most_championships.count}x CHAMPION` : 'NO RECORD YET'}
              </div>
            </div>

            <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30 hover:border-red-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">⚡</span>
                <span className="text-xs font-bold text-red-400 bg-red-500/20 px-3 py-1 rounded-full">PEAK</span>
              </div>
              <div className="text-2xl font-black text-white mb-2">{records.highest_points.name || 'AWAITING CHAMPION'}</div>
              <div className="text-red-500 text-xl font-bold">
                {records.highest_points.points > 0 ? `${records.highest_points.points} POINTS` : 'NO RECORD YET'}
              </div>
              {records.highest_points.month && (
                <div className="text-red-400/60 text-xs mt-2">{formatMonth(records.highest_points.month).toUpperCase()}</div>
              )}
            </div>

            <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">💯</span>
                <span className="text-xs font-bold text-green-400 bg-green-500/20 px-3 py-1 rounded-full">PERFECTION</span>
              </div>
              <div className="text-2xl font-black text-white mb-2">{records.perfect_productivity.name || 'AWAITING CHAMPION'}</div>
              <div className="text-green-500 text-xl font-bold">
                {records.perfect_productivity.productivity > 0 ? `${records.perfect_productivity.productivity}% PRODUCTIVITY` : 'NO RECORD YET'}
              </div>
              {records.perfect_productivity.month && (
                <div className="text-green-400/60 text-xs mt-2">{formatMonth(records.perfect_productivity.month).toUpperCase()}</div>
              )}
            </div>

            <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">🎯</span>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">GRIND</span>
              </div>
              <div className="text-2xl font-black text-white mb-2">{records.most_activities.name || 'AWAITING CHAMPION'}</div>
              <div className="text-blue-500 text-xl font-bold">
                {records.most_activities.activities > 0 ? `${records.most_activities.activities} ACTIVITIES` : 'NO RECORD YET'}
              </div>
              {records.most_activities.month && (
                <div className="text-blue-400/60 text-xs mt-2">{formatMonth(records.most_activities.month).toUpperCase()}</div>
              )}
            </div>
          </div>
        </div>

        {/* CHAMPIONS CHRONICLE */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">📜</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">CHAMPIONS CHRONICLE</h2>
          </div>
          
          {champions.length > 0 ? (
            <div className="space-y-4">
              {champions.map((champion, index) => (
                <div
                  key={index}
                  className="bg-black/50 rounded-xl p-6 border border-gray-800 hover:border-yellow-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                        <span className="text-2xl">👑</span>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-white group-hover:text-yellow-500 transition-colors">{champion.full_name.toUpperCase()}</div>
                        <div className="text-gray-500 text-xs tracking-wide">{champion.role_title.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-500">{formatMonth(champion.month).toUpperCase()}</div>
                      <div className="text-xs text-gray-500">{champion.total_championships}x CHAMPION</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-800">
                    <div className="text-center">
                      <div className="text-3xl font-black text-yellow-500">{champion.total_points}</div>
                      <div className="text-xs text-gray-600 tracking-wide">POINTS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-green-500">{champion.todo_productivity}%</div>
                      <div className="text-xs text-gray-600 tracking-wide">PRODUCTIVITY</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-red-500">{champion.missed_days}</div>
                      <div className="text-xs text-gray-600 tracking-wide">MISSED</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-blue-500">{champion.total_activities}</div>
                      <div className="text-xs text-gray-600 tracking-wide">ACTIVITIES</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      champion.win_path === 'primary' 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                      {champion.win_path === 'primary' ? '🎯 PRIMARY PATH' : '⚡ BONUS PATH'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(champion.crowned_at).toLocaleDateString().toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📜</div>
              <p className="text-gray-500 text-lg tracking-wide">NO CHAMPIONS YET • BE THE FIRST TO MAKE HISTORY</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HallOfFame;