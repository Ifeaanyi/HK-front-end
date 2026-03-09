import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const S = {
  bg: '#0A1628',
  surface: '#0F2040',
  surfaceAlt: '#132A52',
  border: '#1E3A5F',
  borderBright: '#2A5A9F',
  text: '#FFFFFF',
  textSub: '#C8D8E8',
  muted: '#7A9BBF',
  gold: '#C9A84C',
  goldBright: '#E8C060',
  green: '#00E676',
  greenDim: '#1A4A2A',
  greenBorder: '#00C853',
  red: '#FF5252',
  blue: '#0A2E52',
  blueHeader: '#0F3D6E',
  blueLight: '#42A5F5',
};

function ToDoList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState({});
  const [editingDateId, setEditingDateId] = useState(null);
  const [editingDateValue, setEditingDateValue] = useState('');

  useEffect(() => { fetchTodos(); }, []);

  const fetchTodos = async () => {
    try {
      const response = await api.get('/todos');
      setTodos(response.data.todos || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      setLoading(false);
    }
  };

  const getMonthTodos = () => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    return todos.filter(todo => todo.task_date.substring(0, 7) === `${year}-${month}`);
  };

  const calculateProductivity = () => {
    const monthTodos = getMonthTodos();
    if (monthTodos.length === 0) return 0;
    return ((monthTodos.filter(t => t.completed).length / monthTodos.length) * 100).toFixed(1);
  };

  const getProductivityBonus = () => {
    const p = parseFloat(calculateProductivity());
    if (p >= 85) return 20;
    if (p >= 75) return 15;
    if (p >= 65) return 10;
    if (p >= 50) return 5;
    return 0;
  };

  const getNextLevelInfo = () => {
    const productivity = parseFloat(calculateProductivity());
    const monthTodos = getMonthTodos();
    const completed = monthTodos.filter(t => t.completed).length;
    if (productivity >= 85) return { message: 'Maximum bonus reached!' };
    let nextThreshold, nextBonus;
    if (productivity >= 75) { nextThreshold = 85; nextBonus = 20; }
    else if (productivity >= 65) { nextThreshold = 75; nextBonus = 15; }
    else if (productivity >= 50) { nextThreshold = 65; nextBonus = 10; }
    else { nextThreshold = 50; nextBonus = 5; }
    const tasksNeeded = Math.ceil((nextThreshold * monthTodos.length / 100) - completed);
    return { message: `${tasksNeeded} more task${tasksNeeded > 1 ? 's' : ''} → ${nextThreshold}% → +${nextBonus}pts` };
  };

  const addTodo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/todos', { task_name: newTaskName, task_date: newTaskDate });
      setNewTaskName(''); setNewTaskDate(''); setShowAddForm(false);
      fetchTodos();
      toast.success('Task added', { duration: 2000, icon: '✓' });
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const toggleTodo = async (todoId, currentStatus) => {
    if (toggleLoading[todoId]) return;
    setToggleLoading(prev => ({ ...prev, [todoId]: true }));
    try {
      const oldBonus = getProductivityBonus();
      await api.patch(`/todos/${todoId}`, { completed: !currentStatus });
      setTodos(todos.map(t => t.id === todoId ? { ...t, completed: !currentStatus } : t));
      setTimeout(() => {
        const newBonus = getProductivityBonus();
        if (newBonus > oldBonus && !currentStatus) {
          toast.success(`${newBonus === 20 ? '85%+' : newBonus === 15 ? '75%+' : newBonus === 10 ? '65%+' : '50%+'} Productivity! +${newBonus} points`, { duration: 3000 });
        }
      }, 100);
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setToggleLoading(prev => ({ ...prev, [todoId]: false }));
    }
  };

  const deleteTodo = async (todoId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/todos/${todoId}`);
      setTodos(todos.filter(t => t.id !== todoId));
      toast.success('Task deleted', { duration: 2000 });
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const saveEditedDate = async (todoId) => {
    if (!editingDateValue) { setEditingDateId(null); return; }
    try {
      await api.patch(`/todos/${todoId}`, { task_date: editingDateValue });
      setTodos(todos.map(t => t.id === todoId ? { ...t, task_date: editingDateValue } : t));
      toast.success('Date updated', { duration: 2000 });
    } catch (error) {
      toast.error('Failed to update date');
    } finally {
      setEditingDateId(null);
      setEditingDateValue('');
    }
  };

  const getTodayString = () => {
    const userTz = user?.timezone || 'Africa/Lagos';
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: userTz })).toISOString().split('T')[0];
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthTodos = getMonthTodos();
  const productivity = calculateProductivity();
  const bonus = getProductivityBonus();
  const nextLevel = getNextLevelInfo();
  const todayString = getTodayString();

  if (loading) {
    return (
      <div style={{ backgroundColor: S.bg }} className="min-h-screen flex items-center justify-center">
        <p style={{ color: S.muted }} className="text-sm tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: S.bg, minHeight: '100vh' }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.borderBright}` }} className="sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <img src="/logo.png" alt="Habit King" className="h-16 w-auto" />
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              style={{ color: S.goldBright, border: `1px solid ${S.gold}`, backgroundColor: 'transparent' }}
              className="px-4 py-1.5 text-xs font-bold rounded-lg hover:bg-yellow-900 hover:bg-opacity-20 transition">
              ← Dashboard
            </button>
            <span style={{ color: S.textSub }} className="text-xs font-medium">{user?.full_name}</span>
            <button onClick={logout}
              style={{ border: `1px solid ${S.red}`, color: S.red, backgroundColor: 'transparent' }}
              className="px-4 py-1.5 text-xs font-bold rounded-lg hover:bg-red-900 hover:bg-opacity-20 transition">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* HEADER BANNER */}
        <div style={{ backgroundColor: S.blueHeader, border: `2px solid ${S.blueLight}` }} className="rounded-2xl p-8 mb-6">
          <h2 style={{ color: S.text }} className="text-3xl font-black mb-1 tracking-wide">{monthName.toUpperCase()} — TO-DO</h2>
          <p style={{ color: '#90CAF9' }} className="text-sm font-medium">Track your tasks and boost your productivity score.</p>
        </div>

        {/* STATS ROW */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Productivity */}
          <div style={{ backgroundColor: S.surfaceAlt, border: `2px solid ${S.borderBright}` }} className="rounded-2xl p-6 text-center">
            <p style={{ color: S.goldBright }} className="text-5xl font-black">{productivity}%</p>
            <p style={{ color: S.text }} className="text-sm font-bold uppercase tracking-widest mt-2">Productivity</p>
            <p style={{ color: S.textSub }} className="text-sm mt-1">{monthTodos.filter(t => t.completed).length} / {monthTodos.length} complete</p>
          </div>
          {/* Bonus */}
          <div style={{ backgroundColor: S.surfaceAlt, border: `2px solid ${S.greenBorder}` }} className="rounded-2xl p-6 text-center">
            <p style={{ color: S.green }} className="text-5xl font-black">+{bonus}pts</p>
            <p style={{ color: S.text }} className="text-sm font-bold uppercase tracking-widest mt-2">Current Bonus</p>
            <p style={{ color: S.textSub }} className="text-sm mt-1">
              {bonus === 20 ? 'Maximum!' : bonus === 15 ? 'Great work!' : bonus === 10 ? 'Good!' : bonus === 5 ? 'Keep going!' : 'Add tasks to score'}
            </p>
          </div>
          {/* Next Level */}
          <div style={{ backgroundColor: S.surfaceAlt, border: `2px solid ${S.borderBright}` }} className="rounded-2xl p-6 text-center flex flex-col justify-center">
            <p style={{ color: S.blueLight }} className="text-base font-bold leading-snug">{nextLevel.message}</p>
            <p style={{ color: S.textSub }} className="text-xs uppercase tracking-widest mt-2">Next Level Goal</p>
          </div>
        </div>

        {/* MONTH NAV */}
        <div style={{ backgroundColor: S.surface, border: `1px solid ${S.borderBright}` }} className="rounded-xl p-4 mb-5 flex justify-between items-center">
          <button
            onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d); }}
            style={{ backgroundColor: S.gold, color: '#0A0F1E' }}
            className="px-6 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition shadow-lg">
            ← Prev Month
          </button>
          <h3 style={{ color: S.text }} className="text-base font-black uppercase tracking-widest">{monthName}</h3>
          <button
            onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d); }}
            style={{ backgroundColor: S.gold, color: '#0A0F1E' }}
            className="px-6 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition shadow-lg">
            Next Month →
          </button>
        </div>

        {/* ADD TASK BUTTON */}
        <div className="mb-5">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              backgroundColor: showAddForm ? 'transparent' : S.gold,
              color: showAddForm ? S.red : '#0A0F1E',
              border: showAddForm ? `1px solid ${S.red}` : 'none'
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition">
            {showAddForm ? '✕ Cancel' : '+ Add New Task'}
          </button>
        </div>

        {/* ADD FORM */}
        {showAddForm && (
          <div style={{ backgroundColor: S.surfaceAlt, border: `2px solid ${S.borderBright}` }} className="rounded-2xl p-6 mb-6">
            <h3 style={{ color: S.text }} className="text-sm font-black uppercase tracking-widest mb-4">New Task</h3>
            <form onSubmit={addTodo} className="space-y-4">
              <div>
                <label style={{ color: S.textSub }} className="block text-xs font-bold uppercase tracking-wider mb-2">Task Name</label>
                <input type="text" required value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)}
                  style={{ backgroundColor: S.bg, border: `1px solid ${S.borderBright}`, color: S.text }}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-yellow-400 transition"
                  placeholder="e.g., Complete dashboard report" maxLength={100} />
              </div>
              <div>
                <label style={{ color: S.textSub }} className="block text-xs font-bold uppercase tracking-wider mb-2">Date</label>
                <input type="date" required value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)}
                  style={{ backgroundColor: S.bg, border: `1px solid ${S.borderBright}`, color: S.text }}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:border-yellow-400 transition" />
              </div>
              <button type="submit"
                style={{ backgroundColor: S.gold, color: '#0A0F1E' }}
                className="px-8 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition">
                Add Task
              </button>
            </form>
          </div>
        )}

        {/* TASK TABLE */}
        <div style={{ backgroundColor: S.surface, border: `2px solid ${S.borderBright}` }} className="rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: S.blue, borderBottom: `2px solid ${S.blueLight}` }}>
                <th style={{ color: S.text }} className="p-4 text-left text-sm font-black uppercase tracking-wider">Task</th>
                <th style={{ color: S.text }} className="p-4 text-center text-sm font-black uppercase tracking-wider w-44">
                  Date
                  <span style={{ color: '#90CAF9' }} className="block text-xs font-normal normal-case tracking-normal">double-click to edit</span>
                </th>
                <th style={{ color: S.text }} className="p-4 text-center text-sm font-black uppercase tracking-wider w-24">Done</th>
                <th style={{ color: S.text }} className="p-4 text-center text-sm font-black uppercase tracking-wider w-20">Del</th>
              </tr>
            </thead>
            <tbody>
              {monthTodos.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: S.textSub }} className="p-10 text-center text-sm">
                    No tasks for {monthName} yet. Add one above.
                  </td>
                </tr>
              ) : (
                monthTodos
                  .sort((a, b) => new Date(a.task_date) - new Date(b.task_date))
                  .map((todo, idx) => {
                    const isToday = todo.task_date === todayString;
                    const isLoading = toggleLoading[todo.id];
                    const isEditingDate = editingDateId === todo.id;
                    return (
                      <tr key={todo.id}
                        style={{
                          backgroundColor: isToday ? '#0A2A4A' : idx % 2 === 0 ? S.surface : S.surfaceAlt,
                          borderBottom: `1px solid ${S.border}`,
                        }}>
                        {/* TASK NAME */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {todo.completed && (
                              <span style={{ color: S.green, fontSize: '10px', border: `1px solid ${S.green}`, borderRadius: '4px', padding: '1px 5px', fontWeight: 'bold' }}>DONE</span>
                            )}
                            <span style={{
                              color: todo.completed ? S.muted : S.text,
                              textDecoration: todo.completed ? 'line-through' : 'none',
                              textDecorationColor: S.muted,
                              textDecorationThickness: '2px',
                              fontSize: '14px',
                              fontWeight: todo.completed ? '400' : '600',
                            }}>
                              {todo.task_name}
                            </span>
                          </div>
                        </td>
                        {/* DATE */}
                        <td className="p-4 text-center">
                          {isEditingDate ? (
                            <input type="date" value={editingDateValue}
                              onChange={(e) => setEditingDateValue(e.target.value)}
                              onBlur={() => saveEditedDate(todo.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditedDate(todo.id);
                                if (e.key === 'Escape') { setEditingDateId(null); setEditingDateValue(''); }
                              }}
                              style={{ backgroundColor: S.bg, border: `2px solid ${S.goldBright}`, color: S.text }}
                              className="px-2 py-1 rounded-lg text-xs focus:outline-none"
                              autoFocus />
                          ) : (
                            <span
                              onClick={() => { setEditingDateId(todo.id); setEditingDateValue(todo.task_date); }}
                              style={{ color: isToday ? S.goldBright : S.textSub, cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                              className="hover:text-yellow-300 transition"
                              title="Double-click to edit date">
                              {new Date(todo.task_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </td>
                        {/* TOGGLE */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleTodo(todo.id, todo.completed)}
                            disabled={isLoading}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: `2px solid ${todo.completed ? S.greenBorder : S.borderBright}`,
                              backgroundColor: todo.completed ? S.greenDim : 'transparent',
                              color: S.green,
                              fontSize: '16px',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}>
                            {todo.completed ? '✓' : ''}
                          </button>
                        </td>
                        {/* DELETE */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            style={{
                              color: S.red,
                              fontSize: '18px',
                              fontWeight: 'bold',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            className="hover:opacity-70 transition">
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {monthTodos.length > 0 && (
          <div style={{ backgroundColor: S.surfaceAlt, border: `1px solid ${S.borderBright}` }} className="mt-5 rounded-xl p-4">
            <p style={{ color: S.textSub }} className="text-sm font-medium">Check at least 1 task today to maintain your streak.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default ToDoList;