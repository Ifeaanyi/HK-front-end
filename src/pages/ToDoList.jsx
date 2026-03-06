import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const S = {
  bg: '#0D1B2A',
  surface: '#152338',
  border: '#1E3A5F',
  text: '#F5F0E8',
  muted: '#8A9BB0',
  gold: '#C9A84C',
  hover: '#1E3050',
  blue: '#1A4A7A',
  blueLight: '#2A6AAA',
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
        <p style={{ color: S.muted }} className="text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: S.bg, minHeight: '100vh' }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }} className="sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <img src="/logo.png" alt="Habit King" className="h-16 w-auto" />
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              style={{ color: S.gold, border: `1px solid ${S.border}` }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg hover:border-yellow-600 transition">
              ← Dashboard
            </button>
            <span style={{ color: S.muted }} className="text-xs">{user?.full_name}</span>
            <button onClick={logout}
              style={{ border: `1px solid #4A1A1A`, color: '#E07070' }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-red-900 hover:bg-opacity-20 transition">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* HEADER */}
        <div style={{ backgroundColor: S.blue, border: `1px solid ${S.blueLight}` }} className="rounded-2xl p-8 mb-6">
          <h2 style={{ color: S.text }} className="text-2xl font-bold mb-1">{monthName.toUpperCase()} — TO-DO</h2>
          <p style={{ color: S.muted }} className="text-sm">Track your tasks and boost your productivity score.</p>
        </div>

        {/* STATS */}
        <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-2xl p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p style={{ color: S.gold }} className="text-4xl font-black">{productivity}%</p>
              <p style={{ color: S.muted }} className="text-xs uppercase tracking-wider mt-1">Productivity</p>
              <p style={{ color: S.muted }} className="text-xs mt-1">{monthTodos.filter(t => t.completed).length}/{monthTodos.length} complete</p>
            </div>
            <div className="text-center">
              <p style={{ color: '#6DBF8A' }} className="text-4xl font-black">+{bonus}pts</p>
              <p style={{ color: S.muted }} className="text-xs uppercase tracking-wider mt-1">Current Bonus</p>
              <p style={{ color: S.muted }} className="text-xs mt-1">
                {bonus === 20 ? 'Maximum!' : bonus === 15 ? 'Great!' : bonus === 10 ? 'Good!' : bonus === 5 ? 'Keep going!' : 'Add tasks!'}
              </p>
            </div>
            <div className="text-center flex flex-col justify-center">
              <p style={{ color: S.blueLight }} className="text-sm font-semibold leading-tight">{nextLevel.message}</p>
              <p style={{ color: S.muted }} className="text-xs mt-2">Next Level Goal</p>
            </div>
          </div>
        </div>

        {/* MONTH NAV */}
        <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-xl p-4 mb-5 flex justify-between items-center">
          <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d); }}
            style={{ backgroundColor: S.gold, color: S.bg }}
            className="px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition">
            ← Prev Month
          </button>
          <h3 style={{ color: S.text }} className="text-sm font-bold uppercase tracking-wider">{monthName}</h3>
          <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d); }}
            style={{ backgroundColor: S.gold, color: S.bg }}
            className="px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition">
            Next Month →
          </button>
        </div>

        {/* ADD TASK */}
        <div className="mb-5">
          <button onClick={() => setShowAddForm(!showAddForm)}
            style={{ backgroundColor: showAddForm ? 'transparent' : S.gold, color: showAddForm ? '#E07070' : S.bg, border: showAddForm ? '1px solid #4A1A1A' : 'none' }}
            className="px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition">
            {showAddForm ? '✕ Cancel' : '+ Add New Task'}
          </button>
        </div>

        {showAddForm && (
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-xl p-6 mb-6">
            <form onSubmit={addTodo} className="space-y-4">
              <div>
                <label style={{ color: S.muted }} className="block text-xs uppercase tracking-wider mb-2">Task Name</label>
                <input type="text" required value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)}
                  style={{ backgroundColor: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-yellow-600 transition"
                  placeholder="e.g., Complete dashboard report" maxLength={100} />
              </div>
              <div>
                <label style={{ color: S.muted }} className="block text-xs uppercase tracking-wider mb-2">Date</label>
                <input type="date" required value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)}
                  style={{ backgroundColor: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-yellow-600 transition" />
              </div>
              <button type="submit" style={{ backgroundColor: S.gold, color: S.bg }} className="px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition">
                Add Task
              </button>
            </form>
          </div>
        )}

        {/* TASK TABLE */}
        <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: S.blue, borderBottom: `1px solid ${S.border}` }}>
                <th style={{ color: S.text }} className="p-4 text-left text-xs uppercase tracking-wider font-bold">Task</th>
                <th style={{ color: S.text }} className="p-4 text-center text-xs uppercase tracking-wider font-bold w-40">Date <span style={{ color: S.muted }} className="text-xs normal-case font-normal">(double-click)</span></th>
                <th style={{ color: S.text }} className="p-4 text-center text-xs uppercase tracking-wider font-bold w-24">Done</th>
                <th style={{ color: S.text }} className="p-4 text-center text-xs uppercase tracking-wider font-bold w-20">Del</th>
              </tr>
            </thead>
            <tbody>
              {monthTodos.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: S.muted }} className="p-10 text-center text-sm italic">
                    No tasks for {monthName} yet. Add one above.
                  </td>
                </tr>
              ) : (
                monthTodos
                  .sort((a, b) => new Date(a.task_date) - new Date(b.task_date))
                  .map((todo) => {
                    const isToday = todo.task_date === todayString;
                    const isLoading = toggleLoading[todo.id];
                    const isEditingDate = editingDateId === todo.id;
                    return (
                      <tr key={todo.id}
                        style={{
                          backgroundColor: isToday ? '#0D2A4A' : 'transparent',
                          borderBottom: `1px solid ${S.border}`,
                          opacity: todo.completed ? 0.6 : 1
                        }}>
                        <td className="p-4">
                          <span style={{ color: todo.completed ? '#4A6A8A' : S.text, textDecorationColor: S.border }}
                            className={`text-sm font-medium ${todo.completed ? 'line-through' : ''}`}>
                            {todo.task_name}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {isEditingDate ? (
                            <input type="date" value={editingDateValue}
                              onChange={(e) => setEditingDateValue(e.target.value)}
                              onBlur={() => saveEditedDate(todo.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveEditedDate(todo.id); if (e.key === 'Escape') { setEditingDateId(null); setEditingDateValue(''); } }}
                              style={{ backgroundColor: S.bg, border: `1px solid ${S.gold}`, color: S.text }}
                              className="px-2 py-1 rounded text-xs focus:outline-none"
                              autoFocus />
                          ) : (
                            <span
                              onDoubleClick={() => { setEditingDateId(todo.id); setEditingDateValue(todo.task_date); }}
                              style={{ color: isToday ? S.gold : S.muted, cursor: 'pointer' }}
                              className="text-xs hover:text-yellow-500 transition"
                              title="Double-click to edit date">
                              {new Date(todo.task_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => toggleTodo(todo.id, todo.completed)} disabled={isLoading}
                            style={{
                              backgroundColor: todo.completed ? '#2A5A2A' : 'transparent',
                              border: `2px solid ${todo.completed ? '#4A8A4A' : S.border}`,
                              color: '#6DBF6D'
                            }}
                            className="w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs transition">
                            {todo.completed && '✓'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => deleteTodo(todo.id)}
                            style={{ color: '#E07070' }}
                            className="text-xs hover:opacity-80 transition">
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
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="mt-5 rounded-xl p-4">
            <p style={{ color: S.muted }} className="text-xs">Check at least 1 task today to maintain your streak.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default ToDoList;