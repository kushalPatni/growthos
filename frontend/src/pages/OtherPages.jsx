// ─── ROADMAP ───────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import api from '../api';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

export function RoadmapPage({ toast }) {
  const [goals, setGoals] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', target_date: '', duration_months: 6 });
  const [openGoals, setOpenGoals] = useState({});
  const [openMonths, setOpenMonths] = useState({});
  const [openWeeks, setOpenWeeks] = useState({});

  useEffect(() => { fetchGoals(); }, []);

  async function fetchGoals() {
    try { const r = await api.get('/goals'); setGoals(r.data); } catch {}
  }

  async function addGoal() {
    if (!form.title.trim()) { toast('Enter a goal title'); return; }
    try {
      const r = await api.post('/goals', form);
      setGoals(g => [...g, r.data]);
      setShowAdd(false);
      setForm({ title: '', target_date: '', duration_months: 6 });
      toast('Goal created!');
    } catch { toast('Failed'); }
  }

  async function deleteGoal(id) {
    if (!confirm('Delete this goal and all its contents?')) return;
    await api.delete(`/goals/${id}`);
    setGoals(g => g.filter(x => x.id !== id));
    toast('Deleted');
  }

  async function addItem(goalId, parentId, type) {
    const title = prompt(`${type} title:`);
    if (!title?.trim()) return;
    const pos = 0;
    try {
      const r = await api.post(`/goals/${goalId}/items`, { parent_id: parentId, item_type: type, title, position: pos });
      setGoals(g => g.map(goal => {
        if (goal.id !== goalId) return goal;
        return { ...goal, items: [...(goal.items || []), r.data] };
      }));
    } catch { toast('Failed to add item'); }
  }

  async function deleteItem(itemId) {
    try {
      await api.delete(`/roadmap-items/${itemId}`);
      setGoals(g => g.map(goal => ({ ...goal, items: (goal.items || []).filter(i => i.id !== itemId) })));
    } catch { toast('Failed'); }
  }

  function buildTree(items, parentId = null) {
    return items.filter(i => i.parent_id === parentId).map(i => ({
      ...i, children: buildTree(items, i.id)
    }));
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Goals → Months → Weeks → Day topics</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Goal</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Goal Title *</label>
            <input className="input" placeholder="e.g. Become a Data Scientist" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target date</label>
              <input className="input" type="date" value={form.target_date}
                onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (months)</label>
              <input className="input" type="number" min="1" max="24" value={form.duration_months}
                onChange={e => setForm(f => ({ ...f, duration_months: parseInt(e.target.value) || 6 }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={addGoal}>Create</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {goals.length === 0 && <div className="empty">🗺️<p>No goals yet. Start planning your journey!</p></div>}

      {goals.map(goal => {
        const tree = buildTree(goal.items || []);
        const isOpen = openGoals[goal.id];
        return (
          <div key={goal.id} className="rm-goal">
            <div className="rm-goal-header" onClick={() => setOpenGoals(o => ({ ...o, [goal.id]: !o[goal.id] }))}>
              <span style={{ fontSize: 18 }}>🎯</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{goal.title}</span>
              {goal.target_date && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{goal.target_date?.slice(0,10)}</span>}
              <button className="task-btn" onClick={e => { e.stopPropagation(); addItem(goal.id, null, 'month'); }}>+ Month</button>
              <button className="task-btn del" onClick={e => { e.stopPropagation(); deleteGoal(goal.id); }}>✕</button>
            </div>

            {isOpen && (
              <div className="rm-goal-body">
                {tree.map(month => {
                  const mOpen = openMonths[month.id];
                  return (
                    <div key={month.id} className="rm-month">
                      <div className="rm-month-header" onClick={() => setOpenMonths(o => ({ ...o, [month.id]: !o[month.id] }))}>
                        <span>{month.title}</span>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="task-btn" onClick={e => { e.stopPropagation(); addItem(goal.id, month.id, 'week'); }}>+ Week</button>
                          <button className="task-btn del" onClick={e => { e.stopPropagation(); deleteItem(month.id); }}>✕</button>
                        </div>
                      </div>
                      {mOpen && month.children.map(week => {
                        const wOpen = openWeeks[week.id];
                        return (
                          <div key={week.id} className="rm-week">
                            <div className="rm-week-header" onClick={() => setOpenWeeks(o => ({ ...o, [week.id]: !o[week.id] }))}>
                              <span>{week.title}</span>
                              <div style={{ display: 'flex', gap: 5 }}>
                                <button className="task-btn" onClick={e => { e.stopPropagation(); addItem(goal.id, week.id, 'day'); }}>+ Day</button>
                                <button className="task-btn del" onClick={e => { e.stopPropagation(); deleteItem(week.id); }}>✕</button>
                              </div>
                            </div>
                            {wOpen && week.children.map(day => (
                              <div key={day.id} className="rm-day">
                                <span>{day.title}</span>
                                <button className="task-btn del" onClick={() => deleteItem(day.id)}>✕</button>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── PROJECTS ──────────────────────────────────────────────────────────
export function ProjectsPage({ toast }) {
  const [projects, setProjects] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', tag: 'Other', target_date: '' });

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    try { const r = await api.get('/projects'); setProjects(r.data); } catch {}
  }

  async function addProject() {
    if (!form.title.trim()) { toast('Title required'); return; }
    try {
      const r = await api.post('/projects', form);
      setProjects(p => [r.data, ...p]);
      setShowAdd(false);
      setForm({ title: '', description: '', tag: 'Other', target_date: '' });
      toast('Project created!');
    } catch { toast('Failed'); }
  }

  async function deleteProject(id) {
    if (!confirm('Delete this project?')) return;
    await api.delete(`/projects/${id}`);
    setProjects(p => p.filter(x => x.id !== id));
    toast('Deleted');
  }

  const tagColors = { Python: 'tag-blue', ML: 'tag-green', Stats: 'tag-purple', DSA: 'tag-amber', Project: 'tag-teal', Maths: 'tag-teal', Other: 'tag-red' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ New Project</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group"><label className="form-label">Title *</label>
            <input className="input" placeholder="Project name" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="input" placeholder="What is this project?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ minHeight: 60 }} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Tag</label>
              <select className="input" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
                {['Python','ML','Stats','DSA','Project','Maths','Other'].map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Target date</label>
              <input className="input" type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={addProject}>Create</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {projects.length === 0 && <div className="empty">📁<p>No projects yet.</p></div>}
      {projects.map(p => {
        const total = parseInt(p.total_tasks) || 0;
        const done = parseInt(p.done_tasks) || 0;
        const pct = total ? Math.round(done / total * 100) : 0;
        const hrs = Math.floor((parseInt(p.logged_seconds) || 0) / 3600);
        return (
          <div key={p.id} className="proj-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.description}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={`tag ${tagColors[p.tag] || 'tag-blue'}`}>{p.tag}</span>
                <button className="task-btn del" onClick={() => deleteProject(p.id)}>✕</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
              <span>📋 {total} tasks</span>
              <span>⏱ {hrs}h logged</span>
              {p.target_date && <span>📅 {p.target_date?.slice(0,10)}</span>}
            </div>
            <div className="prog-wrap"><div className="prog-fill" style={{ width: `${pct}%`, background: 'var(--accent)' }} /></div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{pct}% complete ({done}/{total} tasks)</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── NOTES ─────────────────────────────────────────────────────────────
export function NotesPage({ toast }) {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', tag: 'Other' });

  useEffect(() => { api.get('/notes').then(r => setNotes(r.data)).catch(() => {}); }, []);

  async function addNote() {
    if (!form.title.trim()) { toast('Title required'); return; }
    try {
      const r = await api.post('/notes', form);
      setNotes(n => [r.data, ...n]);
      setShowAdd(false);
      setForm({ title: '', body: '', tag: 'Other' });
      toast('Note saved ✓');
    } catch { toast('Failed'); }
  }

  async function deleteNote(id) {
    await api.delete(`/notes/${id}`);
    setNotes(n => n.filter(x => x.id !== id));
    toast('Deleted');
  }

  async function togglePin(note) {
    try {
      const r = await api.patch(`/notes/${note.id}`, { is_pinned: !note.is_pinned });
      setNotes(n => n.map(x => x.id === note.id ? r.data : x));
    } catch {}
  }

  const tagColors = { Python: 'tag-blue', ML: 'tag-green', Stats: 'tag-purple', DSA: 'tag-amber', Maths: 'tag-teal', Other: 'tag-red' };
  const filtered = notes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input className="input" style={{ flex: 1 }} placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ New Note</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group"><label className="form-label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus /></div>
          <div className="form-group"><label className="form-label">Content</label>
            <textarea className="input" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} style={{ minHeight: 120 }} /></div>
          <div className="form-group"><label className="form-label">Tag</label>
            <select className="input" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
              {['Python','ML','Stats','DSA','Maths','Other'].map(t => <option key={t}>{t}</option>)}</select></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={addNote}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && <div className="empty">📝<p>No notes yet.</p></div>}
      {filtered.map(n => (
        <div key={n.id} className="note-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div className="note-title">{n.is_pinned && '📌 '}{n.title}</div>
            <div style={{ display: 'flex', gap: 5 }}>
              <span className={`tag ${tagColors[n.tag] || 'tag-blue'}`}>{n.tag}</span>
              <button className="task-btn" onClick={() => togglePin(n)} title="Pin">{n.is_pinned ? '📌' : '📍'}</button>
              <button className="task-btn del" onClick={() => deleteNote(n.id)}>✕</button>
            </div>
          </div>
          <div className="note-body">{n.body}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>{n.created_at?.slice(0, 10)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── REVISION ──────────────────────────────────────────────────────────
export function RevisionPage({ toast }) {
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState({ topic: '', tag: 'Python', interval_days: 7 });

  useEffect(() => { api.get('/revision').then(r => setTopics(r.data)).catch(() => {}); }, []);

  async function addTopic() {
    if (!form.topic.trim()) { toast('Enter topic'); return; }
    try {
      const r = await api.post('/revision', form);
      setTopics(t => [...t, r.data]);
      setForm(f => ({ ...f, topic: '' }));
      toast('Added to revision!');
    } catch { toast('Failed'); }
  }

  async function markDone(id) {
    try {
      const r = await api.post(`/revision/${id}/done`);
      setTopics(t => t.map(x => x.id === id ? r.data : x));
      toast('Marked revised — next in ' + r.data.interval_days + ' days ✓');
    } catch { toast('Failed'); }
  }

  async function deleteTopic(id) {
    await api.delete(`/revision/${id}`);
    setTopics(t => t.filter(x => x.id !== id));
    toast('Deleted');
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const due = topics.filter(t => t.due_date?.slice(0, 10) <= todayStr);
  const upcoming = topics.filter(t => t.due_date?.slice(0, 10) > todayStr);
  const tagColors = { Python: 'tag-blue', ML: 'tag-green', Stats: 'tag-purple', DSA: 'tag-amber', Maths: 'tag-teal', Other: 'tag-red' };

  function revBadge(dueDate) {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
    if (diff <= 0) return <span className="rev-badge rev-overdue">Overdue</span>;
    if (diff <= 3) return <span className="rev-badge rev-soon">In {diff}d</span>;
    return <span className="rev-badge rev-ok">In {diff}d</span>;
  }

  return (
    <div>
      {/* Add form */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Add topic for spaced repetition</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 1, minWidth: 160 }} placeholder="Topic to revise…" value={form.topic}
            onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addTopic()} />
          <select className="input" style={{ maxWidth: 110 }} value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
            {['Python','ML','Stats','DSA','Maths','Other'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="input" style={{ maxWidth: 140 }} value={form.interval_days} onChange={e => setForm(f => ({ ...f, interval_days: parseInt(e.target.value) }))}>
            <option value={1}>Tomorrow</option>
            <option value={3}>3 days</option>
            <option value={7}>1 week</option>
            <option value={14}>2 weeks</option>
            <option value={30}>1 month</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={addTopic}>Add</button>
        </div>
      </div>

      {/* Due now */}
      {due.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(240,96,96,0.25)' }}>
          <div className="card-title" style={{ color: 'var(--red)' }}>⚠️ Due for review ({due.length})</div>
          {due.map(t => (
            <div key={t.id} className="rev-item">
              <div style={{ flex: 1 }}>{t.topic}</div>
              <span className={`tag ${tagColors[t.tag] || 'tag-blue'}`}>{t.tag}</span>
              <span className="rev-badge rev-overdue">Due now</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>Box {t.box_level || 1}/5</span>
              <button className="btn btn-primary btn-xs" onClick={() => markDone(t.id)}>✓ Done</button>
              <button className="task-btn del" onClick={() => deleteTopic(t.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* All topics */}
      <div className="card">
        <div className="card-title">All revision topics ({topics.length})</div>
        {topics.length === 0 && <div className="empty"><p>No topics yet. Add topics above.</p></div>}
        {upcoming.map(t => (
          <div key={t.id} className="rev-item">
            <div style={{ flex: 1 }}>{t.topic}</div>
            <span className={`tag ${tagColors[t.tag] || 'tag-blue'}`}>{t.tag}</span>
            {revBadge(t.due_date)}
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>Box {t.box_level || 1}/5</span>
            <button className="btn btn-ghost btn-xs" onClick={() => markDone(t.id)}>✓</button>
            <button className="task-btn del" onClick={() => deleteTopic(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ANALYTICS ─────────────────────────────────────────────────────────
const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#5a6070', font: { size: 11 } }, grid: { display: false } },
    y: { ticks: { color: '#5a6070', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
  }
};

export function AnalyticsPage({ tasks, logs }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const log = logs.find(l => l.log_date?.slice(0, 10) === ds);
    return { label: ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()], hours: log?.hours_studied || 0 };
  });

  const tagTime = {};
  tasks.filter(t => !t.parent_id).forEach(t => {
    tagTime[t.tag] = (tagTime[t.tag] || 0) + (parseInt(t.logged_seconds) || 0);
  });

  const tagStats = {};
  tasks.filter(t => !t.parent_id).forEach(t => {
    if (!tagStats[t.tag]) tagStats[t.tag] = { total: 0, done: 0 };
    tagStats[t.tag].total++;
    if (t.status === 'done') tagStats[t.tag].done++;
  });

  const weekRates = Array.from({ length: 7 }, (_, i) => {
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
    const weekTasks = tasks.filter(t => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      return d >= weekStart && d < weekEnd && !t.parent_id;
    });
    return weekTasks.length ? Math.round(weekTasks.filter(t => t.status === 'done').length / weekTasks.length * 100) : 0;
  }).reverse();

  const PIE_COLORS = { Python: '#4f8ef7', ML: '#3ecf8e', Stats: '#a78bfa', DSA: '#f5a623', Project: '#2dd4bf', Maths: '#f06060', Other: '#9298a8' };
  const tagTimeEntries = Object.entries(tagTime).filter(([, v]) => v > 0);

  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Daily study hours — last 7 days</div>
          <div style={{ height: 200 }}>
            <Bar
              data={{ labels: last7.map(d => d.label), datasets: [{ data: last7.map(d => d.hours), backgroundColor: 'rgba(79,142,247,0.75)', borderRadius: 6, hoverBackgroundColor: '#4f8ef7' }] }}
              options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, beginAtZero: true } } }}
            />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Time by subject</div>
          <div style={{ height: 200 }}>
            {tagTimeEntries.length > 0 ? (
              <Doughnut
                data={{ labels: tagTimeEntries.map(([k]) => k), datasets: [{ data: tagTimeEntries.map(([, v]) => Math.round(v / 3600 * 10) / 10), backgroundColor: tagTimeEntries.map(([k]) => PIE_COLORS[k] || '#9298a8'), borderWidth: 0 }] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#9298a8', font: { size: 11 }, boxWidth: 10 } } } }}
              />
            ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 13 }}>No timer data yet</div>}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Weekly completion rate (%)</div>
        <div style={{ height: 180 }}>
          <Line
            data={{ labels: ['W-6','W-5','W-4','W-3','W-2','W-1','Now'], datasets: [{ data: weekRates, borderColor: '#4f8ef7', backgroundColor: 'rgba(79,142,247,0.08)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#4f8ef7' }] }}
            options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, min: 0, max: 100 } } }}
          />
        </div>
      </div>
      <div className="card">
        <div className="card-title">Tasks by tag — done vs pending</div>
        <div style={{ height: 160 }}>
          <Bar
            data={{
              labels: Object.keys(tagStats),
              datasets: [
                { label: 'Done', data: Object.values(tagStats).map(s => s.done), backgroundColor: '#4f8ef7', borderRadius: 4 },
                { label: 'Pending', data: Object.values(tagStats).map(s => s.total - s.done), backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 4 },
              ]
            }}
            options={{ ...CHART_OPTS, plugins: { legend: { display: true, labels: { color: '#9298a8', font: { size: 11 } } } }, scales: { ...CHART_OPTS.scales, x: { ...CHART_OPTS.scales.x, stacked: true }, y: { ...CHART_OPTS.scales.y, stacked: true } } }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── INSIGHTS ──────────────────────────────────────────────────────────
export function InsightsPage({ tasks, logs }) {
  const insights = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  const dayHours = {};
  logs.forEach(l => {
    const day = new Date(l.log_date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long' });
    dayHours[day] = (dayHours[day] || 0) + parseFloat(l.hours_studied || 0);
  });
  const bestDay = Object.entries(dayHours).sort((a, b) => b[1] - a[1])[0];
  if (bestDay) insights.push({ icon: '📈', text: <>You're most productive on <strong>{bestDay[0]}</strong> — {bestDay[1].toFixed(1)}h on average. Schedule hardest topics then.</> });

  const tagCount = {};
  tasks.filter(t => !t.parent_id).forEach(t => { tagCount[t.tag] = (tagCount[t.tag] || 0) + 1; });
  const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0];
  if (topTag) insights.push({ icon: '⏰', text: <>You have the most tasks in <strong>{topTag[0]}</strong>. Make sure other subjects get equal attention.</> });

  const totalTasks = tasks.filter(t => !t.parent_id).length;
  const doneTasks = tasks.filter(t => !t.parent_id && t.status === 'done').length;
  const rate = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0;
  insights.push({ icon: '🎯', text: <>Overall completion rate: <strong>{rate}%</strong>. Aim for 80%+ by keeping tasks small and specific.</> });

  const totalHours = logs.reduce((s, l) => s + parseFloat(l.hours_studied || 0), 0);
  if (totalHours > 0) insights.push({ icon: '📚', text: <>Total logged study time: <strong>{totalHours.toFixed(1)} hours</strong>. Incredible commitment!</> });

  const overdueTasks = tasks.filter(t => !t.parent_id && t.deadline && t.deadline < todayStr && t.status !== 'done');
  if (overdueTasks.length > 0) insights.push({ icon: '⚠️', text: <><strong>{overdueTasks.length} task{overdueTasks.length > 1 ? 's are' : ' is'} overdue</strong>. Review and reschedule or complete them today.</> });

  const weekLogs = logs.slice(0, 7);
  const avgH = weekLogs.length ? weekLogs.reduce((s, l) => s + parseFloat(l.hours_studied || 0), 0) / weekLogs.length : 0;
  if (avgH > 0) insights.push({ icon: '📊', text: <>Last 7 logs average: <strong>{avgH.toFixed(1)}h/day</strong>. {avgH >= 4 ? 'Excellent pace! 🔥' : 'Try to push towards 4-5h daily.'}</> });

  const recentMoods = logs.slice(0, 5).map(l => l.mood).filter(Boolean);
  if (recentMoods.includes('🚀') || recentMoods.includes('⚡')) insights.push({ icon: '🚀', text: <>You've been in high-energy mode recently. Use those days for the hardest new concepts.</> });

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Smart insights</div>
        {insights.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Keep logging data to generate insights!</div>}
        {insights.map((ins, i) => (
          <div key={i} className="insight-row">
            <span className="insight-icon">{ins.icon}</span>
            <span>{ins.text}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Recent logs</div>
        {logs.slice(0, 10).map(l => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', minWidth: 80 }}>{l.log_date?.slice(0, 10)}</span>
            <span style={{ fontSize: 16 }}>{l.mood}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{l.hours_studied}h</span>
            <span style={{ flex: 1, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.what_studied}</span>
            {l.wins && <span style={{ fontSize: 12, color: 'var(--green)' }}>🎉 {l.wins}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
