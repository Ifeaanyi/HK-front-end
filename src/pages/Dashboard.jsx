import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/UpgradeModal';

const API_URL = 'https://habit-king-production.up.railway.app/api/v1';

const S = {
  bg: '#0A0F1E',
  surface: '#111827',
  border: '#1E2A3A',
  text: '#F5F0E8',
  muted: '#8A9BB0',
  gold: '#C9A84C',
  hover: '#2A3A4A',
};

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [todos, setTodos] = useState([]);
  const [streak, setStreak] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [showStudyForm, setShowStudyForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [draggedHabit, setDraggedHabit] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [toggleLoading, setToggleLoading] = useState({});
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [monthlyGoals, setMonthlyGoals] = useState(null);
  const [newGoalText, setNewGoalText] = useState('');
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoalText, setEditingGoalText] = useState('');
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(0);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user?.subscription_tier === 'pro' && user?.subscription_end_date) {
      const endDate = new Date(user.subscription_end_date);
      const now = new Date();
      const daysLeft = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) { setSubscriptionExpired(true); setShowExpiryWarning(false); }
      else if (daysLeft <= 3) { setShowExpiryWarning(true); setDaysUntilExpiry(daysLeft); setSubscriptionExpired(false); }
    }
  }, [user]);

  useEffect(() => {
    fetchHabits(); fetchTodos(); fetchStreak(); fetchMonthlyGoals();
  }, [selectedDate, currentMonth]);

  const getToken = () => localStorage.getItem('token');

  const fetchHabits = async () => {
    try {
      const response = await axios.get(API_URL + '/habits', { headers: { Authorization: 'Bearer ' + getToken() } });
      const habitsWithLogs = await Promise.all(
        response.data.habits.map(async (habit) => {
          const logsResponse = await axios.get(API_URL + '/habits/' + habit.id + '/logs', { headers: { Authorization: 'Bearer ' + getToken() } });
          return { ...habit, logs: logsResponse.data.logs };
        })
      );
      setHabits(habitsWithLogs);
    } catch (error) { console.error('Error fetching habits:', error); }
  };

  const fetchTodos = async () => {
    try {
      const response = await axios.get(API_URL + '/todos', { headers: { Authorization: 'Bearer ' + getToken() } });
      setTodos(response.data.todos);
    } catch (error) { console.error('Error fetching todos:', error); }
  };

  const fetchStreak = async () => {
    try {
      const response = await axios.get(API_URL + '/streaks', { headers: { Authorization: 'Bearer ' + getToken() } });
      setStreak(response.data);
    } catch (error) { console.error('Error fetching streak:', error); }
  };

  const fetchMonthlyGoals = async () => {
    try {
      setGoalsLoading(true);
      const response = await axios.get(API_URL + '/monthly-goals', { headers: { Authorization: 'Bearer ' + getToken() } });
      setMonthlyGoals(response.data);
    } catch (error) { console.error('Error fetching monthly goals:', error); }
    finally { setGoalsLoading(false); }
  };

  const createGoal = async () => {
    if (!newGoalText.trim()) { alert('Please enter a goal'); return; }
    try {
      await axios.post(API_URL + '/monthly-goals', { goal_text: newGoalText }, { headers: { Authorization: 'Bearer ' + getToken() } });
      setNewGoalText(''); fetchMonthlyGoals();
    } catch (error) { alert(error.response?.data?.detail || 'Failed to create goal'); }
  };

  const toggleGoal = async (goalId) => {
    try {
      const response = await axios.post(API_URL + '/monthly-goals/' + goalId + '/toggle', {}, { headers: { Authorization: 'Bearer ' + getToken() } });
      if (response.data.points_just_awarded) alert('Congratulations! You completed all 5 goals and earned 15 bonus points!');
      fetchMonthlyGoals();
    } catch (error) { alert(error.response?.data?.detail || 'Failed to update goal'); }
  };

  const deleteGoal = async (goalId) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await axios.delete(API_URL + '/monthly-goals/' + goalId, { headers: { Authorization: 'Bearer ' + getToken() } });
      fetchMonthlyGoals();
    } catch (error) { alert(error.response?.data?.detail || 'Failed to delete goal'); }
  };

  const startEditingGoal = (goal) => { setEditingGoalId(goal.id); setEditingGoalText(goal.goal_text); };

  const saveEditedGoal = async (goalId) => {
    if (!editingGoalText.trim()) { alert('Goal cannot be empty'); return; }
    try {
      await axios.put(API_URL + '/monthly-goals/' + goalId, { goal_text: editingGoalText }, { headers: { Authorization: 'Bearer ' + getToken() } });
      setEditingGoalId(null); setEditingGoalText(''); fetchMonthlyGoals();
    } catch (error) { alert(error.response?.data?.detail || 'Failed to update goal'); }
  };

  const cancelEditing = () => { setEditingGoalId(null); setEditingGoalText(''); };

  const createHabit = async (category) => {
    if (!newHabitName.trim()) { alert('Please enter a habit name'); return; }
    try {
      await axios.post(API_URL + '/habits', { name: newHabitName, category, point_value: 1 }, { headers: { Authorization: 'Bearer ' + getToken() } });
      setNewHabitName(''); setShowPersonalForm(false); setShowStudyForm(false); fetchHabits();
    } catch (error) { alert(error.response?.data?.detail || 'Failed to create habit'); }
  };

  const deleteHabit = async (habitId) => {
    if (!confirm('Delete this habit? This cannot be undone.')) return;
    try {
      await axios.delete(API_URL + '/habits/' + habitId, { headers: { Authorization: 'Bearer ' + getToken() } });
      setHabits(prev => prev.filter(h => h.id !== habitId));
    } catch (error) { alert(error.response?.data?.detail || 'Failed to delete habit'); }
  };

  const toggleHabit = async (habitId, date, currentStatus) => {
    const toggleKey = `${habitId}-${date}`;
    if (toggleLoading[toggleKey]) return;
    setToggleLoading(prev => ({ ...prev, [toggleKey]: true }));
    try {
      await axios.post(API_URL + '/habits/log', { habit_id: habitId, log_date: date, completed: !currentStatus, hours: 0 }, { headers: { Authorization: 'Bearer ' + getToken() } });
      fetchHabits(); fetchStreak();
    } catch (error) { alert(error.response?.data?.detail || 'Cannot modify past dates'); }
    finally { setToggleLoading(prev => ({ ...prev, [toggleKey]: false })); }
  };

  const logStudyHours = async (habitId, date, hours) => {
    try {
      await axios.post(API_URL + '/habits/log', { habit_id: habitId, log_date: date, completed: hours > 0, hours: parseFloat(hours) || 0 }, { headers: { Authorization: 'Bearer ' + getToken() } });
      fetchHabits();
    } catch (error) { alert(error.response?.data?.detail || 'Cannot modify past dates'); }
  };

  const getHabitStatus = (habit) => { const log = habit.logs?.find(l => l.log_date === selectedDate); return log?.completed || false; };

  const changeMonth = (direction) => { const newMonth = new Date(currentMonth); newMonth.setMonth(newMonth.getMonth() + direction); setCurrentMonth(newMonth); };

  const getMonthName = () => currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDaysInMonth = () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  const canDeleteHabit = (createdAt) => {
    if (!createdAt) return false;
    const viewingCurrentMonth = currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth();
    if (!viewingCurrentMonth) return false;
    const createdTime = new Date(createdAt + 'Z');
    const now = new Date();
    const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);
    const isStartOfMonth = now.getDate() <= 3;
    const daysSinceSignup = (now - new Date(user?.created_at + 'Z')) / (1000 * 60 * 60 * 24);
    return hoursSinceCreation <= 24 || isStartOfMonth || daysSinceSignup < 7;
  };

  const handleDragStart = (e, habit) => { setDraggedHabit(habit); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDrop = async (e, targetHabit) => {
    e.preventDefault();
    if (!draggedHabit || draggedHabit.id === targetHabit.id) { setDraggedHabit(null); return; }
    if (draggedHabit.category !== targetHabit.category) { alert('Can only reorder habits within the same section'); setDraggedHabit(null); return; }
    const categoryHabits = habits.filter(h => h.category === draggedHabit.category);
    const otherHabits = habits.filter(h => h.category !== draggedHabit.category);
    const reordered = [...categoryHabits];
    const [removed] = reordered.splice(categoryHabits.findIndex(h => h.id === draggedHabit.id), 1);
    reordered.splice(categoryHabits.findIndex(h => h.id === targetHabit.id), 0, removed);
    setHabits([...otherHabits, ...reordered]);
    setDraggedHabit(null);
    try {
      await axios.post(API_URL + '/habits/reorder', reordered.map(h => h.id), { headers: { Authorization: 'Bearer ' + getToken() } });
    } catch (error) { console.error('Error saving habit order:', error); }
  };

  const shareStats = async () => {
    setShareLoading(true);
    try {
      const response = await axios.get(API_URL + '/stats/share-card', { headers: { Authorization: 'Bearer ' + getToken() } });
      const s = response.data;
      const rank = s.user_rank ? `#${s.user_rank} of ${s.total_members}` : null;
      const text =
`👑 HABIT KING — ${s.month.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━
👤 ${s.user_name} | ${user?.role_title || ''}
📊 Points:       ${s.total_points}
✅ Productivity: ${s.todo_productivity}%
🔥 Streak:       ${streak?.current_streak || 0} days${rank ? `\n🏅 Rank:         ${rank}` : ''}
━━━━━━━━━━━━━━━━━━━━
habitking.io`;
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch (error) { alert('Failed to load stats'); }
    finally { setShareLoading(false); }
  };

  const monthStart = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(getDaysInMonth()).padStart(2, '0')}`;
  const habitsForMonth = habits.filter(h => {
    const createdDate = h.created_at ? h.created_at.split('T')[0] : '2000-01-01';
    const deletedDate = h.deleted_at ? h.deleted_at.replace('T', ' ').split(' ')[0] : null;
    return createdDate <= monthEnd && (!deletedDate || (deletedDate > monthStart && monthStart < new Date().toISOString().split('T')[0].substring(0, 7) + '-01'));
  });

  const teamHabits = habitsForMonth.filter(h => h.category === 'Team');
  const personalHabits = habitsForMonth.filter(h => h.category === 'Personal');
  const studyHabits = habitsForMonth.filter(h => h.category === 'Study');
  const teamCompleted = teamHabits.filter(h => getHabitStatus(h)).length;
  const personalCompleted = personalHabits.filter(h => getHabitStatus(h)).length;
  const todayTodos = todos.filter(t => t.task_date === selectedDate);
  const todayTodosCompleted = todayTodos.filter(t => t.completed).length;

  const getUserToday = () => {
    const userTz = user?.timezone || 'Africa/Lagos';
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: userTz })).toISOString().split('T')[0];
  };
  const today = getUserToday();

  return (
    <div style={{ backgroundColor: S.bg, minHeight: '100vh' }}>

      {/* NAVBAR */}
      <div style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <img src="/logo.png" alt="Habit King" className="h-20 w-auto" />
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: 'Leaderboard', path: '/leaderboard' },
                { label: 'To-Do', path: '/todos' },
                { label: 'Friends', path: '/friends' },
                { label: 'Settings', path: '/settings' },
                { label: 'Rules', path: '/rules' },
              ].map(({ label, path }) => (
                <button key={path} onClick={() => navigate(path)}
                  style={{ backgroundColor: 'transparent', border: `1px solid ${S.border}`, color: S.muted }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg hover:border-yellow-600 hover:text-yellow-500 transition">
                  {label}
                </button>
              ))}
              <button onClick={shareStats} disabled={shareLoading}
                style={shareCopied ? { backgroundColor: '#1A3A2A', border: '1px solid #2A5A3A', color: '#6DBF8A' } : { backgroundColor: 'transparent', border: `1px solid ${S.gold}`, color: S.gold }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition">
                {shareLoading ? 'Loading...' : shareCopied ? 'Copied!' : 'Share Stats'}
              </button>
              <div style={{ color: S.text }} className="text-xs font-medium px-2">{user?.full_name}</div>
              {user?.subscription_tier === 'pro' ? (
                <span style={{ backgroundColor: '#1A1A0A', border: `1px solid ${S.gold}`, color: S.gold }} className="px-3 py-1 rounded-full text-xs font-bold">PRO</span>
              ) : (
                <button onClick={() => setShowUpgradeModal(true)}
                  style={{ backgroundColor: S.gold, color: S.bg }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg hover:opacity-90 transition">
                  Upgrade
                </button>
              )}
              <button onClick={logout}
                style={{ backgroundColor: 'transparent', border: `1px solid #4A1A1A`, color: '#E07070' }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-red-900 hover:bg-opacity-20 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EXPIRY WARNINGS */}
      {showExpiryWarning && (
        <div style={{ backgroundColor: '#1A1200', borderBottom: `1px solid #4A3A00` }} className="py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <p style={{ color: S.gold }} className="text-sm">Your Pro subscription expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}. Renew to keep access.</p>
            <button onClick={() => navigate('/settings')} style={{ backgroundColor: S.gold, color: S.bg }} className="px-4 py-1.5 text-xs font-bold rounded-lg">Renew Now</button>
          </div>
        </div>
      )}
      {subscriptionExpired && (
        <div style={{ backgroundColor: '#1A0A0A', borderBottom: `1px solid #4A1A1A` }} className="py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <p style={{ color: '#E07070' }} className="text-sm">Your Pro subscription has ended. Upgrade to regain access.</p>
            <button onClick={() => navigate('/settings')} style={{ backgroundColor: S.gold, color: S.bg }} className="px-4 py-1.5 text-xs font-bold rounded-lg">Upgrade</button>
          </div>
        </div>
      )}

      {/* WELCOME BANNER */}
      <div style={{ borderBottom: `1px solid ${S.border}` }} className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 style={{ color: S.text }} className="text-2xl font-bold">Welcome back, {user?.full_name || 'User'}</h2>
          <p style={{ color: S.muted }} className="text-sm mt-1">{user?.role_title} · {user?.timezone}</p>
        </div>
      </div>

      {/* STREAK */}
      {streak && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-xl p-6 text-center">
            <p style={{ color: S.gold }} className="text-4xl font-bold">{streak.current_streak}</p>
            <p style={{ color: S.muted }} className="text-xs uppercase tracking-widest mt-1">Day Streak</p>
            <p style={{ color: S.muted }} className="text-sm mt-3">Best: {streak.longest_streak} days · This Month: {streak.month_completed_days}/{streak.month_total_days}</p>
          </div>
        </div>
      )}

      {/* MONTHLY GOALS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 style={{ color: S.text }} className="text-base font-bold uppercase tracking-wider">Monthly Goals</h3>
              {monthlyGoals && <span style={{ color: S.muted }} className="text-xs">({monthlyGoals.completed_goals}/{monthlyGoals.total_goals})</span>}
            </div>
            {monthlyGoals?.points_awarded && <span style={{ backgroundColor: '#0A1A0A', border: '1px solid #2A5A2A', color: '#6DBF6D' }} className="px-3 py-1 rounded-full text-xs font-bold">+15 pts earned</span>}
          </div>

          {monthlyGoals && (
            <div style={{ backgroundColor: monthlyGoals.is_edit_period ? '#0A1020' : '#0A0A0A', border: `1px solid ${monthlyGoals.is_edit_period ? '#1A2A4A' : S.border}`, color: monthlyGoals.is_edit_period ? '#6A8ABF' : S.muted }} className="mb-4 p-3 rounded-lg text-xs">
              {monthlyGoals.is_edit_period ? 'Edit period active — you can create, edit and delete goals.' : 'Goals locked. You can only mark complete / incomplete. Editing opens on the 1st.'}
            </div>
          )}

          {goalsLoading ? (
            <p style={{ color: S.muted }} className="text-sm text-center py-6">Loading...</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {monthlyGoals?.goals?.map((goal, index) => (
                  <div key={goal.id} style={{ backgroundColor: goal.completed ? '#0A1A0A' : S.bg, border: `1px solid ${goal.completed ? '#2A5A2A' : S.border}` }} className="flex items-center gap-3 p-3 rounded-lg">
                    <span style={{ color: S.muted }} className="text-xs w-5">{index + 1}.</span>
                    <button onClick={() => toggleGoal(goal.id)}
                      style={{ backgroundColor: goal.completed ? '#2A5A2A' : 'transparent', border: `2px solid ${goal.completed ? '#4A8A4A' : S.border}`, color: '#6DBF6D' }}
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition">
                      {goal.completed && '✓'}
                    </button>
                    {editingGoalId === goal.id ? (
                      <div className="flex-1 flex gap-2">
                        <input type="text" value={editingGoalText} onChange={(e) => setEditingGoalText(e.target.value)}
                          style={{ backgroundColor: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                          className="flex-1 px-3 py-1 rounded-lg text-xs focus:outline-none" maxLength={500} />
                        <button onClick={() => saveEditedGoal(goal.id)} style={{ backgroundColor: '#2A5A2A', color: '#6DBF6D' }} className="px-3 py-1 rounded-lg text-xs">Save</button>
                        <button onClick={cancelEditing} style={{ backgroundColor: S.hover, color: S.muted }} className="px-3 py-1 rounded-lg text-xs">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ color: goal.completed ? S.muted : S.text }} className={`flex-1 text-sm ${goal.completed ? 'line-through' : ''}`}>{goal.goal_text}</span>
                        {monthlyGoals.is_edit_period && (
                          <div className="flex gap-2">
                            <button onClick={() => startEditingGoal(goal)} style={{ color: S.muted }} className="text-xs hover:text-yellow-500 transition">Edit</button>
                            <button onClick={() => deleteGoal(goal.id)} style={{ color: '#E07070' }} className="text-xs hover:opacity-80 transition">Del</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {monthlyGoals && monthlyGoals.total_goals < 5 && Array.from({ length: 5 - monthlyGoals.total_goals }, (_, i) => (
                  <div key={'empty-' + i} style={{ border: `1px dashed ${S.border}` }} className="flex items-center gap-3 p-3 rounded-lg">
                    <span style={{ color: S.muted }} className="text-xs w-5">{monthlyGoals.total_goals + i + 1}.</span>
                    <div style={{ border: `2px solid ${S.border}` }} className="w-5 h-5 rounded-full flex-shrink-0"></div>
                    <span style={{ color: S.border }} className="text-xs italic">Empty slot</span>
                  </div>
                ))}
              </div>

              {monthlyGoals?.is_edit_period && monthlyGoals?.total_goals < 5 && (
                <div className="flex gap-3 mt-4">
                  <input type="text" value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)} placeholder="Enter a new goal..."
                    style={{ backgroundColor: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                    className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-yellow-600 transition" maxLength={500} />
                  <button onClick={createGoal} style={{ backgroundColor: S.gold, color: S.bg }} className="px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">Add</button>
                </div>
              )}

              <div style={{ backgroundColor: '#0A0F00', border: `1px solid #2A3A00`, color: S.gold }} className="mt-4 p-3 rounded-lg text-xs">
                Complete all 5 goals this month to earn +15 points on the leaderboard.
              </div>
            </>
          )}
        </div>
      </div>

      {/* TODAY'S PROGRESS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ color: S.text }} className="text-xs font-bold uppercase tracking-widest">Today's Progress</h3>
          <p style={{ color: S.muted }} className="text-xs">Locks at 11:59 PM</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Team Habits', value: teamCompleted, total: teamHabits.length },
            { label: 'Personal', value: personalCompleted, total: personalHabits.length },
            { label: 'To-Do', value: todayTodosCompleted, total: todayTodos.length },
          ].map(({ label, value, total }) => (
            <div key={label} style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-xl p-6 text-center">
              <p style={{ color: S.gold }} className="text-3xl font-bold">{value}<span style={{ color: S.muted }} className="text-lg">/{total}</span></p>
              <p style={{ color: S.muted }} className="text-xs uppercase tracking-wider mt-2">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HABIT TABLE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => changeMonth(-1)} style={{ backgroundColor: S.gold, color: S.bg }} className="px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition">← Prev Month</button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, color: S.text }}
            className="px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-yellow-600" />
          <button onClick={() => changeMonth(1)} style={{ backgroundColor: S.gold, color: S.bg }} className="px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition">Next Month →</button>
        </div>

        <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: S.text }} className="text-sm font-bold uppercase tracking-wider">{getMonthName()}</h3>
            <div className="flex gap-3">
              {currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth() && (
                <>
                  <button onClick={() => setShowPersonalForm(!showPersonalForm)}
                    style={{ backgroundColor: 'transparent', border: `1px solid ${S.border}`, color: S.muted }}
                    className="px-3 py-1.5 text-xs rounded-lg hover:border-yellow-600 hover:text-yellow-500 transition">
                    + Personal ({personalHabits.filter(h => !h.deleted_at).length}/10)
                  </button>
                  <button onClick={() => setShowStudyForm(!showStudyForm)}
                    style={{ backgroundColor: 'transparent', border: `1px solid ${S.border}`, color: S.muted }}
                    className="px-3 py-1.5 text-xs rounded-lg hover:border-yellow-600 hover:text-yellow-500 transition">
                    + Study ({studyHabits.filter(h => !h.deleted_at).length}/5)
                  </button>
                </>
              )}
            </div>
          </div>

          {showPersonalForm && (
            <div style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }} className="mb-4 p-4 rounded-lg">
              <div className="flex gap-3">
                <input type="text" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="e.g., Read 30 minutes"
                  style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, color: S.text }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-yellow-600" maxLength={50} />
                <button onClick={() => createHabit('Personal')} style={{ backgroundColor: S.gold, color: S.bg }} className="px-4 py-2 rounded-lg text-sm font-semibold">Create</button>
                <button onClick={() => { setShowPersonalForm(false); setNewHabitName(''); }} style={{ backgroundColor: S.hover, color: S.muted }} className="px-4 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          {showStudyForm && (
            <div style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }} className="mb-4 p-4 rounded-lg">
              <div className="flex gap-3">
                <input type="text" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="e.g., Python, Guitar"
                  style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, color: S.text }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-yellow-600" maxLength={50} />
                <button onClick={() => createHabit('Study')} style={{ backgroundColor: S.gold, color: S.bg }} className="px-4 py-2 rounded-lg text-sm font-semibold">Create</button>
                <button onClick={() => { setShowStudyForm(false); setNewHabitName(''); }} style={{ backgroundColor: S.hover, color: S.muted }} className="px-4 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr>
                  <th style={{ color: S.muted, borderBottom: `1px solid ${S.border}` }} className="text-left py-2 px-1 text-xs font-medium w-40">Habit</th>
                  {Array.from({ length: getDaysInMonth() }, (_, i) => {
                    const year = currentMonth.getFullYear();
                    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                    const cellDate = `${year}-${month}-${String(i + 1).padStart(2, '0')}`;
                    const isToday = cellDate === today;
                    return (
                      <th key={i} style={{ color: isToday ? S.gold : S.muted, backgroundColor: isToday ? '#1A1400' : 'transparent', borderBottom: `1px solid ${S.border}` }}
                        className="text-center py-2 px-0 text-xs font-medium w-7">{i + 1}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#1A1400' }}>
                  <td colSpan={getDaysInMonth() + 1} style={{ color: S.gold, borderTop: `1px solid #2A2400`, borderBottom: `1px solid #2A2400` }} className="py-2 px-3 text-xs font-bold uppercase tracking-widest">Team Habits</td>
                </tr>
                {teamHabits.map((habit) => (
                  <tr key={habit.id} style={{ borderBottom: `1px solid ${S.border}` }} className="hover:bg-opacity-50">
                    <td style={{ color: S.text }} className="py-1.5 px-1 text-xs break-words">{habit.name}</td>
                    {Array.from({ length: getDaysInMonth() }, (_, i) => {
                      const date = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                      const log = habit.logs?.find(l => l.log_date === date);
                      const isToday = date === today;
                      return (
                        <td key={i} style={{ backgroundColor: isToday ? '#1A1400' : 'transparent' }} className="text-center py-1 px-0">
                          <button onClick={() => toggleHabit(habit.id, date, log?.completed)} disabled={toggleLoading[`${habit.id}-${date}`]}
                            style={{ backgroundColor: log?.completed ? '#2A5A2A' : S.border, color: log?.completed ? '#6DBF6D' : 'transparent' }}
                            className="w-5 h-5 rounded text-xs transition">
                            {log?.completed && '✓'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr style={{ backgroundColor: '#1A1400' }}>
                  <td colSpan={getDaysInMonth() + 1} style={{ color: S.gold, borderTop: `1px solid #2A2400`, borderBottom: `1px solid #2A2400` }} className="py-2 px-3 text-xs font-bold uppercase tracking-widest">Personal</td>
                </tr>
                {personalHabits.map((habit) => (
                  <tr key={habit.id} style={{ borderBottom: `1px solid ${S.border}` }} className="cursor-move" draggable onDragStart={(e) => handleDragStart(e, habit)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, habit)}>
                    <td style={{ color: S.text }} className="py-1.5 px-1 text-xs">
                      <div className="flex items-center gap-1">
                        <span style={{ color: S.border }} className="text-xs">☰</span>
                        <span className="flex-1 break-words">{habit.name}</span>
                        {canDeleteHabit(habit.created_at) && <button onClick={() => deleteHabit(habit.id)} style={{ color: '#E07070' }} className="text-xs flex-shrink-0">✕</button>}
                      </div>
                    </td>
                    {Array.from({ length: getDaysInMonth() }, (_, i) => {
                      const date = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                      const log = habit.logs?.find(l => l.log_date === date);
                      const isToday = date === today;
                      return (
                        <td key={i} style={{ backgroundColor: isToday ? '#1A1400' : 'transparent' }} className="text-center py-1 px-0">
                          <button onClick={() => toggleHabit(habit.id, date, log?.completed)} disabled={toggleLoading[`${habit.id}-${date}`]}
                            style={{ backgroundColor: log?.completed ? '#2A5A2A' : S.border, color: log?.completed ? '#6DBF6D' : 'transparent' }}
                            className="w-5 h-5 rounded text-xs transition">
                            {log?.completed && '✓'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {studyHabits.length > 0 && (
                  <>
                    <tr style={{ backgroundColor: '#1A1400' }}>
                      <td colSpan={getDaysInMonth() + 1} style={{ color: S.gold, borderTop: `1px solid #2A2400`, borderBottom: `1px solid #2A2400` }} className="py-2 px-3 text-xs font-bold uppercase tracking-widest">Study</td>
                    </tr>
                    {studyHabits.map((habit) => (
                      <tr key={habit.id} style={{ borderBottom: `1px solid ${S.border}` }} className="cursor-move" draggable onDragStart={(e) => handleDragStart(e, habit)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, habit)}>
                        <td style={{ color: S.text }} className="py-1.5 px-1 text-xs">
                          <div className="flex items-center gap-1">
                            <span style={{ color: S.border }} className="text-xs">☰</span>
                            <span className="flex-1 break-words">{habit.name}</span>
                            {canDeleteHabit(habit.created_at) && <button onClick={() => deleteHabit(habit.id)} style={{ color: '#E07070' }} className="text-xs flex-shrink-0">✕</button>}
                          </div>
                        </td>
                        {Array.from({ length: getDaysInMonth() }, (_, i) => {
                          const date = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                          const log = habit.logs?.find(l => l.log_date === date);
                          const isToday = date === today;
                          return (
                            <td key={i} style={{ backgroundColor: isToday ? '#1A1400' : 'transparent' }} className="text-center py-1 px-0">
                              <input type="number" min="0" max="24" step="0.5" value={log?.hours || ''} onChange={(e) => logStudyHours(habit.id, date, e.target.value)} placeholder="0"
                                style={{ backgroundColor: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                                className="w-7 h-5 text-center rounded text-xs p-0 focus:outline-none focus:border-yellow-600" />
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