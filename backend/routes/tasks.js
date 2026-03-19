const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// Build nested task tree from flat array
function buildTree(tasks, parentId = null) {
  return tasks
    .filter(t => t.parent_id === parentId)
    .map(t => ({ ...t, subtasks: buildTree(tasks, t.id) }));
}

// GET all tasks (nested tree)
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
        COALESCE(tl.total_secs, 0) as logged_seconds
       FROM tasks t
       LEFT JOIN (
         SELECT task_id, SUM(seconds) as total_secs FROM time_logs GROUP BY task_id
       ) tl ON tl.task_id = t.id
       WHERE t.user_id=$1 ORDER BY t.created_at DESC`,
      [req.userId]
    );
    const tree = buildTree(result.rows);
    res.json(tree);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET tasks for a specific date (deadline = date OR created that date)
router.get('/by-date/:date', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tasks WHERE user_id=$1 AND parent_id IS NULL
       AND (deadline=$2 OR DATE(created_at)=$2) ORDER BY priority DESC`,
      [req.userId, req.params.date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create task
router.post('/', auth, async (req, res) => {
  const { title, description, tag, priority, deadline, planned_hours, project_id, parent_id, notes } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
  try {
    const result = await pool.query(
      `INSERT INTO tasks(user_id,parent_id,title,description,tag,priority,deadline,planned_hours,project_id,notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.userId, parent_id || null, title.trim(), description || '', tag || 'Other', priority || 'mid',
       deadline || null, planned_hours || 0, project_id || null, notes || '']
    );
    res.status(201).json({ ...result.rows[0], subtasks: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH update task
router.patch('/:id', auth, async (req, res) => {
  const { title, description, tag, priority, status, deadline, planned_hours, notes, project_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks SET
        title=COALESCE($1,title),
        description=COALESCE($2,description),
        tag=COALESCE($3,tag),
        priority=COALESCE($4,priority),
        status=COALESCE($5,status),
        deadline=COALESCE($6,deadline),
        planned_hours=COALESCE($7,planned_hours),
        notes=COALESCE($8,notes),
        project_id=COALESCE($9,project_id),
        updated_at=NOW()
       WHERE id=$10 AND user_id=$11 RETURNING *`,
      [title, description, tag, priority, status, deadline, planned_hours, notes, project_id, req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE task (cascades to subtasks via DB)
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST log time for a task
router.post('/:id/time', auth, async (req, res) => {
  const { seconds } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const existing = await pool.query(
      'SELECT id, seconds FROM time_logs WHERE task_id=$1 AND user_id=$2 AND log_date=$3',
      [req.params.id, req.userId, today]
    );
    if (existing.rows.length) {
      await pool.query(
        'UPDATE time_logs SET seconds=seconds+$1, updated_at=NOW() WHERE id=$2',
        [seconds, existing.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO time_logs(user_id,task_id,seconds,log_date) VALUES($1,$2,$3,$4)',
        [req.userId, req.params.id, seconds, today]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
