import { useState, useEffect } from 'react';
import api from '../api';
import { today } from '../utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const COLORS = { blue:'#4f8ef7', green:'#3ecf8e', amber:'#f5a623', red:'#f06060', purple:'#a78bfa' };

export default function MiniCalendar({ tasks = [], onDateClick }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [events, setEvents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', color: 'blue' });
  const todayStr = today();

  useEffect(() => {
    fetchEvents();
  }, [viewMonth, viewYear]);

  async function fetchEvents() {
    try {
      const r = await api.get('/calendar', { params: { month: viewMonth + 1, year: viewYear } });
      setEvents(r.data);
    } catch { /* ignore */ }
  }

  async function addEvent() {
    if (!newEvent.title.trim() || !newEvent.date) return;
    try {
      const r = await api.post('/calendar', newEvent);
      setEvents(ev => [...ev, r.data]);
      setShowAdd(false);
      setNewEvent({ title: '', date: '', color: 'blue' });
    } catch { /* ignore */ }
  }

  async function deleteEvent(id) {
    try {
      await api.delete(`/calendar/${id}`);
      setEvents(ev => ev.filter(e => e.id !== id));
    } catch { /* ignore */ }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  // prev month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, currentMonth: false, date: null });
  }
  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, currentMonth: true, date: `${viewYear}-${mm}-${dd}` });
  }
  // next month padding
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false, date: null });
  }

  function getTasksForDate(dateStr) {
    return tasks.filter(t => t.deadline?.slice(0, 10) === dateStr);
  }
  function getEventsForDate(dateStr) {
    return events.filter(e => e.event_date?.slice(0, 10) === dateStr);
  }

  return (
    <div className="card" style={{ padding: '16px 16px' }}>
      {/* Header */}
      <div className="cal-header">
        <button className="btn btn-ghost btn-xs" onClick={prevMonth}>‹</button>
        <span className="cal-month-title">{MONTHS[viewMonth]} {viewYear}</span>
        <button className="btn btn-ghost btn-xs" onClick={nextMonth}>›</button>
      </div>

      {/* Day names */}
      <div className="cal-grid" style={{ marginBottom: 4 }}>
        {DAYS.map(d => <div key={d} className="cal-day-name">{d[0]}</div>)}
      </div>

      {/* Cells */}
      <div className="cal-grid">
        {cells.map((cell, i) => {
          const taskList = cell.date ? getTasksForDate(cell.date) : [];
          const eventList = cell.date ? getEventsForDate(cell.date) : [];
          const isToday = cell.date === todayStr;
          const hasItems = taskList.length > 0 || eventList.length > 0;
          return (
            <div
              key={i}
              className={`cal-cell ${isToday ? 'today' : ''} ${!cell.currentMonth ? 'other-month' : ''} ${hasItems ? 'has-task' : ''}`}
              onClick={() => cell.date && onDateClick && onDateClick(cell.date)}
              title={cell.date || ''}
            >
              <div className="cal-num">{cell.day}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
                {taskList.slice(0, 2).map((_, ti) => (
                  <div key={ti} className="cal-event-dot" style={{ background: 'var(--accent)' }} />
                ))}
                {eventList.slice(0, 2).map((ev, ei) => (
                  <div key={ei} className="cal-event-dot" style={{ background: COLORS[ev.color] || COLORS.blue }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10, color: 'var(--text3)', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginRight: 4 }}/>Task deadline</span>
        <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', marginRight: 4 }}/>Event</span>
      </div>

      {/* Add Event */}
      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        {!showAdd ? (
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowAdd(true)}>
            + Add Event
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <input className="input" style={{ fontSize: 12 }} placeholder="Event title" value={newEvent.title}
              onChange={e => setNewEvent(n => ({ ...n, title: e.target.value }))} />
            <input className="input" type="date" style={{ fontSize: 12 }} value={newEvent.date}
              onChange={e => setNewEvent(n => ({ ...n, date: e.target.value }))} />
            <select className="input" style={{ fontSize: 12 }} value={newEvent.color}
              onChange={e => setNewEvent(n => ({ ...n, color: e.target.value }))}>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="amber">Amber</option>
              <option value="red">Red</option>
              <option value="purple">Purple</option>
            </select>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={addEvent}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Events this month */}
      {events.length > 0 && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)', marginBottom: 8 }}>This Month</div>
          {events.map(ev => (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, fontSize: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[ev.color] || COLORS.blue, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
              <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{ev.event_date?.slice(5).replace('-', '/')}</span>
              <button className="task-btn del" onClick={() => deleteEvent(ev.id)} style={{ padding: '1px 5px' }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
