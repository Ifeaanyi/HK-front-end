import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Rules() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Habit King 👑</h1>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700">← Dashboard</button>
              <span className="text-gray-700">{user?.full_name || 'User'}</span>
              <button onClick={logout} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">Logout</button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">How Habit King Works</h2>
          <p className="text-gray-600 mt-2">Master your habits, compete with friends, become the King</p>
        </div>

        {/* Streaks Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Daily Streaks</h3>
          </div>
          <p className="text-gray-700 mb-4">Build consistency by completing all daily requirements. Your streak grows each day you complete everything.</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-semibold text-gray-800 mb-3">To complete a day, you must:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</span>
                <span className="text-gray-700">Complete <strong>all Team habits</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</span>
                <span className="text-gray-700">Complete <strong>at least 1 Personal habit</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</span>
                <span className="text-gray-700">Complete <strong>at least 1 To-Do item</strong></span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800"><strong>⏰ Important:</strong> Your daily sheet locks at 11:59 PM in your timezone. Make sure your timezone is set correctly in Settings.</p>
          </div>
        </div>

        {/* Points Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Points System</h3>
          </div>
          <p className="text-gray-700 mb-4">Earn points through habits, study hours, and bonuses. Points determine your leaderboard rank.</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Activity</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Team Habit (per completion)</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">1 point</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Personal Habit (per completion)</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">1 point</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Study Skills (per hour logged)</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">1 point</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Monthly Goals (all 5 completed)</td>
                  <td className="py-3 px-4 text-green-600 font-bold">+15 bonus</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* To-Do Bonus Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">To-Do Productivity Bonus</h3>
          </div>
          <p className="text-gray-700 mb-4">Complete your to-dos to earn bonus points based on your completion rate.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-400">50%+</p>
              <p className="text-sm text-gray-600">+5 pts</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-500">65%+</p>
              <p className="text-sm text-gray-600">+10 pts</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">75%+</p>
              <p className="text-sm text-gray-600">+15 pts</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">85%+</p>
              <p className="text-sm text-gray-600">+20 pts</p>
            </div>
          </div>
        </div>

        {/* Streak Bonus Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Streak Bonus Points</h3>
          </div>
          <p className="text-gray-700 mb-4">Maintain long streaks to earn bonus points on the leaderboard.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-400">7+ days</p>
              <p className="text-sm text-gray-600">+2 pts</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">14+ days</p>
              <p className="text-sm text-gray-600">+5 pts</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">21+ days</p>
              <p className="text-sm text-gray-600">+10 pts</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-600">30+ days</p>
              <p className="text-sm text-gray-600">+20 pts</p>
            </div>
          </div>
        </div>

        {/* Monthly Goals Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Monthly Goals</h3>
          </div>
          <p className="text-gray-700 mb-4">Set up to 5 goals each month and track your progress.</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
              <div>
                <p className="font-semibold text-gray-800">Edit Period: 1st - 4th of each month</p>
                <p className="text-sm text-gray-600">Create, edit, or delete your goals during this window</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
              <div>
                <p className="font-semibold text-gray-800">Locked Period: 5th onwards</p>
                <p className="text-sm text-gray-600">Goals are locked - you can only mark them complete or incomplete</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</span>
              <div>
                <p className="font-semibold text-gray-800">Complete all 5 goals = +15 bonus points</p>
                <p className="text-sm text-gray-600">Points are added to your leaderboard total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Winning Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👑</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Becoming the Habit King</h3>
          </div>
          <p className="text-gray-700 mb-4">At the end of each month, a winner is crowned in each group. There are two paths to victory:</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-bold text-purple-800 mb-2">🏆 Primary Path</h4>
              <p className="text-sm text-gray-700 mb-2">Top 3 by points who meet ALL criteria:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• To-Do productivity ≥ 65%</li>
                <li>• Missed days ≤ 3</li>
                <li>• Total activities ≥ 130</li>
              </ul>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2">⭐ Bonus Path</h4>
              <p className="text-sm text-gray-700 mb-2">If no Primary winner, first to meet:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Total points ≥ 260</li>
                <li>• To-Do productivity ≥ 80%</li>
                <li>• Total activities ≥ 130</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Habit Management Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Managing Habits</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-800">Team Habits</p>
              <p className="text-sm text-gray-600">Shared habits for your group. Cannot be deleted by members.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Personal Habits</p>
              <p className="text-sm text-gray-600">Your custom habits. Maximum 10 personal habits.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Study Skills</p>
              <p className="text-sm text-gray-600">Track hours spent learning. Maximum 5 study skills. Points = hours logged.</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-sm text-yellow-800"><strong>🗑️ Delete Window:</strong> Personal and Study habits can be deleted within 24 hours of creation, or during the first 3 days of any month.</p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <button onClick={() => navigate('/dashboard')} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}