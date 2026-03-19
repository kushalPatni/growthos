export const TAG_COLORS = {
  Python: 'tag-blue', ML: 'tag-green', Stats: 'tag-purple',
  DSA: 'tag-amber', Project: 'tag-teal', Maths: 'tag-teal',
  Other: 'tag-red',
};

export function tagClass(tag) {
  return TAG_COLORS[tag] || 'tag-blue';
}

export function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function fmtTimer(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function secsToHM(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(d, n) {
  const dt = new Date(d + 'T00:00:00');
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function calcStreak(logs) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = d.toISOString().slice(0, 10);
    if (logs.some(l => l.log_date?.slice(0, 10) === ds && l.hours_studied > 0)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export const TAGS = ['Python', 'ML', 'Stats', 'DSA', 'Project', 'Maths', 'Other'];
export const PRIORITIES = [
  { value: 'high', label: 'High 🔴' },
  { value: 'mid', label: 'Medium 🟡' },
  { value: 'low', label: 'Low 🟢' },
];
