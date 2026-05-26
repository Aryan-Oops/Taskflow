import React from 'react';

export default function StatsBar({ stats, loading }) {
  if (loading) {
    return (
      <div className="stats-bar" style={{ padding: '20px', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', letterSpacing: '2px' }}>
          LOADING STATS...
        </span>
      </div>
    );
  }

  if (!stats) return null;

  const maxImp = Math.max(...Object.values(stats.tasksByImportance), 1);

  const impColors = ['#444', '#666', 'var(--amber)', '#ff7700', 'var(--red)'];

  return (
    <div className="stats-bar">
      <div className="stat-cell">
        <span className="stat-label">Total Tasks</span>
        <span className="stat-value">{stats.totalTasks}</span>
      </div>

      <div className="stat-cell">
        <span className="stat-label">Pending</span>
        <span className="stat-value amber">{stats.pendingTasks}</span>
      </div>

      <div className="stat-cell">
        <span className="stat-label">Completed</span>
        <span className="stat-value green">{stats.completedTasks}</span>
      </div>

      <div className="stat-cell">
        <span className="stat-label">Overdue</span>
        <span className="stat-value" style={{ color: stats.overdueTasks > 0 ? 'var(--red)' : 'var(--text)' }}>
          {stats.overdueTasks}
        </span>
      </div>

      <div className="stat-cell">
        <span className="stat-label">Avg Importance</span>
        <span className="stat-value">{stats.averageImportance.toFixed(1)}</span>
      </div>

      <div className="stat-cell">
        <span className="stat-label">By Importance</span>
        <div className="importance-bars">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const count = stats.tasksByImportance[lvl] || 0;
            const height = maxImp > 0 ? Math.max((count / maxImp) * 24, count > 0 ? 4 : 0) : 0;
            return (
              <div
                key={lvl}
                className="imp-bar"
                style={{
                  height: `${height}px`,
                  background: impColors[lvl - 1],
                  opacity: count > 0 ? 1 : 0.2,
                }}
                title={`Importance ${lvl}: ${count} task${count !== 1 ? 's' : ''}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
