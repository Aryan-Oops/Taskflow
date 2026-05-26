export function formatDueDate(dateStr) {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return `${abs}d overdue`;
  }
  if (diffDays === 0) return 'due today';
  if (diffDays === 1) return 'due tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `in ${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  const months = Math.floor(diffDays / 30);
  return `in ${months} month${months > 1 ? 's' : ''}`;
}

export function toInputDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

export function minFutureDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}
