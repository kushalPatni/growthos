const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

/* ─── PROJECTS ─── */
router.get('/projects', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        COUNT(t.id) FILTER (WHERE t.parent_id IS NULL) as total_tasks,
        COUNT(t.id) FILTER (WHERE t.parent_id IS NULL AND t.status='done') as done_tasks,
        COALESCE(SUM(tl.seconds),0) as logged_seconds
       FROM projects p
       LEFT JOIN tasks t ON t.project_id=p.id AND t.user_id=p.user_id
       LEFT JOIN time_logs tl ON tl.task_id=t.id
       WHERE p.user_id=$1 GROUP BY p.id ORDER BY p.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/projects', auth, async (req, res) => {
  const { title, description, tag, target_date } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
  try {
    const r = await pool.query(
      'INSERT INTO projects(user_id,title,description,tag,target_date) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.userId, title.trim(), description || '', tag || 'Other', target_date || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/projects/:id', auth, async (req, res) => {
  const { title, description, tag, target_date, status } = req.body;
  try {
    const r = await pool.query(
      `UPDATE projects SET title=COALESCE($1,title),description=COALESCE($2,description),
       tag=COALESCE($3,tag),target_date=COALESCE($4,target_date),status=COALESCE($5,status),
       updated_at=NOW() WHERE id=$6 AND user_id=$7 RETURNING *`,
      [title, description, tag, target_date, status, req.params.id, req.userId]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/projects/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

/* ─── DAILY LOGS ─── */
router.get('/logs', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM daily_logs WHERE user_id=$1 ORDER BY log_date DESC LIMIT 60',
      [req.userId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/logs', auth, async (req, res) => {
  const { log_date, hours_studied, mood, what_studied, wins } = req.body;
  const date = log_date || new Date().toISOString().slice(0, 10);
  try {
    const r = await pool.query(
      `INSERT INTO daily_logs(user_id,log_date,hours_studied,mood,what_studied,wins)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT(user_id,log_date) DO UPDATE SET
         hours_studied=$3,mood=$4,what_studied=$5,wins=$6
       RETURNING *`,
      [req.userId, date, hours_studied || 0, mood || '🙂', what_studied || '', wins || '']
    );
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

/* ─── NOTES ─── */
router.get('/notes', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM notes WHERE user_id=$1 ORDER BY is_pinned DESC, updated_at DESC',
      [req.userId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/notes', auth, async (req, res) => {
  const { title, body, tag } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
  try {
    const r = await pool.query(
      'INSERT INTO notes(user_id,title,body,tag) VALUES($1,$2,$3,$4) RETURNING *',
      [req.userId, title.trim(), body || '', tag || 'Other']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/notes/:id', auth, async (req, res) => {
  const { title, body, tag, is_pinned } = req.body;
  try {
    const r = await pool.query(
      `UPDATE notes SET title=COALESCE($1,title),body=COALESCE($2,body),
       tag=COALESCE($3,tag),is_pinned=COALESCE($4,is_pinned),updated_at=NOW()
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [title, body, tag, is_pinned, req.params.id, req.userId]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/notes/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

/* ─── GOALS / ROADMAP ─── */
router.get('/goals', auth, async (req, res) => {
  try {
    const goals = await pool.query('SELECT * FROM goals WHERE user_id=$1 ORDER BY position,created_at', [req.userId]);
    const items = await pool.query(
      `SELECT ri.* FROM roadmap_items ri
       JOIN goals g ON g.id=ri.goal_id
       WHERE g.user_id=$1 ORDER BY ri.position`,
      [req.userId]
    );
    const result = goals.rows.map(g => ({
      ...g,
      items: items.rows.filter(i => i.goal_id === g.id)
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/goals', auth, async (req, res) => {
  const { title, target_date, duration_months } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
  try {
    const r = await pool.query(
      'INSERT INTO goals(user_id,title,target_date,duration_months) VALUES($1,$2,$3,$4) RETURNING *',
      [req.userId, title.trim(), target_date || null, duration_months || 6]
    );
    res.status(201).json({ ...r.rows[0], items: [] });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/goals/:id/items', auth, async (req, res) => {
  const { parent_id, item_type, title, position } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO roadmap_items(goal_id,parent_id,item_type,title,position) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.params.id, parent_id || null, item_type, title, position || 0]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/goals/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM goals WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/roadmap-items/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM roadmap_items WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

/* ─── REVISION ─── */
router.get('/revision', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM revision_topics WHERE user_id=$1 ORDER BY due_date',
      [req.userId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/revision', auth, async (req, res) => {
  const { topic, tag, interval_days } = req.body;
  if (!topic?.trim()) return res.status(400).json({ error: 'Topic required' });
  const days = parseInt(interval_days) || 7;
  const due = new Date();
  due.setDate(due.getDate() + days);
  try {
    const r = await pool.query(
      'INSERT INTO revision_topics(user_id,topic,tag,due_date,interval_days) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.userId, topic.trim(), tag || 'Other', due.toISOString().slice(0, 10), days]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/revision/:id/done', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM revision_topics WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    const topic = r.rows[0];
    const newBox = Math.min((topic.box_level || 1) + 1, 5);
    const intervals = [1, 3, 7, 14, 30];
    const newInterval = intervals[newBox - 1];
    const due = new Date();
    due.setDate(due.getDate() + newInterval);
    const updated = await pool.query(
      'UPDATE revision_topics SET box_level=$1,interval_days=$2,due_date=$3 WHERE id=$4 RETURNING *',
      [newBox, newInterval, due.toISOString().slice(0, 10), req.params.id]
    );
    res.json(updated.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/revision/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM revision_topics WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

/* ─── CALENDAR EVENTS ─── */
router.get('/calendar', auth, async (req, res) => {
  const { month, year } = req.query;
  try {
    const r = await pool.query(
      `SELECT * FROM calendar_events
       WHERE user_id=$1 AND EXTRACT(MONTH FROM event_date)=$2 AND EXTRACT(YEAR FROM event_date)=$3
       ORDER BY event_date`,
      [req.userId, month, year]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/calendar', auth, async (req, res) => {
  const { title, event_date, color } = req.body;
  if (!title?.trim() || !event_date) return res.status(400).json({ error: 'Title and date required' });
  try {
    const r = await pool.query(
      'INSERT INTO calendar_events(user_id,title,event_date,color) VALUES($1,$2,$3,$4) RETURNING *',
      [req.userId, title.trim(), event_date, color || 'blue']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/calendar/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM calendar_events WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

/* ─── ANALYTICS ─── */
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const [tasks, logs, timeLogs, revDue] = await Promise.all([
      pool.query('SELECT status, tag FROM tasks WHERE user_id=$1 AND parent_id IS NULL', [req.userId]),
      pool.query('SELECT * FROM daily_logs WHERE user_id=$1 ORDER BY log_date DESC LIMIT 30', [req.userId]),
      pool.query(
        `SELECT t.tag, SUM(tl.seconds) as seconds
         FROM time_logs tl JOIN tasks t ON t.id=tl.task_id
         WHERE tl.user_id=$1 GROUP BY t.tag`, [req.userId]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM revision_topics
         WHERE user_id=$1 AND due_date<=CURRENT_DATE`, [req.userId]
      ),
    ]);
    res.json({
      tasks: tasks.rows,
      logs: logs.rows,
      timeLogs: timeLogs.rows,
      revisionDue: parseInt(revDue.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
