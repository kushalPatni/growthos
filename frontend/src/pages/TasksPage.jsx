import { useState } from 'react';
import TaskTree from '../components/TaskTree';
import AddTaskModal from '../components/AddTaskModal';
import { TAGS } from '../utils';

export default function TasksPage({ tasks, onTasksChange, projects, toast }) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  function handleAdded(task) {
    onTasksChange([task, ...tasks]);
  }

  // Only show root tasks (no parent) in the filtered view
  const rootTasks = tasks.filter(t => !t.parent_id);

  const filtered = rootTasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTag && t.tag !== filterTag) return false;
    if (filterStatus === 'done' && t.status !== 'done') return false;
    if (filterStatus === 'pending' && t.status === 'done') return false;
    return true;
  });

  // For filtered view, we need to attach subtasks back
  const filteredWithSubs = filtered.map(t => {
    const original = tasks.find(x => x.id === t.id);
    return original || t;
  });

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" style={{ maxWidth: 220 }} placeholder="Search tasks…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" style={{ maxWidth: 130 }} value={filterTag} onChange={e => setFilterTag(e.target.value)}>
          <option value="">All tags</option>
          {TAGS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="done">Done</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>
            {filtered.filter(t => t.status === 'done').length}/{filtered.length} done
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ New Task</button>
        </div>
      </div>

      <TaskTree tasks={filteredWithSubs} onTasksChange={onTasksChange} toast={toast} />

      {showAdd && (
        <AddTaskModal
          projects={projects}
          toast={toast}
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
