import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [personalHabits, setPersonalHabits] = useState([]);
  const [studySkills, setStudySkills] = useState([]);
  const [logs, setLogs] = useState({});
  const [showCreateHabitForm, setShowCreateHabitForm] = useState(false);
  const [showCreateStudyForm, setShowCreateStudyForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState('');
  const [newStudySkillName, setNewStudySkillName] = useState('');
  const [teamHabitsFromDB, setTeamHabitsFromDB] = useState([]);
  const [streakInfo, setStreakInfo] = useState(null);
  const [todayProgress, setTodayProgress] = useState({
    teamCount: 0,
    teamTotal: 0,
    personalCount: 0,
    personalTotal: 0,
    todoCount: 0,
    todoTotal: 0
  });

  const isTestAccount = user?.email === 'test@test.com';

  const teamHabitsTemplate = [
    { name: '1hr productivity', points: 2 },
    { name: 'Make morning bed', points: 1 },
    { name: 'Document finance', points: 1 },
    { name: 'Drink 2 liters water', points: 1 }
  ];

  useEffect(() => {
    initializeDashboard();
  }, []);

  useEffect(() => {
    loadLogsForMonth();
  }, [currentMonth]);

  const initializeDashboard = async () => {
    await createTeamHabitsIfNeeded();
    await fetchAllHabits();
    await loadLogsForMonth();
    await fetchStreakInfo();
    await calculateTodayProgress();
    setLoading(false);
  };

  const fetchStreakInfo = async () => {
    try {
      const response = await api.get('/streaks');
      setStreakInfo(response.data);
      console.log('Streak info:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch streak info:', error);
      return null;
    }
  };

  const calculateTodayProgress = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const habitsResponse = await api.get('/habits');
      const allHabits = habitsResponse.data.habits || [];
      
      const teamHabits = allHabits.filter(h => h.category === 'Team');
      const personalHabits = allHabits.filter(h => h.category === 'Personal');
      
      let teamCompleted = 0;
      let personalCompleted = 0;
      
      for (const habit of teamHabits) {
        const logsResponse = await api.get(`/habits/${habit.id}/logs`);
        const todayLog = logsResponse.data.logs.find(log => log.log_date === today);
        if (todayLog && todayLog.completed) teamCompleted++;
      }
      
      for (const habit of personalHabits) {
        const logsResponse = await api.get(`/habits/${habit.id}/logs`);
        const todayLog = logsResponse.data.logs.find(log => log.log_date === today);
        if (todayLog && todayLog.completed) personalCompleted++;
      }
      
      const todosResponse = await api.get('/todos');
      const allTodos = todosResponse.data.todos || [];
      const todayTodos = allTodos.filter(t => t.task_date === today);
      const todoCompleted = todayTodos.filter(t => t.completed).length;
      
      setTodayProgress({
        teamCount: teamCompleted,
        teamTotal: teamHabits.length,
        personalCount: personalCompleted,
        personalTotal: personalHabits.length,
        todoCount: todoCompleted,
        todoTotal: todayTodos.length
      });
      
    } catch (error) {
      console.error('Failed to calculate today progress:', error);
    }
  };

  const createTeamHabitsIfNeeded = async () => {
    try {
      const response = await api.get('/habits');
      const existingHabits = response.data.habits || [];
      const existingTeamHabits = existingHabits.filter(h => h.category === 'Team');
      
      if (existingTeamHabits.length > 0) {
        console.log('Team habits already exist, skipping creation');
        return;
      }
      
      console.log('Creating team habits for the first time...');
      for (const habit of teamHabitsTemplate) {
        try {
          await api.post('/habits', {
            name: habit.name,
            category: 'Team',
            point_value: habit.points
          });
          console.log(`Created team habit: ${habit.name}`);
        } catch (error) {
          console.error(`Failed to create team habit ${habit.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking/creating team habits:', error);
    }
  };

  const fetchAllHabits = async () => {
    try {
      const response = await api.get('/habits');
      const habits = response.data.habits || [];
      
      setPersonalHabits(habits.filter(h => h.category === 'Personal'));
      setStudySkills(habits.filter(h => h.category === 'Study'));
      setTeamHabitsFromDB(habits.filter(h => h.category === 'Team'));
      
      console.log('Fetched habits:', {
        team: habits.filter(h => h.category === 'Team').length,
        personal: habits.filter(h => h.category === 'Personal').length,
        study: habits.filter(h => h.category === 'Study').length
      });
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    }
  };

  const loadLogsForMonth = async () => {
    try {
      const response = await api.get('/habits');
      const allHabits = response.data.habits || [];
      
      const logsMap = {};
      
      for (const habit of allHabits) {
        try {
          const logsResponse = await api.get(`/habits/${habit.id}/logs`);
          const habitLogs = logsResponse.data.logs || [];
          
          habitLogs.forEach(log => {
            const key = `${habit.id}-${log.log_date}`;
            if (log.hours > 0) {
              logsMap[key] = log.hours;
            } else {
              logsMap[key] = log.completed;
            }
          });
        } catch (error) {
          console.error(`Failed to load logs for habit ${habit.id}:`, error);
        }
      }
      
      setLogs(logsMap);
      console.log('Loaded logs from backend:', Object.keys(logsMap).length, 'entries');
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const canEditHabits = () => {
    if (isTestAccount) return true;
    const today = new Date();
    const day = today.getDate();
    return day === 1 || day === 2;
  };

  const canDeleteHabit = (createdAt) => {
    if (isTestAccount) return true;
    if (!createdAt) return false;
    try {
      const created = new Date(createdAt);
      const now = new Date();
      const hoursDiff = (now - created) / (1000 * 60 * 60);
      return hoursDiff < 1;
    } catch (error) {
      return false;
    }
  };

  const isDayLocked = (day) => {
    if (isTestAccount) return false;
    const now = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const targetDate = new Date(year, month, day, 23, 59, 59);
    return now > targetDate;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };

  const getDateString = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getLogStatus = (habitId, day) => {
    const dateStr = getDateString(day);
    const key = `${habitId}-${dateStr}`;
    return logs[key];
  };

  const getStudyHours = (habitId, day) => {
    const dateStr = getDateString(day);
    const key = `${habitId}-${dateStr}`;
    const value = logs[key];
    return typeof value === 'number' ? value : '';
  };

  const toggleHabit = async (habitId, day) => {
    if (isDayLocked(day) && !isTestAccount) {
      alert('This day is locked!');
      return;
    }

    const dateStr = getDateString(day);
    const currentStatus = getLogStatus(habitId, day);
    const newStatus = !currentStatus;

    const key = `${habitId}-${dateStr}`;
    setLogs({ ...logs, [key]: newStatus });

    console.log('Toggling habit:', { habitId, dateStr, newStatus });

    try {
      await api.post('/habits/log', {
        habit_id: habitId,
        log_date: dateStr,
        completed: newStatus,
        hours: 0
      });
      console.log('✅ Saved to backend successfully');
      
      const today = new Date().toISOString().split('T')[0];
      if (dateStr === today) {
        await calculateTodayProgress();
        const streakData = await fetchStreakInfo();
        
        // Check for streak milestones and show elegant notification
        if (streakData && newStatus) {
          const streak = streakData.current_streak;
          if (streak === 7) {
            toast.success('🔥 7-Day Streak! +2 points', {
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
              },
            });
          } else if (streak === 14) {
            toast.success('🔥 14-Day Streak! +5 points', {
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
              },
            });
          } else if (streak === 21) {
            toast.success('🔥 21-Day Streak! +10 points', {
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#fff',
              },
            });
          } else if (streak === 30) {
            toast.success('🔥 30-Day Streak! +20 points', {
              duration: 5000,
              style: {
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: '#fff',
                fontSize: '16px',
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to save to backend:', error);
      console.error('Error details:', error.response?.data);
      
      toast.error('Failed to save. Please try again.', {
        duration: 3000,
      });
    }
  };

  const logStudyHours = async (habitId, day, hours) => {
    if (isDayLocked(day) && !isTestAccount) {
      return;
    }

    const dateStr = getDateString(day);
    const hoursFloat = parseFloat(hours) || 0;
    const key = `${habitId}-${dateStr}`;
    
    setLogs({ ...logs, [key]: hoursFloat });

    console.log('Logging study hours:', { habitId, dateStr, hours: hoursFloat });

    try {
      await api.post('/habits/log', {
        habit_id: habitId,
        log_date: dateStr,
        completed: hoursFloat > 0,
        hours: hoursFloat
      });
      console.log('✅ Saved study hours to backend successfully');
    } catch (error) {
      console.error('❌ Failed to save study hours to backend:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const deleteHabit = async (habitId, createdAt, isStudy) => {
    console.log('DELETE CLICKED!', { habitId, createdAt, isStudy });
    
    if (!canDeleteHabit(createdAt)) {
      console.log('Delete blocked - outside 1 hour window');
      alert('You can only delete habits within 1 hour of creation!');
      return;
    }

    if (!confirm('Are you sure you want to delete this habit?')) {
      console.log('Delete cancelled by user');
      return;
    }

    console.log('Starting delete process...');

    try {
      console.log('Calling backend DELETE /habits/' + habitId);
      await api.delete(`/habits/${habitId}`);
      console.log('Backend delete SUCCESS');
      
      console.log('Removing from UI state...');
      if (isStudy) {
        setStudySkills(studySkills.filter(s => s.id !== habitId));
      } else {
        setPersonalHabits(personalHabits.filter(h => h.id !== habitId));
      }
      
      const newLogs = { ...logs };
      Object.keys(newLogs).forEach(key => {
        if (key.startsWith(`${habitId}-`)) {
          delete newLogs[key];
        }
      });
      setLogs(newLogs);
      
      console.log('Delete complete!');
      toast.success('Habit deleted', {
        duration: 2000,
        icon: '✓',
      });
      
      fetchAllHabits();
      await calculateTodayProgress();
      
    } catch (error) {
      console.error('DELETE ERROR:', error);
      toast.error('Failed to delete habit');
    }
  };

  const createPersonalHabit = async (e) => {
    e.preventDefault();
    
    if (!canEditHabits()) {
      alert('You can only add habits on the 1st or 2nd of the month!');
      return;
    }

    if (personalHabits.length >= 10) {
      alert('Maximum 10 personal habits allowed!');
      return;
    }

    try {
      await api.post('/habits', {
        name: newHabitName,
        category: 'Personal',
        point_value: 1
      });
      
      setNewHabitName('');
      setShowCreateHabitForm(false);
      fetchAllHabits();
      await calculateTodayProgress();
      
      toast.success('Habit added', {
        duration: 2000,
        icon: '✓',
      });
    } catch (error) {
      console.error('Create habit error:', error);
      toast.error('Failed to create habit');
    }
  };

  const createStudySkill = async (e) => {
    e.preventDefault();
    
    if (!canEditHabits()) {
      alert('You can only add study skills on the 1st or 2nd of the month!');
      return;
    }

    if (studySkills.length >= 5) {
      alert('Maximum 5 study skills allowed!');
      return;
    }

    try {
      await api.post('/habits', {
        name: newStudySkillName,
        category: 'Study',
        point_value: 0
      });
      
      setNewStudySkillName('');
      setShowCreateStudyForm(false);
      fetchAllHabits();
      
      toast.success('Study skill added', {
        duration: 2000,
        icon: '✓',
      });
    } catch (error) {
      console.error('Create study skill error:', error);
      toast.error('Failed to create study skill');
    }
  };

  const calculateMonthlyTotal = (habitId, points = 1) => {
    const days = getDaysInMonth(currentMonth);
    let total = 0;
    days.forEach(day => {
      const status = getLogStatus(habitId, day);
      if (status === true) {
        total += points;
      }
    });
    return total;
  };

  const calculateStudyTotal = (habitId) => {
    const days = getDaysInMonth(currentMonth);
    let total = 0;
    days.forEach(day => {
      const hours = getStudyHours(habitId, day);
      if (hours) {
        total += parseFloat(hours);
      }
    });
    return total.toFixed(1);
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);
  const today = new Date().getDate();
  const isCurrentMonth = new Date().getMonth() === currentMonth.getMonth() && 
                         new Date().getFullYear() === currentMonth.getFullYear();

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
                onClick={() => navigate('/leaderboard')}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition font-semibold text-sm"
              >
                🏆 Leaderboard
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
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-5 text-white mb-5">
          <h2 className="text-xl font-bold">Welcome back, {user?.full_name}! 👋</h2>
          <p className="text-blue-100 text-sm">{user?.role_title} • {user?.timezone}</p>
          {isTestAccount && (
            <p className="text-yellow-200 mt-2 text-sm">🧪 Test Mode Active - Logs save to database!</p>
          )}
        </div>

        {streakInfo && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-50 to-red-50 px-6 py-3 rounded-full mb-3">
                <span className="text-2xl">🔥</span>
                <span className="text-3xl font-bold text-gray-900">{streakInfo.current_streak}</span>
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">Day Streak</span>
              </div>
              <p className="text-sm text-gray-500">
                Best: {streakInfo.longest_streak} days • This Month: {streakInfo.month_completed_days}/{streakInfo.month_total_days}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Today's Progress</h3>
                <span className="text-xs text-gray-500">Locks at 11:59 PM</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className={`relative rounded-xl p-5 transition-all ${
                  todayProgress.teamCount > 0 
                    ? 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      todayProgress.teamCount > 0 ? 'bg-purple-500' : 'bg-gray-300'
                    }`}>
                      <span className="text-2xl">🏆</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Team Habits</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {todayProgress.teamCount}<span className="text-base text-gray-400">/{todayProgress.teamTotal}</span>
                      </p>
                    </div>
                    {todayProgress.teamCount > 0 ? (
                      <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                        <span>✓</span>
                        <span>Complete</span>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-gray-400">Pending</div>
                    )}
                  </div>
                </div>

                <div className={`relative rounded-xl p-5 transition-all ${
                  todayProgress.personalCount > 0 
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      todayProgress.personalCount > 0 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <span className="text-2xl">⭐</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Personal</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {todayProgress.personalCount}<span className="text-base text-gray-400">/{todayProgress.personalTotal}</span>
                      </p>
                    </div>
                    {todayProgress.personalCount > 0 ? (
                      <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                        <span>✓</span>
                        <span>Complete</span>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-gray-400">Pending</div>
                    )}
                  </div>
                </div>

                <div className={`relative rounded-xl p-5 transition-all ${
                  todayProgress.todoCount > 0 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      todayProgress.todoCount > 0 ? 'bg-blue-500' : 'bg-gray-300'
                    }`}>
                      <span className="text-2xl">📋</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">To-Do</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {todayProgress.todoCount}<span className="text-base text-gray-400">/{todayProgress.todoTotal}</span>
                      </p>
                    </div>
                    {todayProgress.todoCount > 0 ? (
                      <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                        <span>✓</span>
                        <span>Complete</span>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-gray-400">Pending</div>
                    )}
                  </div>
                </div>
              </div>

              {(todayProgress.teamCount > 0 && todayProgress.personalCount > 0 && todayProgress.todoCount > 0) && (
                <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-center">
                  <p className="text-white font-semibold">🎉 Streak Complete for Today!</p>
                  <p className="text-green-50 text-xs mt-1">Come back tomorrow to keep it going</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-4 mb-5">
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentMonth(newDate);
              }}
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
            >
              ← Previous
            </button>
            <h3 className="text-lg font-bold">{monthName}</h3>
            <button
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentMonth(newDate);
              }}
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setShowCreateHabitForm(!showCreateHabitForm)}
            disabled={!canEditHabits() || personalHabits.length >= 10}
            className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            {showCreateHabitForm ? '✕ Cancel' : `+ Personal Habit (${personalHabits.length}/10)`}
          </button>
          
          <button
            onClick={() => setShowCreateStudyForm(!showCreateStudyForm)}
            disabled={!canEditHabits() || studySkills.length >= 5}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            {showCreateStudyForm ? '✕ Cancel' : `+ Study Skill (${studySkills.length}/5)`}
          </button>
        </div>

        {showCreateHabitForm && (
          <div className="bg-white rounded-xl shadow p-5 mb-5">
            <h3 className="text-lg font-bold mb-3">Add Personal Habit (1pt)</h3>
            <form onSubmit={createPersonalHabit} className="flex gap-3">
              <input
                type="text"
                required
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
                placeholder="e.g., Read 10 mins, Pray"
                maxLength={50}
              />
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm">
                Add
              </button>
            </form>
          </div>
        )}

        {showCreateStudyForm && (
          <div className="bg-white rounded-xl shadow p-5 mb-5">
            <h3 className="text-lg font-bold mb-3">Add Study Skill (Variable pts)</h3>
            <form onSubmit={createStudySkill} className="flex gap-3">
              <input
                type="text"
                required
                value={newStudySkillName}
                onChange={(e) => setNewStudySkillName(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
                placeholder="e.g., Python, SQL, Excel"
                maxLength={50}
              />
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
                Add
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border-b-2 p-3 bg-gray-50 sticky left-0 z-10 min-w-[200px] text-left font-bold">Habit</th>
                {days.map(day => (
                  <th
                    key={day}
                    className={`border-b-2 p-2 text-center min-w-[40px] font-semibold ${
                      isCurrentMonth && day === today ? 'bg-blue-200 font-bold' : 'bg-gray-50'
                    }`}
                  >
                    {day}
                  </th>
                ))}
                <th className="border-b-2 p-3 bg-gray-50 min-w-[70px] font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gradient-to-r from-purple-600 to-purple-700">
                <td colSpan={days.length + 2} className="p-4 text-center">
                  <div className="text-white font-bold text-lg tracking-wide">
                    🏆 TEAM HABITS
                  </div>
                  <div className="text-purple-100 text-xs mt-1">
                    Everyone must complete • Fixed points
                  </div>
                </td>
              </tr>
              {teamHabitsFromDB.map((habit, idx) => (
                <tr key={habit.id} className={`hover:bg-purple-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="border-b p-2.5 sticky left-0 bg-white z-10">
                    <div className="font-semibold text-sm">{habit.name}</div>
                    <div className="text-xs text-purple-600 font-medium">{habit.point_value} points</div>
                  </td>
                  {days.map(day => {
                    const isChecked = getLogStatus(habit.id, day);
                    const isLocked = isDayLocked(day);
                    const isToday = isCurrentMonth && day === today;
                    
                    return (
                      <td
                        key={day}
                        className={`border-b p-1 text-center ${
                          isToday ? 'bg-blue-100 ring-2 ring-blue-400' : ''
                        } ${
                          isLocked && isChecked === true ? 'bg-green-100' :
                          isLocked && isChecked === false ? 'bg-red-100' :
                          ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={() => toggleHabit(habit.id, day)}
                          disabled={isLocked && !isTestAccount}
                          className="w-4 h-4 cursor-pointer accent-purple-600"
                        />
                      </td>
                    );
                  })}
                  <td className="border-b p-2 text-center font-bold text-purple-700 bg-purple-50">
                    {calculateMonthlyTotal(habit.id, habit.point_value)}
                  </td>
                </tr>
              ))}

              <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                <td colSpan={days.length + 2} className="p-4 text-center">
                  <div className="text-white font-bold text-lg tracking-wide">
                    📚 STUDY / SKILL BUILDING
                  </div>
                  <div className="text-blue-100 text-xs mt-1">
                    Your skills only • Max 5 • Hours = Points
                  </div>
                </td>
              </tr>
              {studySkills.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 2} className="border-b p-8 text-center text-gray-400 italic">
                    No study skills yet. Click "+ Study Skill" to add one.
                  </td>
                </tr>
              ) : (
                studySkills.map((skill, idx) => (
                  <tr key={skill.id} className={`hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="border-b p-2.5 sticky left-0 bg-white z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">{skill.name}</div>
                          <div className="text-xs text-blue-600 font-medium">Variable points</div>
                        </div>
                        {canDeleteHabit(skill.created_at) && (
                          <button
                            onClick={() => deleteHabit(skill.id, skill.created_at, true)}
                            className="text-red-500 hover:text-red-700 text-lg"
                            title="Delete (within 1 hour)"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                    {days.map(day => {
                      const hours = getStudyHours(skill.id, day);
                      const isLocked = isDayLocked(day);
                      const isToday = isCurrentMonth && day === today;
                      
                      return (
                        <td
                          key={day}
                          className={`border-b p-1 text-center ${
                            isToday ? 'bg-blue-100 ring-2 ring-blue-400' : ''
                          } ${hours > 0 ? 'bg-blue-50' : ''}`}
                        >
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={hours}
                            onChange={(e) => logStudyHours(skill.id, day, e.target.value)}
                            className="w-full px-1 py-1 text-center border rounded text-xs focus:ring-2 focus:ring-blue-400"
                            placeholder="0"
                            disabled={isLocked && !isTestAccount}
                          />
                        </td>
                      );
                    })}
                    <td className="border-b p-2 text-center font-bold text-blue-700 bg-blue-50">
                      {calculateStudyTotal(skill.id)}
                    </td>
                  </tr>
                ))
              )}

              <tr className="bg-gradient-to-r from-green-600 to-green-700">
                <td colSpan={days.length + 2} className="p-4 text-center">
                  <div className="text-white font-bold text-lg tracking-wide">
                    ⭐ PERSONAL HABITS
                  </div>
                  <div className="text-green-100 text-xs mt-1">
                    Your habits only • Max 10 • 1 point each
                  </div>
                </td>
              </tr>
              {personalHabits.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 2} className="border-b p-8 text-center text-gray-400 italic">
                    No personal habits yet. Click "+ Personal Habit" to add one.
                  </td>
                </tr>
              ) : (
                personalHabits.map((habit, idx) => (
                  <tr key={habit.id} className={`hover:bg-green-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="border-b p-2.5 sticky left-0 bg-white z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">{habit.name}</div>
                          <div className="text-xs text-green-600 font-medium">1 point</div>
                        </div>
                        {canDeleteHabit(habit.created_at) && (
                          <button
                            onClick={() => deleteHabit(habit.id, habit.created_at, false)}
                            className="text-red-500 hover:text-red-700 text-lg"
                            title="Delete (within 1 hour)"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                    {days.map(day => {
                      const isChecked = getLogStatus(habit.id, day);
                      const isLocked = isDayLocked(day);
                      const isToday = isCurrentMonth && day === today;
                      
                      return (
                        <td
                          key={day}
                          className={`border-b p-1 text-center ${
                            isToday ? 'bg-blue-100 ring-2 ring-blue-400' : ''
                          } ${
                            isLocked && isChecked === true ? 'bg-green-100' :
                            isLocked && isChecked === false ? 'bg-red-100' :
                            ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked || false}
                            onChange={() => toggleHabit(habit.id, day)}
                            disabled={isLocked && !isTestAccount}
                            className="w-4 h-4 cursor-pointer accent-green-600"
                          />
                        </td>
                      );
                    })}
                    <td className="border-b p-2 text-center font-bold text-green-700 bg-green-50">
                      {calculateMonthlyTotal(habit.id, 1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 bg-white rounded-xl shadow p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 border rounded"></div>
              <span>Done (Green)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 border rounded"></div>
              <span>Not Done (Red)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 border rounded"></div>
              <span>Today</span>
            </div>
            <div>💾 Saving to database!</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;