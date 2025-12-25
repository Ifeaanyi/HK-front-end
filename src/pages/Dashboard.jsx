import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://habit-king-production.up.railway.app/api/v1';

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [streak, setStreak] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [testMode, setTestMode] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchHabits();
    fetchStreak();
  }, [selectedDate]);

  const getToken = () => localStorage.getItem('token');

  const fetchHabits = async () => {
    try {
      const response = await axios.get(`${API_URL}/habits`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const habitsData = response.data.habits;
      
      const habitsWithLogs = await Promise.all(
        habitsData.map(async (habit) => {
          const logsResponse = await axios.get(`${API_URL}/habits/${habit.id}/logs`, {
            headers: { Authorization: `Bearer ${getToken()}` }
          });
          return { ...habit, logs: logsResponse.data.logs };
        })
      );
      
      setHabits(habitsWithLogs);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchStreak = async () => {
    try {
      const response = await axios.get(`${API_URL}/streaks`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setStreak(response.data);
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  };

  const toggleHabit = async (habitId, currentStatus) => {
    try {
      await axios.post(
        `${API_URL}/habits/log`,
        {
          habit_id: habitId,
          log_date: selectedDate,
          completed: !currentStatus,
          hours: 0
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchHabits();
      fetchStreak();
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const getHabitStatus = (habit) => {
    const log = habit.logs?.find(l => l.log_date === selectedDate);
    return log?.completed || false;
  };

  const changeDate = (days) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const teamHabits = habits.filter(h => h.category === 'Team');
  const personalHabits = habits.filter(h => h.category === 'Personal');
  const teamCompleted = teamHabits.filter(h => getHabitStatus(h)).length;
  const personalCompleted = personalHabits.filter(h => getHabitStatus(h)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Habit King 👑</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/leaderboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-yellow-400 rounded-lg hover:bg-yellow-500"
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={() => navigate('/todos')}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
              >
                📋 To-Do
              </button>
              <button
                onClick={() => navigate('/friends')}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600"
              >
                👥 Friends
              </button>
              <span className="text-gray-700">{user?.full_name || 'Test User'}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-3xl font-bold">Welcome back, {user?.full_name || 'Test User'}! 👋</h2>
          <p className="text-blue-100 mt-1">{user?.role_title || 'Tester'} • {user?.timezone || 'Africa/Lagos'}</p>
          {testMode && (
            <p className="text-yellow-300 mt-2">🔧 Test Mode Active - Logs save to database!</p>
          )}
        </div>
      </div>

      {/* Streak Display */}
      {streak && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="flex items-center justify-center space-x-4">
              <div>
                <p className="text-4xl font-bold text-orange-500">🔥 {streak.current_streak}</p>
                <p className="text-gray-600 text-sm mt-1">DAY STREAK</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Best: {streak.longest_streak} days • This Month: {streak.month_completed_days}/{streak.month_total_days}
            </p>
          </div>
        </div>
      )}

      {/* Today's Progress */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">TODAY'S PROGRESS</h3>
            <p className="text-sm text-gray-500">Locks at 11:59 PM</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Team Habits */}
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h4 className="text-gray-700 font-medium mb-2">Team Habits</h4>
              <p className="text-4xl font-bold text-gray-900">
                {teamCompleted}<span className="text-gray-400">/{teamHabits.length}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {teamCompleted === teamHabits.length && teamHabits.length > 0 ? '✓ Complete' : 'Pending'}
              </p>
            </div>

            {/* Personal Habits */}
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⭐</span>
              </div>
              <h4 className="text-gray-700 font-medium mb-2">Personal</h4>
              <p className="text-4xl font-bold text-gray-900">
                {personalCompleted}<span className="text-gray-400">/{personalHabits.length}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {personalCompleted === personalHabits.length && personalHabits.length > 0 ? '✓ Complete' : 'Pending'}
              </p>
            </div>

            {/* To-Do */}
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h4 className="text-gray-700 font-medium mb-2">To-Do</h4>
              <p className="text-4xl font-bold text-gray-900">
                0<span className="text-gray-400">/0</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">Pending</p>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => changeDate(-1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Previous
          </button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          
          <button
            onClick={() => changeDate(1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Next →
          </button>
        </div>

        {/* Habit Calendar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">December 2025</h3>
          
          <div className="mb-6 flex gap-4">
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              + Personal Habit (0/10)
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              + Study Skill (0/5)
            </button>
          </div>

          {/* Calendar Header */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">Habit</th>
                  {Array.from({ length: 31 }, (_, i) => (
                    <th key={i} className="text-center py-2 px-1 text-sm font-medium text-gray-600">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Team Habits Section */}
                <tr className="bg-purple-600 text-white">
                  <td colSpan="32" className="py-3 px-4 text-center font-bold">
                    👑 TEAM HABITS
                    <p className="text-sm font-normal">Everyone must complete • Fixed points</p>
                  </td>
                </tr>
                {teamHabits.map((habit) => (
                  <tr key={habit.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">{habit.name}</td>
                    {Array.from({ length: 31 }, (_, i) => {
                      const date = `2025-12-${String(i + 1).padStart(2, '0')}`;
                      const log = habit.logs?.find(l => l.log_date === date);
                      const isToday = date === selectedDate;
                      return (
                        <td key={i} className={`text-center py-2 px-1 ${isToday ? 'bg-blue-50' : ''}`}>
                          <button
                            onClick={() => toggleHabit(habit.id, log?.completed)}
                            className={`w-6 h-6 rounded ${
                              log?.completed ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          >
                            {log?.completed && '✓'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Personal Habits Section */}
                <tr className="bg-yellow-400 text-gray-900">
                  <td colSpan="32" className="py-3 px-4 text-center font-bold">
                    ⭐ PERSONAL HABITS
                    <p className="text-sm font-normal">Optional • Earn extra points</p>
                  </td>
                </tr>
                {personalHabits.map((habit) => (
                  <tr key={habit.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">{habit.name}</td>
                    {Array.from({ length: 31 }, (_, i) => {
                      const date = `2025-12-${String(i + 1).padStart(2, '0')}`;
                      const log = habit.logs?.find(l => l.log_date === date);
                      const isToday = date === selectedDate;
                      return (
                        <td key={i} className={`text-center py-2 px-1 ${isToday ? 'bg-blue-50' : ''}`}>
                          <button
                            onClick={() => toggleHabit(habit.id, log?.completed)}
                            className={`w-6 h-6 rounded ${
                              log?.completed ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          >
                            {log?.completed && '✓'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}