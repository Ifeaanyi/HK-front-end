import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://habit-king-production.up.railway.app/api/v1';

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [streak, setStreak] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [testMode, setTestMode] = useState(false);
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [showStudyForm, setShowStudyForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [draggedHabit, setDraggedHabit] = useState(null);
  
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

  const createHabit = async (category) => {
    if (!newHabitName.trim()) {
      alert('Please enter a habit name');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/habits`,
        {
          name: newHabitName,
          category: category,
          point_value: 1
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      setNewHabitName('');
      setShowPersonalForm(false);
      setShowStudyForm(false);
      fetchHabits();
      alert(`${category} habit created successfully!`);
    } catch (error) {
      console.error('Error creating habit:', error);
      alert(error.response?.data?.detail || 'Failed to create habit');
    }
  };

  const deleteHabit = async (habitId, habitCreatedAt) => {
    const createdTime = new Date(habitCreatedAt);
    const now = new Date();
    const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);

    if (hoursSinceCreation > 1) {
      alert('Can only delete habits within 1 hour of creation');
      return;
    }

    if (!confirm('Delete this habit? This cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/habits/${habitId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      fetchHabits();
      alert('Habit deleted successfully');
    } catch (error) {
      console.error('Error deleting habit:', error);
      alert('Failed to delete habit');
    }
  };

  const toggleHabit = async (habitId, date, currentStatus) => {
    try {
      await axios.post(
        `${API_URL}/habits/log`,
        {
          habit_id: habitId,
          log_date: date,
          completed: !currentStatus,
          hours: 0
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchHabits();
      fetchStreak();
    } catch (error) {
      console.error('Error toggling habit:', error);
      alert(error.response?.data?.detail || 'Cannot modify past dates');
    }
  };

  const logStudyHours = async (habitId, date, hours) => {
    try {
      await axios.post(
        `${API_URL}/habits/log`,
        {
          habit_id: habitId,
          log_date: date,
          completed: hours > 0,
          hours: parseFloat(hours) || 0
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchHabits();
    } catch (error) {
      console.error('Error logging study hours:', error);
      alert(error.response?.data?.detail || 'Cannot modify past dates');
    }
  };

  const getHabitStatus = (habit) => {
    const log = habit.logs?.find(l => l.log_date === selectedDate);
    return log?.completed || false;
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getMonthName = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const canDeleteHabit = (createdAt) => {
    if (!createdAt) return false;
    const createdTime = new Date(createdAt);
    const now = new Date();
    const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);
    console.log('Hours since creation:', hoursSinceCreation, 'Created at:', createdAt);
    return hoursSinceCreation <= 1;
  };

  const handleDragStart = (e, habit) => {
    setDraggedHabit(habit);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetHabit) => {
    e.preventDefault();
    
    if (!draggedHabit || draggedHabit.id === targetHabit.id) {
      setDraggedHabit(null);
      return;
    }

    // Only allow reordering within same category
    if (draggedHabit.category !== targetHabit.category) {
      alert('Can only reorder habits within the same section');
      setDraggedHabit(null);
      return;
    }

    const categoryHabits = habits.filter(h => h.category === draggedHabit.category);
    const otherHabits = habits.filter(h => h.category !== draggedHabit.category);
    
    const draggedIndex = categoryHabits.findIndex(h => h.id === draggedHabit.id);
    const targetIndex = categoryHabits.findIndex(h => h.id === targetHabit.id);
    
    const reordered = [...categoryHabits];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);
    
    setHabits([...otherHabits, ...reordered]);
    setDraggedHabit(null);
  };

  const teamHabits = habits.filter(h => h.category === 'Team');
  const personalHabits = habits.filter(h => h.category === 'Personal');
  const studyHabits = habits.filter(h => h.category === 'Study');
  
  const teamCompleted = teamHabits.filter(h => getHabitStatus(h)).length;
  const personalCompleted = personalHabits.filter(h => getHabitStatus(h)).length;

  const today = new Date().toISOString().split('T')[0];

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
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{user?.full_name || 'Test User'}</span>
                {user?.subscription_tier === 'pro' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    ✨ PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700">
                    FREE
                  </span>
                )}
              </div>
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

        {/* Month Navigation */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => changeMonth(-1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Previous Month
          </button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          
          <button
            onClick={() => changeMonth(1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Next Month →
          </button>
        </div>

        {/* Habit Calendar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{getMonthName()}</h3>
          
          {/* Create Habit Buttons */}
          <div className="mb-6 flex gap-4">
            <button 
              onClick={() => setShowPersonalForm(!showPersonalForm)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              + Personal Habit ({personalHabits.length}/10)
            </button>
            <button 
              onClick={() => setShowStudyForm(!showStudyForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + Study Skill ({studyHabits.length}/5)
            </button>
          </div>

          {/* Personal Habit Form */}
          {showPersonalForm && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold mb-3">Add Personal Habit</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g., Read 30 minutes, Gym workout"
                  className="flex-1 px-4 py-2 border rounded-lg text-sm"
                  maxLength={50}
                />
                <button
                  onClick={() => createHabit('Personal')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowPersonalForm(false);
                    setNewHabitName('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Study Habit Form */}
          {showStudyForm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-3">Add Study Skill</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g., Python, Dancing, Guitar"
                  className="flex-1 px-4 py-2 border rounded-lg text-sm"
                  maxLength={50}
                />
                <button
                  onClick={() => createHabit('Study')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowStudyForm(false);
                    setNewHabitName('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Calendar Header */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-600 min-w-[300px]">Habit</th>
                  {Array.from({ length: getDaysInMonth() }, (_, i) => {
                    const year = currentMonth.getFullYear();
                    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                    const day = String(i + 1).padStart(2, '0');
                    const cellDate = `${year}-${month}-${day}`;
                    const isToday = cellDate === today;
                    
                    return (
                      <th key={i} className={`text-center py-2 px-1 text-sm font-medium ${isToday ? 'bg-blue-200 text-blue-900' : 'text-gray-600'}`}>
                        {i + 1}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Team Habits Section */}
                <tr className="bg-purple-600 text-white">
                  <td colSpan={getDaysInMonth() + 1} className="py-3 px-4 text-center font-bold">
                    👑 TEAM HABITS
                    <p className="text-sm font-normal">Everyone must complete • Fixed points</p>
                  </td>
                </tr>
                {teamHabits.map((habit) => (
                  <tr key={habit.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">{habit.name}</td>
                    {Array.from({ length: getDaysInMonth() }, (_, i) => {
                      const year = currentMonth.getFullYear();
                      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                      const day = String(i + 1).padStart(2, '0');
                      const date = `${year}-${month}-${day}`;
                      const log = habit.logs?.find(l => l.log_date === date);
                      const isToday = date === today;
                      return (
                        <td key={i} className={`text-center py-2 px-1 ${isToday ? 'bg-blue-100' : ''}`}>
                          <button
                            onClick={() => toggleHabit(habit.id, date, log?.completed)}
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
                  <td colSpan={getDaysInMonth() + 1} className="py-3 px-4 text-center font-bold">
                    ⭐ PERSONAL HABITS
                    <p className="text-sm font-normal">Optional • Earn extra points • Drag to reorder</p>
                  </td>
                </tr>
                {personalHabits.map((habit) => (
                  <tr 
                    key={habit.id} 
                    className="border-b hover:bg-gray-50 cursor-move"
                    draggable
                    onDragStart={(e) => handleDragStart(e, habit)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, habit)}
                  >
                    <td className="py-3 px-2 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="cursor-move text-gray-400">☰</span>
                        <span className="flex-1">{habit.name}</span>
                        {canDeleteHabit(habit.created_at) && (
                          <button
                            onClick={() => deleteHabit(habit.id, habit.created_at)}
                            className="text-red-600 hover:text-red-800 font-bold text-lg px-2"
                            title="Delete (within 1hr)"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                    {Array.from({ length: getDaysInMonth() }, (_, i) => {
                      const year = currentMonth.getFullYear();
                      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                      const day = String(i + 1).padStart(2, '0');
                      const date = `${year}-${month}-${day}`;
                      const log = habit.logs?.find(l => l.log_date === date);
                      const isToday = date === today;
                      return (
                        <td key={i} className={`text-center py-2 px-1 ${isToday ? 'bg-blue-100' : ''}`}>
                          <button
                            onClick={() => toggleHabit(habit.id, date, log?.completed)}
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

                {/* Study Habits Section */}
                {studyHabits.length > 0 && (
                  <>
                    <tr className="bg-blue-500 text-white">
                      <td colSpan={getDaysInMonth() + 1} className="py-3 px-4 text-center font-bold">
                        📚 STUDY SKILLS
                        <p className="text-sm font-normal">Track study hours • 1hr = 1pt • Drag to reorder</p>
                      </td>
                    </tr>
                    {studyHabits.map((habit) => (
                      <tr 
                        key={habit.id} 
                        className="border-b hover:bg-gray-50 cursor-move"
                        draggable
                        onDragStart={(e) => handleDragStart(e, habit)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, habit)}
                      >
                        <td className="py-3 px-2 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="cursor-move text-gray-400">☰</span>
                            <span className="flex-1">{habit.name}</span>
                            {canDeleteHabit(habit.created_at) && (
                              <button
                                onClick={() => deleteHabit(habit.id, habit.created_at)}
                                className="text-red-600 hover:text-red-800 font-bold text-lg px-2"
                                title="Delete (within 1hr)"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                        {Array.from({ length: getDaysInMonth() }, (_, i) => {
                          const year = currentMonth.getFullYear();
                          const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                          const day = String(i + 1).padStart(2, '0');
                          const date = `${year}-${month}-${day}`;
                          const log = habit.logs?.find(l => l.log_date === date);
                          const isToday = date === today;
                          return (
                            <td key={i} className={`text-center py-2 px-1 ${isToday ? 'bg-blue-100' : ''}`}>
                              <input
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                value={log?.hours || ''}
                                onChange={(e) => logStudyHours(habit.id, date, e.target.value)}
                                placeholder="0"
                                className="w-10 h-6 text-center border rounded text-xs"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}