import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = 'https://habit-king-production.up.railway.app/api/v1';

export default function FriendDashboard() {
  const { friendId } = useParams();
  const [friend, setFriend] = useState(null);
  const [habits, setHabits] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchFriendData();
  }, [friendId]);

  const fetchFriendData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/friends/${friendId}/habits`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setFriend(response.data.friend);
      setHabits(response.data.habits);
    } catch (error) {
      console.error('Error fetching friend data:', error);
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

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const today = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');

  const teamHabits = habits.filter(h => h.category === 'Team');
  const personalHabits = habits.filter(h => h.category === 'Personal');
  const studyHabits = habits.filter(h => h.category === 'Study');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{friend?.full_name}'s Dashboard 👀</h1>
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

      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <button className="text-purple-600 font-semibold border-b-2 border-purple-600 pb-2">
              Habits
            </button>
            <button 
              onClick={() => navigate(`/friends/${friendId}/todos`)} 
              className="text-gray-600 hover:text-gray-900 pb-2"
            >
              To-Do List
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex justify-between items-center">
          <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">← Previous Month</button>
          <h3 className="text-xl font-bold text-gray-900">{getMonthName()}</h3>
          <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Next Month →</button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
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
                {/* Team Habits */}
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
                          <div className={log?.completed ? 'w-5 h-5 rounded text-xs bg-green-500 mx-auto flex items-center justify-center' : 'w-5 h-5 rounded text-xs bg-gray-200 mx-auto'}>{log?.completed && '✓'}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Personal Habits */}
                <tr className="bg-yellow-400 text-gray-900">
                  <td colSpan={getDaysInMonth() + 1} className="py-2 px-2 text-center font-bold text-xs">⭐ PERSONAL</td>
                </tr>
                {personalHabits.map((habit) => (
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
                          <div className={log?.completed ? 'w-5 h-5 rounded text-xs bg-green-500 mx-auto flex items-center justify-center' : 'w-5 h-5 rounded text-xs bg-gray-200 mx-auto'}>{log?.completed && '✓'}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Study Habits */}
                {studyHabits.length > 0 && (
                  <>
                    <tr className="bg-blue-500 text-white">
                      <td colSpan={getDaysInMonth() + 1} className="py-2 px-2 text-center font-bold text-xs">📚 STUDY</td>
                    </tr>
                    {studyHabits.map((habit) => (
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
                              <div className="w-7 h-5 text-center text-xs text-gray-700 mx-auto">{log?.hours || '-'}</div>
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