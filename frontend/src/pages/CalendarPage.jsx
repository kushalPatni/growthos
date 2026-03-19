import { useState } from 'react';
import MiniCalendar from '../components/MiniCalendar';
import api from '../api';
import { tagClass } from '../utils';

export default function CalendarPage({ tasks, toast }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateTasks, setDateTasks] = useState([]);

  async function handleDateClick(dateStr) {
    setSelectedDate(dateStr);
    try {
      const r = await api.get(`/tasks/by-date/${dateStr}`);
      setDateTasks(r.data);
    } catch { setDateTasks([]); }
  }

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div>
        <MiniCalendar tasks={tasks} onDateClick={handleDateClick} />
      </div>
      <div>
        {selectedDate ? (
          <div className="card">
            <div className="card-title">Tasks for {selectedDate}</div>
            {dateTasks.length === 0
              ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>No tasks with this deadline.</div>
              : dateTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div className={`task-check ${t.status === 'done' ? 'checked' : ''}`} style={{ cursor: 'default' }} />
                  <span style={{ flex: 1 }}>{t.title}</span>
                  <span className={`tag ${tagClass(t.tag)}`}>{t.tag}</span>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: t.priority === 'high' ? 'rgba(240,96,96,0.12)' : t.priority === 'mid' ? 'rgba(245,166,35,0.12)' : 'rgba(62,207,142,0.12)', color: t.priority === 'high' ? 'var(--red)' : t.priority === 'mid' ? 'var(--amber)' : 'var(--green)' }}>
                    {t.priority}
                  </span>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="card">
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              👆 Click a date on the calendar to see tasks for that day
            </div>
          </div>
        )}

        {/* Upcoming tasks */}
        <div className="card">
          <div className="card-title">Upcoming deadlines</div>
          {tasks
            .filter(t => !t.parent_id && t.deadline && t.status !== 'done' && t.deadline >= new Date().toISOString().slice(0, 10))
            .sort((a, b) => a.deadline.localeCompare(b.deadline))
            .slice(0, 8)
            .map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ flex: 1 }}>{t.title}</span>
                <span className={`tag ${tagClass(t.tag)}`}>{t.tag}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.deadline?.slice(5)}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
