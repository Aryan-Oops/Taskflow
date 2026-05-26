const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');

const router = express.Router();

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function buildFilterQuery(query) {
  const filter = {};

  if (query.status) {
    if (!['pending', 'completed'].includes(query.status)) {
      return { error: 'status must be "pending" or "completed"' };
    }
    filter.status = query.status;
  }

  if (query.minImportance !== undefined) {
    const min = Number(query.minImportance);
    if (isNaN(min) || min < 1 || min > 5) {
      return { error: 'minImportance must be a number between 1 and 5' };
    }
    filter.importance = { $gte: min };
  }

  return filter;
}

// ─────────────────────────────────────────
// POST /bfhl/tasks — Create task
// ─────────────────────────────────────────
router.post('/tasks', async (req, res) => {
  try {
    const { title, description, importance, dueDate, status } = req.body;

    // Validate dueDate is future on creation
    if (dueDate) {
      const due = new Date(dueDate);
      if (isNaN(due.getTime())) {
        return res.status(400).json({ error: 'dueDate is not a valid date' });
      }
      if (due <= new Date()) {
        return res.status(400).json({ error: 'dueDate must be a future date' });
      }
    }

    const task = new Task({ title, description, importance, dueDate, status });
    await task.save();

    res.status(201).json(task.toResponseJSON());
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// GET /bfhl/tasks — List tasks
// ─────────────────────────────────────────
router.get('/tasks', async (req, res) => {
  try {
    const filterResult = buildFilterQuery(req.query);
    if (filterResult.error) {
      return res.status(400).json({ error: filterResult.error });
    }

    const tasks = await Task.find(filterResult);

    // Compute priority scores and sort DESC
    const tasksWithScore = tasks
      .map((t) => t.toResponseJSON())
      .sort((a, b) => b.priorityScore - a.priorityScore);

    res.json(tasksWithScore);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// PATCH /bfhl/tasks/:id — Update task
// ─────────────────────────────────────────
router.patch('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    const allowedFields = ['title', 'description', 'importance', 'dueDate', 'status'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Validate importance range if provided
    if (updates.importance !== undefined) {
      const imp = Number(updates.importance);
      if (!Number.isInteger(imp) || imp < 1 || imp > 5) {
        return res.status(400).json({ error: 'Importance must be an integer between 1 and 5' });
      }
    }

    // Validate status if provided
    if (updates.status && !['pending', 'completed'].includes(updates.status)) {
      return res.status(400).json({ error: 'status must be "pending" or "completed"' });
    }

    // Validate dueDate if provided
    if (updates.dueDate) {
      const due = new Date(updates.dueDate);
      if (isNaN(due.getTime())) {
        return res.status(400).json({ error: 'dueDate is not a valid date' });
      }
    }

    const task = await Task.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task.toResponseJSON());
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// DELETE /bfhl/tasks/:id — Delete task
// ─────────────────────────────────────────
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully', _id: task._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// BONUS: GET /bfhl/tasks/stats — Aggregated stats
// ─────────────────────────────────────────
router.get('/tasks/stats', async (req, res) => {
  try {
    const now = new Date();

    const result = await Task.aggregate([
      {
        $facet: {
          // Total counts
          counts: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                pendingTasks: {
                  $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
                },
                completedTasks: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                averageImportance: { $avg: '$importance' },
                overdueTasks: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$status', 'pending'] },
                          { $lt: ['$dueDate', now] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          // Tasks grouped by importance level
          byImportance: [
            {
              $group: {
                _id: '$importance',
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const countsData = result[0].counts[0] || {
      totalTasks: 0,
      pendingTasks: 0,
      completedTasks: 0,
      averageImportance: 0,
      overdueTasks: 0,
    };

    // Build tasksByImportance map
    const tasksByImportance = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const item of result[0].byImportance) {
      tasksByImportance[item._id] = item.count;
    }

    res.json({
      totalTasks: countsData.totalTasks,
      pendingTasks: countsData.pendingTasks,
      completedTasks: countsData.completedTasks,
      averageImportance: countsData.averageImportance
        ? Math.round(countsData.averageImportance * 100) / 100
        : 0,
      overdueTasks: countsData.overdueTasks,
      tasksByImportance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
