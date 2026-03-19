import { useState, useEffect } from 'react';
import api from '../api';
import { TAGS, PRIORITIES } from '../utils';

export default function AddTaskModal({ onClose, onAdded, toast, projects = [] }) {
  const [form, setForm] = useState({
    title: '', description: '', tag: 'Python', priority: 'mid',
    deadline: '', planned_hours: '', project_id: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.title.trim()) { toast('Title is required'); return; }
    setSaving(true);
    try {
      const r = await api.post('/tasks', {
        ...form,
        planned_hours: parseFloat(form.planned_hours) || 0,
        project_id: form.project_id || null,
      });
      onAdded(r.data);
      toast('Task added ✓');
      onClose();
    } catch { toast('Failed to add task'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Add New Task</div>

        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="input" placeholder="e.g. Learn Pandas groupby" value={form.title}
            onChange={e => set('title', e.target.value)} autoFocus />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="input" placeholder="What does this task cover?" value={form.description}
            onChange={e => set('description', e.target.value)} style={{ minHeight: 70 }} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tag</label>
            <select className="input" value={form.tag} onChange={e => set('tag', e.target.value)}>
              {TAGS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input className="input" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Planned hours</label>
            <input className="input" placeholder="e.g. 2.5" value={form.planned_hours}
              onChange={e => set('planned_hours', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Project (optional)</label>
          <select className="input" value={form.project_id} onChange={e => set('project_id', e.target.value)}>
            <option value="">None</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
