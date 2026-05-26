import React, { useState, useEffect, useCallback } from 'react';
import { api } from './utils/api';
import TaskCard from './components/TaskCard';
import CreateTaskModal from './components/CreateTaskModal';
import StatsBar from './components/StatsBar';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [minImportance, setMinImportance] = useState(1);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getTasks({ status: statusFilter, minImportance });
      setTasks(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, minImportance]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {
      // Stats are bonus — fail silently
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchStats();
  }, [tasks]); // Re-fetch stats when tasks change

  function handleCreate(newTask) {
    setTasks((prev) => {
      const updated = [newTask, ...prev];
      return updated.sort((a, b) => b.priorityScore - a.priorityScore);
    });
  }

  function handleUpdate(updated) {
    setTasks((prev) => {
      const next = prev.map((t) => (t._id === updated._id ? updated : t));
      return next.sort((a, b) => b.priorityScore - a.priorityScore);
    });
  }

  function handleDelete(id) {
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">
            Task<span>Flow</span>
          </div>
          <div className="header-sub">Priority-driven task manager</div>
        </div>
        <span className="header-tag">MERN STACK</span>
      </header>

      {/* Stats Dashboard (Bonus) */}
      <StatsBar stats={stats} loading={statsLoading} />

      {/* Controls */}
      <div className="controls-row">
        <div className="control-group">
          <span className="control-label">Status</span>
          <div className="btn-group">
            {['all', 'pending', 'completed'].map((s) => (
              <button
                key={s}
                className={statusFilter === s ? 'active' : ''}
                onClick={() => setStatusFilter(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label" htmlFor="min-imp">
            Min Importance
          </label>
          <select
            id="min-imp"
            className="imp-filter"
            value={minImportance}
            onChange={(e) => setMinImportance(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+ {['', '(Low+)', '(Minor+)', '(Med+)', '(High+)', '(Crit)'][n]}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-new-task" onClick={() => setShowModal(true)}>
          + New Task
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="state-error">
          <span>⚠</span>
          <span>{error}</span>
          <button
            onClick={fetchTasks}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: '1px solid var(--red)',
              color: 'var(--red)',
              padding: '3px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="state-loading">
          <div className="loader-ring" />
          <span className="loading-text">Fetching tasks...</span>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.length === 0 ? (
            <div className="state-empty">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No tasks found</div>
              <div className="empty-sub">
                {statusFilter !== 'all' || minImportance > 1
                  ? 'Try adjusting your filters'
                  : 'Create your first task to get started'}
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
