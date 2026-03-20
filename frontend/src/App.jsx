import { useState, useEffect } from 'react';
import api from './api';
import { useAuth } from './context/AuthContext';
import { useToast } from './hooks/useToast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import TimerPage from './pages/TimerPage';
import CalendarPage from './pages/CalendarPage';
import {
  RoadmapPage, ProjectsPage, NotesPage,
  RevisionPage, AnalyticsPage, InsightsPage
} from './pages/OtherPages';

const PAGE_TITLES = {
  dashboard: 'Dashboard', tasks: 'Tasks', timer: 'Time Tracker',
  calendar: 'Calendar', roadmap: 'Roadmap', projects: 'Projects',
  notes: 'Notes', revision: 'Revision', analytics: 'Analytics', insights: 'Insights',
};

function QuickLogModal({ onClose, onSave, toast }) {
  const [form, setForm] = useState({ hours_studied: '', mood: '🙂', what_studied: '', wins: '' });
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try { await onSave(form); onClose(); toast('Daily log saved ✓'); }
    catch { toast('Failed to save log'); }
    finally { setSaving(false); }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">⚡ Quick Daily Log</div>
        <div className="form-group">
          <label className="form-label">What did you study today?</label>
          <textarea className="input" placeholder="e.g. Completed Numpy chapter, started Pandas…"
            value={form.what_studied} onChange={e => setForm(f => ({ ...f, what_studied: e.target.value }))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Hours studied</label>
            <input className="input" placeholder="e.g. 3.5" value={form.hours_studied}
              onChange={e => setForm(f => ({ ...f, hours_studied: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Mood</label>
            <select className="input" value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}>
              {['😴 Tired', '😐 Okay', '🙂 Good', '⚡ Energized', '🚀 On fire'].map(m => (
                <option key={m} value={m.split(' ')[0]}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Wins today 🎉</label>
          <input className="input" placeholder="What went well?" value={form.wins}
            onChange={e => setForm(f => ({ ...f, wins: e.target.value }))} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Log'}</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  const { toast, ToastContainer } = useToast();
  const [page, setPage]                 = useState('dashboard');
  const [tasks, setTasks]               = useState([]);
  const [logs, setLogs]                 = useState([]);
  const [projects, setProjects]         = useState([]);
  const [dataLoading, setDataLoading]   = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    Promise.all([
      api.get('/tasks').then(r => setTasks(r.data)),
      api.get('/logs').then(r => setLogs(r.data)),
      api.get('/projects').then(r => setProjects(r.data)),
    ]).catch(err => console.error('Failed to load app data:', err))
      .finally(() => setDataLoading(false));
  }, [user]);

  async function saveQuickLog(form) {
    const r = await api.post('/logs', {
      log_date: new Date().toISOString().slice(0, 10),
      hours_studied: parseFloat(form.hours_studied) || 0,
      mood: form.mood, what_studied: form.what_studied, wins: form.wins,
    });
    setLogs(prev => {
      const dk = r.data.log_date?.slice(0, 10);
      return [r.data, ...prev.filter(l => l.log_date?.slice(0, 10) !== dk)];
    });
  }

  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  if (dataLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12, background:'var(--bg)', color:'var(--text3)' }}>
      <div style={{ fontSize:28 }}>🌱</div>
      <div style={{ fontSize:14 }}>Loading your workspace…</div>
    </div>
  );

  function renderPage() {
    switch (page) {
      case 'dashboard':  return <Dashboard tasks={tasks} logs={logs} onQuickLog={() => setShowQuickLog(true)} setPage={setPage} toast={toast} />;
      case 'tasks':      return <TasksPage tasks={tasks} onTasksChange={setTasks} projects={projects} toast={toast} />;
      case 'timer':      return <TimerPage tasks={tasks} toast={toast} />;
      case 'calendar':   return <CalendarPage tasks={tasks} toast={toast} />;
      case 'roadmap':    return <RoadmapPage toast={toast} />;
      case 'projects':   return <ProjectsPage toast={toast} />;
      case 'notes':      return <NotesPage toast={toast} />;
      case 'revision':   return <RevisionPage toast={toast} />;
      case 'analytics':  return <AnalyticsPage tasks={tasks} logs={logs} />;
      case 'insights':   return <InsightsPage tasks={tasks} logs={logs} />;
      default:           return null;
    }
  }

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} logs={logs} />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{PAGE_TITLES[page]}</div>
          <div className="topbar-right">
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text3)' }}>{dateStr}</span>
            <button className="chip" onClick={() => setPage('tasks')}>+ Task</button>
            <button className="chip accent" onClick={() => setShowQuickLog(true)}>⚡ Log Day</button>
          </div>
        </div>
        <div className="page-content">{renderPage()}</div>
      </div>
      {showQuickLog && <QuickLogModal onClose={() => setShowQuickLog(false)} onSave={saveQuickLog} toast={toast} />}
      <ToastContainer />
    </div>
  );
}
