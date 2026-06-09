// 1. ALL IMPORTS AT THE VERY TOP
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const Dashboard = () => {
  const [newTask, setNewTask] = useState('');
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 2. INITIALIZE SOCKET
  const { socket } = useSocket();

  // STYLES
  const containerStyle = { maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' };
  const inputStyle = {
    width: '100%', padding: '1rem', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
    background: isDarkMode ? '#1e293b' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#0f172a',
    fontSize: '1rem', marginBottom: '1.5rem', boxSizing: 'border-box'
  };
  const taskCardStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem', marginBottom: '0.5rem', borderRadius: '8px',
    background: isDarkMode ? '#1e293b' : '#ffffff', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
  };

  // 3. FETCH TASKS
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data;
    }
  });

  // 4. CREATE TASK
  const createTask = useMutation({
    mutationFn: async (title) => await api.post('/tasks', { title }),
    onSuccess: () => queryClient.invalidateQueries(['tasks'])
  });

  // 5. TOGGLE TASK
  const toggleTask = useMutation({
    mutationFn: async (id) => await api.put(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['tasks'])
  });

  // 6. DELETE TASK
  const deleteTask = useMutation({
    mutationFn: async (id) => await api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['tasks'])
  });

  // 7. WEBSOCKET AUTO-REFRESH LISTENER
  useEffect(() => {
    if (!socket) return;

    // When the backend shouts "tasks_updated", tell React Query to fetch the newest data
    socket.on('tasks_updated', () => {
      queryClient.invalidateQueries(['tasks']);
    });

    return () => socket.off('tasks_updated');
  }, [socket, queryClient]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    createTask.mutate(newTask);
    setNewTask('');
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: '0.5rem' }}>Welcome back, {user?.name.split(' ')[0]} 👋</h1>
      <p style={{ color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '2rem' }}>Here is what you need to do today.</p>

      <form onSubmit={handleAddTask}>
        <input 
          type="text" 
          value={newTask} 
          onChange={(e) => setNewTask(e.target.value)} 
          placeholder="Add a new task... (Press Enter)"
          style={inputStyle}
          disabled={createTask.isPending}
        />
      </form>

      {isLoading ? (
        <p>Loading tasks...</p>
      ) : tasks?.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>You're all caught up! Enjoy your day.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks?.map((task) => (
            <div key={task._id} style={taskCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={task.completed}
                  onChange={() => toggleTask.mutate(task._id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ 
                  fontSize: '1.1rem', 
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed ? (isDarkMode ? '#475569' : '#94a3b8') : 'inherit',
                  transition: 'all 0.2s'
                }}>
                  {task.title}
                </span>
              </div>
              <button 
                onClick={() => deleteTask.mutate(task._id)}
                style={{ 
                  background: 'transparent', border: 'none', color: '#ef4444', 
                  cursor: 'pointer', fontSize: '1.2rem', padding: '4px' 
                }}
                title="Delete Task"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};