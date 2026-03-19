import { useState } from 'react';
import api from '../api';
import { tagClass, fmtDate, TAGS, PRIORITIES } from '../utils';

function TaskNode({ task, depth, onUpdate, onDelete, toast }) {
  const [expanded, setExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const [notes, setNotes] = useState(task.notes || '');
  const [noteSaving, setNoteSaving] = useState(false);

  const isDone = task.status === 'done';
  const subCount = task.subtasks?.length || 0;
  const doneSubs = task.subtasks?.filter(s => s.status === 'done').length || 0;

  async function toggleDone() {
    try {
      const updated = await api.patch(`/tasks/${task.id}`, { status: isDone ? 'pending' : 'done' });
      onUpdate(task.id, updated.data);
    } catch { toast('Failed to update task'); }
  }

  async function addSubtask() {
    if (!subTitle.trim()) return;
    try {
      const r = await api.post('/tasks', { title: subTitle.trim(), parent_id: task.id, tag: task.tag, priority: 'mid' });
      onUpdate(task.id, { ...task, subtasks: [...(task.subtasks || []), r.data] });
      setSubTitle('');
      setShowAddSub(false);
      setExpanded(true);
      toast('Subtask added ✓');
    } catch { toast('Failed to add subtask'); }
  }

  async function saveNotes() {
    setNoteSaving(true);
    try {
      await api.patch(`/tasks/${task.id}`, { notes });
      toast('Notes saved ✓');
    } catch { toast('Failed to save notes'); }
    finally { setNoteSaving(false); }
  }

  return (
    <div className={`task-item ${isDone ? 'done-item' : ''}`} style={{ marginLeft: depth * 18 }}>
      <div className="task-header">
        {/* Expand toggle */}
        <button
          className="task-expand"
          onClick={() => setExpanded(e => !e)}
          style={{ opacity: subCount > 0 || showAddSub ? 1 : 0.3 }}
        >
          {expanded ? '▾' : '▸'}
        </button>

        {/* Done checkbox */}
        <div className={`task-check ${isDone ? 'checked' : ''}`} onClick={toggleDone} />

        {/* Title */}
        <span className={`task-label ${isDone ? 'done-text' : ''}`}>{task.title}</span>

        {/* Meta */}
        <div className="task-meta">
          {subCount > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>{doneSubs}/{subCount}</span>
          )}
          <span className={`pri pri-${task.priority}`} />
          <span className={`tag ${tagClass(task.tag)}`}>{task.tag}</span>
          {task.deadline && (
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>{fmtDate(task.deadline)}</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="task-actions">
          <button className="task-btn" onClick={() => { setShowAddSub(s => !s); setExpanded(true); }} title="Add subtask">+sub</button>
          <button className="task-btn" onClick={() => { setShowNotes(s => !s); setExpanded(true); }} title="Notes">📝</button>
          <button className="task-btn del" onClick={() => onDelete(task.id)} title="Delete">✕</button>
        </div>
      </div>

      {/* Expanded zone */}
      {expanded && (
        <div className="subtask-zone">
          {/* Nested subtasks */}
          {(task.subtasks || []).map(sub => (
            <TaskNode
              key={sub.id}
              task={sub}
              depth={depth + 1}
              toast={toast}
              onUpdate={(id, updated) => {
                // propagate update up
                const newSubs = (task.subtasks || []).map(s => s.id === id ? updated : s);
                onUpdate(task.id, { ...task, subtasks: newSubs });
              }}
              onDelete={(id) => {
                const newSubs = (task.subtasks || []).filter(s => s.id !== id);
                onUpdate(task.id, { ...task, subtasks: newSubs });
                api.delete(`/tasks/${id}`).catch(() => {});
              }}
            />
          ))}

          {/* Add subtask input */}
          {showAddSub && (
            <div className="add-sub-row">
              <span style={{ fontSize: 10, color: 'var(--text3)', minWidth: 55 }}>+ subtask</span>
              <input
                className="add-sub-input"
                placeholder="Subtask title…"
                value={subTitle}
                onChange={e => setSubTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubtask()}
                autoFocus
              />
              <button className="btn btn-primary btn-xs" onClick={addSubtask}>Add</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowAddSub(false)}>✕</button>
            </div>
          )}

          {/* Notes area */}
          {showNotes && (
            <div className="notes-zone">
              <textarea
                className="input"
                style={{ fontSize: 12, minHeight: 60 }}
                placeholder="Task notes, links, references…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <button className="btn btn-primary btn-xs" style={{ marginTop: 6 }} onClick={saveNotes} disabled={noteSaving}>
                {noteSaving ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TaskTree({ tasks, onTasksChange, toast }) {
  function handleUpdate(id, updated) {
    // Deep update in the flat/nested structure
    function updateIn(arr) {
      return arr.map(t => {
        if (t.id === id) return { ...t, ...updated };
        if (t.subtasks?.length) return { ...t, subtasks: updateIn(t.subtasks) };
        return t;
      });
    }
    onTasksChange(updateIn(tasks));
  }

  function handleDelete(id) {
    function removeFrom(arr) {
      return arr.filter(t => t.id !== id).map(t => ({
        ...t, subtasks: t.subtasks ? removeFrom(t.subtasks) : []
      }));
    }
    onTasksChange(removeFrom(tasks));
    api.delete(`/tasks/${id}`).then(() => toast('Deleted ✓')).catch(() => toast('Delete failed'));
  }

  if (!tasks.length) return (
    <div className="empty">📭<p>No tasks yet. Add one!</p></div>
  );

  return (
    <div>
      {tasks.map(task => (
        <TaskNode
          key={task.id}
          task={task}
          depth={0}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          toast={toast}
        />
      ))}
    </div>
  );
}
