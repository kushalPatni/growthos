import { useEffect, useState } from 'react';
import api from '../api';
import MiniCalendar from '../components/MiniCalendar';
import { today, calcStreak, tagClass, fmtDate } from '../utils';

const MOOD_OPTIONS = ['😴', '😐', '🙂', '⚡', '🚀'];
const TAG_COLORS = { Python: 'var(--accent)', Stats: 'var(--purple)', ML: 'var(--green)', DSA: 'var(--amber)', Project: 'var(--teal)', Maths: 'var(--red)', Other: 'var(--text3)' };

export default function Dashboard({ tasks, logs, onQuickLog, setPage, toast }) {
  const [todayLog, setTodayLog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateTasks, setDateTasks] = useState([]);

  useEffect(() => {
    const log = logs.find(l => l.log_date?.slice(0, 10) === today());
    setTodayLog(log || null);
  }, [logs]);

  const todayTasks = tasks.filter(t => !t.parent_id && (t.deadline?.slice(0,10) === today() || t.created_at?.slice(0,10) === today()));
  const doneTodayCount = todayTasks.filter(t => t.status === 'done').length;
  const streak = calcStreak(logs);
  const totalTasks = tasks.filter(t => !t.parent_id).length;
  const doneTasks = tasks.filter(t => !t.parent_id && t.status === 'done').length;
  const rate = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0;

  const tagStats = {};
  tasks.filter(t => !t.parent_id).forEach(t => {
    if (!tagStats[t.tag]) tagStats[t.tag] = { total: 0, done: 0 };
    tagStats[t.tag].total++;
    if (t.status === 'done') tagStats[t.tag].done++;
  });

  async function logMood(mood) {
    try {
      const r = await api.post('/logs', {
        log_date: today(),
        hours_studied: todayLog?.hours_studied || 0,
        mood,
        what_studied: todayLog?.what_studied || '',
        wins: todayLog?.wins || '',
      });
      setTodayLog(r.data);
      toast('Mood logged ' + mood);
    } catch { toast('Failed to log mood'); }
  }

  async function handleDateClick(dateStr) {
    setSelectedDate(dateStr);
    try {
      const r = await api.get(`/tasks/by-date/${dateStr}`);
      setDateTasks(r.data);
    } catch { setDateTasks([]); }
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const log = logs.find(l => l.log_date?.slice(0, 10) === ds);
    return { day: ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()], date: ds, hours: log?.hours_studied || 0 };
  });
  const maxH = Math.max(...last7.map(d => d.hours), 1);

  return (
    <div>
      {/* Metrics */}
      <div className="grid-4">
        <div className="metric"><div className="metric-label">Tasks today</div><div className="metric-value">{doneTodayCount}/{todayTasks.length}</div><div className="metric-sub">{todayTasks.length ? Math.round(doneTodayCount / todayTasks.length * 100) : 0}% done</div></div>
        <div className="metric"><div className="metric-label">Hours today</div><div className="metric-value">{todayLog?.hours_studied || 0}h</div><div className="metric-sub">Goal: 5h</div></div>
        <div className="metric"><div className="metric-label">Streak</div><div className="metric-value">🔥 {streak}</div><div className="metric-sub">days in a row</div></div>
        <div className="metric"><div className="metric-label">Completion</div><div className="metric-value">{rate}%</div><div className="metric-sub">All time</div></div>
      </div>

      <div className="grid-2">
        {/* Left column */}
        <div>
          {/* Today tasks */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="card-title" style={{ marginBottom: 0 }}>Today's tasks</div>
              <button className="btn btn-ghost btn-xs" onClick={() => setPage('tasks')}>View all →</button>
            </div>
            {todayTasks.length === 0
              ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>No tasks for today. <button className="btn btn-ghost btn-xs" onClick={() => setPage('tasks')}>Add one</button></div>
              : todayTasks.slice(0, 6).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className={`task-check ${t.status === 'done' ? 'checked' : ''}`} style={{ cursor: 'default' }} />
                  <span style={{ flex: 1, fontSize: 13, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? 'var(--text3)' : 'inherit' }}>{t.title}</span>
                  <span className={`tag ${tagClass(t.tag)}`}>{t.tag}</span>
                </div>
              ))
            }
          </div>

          {/* Mini bar chart */}
          <div className="card">
            <div className="card-title">Hours studied — last 7 days</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
              {last7.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', background: d.date === today() ? 'var(--accent)' : 'rgba(79,142,247,0.35)', borderRadius: '4px 4px 0 0', height: `${(d.hours / maxH) * 60}px`, minHeight: d.hours > 0 ? 4 : 0, transition: 'height 0.4s' }} />
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Streak dots */}
          <div className="card">
            <div className="card-title">Weekly streak</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {last7.map((d, i) => {
                const isToday = d.date === today();
                const active = d.hours > 0;
                return (
                  <div key={i} className={`streak-dot ${isToday ? 'dot-today' : active ? 'dot-on' : 'dot-off'}`}>
                    {d.day[0]}
                  </div>
                );
              })}
            </div>

            {/* Progress by tag */}
            {Object.entries(tagStats).map(([tag, { total, done }]) => (
              <div key={tag} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>
                  <span>{tag}</span><span>{Math.round(done / total * 100)}%</span>
                </div>
                <div className="prog-wrap">
                  <div className="prog-fill" style={{ width: `${Math.round(done / total * 100)}%`, background: TAG_COLORS[tag] || 'var(--accent)' }} />
                </div>
              </div>
            ))}

            {/* Mood */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Today's mood</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {MOOD_OPTIONS.map(m => (
                  <button key={m} onClick={() => logMood(m)}
                    style={{ padding: '5px 8px', borderRadius: 8, border: `1px solid ${todayLog?.mood === m ? 'var(--accent)' : 'var(--border)'}`, background: todayLog?.mood === m ? 'rgba(79,142,247,0.1)' : 'transparent', fontSize: 18, cursor: 'pointer' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Calendar */}
        <div>
          <MiniCalendar tasks={tasks} onDateClick={handleDateClick} />

          {/* Date detail */}
          {selectedDate && (
            <div className="card">
              <div className="card-title">{selectedDate} — tasks</div>
              {dateTasks.length === 0
                ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>No tasks for this date</div>
                : dateTasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div className={`task-check ${t.status === 'done' ? 'checked' : ''}`} style={{ cursor: 'default' }} />
                    <span style={{ flex: 1 }}>{t.title}</span>
                    <span className={`tag ${tagClass(t.tag)}`}>{t.tag}</span>
                  </div>
                ))
              }
            </div>
          )}

          {/* Quick log */}
          <div className="card">
            <div className="card-title">Quick daily log</div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onQuickLog}>
              ⚡ Log Today's Study
            </button>
            {todayLog && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
                <div>📚 {todayLog.hours_studied}h studied</div>
                {todayLog.what_studied && <div>📝 {todayLog.what_studied}</div>}
                {todayLog.wins && <div>🎉 {todayLog.wins}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
