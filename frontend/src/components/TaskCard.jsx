import React, { useState } from 'react';
import { formatDueDate } from '../utils/date';
import { api } from '../utils/api';

function Stars({ value, max = 5 }) {
  return (
    <div className="stars">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`star ${i < value ? 'filled' : ''}`}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const isHighPriority = task.priorityScore >= 50;
  const isCompleted = task.status === 'completed';
  const isOverdue = new Date(task.dueDate) < new Date() && !isCompleted;

  async function handleComplete() {
    setActionLoading(true);
    setError('');
    try {
      const updated = await api.updateTask(task._id, { status: 'completed' });
      onUpdate(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await api.deleteTask(task._id);
      onDelete(task._id);
    } catch (e) {
      setError(e.message);
      setDeleteLoading(false);
    }
  }

  if (confirmDelete) {
    return (
      <div className={`task-card confirm-modal-card`} style={{ textAlign: 'center', padding: '28px 20px' }}>
        <div className="confirm-icon">🗑️</div>
        <div className="confirm-title">Delete Task?</div>
        <div className="confirm-text" style={{ marginBottom: '16px' }}>
          "{task.title}" will be permanently removed.
        </div>
        {error && <div className="state-error" style={{ marginBottom: '12px', textAlign: 'left' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button className="btn-cancel" onClick={() => { setConfirmDelete(false); setError(''); }}>
            Cancel
          </button>
          <button className="btn-confirm-delete" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-card ${isHighPriority ? 'high-priority' : ''} ${isCompleted ? 'completed-card' : ''}`}>
      <div className="task-card-top">
        <div className="task-title">{task.title}</div>
        {isHighPriority && !isCompleted && (
          <span className="priority-badge high">⚡ HIGH</span>
        )}
        {isCompleted && (
          <span className="priority-badge normal">✓ DONE</span>
        )}
      </div>

      {task.description && (
        <div className="task-desc">{task.description}</div>
      )}

      <div className="task-meta">
        <div className="meta-chip">
          <Stars value={task.importance} />
          <span className="val">IMP {task.importance}</span>
        </div>
        <div className="meta-chip">
          <span>📅</span>
          <span
            className="val"
            style={{ color: isOverdue ? 'var(--red)' : 'var(--text-2)' }}
          >
            {isOverdue ? '⚠ ' : ''}{formatDueDate(task.dueDate)}
          </span>
        </div>
        <div className="meta-chip">
          <span className={`status-dot ${task.status}`}></span>
          <span className="val">{task.status}</span>
        </div>
      </div>

      {error && (
        <div className="state-error" style={{ padding: '8px 12px', fontSize: '0.72rem' }}>
          {error}
        </div>
      )}

      <div className="task-footer">
        <div className="score-display">
          SCORE{' '}
          <span className={`score-val ${task.priorityScore === 0 ? 'zero' : ''}`}>
            {task.priorityScore.toFixed(2)}
          </span>
        </div>

        <div className="task-actions">
          {!isCompleted && (
            <button
              className="btn-action complete-btn"
              onClick={handleComplete}
              disabled={actionLoading}
            >
              {actionLoading ? '...' : '✓ Done'}
            </button>
          )}
          <button
            className="btn-action delete-btn"
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
