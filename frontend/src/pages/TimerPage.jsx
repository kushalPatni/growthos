import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { fmtTimer, tagClass, secsToHM } from '../utils';

export default function TimerPage({ tasks, toast }) {
  const [timers, setTimers] = useState({}); // taskId -> { secs, running, intervalId }
  const timersRef = useRef(timers);
  timersRef.current = timers;

  // Pomodoro
  const [pomoSecs, setPomoSecs] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoMode, setPomoMode] = useState('focus');
  const pomoRef = useRef(null);
  const pomoDuration = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

  function toggleTimer(taskId) {
    const cur = timersRef.current[taskId];
    if (cur?.running) {
      // Stop and log to server
      clearInterval(cur.intervalId);
      const secs = cur.secs;
      setTimers(t => ({ ...t, [taskId]: { ...t[taskId], running: false, intervalId: null } }));
      if (secs > 0) {
        api.post(`/tasks/${taskId}/time`, { seconds: secs }).catch(() => {});
        toast(`Logged ${Math.floor(secs / 60)}m for this task`);
      }
    } else {
      const id = setInterval(() => {
        setTimers(t => ({
          ...t,
          [taskId]: { ...t[taskId], secs: (t[taskId]?.secs || 0) + 1 }
        }));
      }, 1000);
      setTimers(t => ({ ...t, [taskId]: { secs: cur?.secs || 0, running: true, intervalId: id } }));
    }
  }

  function pomodoroAction() {
    if (pomoRunning) {
      clearInterval(pomoRef.current);
      setPomoRunning(false);
    } else {
      setPomoRunning(true);
      pomoRef.current = setInterval(() => {
        setPomoSecs(s => {
          if (s <= 1) {
            clearInterval(pomoRef.current);
            setPomoRunning(false);
            alert('⏰ Pomodoro done! Take a break.');
            return pomoDuration[pomoMode];
          }
          return s - 1;
        });
      }, 1000);
    }
  }

  function resetPomo(mode) {
    clearInterval(pomoRef.current);
    setPomoRunning(false);
    const m = mode || pomoMode;
    setPomoMode(m);
    setPomoSecs(pomoDuration[m]);
  }

  // Cleanup on unmount
  useEffect(() => () => {
    Object.values(timersRef.current).forEach(t => t.intervalId && clearInterval(t.intervalId));
    clearInterval(pomoRef.current);
  }, []);

  const rootTasks = tasks.filter(t => !t.parent_id && t.status !== 'done');
  const totalSecs = Object.values(timers).reduce((s, t) => s + (t.secs || 0), 0);
  const runningCount = Object.values(timers).filter(t => t.running).length;

  const mm = String(Math.floor(pomoSecs / 60)).padStart(2, '0');
  const ss = String(pomoSecs % 60).padStart(2, '0');

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="metric"><div className="metric-label">Session focus time</div><div className="metric-value">{secsToHM(totalSecs)}</div><div className="metric-sub">This session</div></div>
        <div className="metric"><div className="metric-label">Active timers</div><div className="metric-value">{runningCount}</div><div className="metric-sub">tasks being tracked</div></div>
      </div>

      {/* Task timers */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Task timers</div>
        {rootTasks.length === 0
          ? <div className="empty"><p>No pending tasks. Go add some!</p></div>
          : rootTasks.map(t => {
            const timer = timers[t.id] || { secs: 0, running: false };
            return (
              <div key={t.id} className={`timer-row ${timer.running ? 'timer-running' : ''}`}>
                <div style={{ flex: 1, fontSize: 13 }}>{t.title}</div>
                <span className={`tag ${tagClass(t.tag)}`}>{t.tag}</span>
                <span className={`timer-disp ${timer.running ? 'running' : ''}`}>
                  {fmtTimer(timer.secs)}
                </span>
                <button className={`timer-start ${timer.running ? 'running' : ''}`} onClick={() => toggleTimer(t.id)}>
                  {timer.running ? 'Stop' : 'Start'}
                </button>
              </div>
            );
          })
        }
      </div>

      {/* Pomodoro */}
      <div className="card">
        <div className="card-title">Pomodoro timer</div>
        <div className="pomo-display">{mm}:{ss}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={pomodoroAction}>
            {pomoRunning ? '⏸ Pause' : '▶ Start'}
          </button>
          <button className="btn btn-ghost" onClick={() => resetPomo()}>↺ Reset</button>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['focus', 'Focus 25m'], ['short', 'Break 5m'], ['long', 'Long Break 15m']].map(([m, label]) => (
            <button key={m} className={`chip ${pomoMode === m ? 'active' : ''}`} onClick={() => resetPomo(m)}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
