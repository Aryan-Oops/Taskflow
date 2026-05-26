import React, { useState } from 'react';
import { api } from '../utils/api';
import { minFutureDate } from '../utils/date';

const EMPTY_FORM = {
  title: '',
  description: '',
  importance: 3,
  dueDate: '',
};

export default function CreateTaskModal({ onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    else if (form.title.trim().length < 3) errs.title = 'Title must be at least 3 characters';
    else if (form.title.trim().length > 100) errs.title = 'Title must be under 100 characters';

    if (form.description && form.description.length > 500)
      errs.description = 'Description max 500 characters';

    if (!form.importance || form.importance < 1 || form.importance > 5)
      errs.importance = 'Select importance 1–5';

    if (!form.dueDate) errs.dueDate = 'Due date is required';
    else if (new Date(form.dueDate) <= new Date())
      errs.dueDate = 'Due date must be in the future';

    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError('');
    try {
      const task = await api.createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        importance: Number(form.importance),
        dueDate: new Date(form.dueDate).toISOString(),
      });
      onCreate(task);
      onClose();
    } catch (e) {
      setApiError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">New Task</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {apiError && (
          <div className="state-error" style={{ marginBottom: '16px' }}>
            ⚠ {apiError}
          </div>
        )}

        <div className="form-fields">
          <div className="field-row">
            <label className="field-label">Title *</label>
            <input
              className={`field-input ${errors.title ? 'error' : ''}`}
              placeholder="e.g. Submit project report"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={100}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="field-row">
            <label className="field-label">Description</label>
            <textarea
              className={`field-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Optional details..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={500}
              rows={3}
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <div className="field-row">
            <label className="field-label">Importance *</label>
            <div className="imp-selector">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`imp-btn ${form.importance === lvl ? 'selected' : ''}`}
                  onClick={() => set('importance', lvl)}
                  title={['Low', 'Minor', 'Medium', 'High', 'Critical'][lvl - 1]}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
              {form.importance}: {['Low', 'Minor', 'Medium', 'High', 'Critical'][form.importance - 1]}
            </span>
            {errors.importance && <span className="field-error">{errors.importance}</span>}
          </div>

          <div className="field-row">
            <label className="field-label">Due Date *</label>
            <input
              type="date"
              className={`field-input ${errors.dueDate ? 'error' : ''}`}
              value={form.dueDate}
              min={minFutureDate()}
              onChange={(e) => set('dueDate', e.target.value)}
            />
            {errors.dueDate && <span className="field-error">{errors.dueDate}</span>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : '+ Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
