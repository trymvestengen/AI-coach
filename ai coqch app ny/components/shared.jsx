// shared.jsx — icons, tab bar, coach pill, small UI atoms

const Icon = {
  Home: ({ size = 22, active = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H5.5A1.5 1.5 0 0 1 4 19v-8.5Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0}/>
    </svg>
  ),
  Dumbbell: ({ size = 22, active = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12"/>
      {active && <path d="M6 12h12" strokeWidth="3"/>}
    </svg>
  ),
  Coach: ({ size = 22, active = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.25 : 0}/>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.55"/>
    </svg>
  ),
  Profile: ({ size = 22, active = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8.5" r="3.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
      <path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5" strokeLinecap="round"/>
    </svg>
  ),
  Social: ({ size = 22, active = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="3.2" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
      <circle cx="17" cy="11" r="2.6"/>
      <path d="M3 20c0.6-3.2 3-5 6-5s5.4 1.8 6 5"/>
      <path d="M15 19.5c0.5-2.4 2-3.8 4-3.8"/>
    </svg>
  ),
  Heart: ({ size = 16, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>
    </svg>
  ),
  Comment: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 3.5V17H6a2 2 0 0 1-2-2V6Z"/>
    </svg>
  ),
  Share: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M8 7l4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>
    </svg>
  ),
  UserPlus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="3.5"/>
      <path d="M3 20c0.7-3.4 3.3-5 7-5s6.3 1.6 7 5"/>
      <path d="M19 5v6M16 8h6"/>
    </svg>
  ),
  Check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7"/>
    </svg>
  ),
  Alarm: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="7"/>
      <path d="M12 10v3l2 1M5 3l-2 2M19 3l2 2"/>
    </svg>
  ),
  More: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>
    </svg>
  ),
  Play: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 5v14l12-7L7 5Z"/>
    </svg>
  ),
  Info: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 11v5M12 8v.5" strokeLinecap="round"/>
    </svg>
  ),
  Search: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.5-3.5"/>
    </svg>
  ),
  Plus: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Mic: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="12" rx="3"/>
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
    </svg>
  ),
  MicOff: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l16 16"/>
      <path d="M9 5a3 3 0 0 1 6 0v6M15 13.5a3 3 0 0 1-5.9.5"/>
      <path d="M5 11a7 7 0 0 0 12 4.9M19 11a7 7 0 0 1-.3 2M12 18v3"/>
    </svg>
  ),
  X: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M6 18L18 6"/>
    </svg>
  ),
  Chevron: ({ size = 16, dir = 'right' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: dir === 'down' ? 'rotate(90deg)' : dir === 'left' ? 'rotate(180deg)' : 'none' }}>
      <path d="M9 6l6 6-6 6"/>
    </svg>
  ),
  Flame: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 2.5c.8 3-1.5 4.5-2.8 6.5-1.3 2-1.5 4 .3 4 1.2 0 1.8-.9 2-2 .8 1 1.5 2.5 1.5 4a5 5 0 1 1-10 0c0-3 2-5 3.5-6.8C9.8 6 10.5 4 10 2c2 .2 3 .5 3.5.5Z"/>
    </svg>
  ),
  Bolt: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>
    </svg>
  ),
  Sparkle: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c.7 4.3 2.7 6.3 7 7-4.3.7-6.3 2.7-7 7-.7-4.3-2.7-6.3-7-7 4.3-.7 6.3-2.7 7-7Z"/>
    </svg>
  ),
  Wave: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 11v2"/>
    </svg>
  ),
  Keyboard: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="6" width="19" height="12" rx="2.5"/>
      <path d="M6 10h0M10 10h0M14 10h0M18 10h0M6 14h12"/>
    </svg>
  ),
  Send: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6"/>
    </svg>
  ),
  ArrowUp: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6"/>
    </svg>
  ),
};

function TabBar({ active = 'home', onTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Icon.Home },
    { id: 'workout', label: 'Workout', icon: Icon.Dumbbell },
    { id: 'coach', label: 'Coach', icon: Icon.Coach },
    { id: 'social', label: 'Social', icon: Icon.Social },
    { id: 'profile', label: 'Profile', icon: Icon.Profile },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingTop: 8, paddingBottom: 28,
      background: 'linear-gradient(to top, #0A0A0B 55%, rgba(10,10,11,0) 100%)',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 10,
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        const I = t.icon;
        return (
          <button key={t.id} onClick={() => onTab && onTab(t.id)}
            style={{
              flex: 1, background: 'none', border: 'none', padding: '6px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: isActive ? 'var(--accent)' : 'var(--fg-3)',
              cursor: 'pointer',
            }}>
            <I size={24} active={isActive}/>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.2 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CoachFAB({ onClick, state = 'idle' }) {
  // tiny orb launcher, top-right
  return (
    <button onClick={onClick} aria-label="Open coach"
      style={{
        position: 'absolute', top: 58, right: 16, zIndex: 20,
        width: 44, height: 44, borderRadius: 999,
        border: '1px solid var(--border-2)',
        background: 'rgba(25,26,29,0.7)', backdropFilter: 'blur(20px)',
        display: 'grid', placeItems: 'center', cursor: 'pointer',
        boxShadow: '0 0 0 0 var(--accent-glow)',
        animation: 'coachPulse 2.4s ease-in-out infinite',
      }}>
      <div style={{
        width: 22, height: 22, borderRadius: 999,
        background: 'radial-gradient(circle at 30% 30%, #FF8A5B, var(--accent) 60%, #C4411A)',
        boxShadow: '0 0 12px var(--accent-glow), inset 0 0 6px rgba(255,255,255,0.3)',
      }}/>
    </button>
  );
}

// little sparkline for metrics
function Sparkline({ points, width = 60, height = 22, color = 'var(--accent)' }) {
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

Object.assign(window, { Icon, TabBar, CoachFAB, Sparkline });
