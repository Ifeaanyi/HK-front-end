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
  const [toggleLoading, setToggleLoading] = useState({});

  useEffect(() => {
    fetchTodos();
  }, []);

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
      return { message: "MAXIMUM BONUS ACHIEVED", tasksNeeded: 0 };
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
      message: `${tasksNeeded} MORE TO ${nextThreshold}% → +${nextBonus}PTS`,
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
      
      toast.success('TASK ADDED', {
        duration: 2000,
        icon: '✓',
        style: {
          background: '#fff',
          color: '#000',
          border: '1px solid #e5e7eb',
        },
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
      toast.error('FAILED TO ADD TASK');
    }
  };

  const toggleTodo = async (todoId, currentStatus) => {
    if (toggleLoading[todoId]) return;
    
    setToggleLoading(prev => ({ ...prev, [todoId]: true }));
    
    try {
      const oldBonus = getProductivityBonus();
      
      await api.patch(`/todos/${todoId}`, {
        completed: !currentStatus
      });
      
      setTodos(todos.map(t => 
        t.id === todoId ? { ...t, completed: !currentStatus } : t
      ));
      
      setTimeout(() => {
        const newBonus = getProductivityBonus();
        
        if (newBonus > oldBonus && !currentStatus) {
          if (newBonus === 20) {
            toast.success('85%+ PRODUCTIVITY • +20 POINTS', {
              duration: 4000,
              style: {
                background: '#fff',
                color: '#000',
                border: '2px solid #10b981',
              },
            });
          } else if (newBonus === 15) {
            toast.success('75%+ PRODUCTIVITY • +15 POINTS', {
              duration: 3000,
              style: {
                background: '#fff',
                color: '#000',
                border: '2px solid #3b82f6',
              },
            });
          } else if (newBonus === 10) {
            toast.success('65%+ PRODUCTIVITY • +10 POINTS', {
              duration: 3000,
              style: {
                background: '#fff',
                color: '#000',
                border: '2px solid #f59e0b',
              },
            });
          } else if (newBonus === 5) {
            toast.success('50%+ PRODUCTIVITY • +5 POINTS', {
              duration: 3000,
              style: {
                background: '#fff',
                color: '#000',
                border: '2px solid #8b5cf6',
              },
            });
          }
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to update todo:', error);
      toast.error('FAILED TO UPDATE');
    } finally {
      setToggleLoading(prev => ({ ...prev, [todoId]: false }));
    }
  };

  const deleteTodo = async (todoId) => {
    if (!confirm('Delete this task?')) return;
    
    try {
      await api.delete(`/todos/${todoId}`);
      setTodos(todos.filter(t => t.id !== todoId));
      
      toast.success('TASK DELETED', {
        duration: 2000,
        icon: '✓',
        style: {
          background: '#fff',
          color: '#000',
          border: '1px solid #e5e7eb',
        },
      });
    } catch (error) {
      console.error('Failed to delete todo:', error);
      toast.error('FAILED TO DELETE');
    }
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const monthTodos = getMonthTodos();
  const productivity = calculateProductivity();
  const bonus = getProductivityBonus();
  const nextLevel = getNextLevelInfo();
  const todayString = getTodayString();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 text-xs tracking-widest">LOADING</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-gray-200 sticky top-0 z-20 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-white text-sm">📋</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">TASKS</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 text-xs font-medium tracking-wide transition-colors"
              >
                ← DASHBOARD
              </button>
              <span className="text-xs text-gray-400 tracking-wide">{user?.full_name?.toUpperCase()}</span>
              <button
                onClick={logout}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all text-xs font-medium tracking-wide"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Month Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentMonth(newDate);
              }}
              className="w-10 h-10 rounded-full border border-gray-300 hover:border-gray-900 flex items-center justify-center transition-all group"
            >
              <span className="text-gray-400 group-hover:text-gray-900 transition-colors">←</span>
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{monthName}</h2>
            
            <button
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentMonth(newDate);
              }}
              className="w-10 h-10 rounded-full border border-gray-300 hover:border-gray-900 flex items-center justify-center transition-all group"
            >
              <span className="text-gray-400 group-hover:text-gray-900 transition-colors">→</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="border border-gray-200 rounded-2xl p-6 hover:border-gray-900 transition-all">
            <div className="text-xs text-gray-500 mb-2 tracking-widest">PRODUCTIVITY</div>
            <div className="text-5xl font-bold text-gray-900 mb-1">{productivity}%</div>
            <div className="text-xs text-gray-400">
              {monthTodos.filter(t => t.completed).length} OF {monthTodos.length} COMPLETE
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-2xl p-6 hover:border-gray-900 transition-all">
            <div className="text-xs text-gray-500 mb-2 tracking-widest">BONUS</div>
            <div className="text-5xl font-bold text-gray-900 mb-1">+{bonus}</div>
            <div className="text-xs text-gray-400">
              {bonus === 20 ? 'MAXIMUM' : bonus === 15 ? 'EXCELLENT' : bonus === 10 ? 'GOOD' : bonus === 5 ? 'KEEP GOING' : 'START NOW'}
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-2xl p-6 hover:border-gray-900 transition-all">
            <div className="text-xs text-gray-500 mb-2 tracking-widest">NEXT LEVEL</div>
            <div className="text-lg font-bold text-gray-900 mb-1">{nextLevel.message}</div>
            <div className="text-xs text-gray-400">PUSH HARDER</div>
          </div>
        </div>

        {/* Add Task Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full border-2 border-dashed border-gray-300 hover:border-gray-900 rounded-2xl py-4 text-gray-400 hover:text-gray-900 transition-all font-medium text-sm tracking-wide"
          >
            {showAddForm ? '✕ CANCEL' : '+ NEW TASK'}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="border border-gray-200 rounded-2xl p-6 mb-6">
            <form onSubmit={addTodo} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2 tracking-widest">TASK NAME</label>
                <input
                  type="text"
                  required
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-all"
                  placeholder="Enter task description"
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-2 tracking-widest">DATE</label>
                <input
                  type="date"
                  required
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-all"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 font-medium text-xs tracking-widest transition-all"
              >
                ADD TASK
              </button>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-2">
          {monthTodos.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-400 text-sm tracking-wide">NO TASKS FOR {monthName}</p>
            </div>
          ) : (
            monthTodos
              .sort((a, b) => new Date(a.task_date) - new Date(b.task_date))
              .map((todo) => {
                const isToday = todo.task_date === todayString;
                const isLoading = toggleLoading[todo.id];
                
                return (
                  <div
                    key={todo.id}
                    className={`border rounded-2xl p-4 transition-all ${
                      isToday 
                        ? 'border-gray-900 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-400'
                    } ${todo.completed ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => toggleTodo(todo.id, todo.completed)}
                          disabled={isLoading}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            todo.completed 
                              ? 'bg-gray-900 border-gray-900' 
                              : 'border-gray-300 hover:border-gray-900'
                          }`}
                        >
                          {todo.completed && <span className="text-white text-xs">✓</span>}
                        </button>
                        
                        <div className="flex-1">
                          <div className={`font-medium text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {todo.task_name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(todo.task_date + 'T00:00:00').toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }).toUpperCase()}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all"
                        title="Delete"
                      >
                        <span className="text-gray-400 hover:text-gray-900">✕</span>
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Tip */}
        {monthTodos.length > 0 && (
          <div className="mt-8 border border-blue-200 bg-blue-50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <span className="text-xs text-gray-600 tracking-wide">
                CHECK AT LEAST 1 TASK TODAY TO MAINTAIN YOUR STREAK
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ToDoList;