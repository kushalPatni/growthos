import { useAuth } from '../context/AuthContext';
import { calcStreak } from '../utils';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { id: 'tasks', label: 'Tasks', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { id: 'timer', label: 'Time Tracker', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { id: 'calendar', label: 'Calendar', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
];
const NAV2 = [
  { id: 'roadmap', label: 'Roadmap', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> },
  { id: 'projects', label: 'Projects', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
  { id: 'notes', label: 'Notes', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { id: 'revision', label: 'Revision', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> },
];
const NAV3 = [
  { id: 'analytics', label: 'Analytics', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { id: 'insights', label: 'Insights', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
];

export default function Sidebar({ page, setPage, logs }) {
  const { user, logout } = useAuth();
  const streak = calcStreak(logs || []);

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-name">🌱 GrowthOS</div>
        <div className="sidebar-logo-sub">{user?.name || 'Personal Academy'}</div>
      </div>

      <div className="nav-section">Main</div>
      {NAV.map(n => (
        <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
          {n.icon}{n.label}
        </button>
      ))}

      <div className="nav-section">Academic</div>
      {NAV2.map(n => (
        <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
          {n.icon}{n.label}
        </button>
      ))}

      <div className="nav-section">Growth</div>
      {NAV3.map(n => (
        <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
          {n.icon}{n.label}
        </button>
      ))}

      <div className="sidebar-bottom">
        <div className="streak-pill" style={{ marginBottom: 10 }}>
          🔥 <strong>{streak}</strong> day streak
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(79,142,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>
            {user?.avatar_initials || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={logout} title="Sign out">↩</button>
        </div>
      </div>
    </div>
  );
}
