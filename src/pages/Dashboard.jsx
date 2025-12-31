import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/UpgradeModal';

const API_URL = 'https://habit-king-production.up.railway.app/api/v1';

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [todos, setTodos] = useState([]);
  const [streak, setStreak] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [testMode, setTestMode] = useState(false);
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [showStudyForm, setShowStudyForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [draggedHabit, setDraggedHabit] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [monthlyGoals, setMonthlyGoals] = useState(null);
  const [newGoalText, setNewGoalText] = useState('');
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoalText, setEditingGoalText] = useState('');
  const [goalsLoading, setGoalsLoading] = useState(true);
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchHabits();
    fetchTodos();
    fetchStreak();
    fetchMonthlyGoals();
  }, [selectedDate]);

  const getToken = () => localStorage.getItem('token');

  const fetchHabits = async () => {
    try {
      const response = await axios.get(API_URL + '/habits', {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      const habitsData = response.data.habits;
      
      const habitsWithLogs = await Promise.all(
        habitsData.map(async (habit) => {
          const logsResponse = await axios.get(API_URL + '/habits/' + habit.id + '/logs', {
            headers: { Authorization: 'Bearer ' + getToken() }
          });
          return { ...habit, logs: logsResponse.data.logs };
        })
      );
      
      setHabits(habitsWithLogs);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchTodos = async () => {
    try {
      const response = await axios.get(API_URL + '/todos', {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      setTodos(response.data.todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const fetchStreak = async () => {
    try {
      const response = await axios.get(API_URL + '/streaks', {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      setStreak(response.data);
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  };

  const fetchMonthlyGoals = async () => {
    try {
      setGoalsLoading(true);
      const response = await axios.get(API_URL + '/monthly-goals', {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      setMonthlyGoals(response.data);
    } catch (error) {
      console.error('Error fetching monthly goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  };

  const createGoal = async () => {
    if (!newGoalText.trim()) {
      alert('Please enter a goal');
      return;
    }
    try {
      await axios.post(
        API_URL + '/monthly-goals',
        { goal_text: newGoalText },
        { headers: { Authorization: 'Bearer ' + getToken() } }
      );
      setNewGoalText('');
      fetchMonthlyGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      alert(error.response?.data?.detail || 'Failed to create goal');
    }
  };

  const toggleGoal = async (goalId) => {
    try {
      const response = await axios.post(
        API_URL + '/monthly-goals/' + goalId + '/toggle',
        {},
        { headers: { Authorization: 'Bearer ' + getToken() } }
      );
      
      if (response.data.points_just_awarded) {
        alert('🎉 Congratulations! You completed all 5 goals and earned 15 bonus points!');
      }
      
      fetchMonthlyGoals();
    } catch (error) {
      console.error('Error toggling goal:', error);
      alert(error.response?.data?.detail || 'Failed to update goal');
    }
  };

  const deleteGoal = async (goalId) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await axios.delete(API_URL + '/monthly-goals/' + goalId, {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      fetchMonthlyGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert(error.response?.data?.detail || 'Failed to delete goal');
    }
  };

  const startEditingGoal = (goal) => {
    setEditingGoalId(goal.id);
    setEditingGoalText(goal.goal_text);
  };

  const saveEditedGoal = async (goalId) => {
    if (!editingGoalText.trim()) {
      alert('Goal cannot be empty');
      return;
    }
    try {
      await axios.put(
        API_URL + '/monthly-goals/' + goalId,
        { goal_text: editingGoalText },
        { headers: { Authorization: 'Bearer ' + getToken() } }
      );
      setEditingGoalId(null);
      setEditingGoalText('');
      fetchMonthlyGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      alert(error.response?.data?.detail || 'Failed to update goal');
    }
  };

  const cancelEditing = () => {
    setEditingGoalId(null);
    setEditingGoalText('');
  };

  const createHabit = async (category) => {
    if (!newHabitName.trim()) {
      alert('Please enter a habit name');
      return;
    }
    try {
      await axios.post(
        API_URL + '/habits',
        { name: newHabitName, category: category, point_value: 1 },
        { headers: { Authorization: 'Bearer ' + getToken() } }
      );
      
      setNewHabitName('');
      setShowPersonalForm(false);
      setShowStudyForm(false);
      fetchHabits();
      alert(category + ' habit created successfully!');
    } catch (error) {
      console.error('Error creating habit:', error);
      alert(error.response?.data?.detail || 'Failed to create habit');
    }
  };

  const deleteHabit = async (habitId) => {
    if (!confirm('Delete this habit? This cannot be undone.')) {
      return;
    }
    try {
      await axios.delete(API_URL + '/habits/' + habitId, {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      fetchHabits();
      alert('Habit deleted successfully');
    } catch (error) {
      console.error('Error deleting habit:', error);
      alert(error.response?.data?.detail || 'Failed to delete habit');
    }
  };

  const toggleHabit = async (habitId, date, currentStatus) => {
    try {
      await axios.post(
        API_URL + '/habits/log',
        { habit_id: habitId, log_date: date, completed: !currentStatus, hours: 0 },
        { headers: { Authorization: 'Bearer ' + getToken() } }
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
        API_URL + '/habits/log',
        { habit_id: habitId, log_date: date, completed: hours > 0, hours: parseFloat(hours) || 0 },
        { headers: { Authorization: 'Bearer ' + getToken() } }
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
    const createdTime = new Date(createdAt + 'Z');
    const now = new Date();
    const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);
    const currentDay = now.getDate();
    const isStartOfMonth = currentDay <= 3;
    return hoursSinceCreation <= 24 || isStartOfMonth;
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
  const todayTodos = todos.filter(t => t.task_date === selectedDate);
  const todayTodosCompleted = todayTodos.filter(t => t.completed).length;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <img src="/logo.jpeg" alt="Habit King" className="h-10" />
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/leaderboard')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-yellow-400 rounded-lg hover:bg-yellow-500">🏆 Leaderboard</button>
              <button onClick={() => navigate('/todos')} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600">📋 To-Do</button>
              <button onClick={() => navigate('/friends')} className="px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600">👥 Friends</button>
              <button onClick={() => navigate('/settings')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">⚙️ Settings</button>
              <button onClick={() => navigate('/rules')} className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600">📖 Rules</button>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{user?.full_name || 'Test User'}</span>
                {user?.subscription_tier === 'pro' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white">✨ PRO</span>
                ) : (
                  <button onClick={() => setShowUpgradeModal(true)} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition">⬆️ Upgrade</button>
                )}
              </div>
              <button onClick={logout} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">Logout</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-3xl font-bold">Welcome back, {user?.full_name || 'Test User'}! 👋</h2>
          <p className="text-blue-100 mt-1">{user?.role_title || 'Tester'} • {user?.timezone || 'Africa/Lagos'}</p>
        </div>
      </div>

      {streak && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-4xl font-bold text-orange-500">🔥 {streak.current_streak}</p>
            <p className="text-gray-600 text-sm mt-1">DAY STREAK</p>
            <p className="text-gray-500 text-sm mt-4">Best: {streak.longest_streak} days • This Month: {streak.month_completed_days}/{streak.month_total_days}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h3 className="text-xl font-bold text-gray-900">Monthly Goals</h3>
              {monthlyGoals && <span className="text-sm text-gray-500">({monthlyGoals.completed_goals}/{monthlyGoals.total_goals} completed)</span>}
            </div>
            {monthlyGoals?.points_awarded && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">🎉 +15 pts earned!</span>}
          </div>

          {monthlyGoals && (
            <div className={monthlyGoals.is_edit_period ? 'mb-4 p-3 rounded-lg text-sm bg-blue-50 text-blue-800 border border-blue-200' : 'mb-4 p-3 rounded-lg text-sm bg-gray-50 text-gray-600 border border-gray-200'}>
              {monthlyGoals.is_edit_period ? (
                <span>📝 <strong>Edit Period Active!</strong> You can create, edit, and delete goals until the 4th.</span>
              ) : (
                <span>🔒 Goals are locked. You can only mark them complete/incomplete. Editing opens on the 1st.</span>
              )}
            </div>
          )}

          {goalsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading goals...</div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {monthlyGoals?.goals?.map((goal, index) => (
                  <div key={goal.id} className={goal.completed ? 'flex items-center gap-3 p-3 rounded-lg border bg-green-50 border-green-200' : 'flex items-center gap-3 p-3 rounded-lg border bg-gray-50 border-gray-200'}>
                    <span className="text-gray-400 font-bold w-6">{index + 1}.</span>
                    <button onClick={() => toggleGoal(goal.id)} className={goal.completed ? 'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-green-500 border-green-500 text-white' : 'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 border-gray-300 hover:border-green-400'}>
                      {goal.completed && '✓'}
                    </button>
                    {editingGoalId === goal.id ? (
                      <div className="flex-1 flex gap-2">
                        <input type="text" value={editingGoalText} onChange={(e) => setEditingGoalText(e.target.value)} className="flex-1 px-3 py-1 border rounded-lg text-sm" maxLength={500} />
                        <button onClick={() => saveEditedGoal(goal.id)} className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">Save</button>
                        <button onClick={cancelEditing} className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <span className={goal.completed ? 'flex-1 line-through text-gray-500' : 'flex-1 text-gray-900'}>{goal.goal_text}</span>
                        {monthlyGoals.is_edit_period && (
                          <div className="flex gap-2">
                            <button onClick={() => startEditingGoal(goal)} className="text-blue-600 hover:text-blue-800 text-sm">✏️</button>
                            <button onClick={() => deleteGoal(goal.id)} className="text-red-600 hover:text-red-800 text-sm">🗑️</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {monthlyGoals && monthlyGoals.total_goals < 5 && Array.from({ length: 5 - monthlyGoals.total_goals }, (_, i) => (
                  <div key={'empty-' + i} className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                    <span className="text-gray-400 font-bold w-6">{monthlyGoals.total_goals + i + 1}.</span>
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                    <span className="text-gray-400 italic">Empty slot</span>
                  </div>
                ))}
              </div>

              {monthlyGoals?.is_edit_period && monthlyGoals?.total_goals < 5 && (
                <div className="flex gap-3 mt-4">
                  <input type="text" value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)} placeholder="Enter a new goal for this month..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" maxLength={500} />
                  <button onClick={createGoal} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm">+ Add Goal</button>
                </div>
              )}

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                <span className="font-bold">🏆 Bonus:</span> Complete all 5 goals this month to earn <strong>+15 points</strong> on the leaderboard!
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">TODAY'S PROGRESS</h3>
            <p className="text-sm text-gray-500">Locks at 11:59 PM</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4"><span className="text-3xl">👥</span></div>
              <h4 className="text-gray-700 font-medium mb-2">Team Habits</h4>
              <p className="text-4xl font-bold text-gray-900">{teamCompleted}<span className="text-gray-400">/{teamHabits.length}</span></p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4"><span className="text-3xl">⭐</span></div>
              <h4 className="text-gray-700 font-medium mb-2">Personal</h4>
              <p className="text-4xl font-bold text-gray-900">{personalCompleted}<span className="text-gray-400">/{personalHabits.length}</span></p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4"><span className="text-3xl">📋</span></div>
              <h4 className="text-gray-700 font-medium mb-2">To-Do</h4>
              <p className="text-4xl font-bold text-gray-900">{todayTodosCompleted}<span className="text-gray-400">/{todayTodos.length}</span></p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">← Previous Month</button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Next Month →</button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{getMonthName()}</h3>
          
          <div className="mb-6 flex gap-4">
            <button onClick={() => setShowPersonalForm(!showPersonalForm)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">+ Personal Habit ({personalHabits.length}/10)</button>
            <button onClick={() => setShowStudyForm(!showStudyForm)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">+ Study Skill ({studyHabits.length}/5)</button>
          </div>

          {showPersonalForm && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold mb-3">Add Personal Habit</h4>
              <div className="flex gap-3">
                <input type="text" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="e.g., Read 30 minutes" className="flex-1 px-4 py-2 border rounded-lg text-sm" maxLength={50} />
                <button onClick={() => createHabit('Personal')} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold">Create</button>
                <button onClick={() => { setShowPersonalForm(false); setNewHabitName(''); }} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {showStudyForm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-3">Add Study Skill</h4>
              <div className="flex gap-3">
                <input type="text" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="e.g., Python, Guitar" className="flex-1 px-4 py-2 border rounded-lg text-sm" maxLength={50} />
                <button onClick={() => createHabit('Study')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold">Create</button>
                <button onClick={() => { setShowStudyForm(false); setNewHabitName(''); }} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr>
                  <th className="text-left py-1 px-1 text-xs font-medium text-gray-600 w-40">Habit</th>
                  {Array.from({ length: getDaysInMonth() }, (_, i) => {
                    const year = currentMonth.getFullYear();
                    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                    const day = String(i + 1).padStart(2, '0');
                    const cellDate = year + '-' + month + '-' + day;
                    const isToday = cellDate === today;
                    return <th key={i} className={isToday ? 'text-center py-1 px-0 text-xs font-medium bg-blue-200 text-blue-900 w-7' : 'text-center py-1 px-0 text-xs font-medium text-gray-600 w-7'}>{i + 1}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-purple-600 text-white">
                  <td colSpan={getDaysInMonth() + 1} className="py-2 px-2 text-center font-bold text-xs">👑 TEAM HABITS</td>
                </tr>
                {teamHabits.map((habit) => (
                  <tr key={habit.id} className="border-b hover:bg-gray-50">
                    <td className="py-1 px-1 font-medium text-gray-900 text-xs break-words">{habit.name}</td>
                    {Array.from({ length: getDaysInMonth() }, (_, i) => {
                      const year = currentMonth.getFullYear();
                      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                      const day = String(i + 1).padStart(2, '0');
                      const date = year + '-' + month + '-' + day;
                      const log = habit.logs?.find(l => l.log_date === date);
                      const isToday = date === today;
                      return (
                        <td key={i} className={isToday ? 'text-center py-1 px-0 bg-blue-100' : 'text-center py-1 px-0'}>
                          <button onClick={() => toggleHabit(habit.id, date, log?.completed)} className={log?.completed ? 'w-5 h-5 rounded text-xs bg-green-500' : 'w-5 h-5 rounded text-xs bg-gray-200'}>{log?.completed && '✓'}</button>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr className="bg-yellow-400 text-gray-900">
                  <td colSpan={getDaysInMonth() + 1} className="py-2 px-2 text-center font-bold text-xs">⭐ PERSONAL</td>
                </tr>
                {personalHabits.map((habit) => (
                  <tr key={habit.id} className="border-b hover:bg-gray-50 cursor-move" draggable onDragStart={(e) => handleDragStart(e, habit)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, habit)}>
                    <td className="py-1 px-1 font-medium text-gray-900 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="cursor-move text-gray-400 text-xs">☰</span>
                        <span className="flex-1 break-words">{habit.name}</span>
                        {canDeleteHabit(habit.created_at) && <button onClick={() => deleteHabit(habit.id)} className="text-red-600 hover:text-red-800 font-bold text-sm flex-shrink-0" title="Delete">✕</button>}
                      </div>
                    </td>
                    {Array.from({ length: getDaysInMonth() }, (_, i) => {
                      const year = currentMonth.getFullYear();
                      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                      const day = String(i + 1).padStart(2, '0');
                      const date = year + '-' + month + '-' + day;
                      const log = habit.logs?.find(l => l.log_date === date);
                      const isToday = date === today;
                      return (
                        <td key={i} className={isToday ? 'text-center py-1 px-0 bg-blue-100' : 'text-center py-1 px-0'}>
                          <button onClick={() => toggleHabit(habit.id, date, log?.completed)} className={log?.completed ? 'w-5 h-5 rounded text-xs bg-green-500' : 'w-5 h-5 rounded text-xs bg-gray-200'}>{log?.completed && '✓'}</button>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {studyHabits.length > 0 && (
                  <>
                    <tr className="bg-blue-500 text-white">
                      <td colSpan={getDaysInMonth() + 1} className="py-2 px-2 text-center font-bold text-xs">📚 STUDY</td>
                    </tr>
                    {studyHabits.map((habit) => (
                      <tr key={habit.id} className="border-b hover:bg-gray-50 cursor-move" draggable onDragStart={(e) => handleDragStart(e, habit)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, habit)}>
                        <td className="py-1 px-1 font-medium text-gray-900 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="cursor-move text-gray-400 text-xs">☰</span>
                            <span className="flex-1 break-words">{habit.name}</span>
                            {canDeleteHabit(habit.created_at) && <button onClick={() => deleteHabit(habit.id)} className="text-red-600 hover:text-red-800 font-bold text-sm flex-shrink-0" title="Delete">✕</button>}
                          </div>
                        </td>
                        {Array.from({ length: getDaysInMonth() }, (_, i) => {
                          const year = currentMonth.getFullYear();
                          const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                          const day = String(i + 1).padStart(2, '0');
                          const date = year + '-' + month + '-' + day;
                          const log = habit.logs?.find(l => l.log_date === date);
                          const isToday = date === today;
                          return (
                            <td key={i} className={isToday ? 'text-center py-1 px-0 bg-blue-100' : 'text-center py-1 px-0'}>
                              <input type="number" min="0" max="24" step="0.5" value={log?.hours || ''} onChange={(e) => logStudyHours(habit.id, date, e.target.value)} placeholder="0" className="w-7 h-5 text-center border rounded text-xs p-0" />
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

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}