import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = 'https://habit-king-production.up.railway.app/api/v1';

export default function FriendTodos() {
  const { friendId } = useParams();
  const [friend, setFriend] = useState(null);
  const [todos, setTodos] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchFriendTodos();
  }, [friendId]);

  const fetchFriendTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/friends/${friendId}/todos`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setFriend(response.data.friend);
      setTodos(response.data.todos);
    } catch (error) {
      console.error('Error fetching friend todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getMonthName = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getMonthTodos = () => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;
    
    return todos
      .filter(todo => todo.task_date.startsWith(monthStr))
      .sort((a, b) => new Date(a.task_date) - new Date(b.task_date));
  };

  const groupTodosByDate = (todosList) => {
    const grouped = {};
    todosList.forEach(todo => {
      if (!grouped[todo.task_date]) {
        grouped[todo.task_date] = [];
      }
      grouped[todo.task_date].push(todo);
    });
    return grouped;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const monthTodos = getMonthTodos();
  const groupedTodos = groupTodosByDate(monthTodos);
  const sortedDates = Object.keys(groupedTodos).sort();

  const completedCount = monthTodos.filter(t => t.completed).length;
  const totalCount = monthTodos.length;
  const productivity = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{friend?.full_name}'s To-Do List 👀</h1>
              <p className="text-sm text-gray-500">{friend?.role_title} • View Only</p>
            </div>
            <button
              onClick={() => navigate('/friends')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ← Back to Friends
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <button 
              onClick={() => navigate(`/friends/${friendId}/dashboard`)} 
              className="text-gray-600 hover:text-gray-900 pb-2"
            >
              Habits
            </button>
            <button className="text-purple-600 font-semibold border-b-2 border-purple-600 pb-2">
              To-Do List
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex justify-between items-center">
          <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">← Previous Month</button>
          <h3 className="text-xl font-bold text-gray-900">{getMonthName()}</h3>
          <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Next Month →</button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-sm text-gray-500">Total Tasks</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">{productivity}%</p>
              <p className="text-sm text-gray-500">Productivity</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {sortedDates.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No to-dos for {getMonthName()}</p>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(date => (
                <div key={date}>
                  <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">{formatDate(date)}</h4>
                  <div className="space-y-2">
                    {groupedTodos[date].map(todo => (
                      <div 
                        key={todo.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg ${todo.completed ? 'bg-green-50' : 'bg-gray-50'}`}
                      >
                        <span className="text-xl">{todo.completed ? '✅' : '⬜'}</span>
                        <span className={todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                          {todo.task_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}