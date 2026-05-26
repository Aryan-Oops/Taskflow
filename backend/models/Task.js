const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title must not exceed 100 characters'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description must not exceed 500 characters'],
      trim: true,
      default: '',
    },
    importance: {
      type: Number,
      required: [true, 'Importance is required'],
      min: [1, 'Importance must be between 1 and 5'],
      max: [5, 'Importance must be between 1 and 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Importance must be an integer',
      },
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed'],
        message: 'Status must be either pending or completed',
      },
      default: 'pending',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/**
 * Compute priority score at read time.
 * priorityScore = (importance * 10) + (100 / max(daysUntilDue, 1))
 * Completed tasks always return 0.
 */
taskSchema.methods.computePriorityScore = function () {
  if (this.status === 'completed') return 0;

  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.floor((this.dueDate - now) / msPerDay);
  const safeDays = Math.max(daysUntilDue, 1);

  const score = this.importance * 10 + 100 / safeDays;
  return Math.round(score * 100) / 100;
};

/**
 * Convert task document to JSON with priorityScore injected.
 */
taskSchema.methods.toResponseJSON = function () {
  return {
    _id: this._id,
    title: this.title,
    description: this.description,
    importance: this.importance,
    dueDate: this.dueDate,
    status: this.status,
    createdAt: this.createdAt,
    priorityScore: this.computePriorityScore(),
  };
};

module.exports = mongoose.model('Task', taskSchema);
