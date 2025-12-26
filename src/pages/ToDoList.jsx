import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

function ToDoList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await api.get('/todos');
      setTodos(response.data.todos || []);
      setLoading(false);
      console.log('Fetched todos:', response.data.todos);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      setLoading(false);
    }
  };

  const getMonthTodos = () => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    
    return todos.filter(todo => {
      const todoMonth = todo.task_date.substring(0, 7);
      return todoMonth === `${year}-${month}`;
    });
  };

  const calculateProductivity = () => {
    const monthTodos = getMonthTodos();
    if (monthTodos.length === 0) return 0;
    
    const completed = monthTodos.filter(t => t.completed).length;
    return ((completed / monthTodos.length) * 100).toFixed(1);
  };

  const getProductivityBonus = () => {
    const productivity = parseFloat(calculateProductivity());
    
    if (productivity >= 85) return 20;
    if (productivity >= 75) return 15;
    if (productivity >= 65) return 10;
    if (productivity >= 50) return 5;
    return 0;
  };

  const getNextLevelInfo = () => {
    const productivity = parseFloat(calculateProductivity());
    const monthTodos = getMonthTodos();
    const completed = monthTodos.filter(t => t.completed).length;
    
    if (productivity >= 85) {
      return { message: "Maximum bonus reached! 🎉", tasksNeeded: 0 };
    }
    
    let nextThreshold, nextBonus;
    if (productivity >= 75) {
      nextThreshold = 85;
      nextBonus = 20;
    } else if (productivity >= 65) {
      nextThreshold = 75;
      nextBonus = 15;
    } else if (productivity >= 50) {
      nextThreshold = 65;
      nextBonus = 10;
    } else {
      nextThreshold = 50;
      nextBonus = 5;
    }
    
    const tasksNeeded = Math.ceil((nextThreshold * monthTodos.length / 100) - completed);
    return {
      message: `Complete ${tasksNeeded} more task${tasksNeeded > 1 ? 's' : ''} to reach ${nextThreshold}% → +${nextBonus}pts!`,
      tasksNeeded
    };
  };

  const addTodo = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/todos', {
        task_name: newTaskName,
        task_date: newTaskDate
      });
      
      setNewTaskName('');
      setNewTaskDate('');
      setShowAddForm(false);
      fetchTodos();
      console.log('Todo created successfully');
      
      // NOTIFICATION ADDED
      toast.success('Task added', {
        duration: 2000,
        icon: '✓',
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
      toast.error('Failed to add task');
    }
  };

  const toggleTodo = async (todoId, currentStatus) => {
    try {
      // Get old bonus before update
      const oldBonus = getProductivityBonus();
      
      await api.patch(`/todos/${todoId}`, {
        completed: !currentStatus
      });
      
      setTodos(todos.map(t => 
        t.id === todoId ? { ...t, completed: !currentStatus } : t
      ));
      console.log('Todo toggled successfully');
      
      // Calculate new bonus after update
      setTimeout(() => {
        const newBonus = getProductivityBonus();
        
        // NOTIFICATION ADDED - Only if bonus tier increased and we're completing (not uncompleting)
        if (newBonus > oldBonus && !currentStatus) {
          if (newBonus === 20) {
            toast.success('🎉 85%+ Productivity! +20 points', {
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
              },
            });
          } else if (newBonus === 15) {
            toast.success('💪 75%+ Productivity! +15 points', {
              duration: 3000,
              style: {
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
              },
            });
          } else if (newBonus === 10) {
            toast.success('✨ 65%+ Productivity! +10 points', {
              duration: 3000,
              style: {
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#fff',
              },
            });
          } else if (newBonus === 5) {
            toast.success('📈 50%+ Productivity! +5 points', {
              duration: 3000,
              style: {
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: '#fff',
              },
            });
          }
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to update todo:', error);
      toast.error('Failed to update task');
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthTodos = getMonthTodos();
  const productivity = calculateProductivity();
  const bonus = getProductivityBonus();
  const nextLevel = getNextLevelInfo();
  const todayString = getTodayString();

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
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                ← Back to Dashboard
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

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl p-6 text-white mb-6">
          <h2 className="text-2xl font-bold mb-2">📋 {monthName} TO-DO LIST</h2>
          <p className="text-orange-100">Track your tasks and boost your productivity score!</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{productivity}%</div>
              <div className="text-sm text-gray-600">Productivity</div>
              <div className="text-xs text-gray-500 mt-1">
                {monthTodos.filter(t => t.completed).length}/{monthTodos.length} complete
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">+{bonus}pts</div>
              <div className="text-sm text-gray-600">Current Bonus</div>
              <div className="text-xs text-gray-500 mt-1">
                {bonus === 20 ? 'Maximum!' : bonus === 15 ? 'Great!' : bonus === 10 ? 'Good!' : bonus === 5 ? 'Keep going!' : 'Add tasks!'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600 mb-2 leading-tight">
                {nextLevel.message}
              </div>
              <div className="text-xs text-gray-500 mt-2">💪 Next Level Goal</div>
            </div>
          </div>
        </div>

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
              ← Previous Month
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
              Next Month →
            </button>
          </div>
        </div>

        <div className="mb-5">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-6 py-3 rounded-lg font-bold hover:from-orange-600 hover:to-pink-700 transition shadow-lg"
          >
            {showAddForm ? '✕ Cancel' : '+ Add New Task'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Add New Task</h3>
            <form onSubmit={addTodo} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Task Name</label>
                <input
                  type="text"
                  required
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm"
                  placeholder="e.g., Complete DeFy dashboard"
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Date</label>
                <input
                  type="date"
                  required
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm"
                />
              </div>
              
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold"
              >
                Add Task
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-500 to-pink-600 text-white">
              <tr>
                <th className="p-4 text-left font-bold">Task</th>
                <th className="p-4 text-center font-bold w-40">Date</th>
                <th className="p-4 text-center font-bold w-24">Done</th>
              </tr>
            </thead>
            <tbody>
              {monthTodos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-400 italic">
                    No tasks for {monthName} yet. Click "Add New Task" to create one!
                  </td>
                </tr>
              ) : (
                monthTodos
                  .sort((a, b) => new Date(a.task_date) - new Date(b.task_date))
                  .map((todo, idx) => {
                    const isToday = todo.task_date === todayString;
                    return (
                      <tr
                        key={todo.id}
                        className={`border-b ${
                          isToday 
                            ? 'bg-blue-50' 
                            : idx % 2 === 0 
                            ? 'bg-white' 
                            : 'bg-gray-50'
                        } ${
                          todo.completed ? 'opacity-60' : ''
                        } hover:bg-orange-50 transition`}
                      >
                        <td className="p-4">
                          <div className={`font-semibold ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                            {todo.task_name}
                          </div>
                        </td>
                        <td className="p-4 text-center text-sm text-gray-600">
                          {new Date(todo.task_date + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo.id, todo.completed)}
                            className="w-6 h-6 cursor-pointer accent-green-600"
                          />
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {monthTodos.length > 0 && (
          <div className="mt-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-2xl">💡</span>
              <span className="text-gray-700">
                <strong>TIP:</strong> Check at least 1 task today to maintain your streak! 🔥
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ToDoList;