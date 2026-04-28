// components.jsx — AI Coach core UI components
// VoiceOrb, MetricTile, WorkoutCard, ExerciseRow, PrimaryButton, PersonaChip,
// SectionHeader, Sparkline, Scrim, GenerativeShape, Placeholder.

// ── VoiceOrb ────────────────────────────────────────────────────────────────
// Locked visual direction: layered halo.
// Supports idle / listening / thinking / speaking states.

function VoiceOrb({ size = 260, state = 'listening', accent = '#FF6A3D', accentGlow = 'rgba(255,106,61,0.45)', muted = false }) {
  // Soft breath + glow
  const glow = state === 'idle' ? 0.25 : state === 'thinking' ? 0.55 : 0.85;
  return (
    <div style={{
      width: size, height: size, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: muted ? 'grayscale(0.6) opacity(0.55)' : 'none',
    }}>
      {/* ambient glow */}
      <div style={{
        position: 'absolute', inset: -size * 0.15, borderRadius: '50%',
        background: `radial-gradient(closest-side, ${accentGlow}, transparent 70%)`,
        opacity: glow, filter: 'blur(8px)',
        animation: `acBreath ${state === 'idle' ? 5 : 3}s ease-in-out infinite`,
      }} />
      <OrbHalo size={size} state={state} accent={accent} />
    </div>
  );
}

function OrbHalo({ size, state, accent }) {
  const r = size * 0.34;
  // Pulse cadence per state
  const pulse = state === 'idle' ? '5s'
             : state === 'thinking' ? '1.6s'
             : state === 'speaking' ? '1.8s'
             : '2.4s'; // listening
  // Core opacity responds to state
  const coreOp = state === 'idle' ? 0.78
              : state === 'thinking' ? 0.55
              : 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r*1.1} fill={accent} opacity={0.10}/>
      <circle cx={size/2} cy={size/2} r={r*0.85} fill={accent} opacity={0.22}/>
      <circle cx={size/2} cy={size/2} r={r*0.55} fill={accent} opacity={coreOp}/>
      <circle cx={size/2} cy={size/2} r={r*1.2} fill="none" stroke={accent} strokeWidth={1}
        style={{ animation: `acPing ${pulse} ease-out infinite`, transformOrigin: `${size/2}px ${size/2}px` }}/>
      {state === 'thinking' && (
        <circle cx={size/2} cy={size/2} r={r*1.2} fill="none" stroke={accent} strokeWidth={1}
          style={{ animation: `acPing ${pulse} ease-out infinite`, animationDelay: '0.8s', transformOrigin: `${size/2}px ${size/2}px` }}/>
      )}
    </svg>
  );
}

// ── Primary button with voice-active glow ───────────────────────────────────
function PrimaryButton({ children, icon, onClick, voiceActive = false, fullWidth = true, accent, theme }) {
  return (
    <button onClick={onClick} style={{
      position: 'relative', width: fullWidth ? '100%' : 'auto',
      height: 56, padding: '0 22px', borderRadius: AC_RADIUS.lg,
      border: 'none', cursor: 'pointer',
      background: accent || theme.accent, color: '#1a0f0a',
      fontFamily: 'inherit', fontSize: 16, fontWeight: 600, letterSpacing: -0.2,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: voiceActive
        ? `0 0 0 4px ${accent || theme.accent}30, 0 0 32px ${accent || theme.accent}99, 0 8px 20px rgba(0,0,0,0.35)`
        : `0 6px 16px rgba(0,0,0,0.28)`,
      transition: 'box-shadow .25s ease',
    }}>
      {icon}
      <span>{children}</span>
      {voiceActive && (
        <span style={{
          position: 'absolute', inset: 0, borderRadius: AC_RADIUS.lg, pointerEvents: 'none',
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.4)`,
          animation: 'acButtonPulse 1.4s ease-in-out infinite',
        }}/>
      )}
    </button>
  );
}

// ── MetricTile ──────────────────────────────────────────────────────────────
function MetricTile({ label, value, unit, delta, trend = 'up', theme, compact = false, children }) {
  const deltaColor = trend === 'up' ? theme.good : trend === 'down' ? theme.bad : theme.textSec;
  return (
    <div style={{
      background: theme.surface1, border: `0.5px solid ${theme.border}`,
      borderRadius: AC_RADIUS.lg, padding: compact ? '14px 14px' : '18px 16px',
      display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
    }}>
      <div style={{ fontSize: 12, color: theme.textSec, letterSpacing: -0.1, textWrap: 'pretty' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{
          fontFamily: 'var(--ac-mono)', fontSize: compact ? 26 : 32, fontWeight: 540,
          letterSpacing: -0.8, color: theme.text, lineHeight: 1,
        }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: theme.textSec, fontWeight: 500 }}>{unit}</span>}
      </div>
      {delta != null && (
        <div style={{ fontSize: 12, color: deltaColor, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '·'} {delta}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ data, width = 80, height = 22, color }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  const last = data[data.length-1];
  const lastX = width, lastY = height - ((last - min)/range)*height;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lastX} cy={lastY} r={2.2} fill={color}/>
    </svg>
  );
}

// ── WorkoutCard ─────────────────────────────────────────────────────────────
function WorkoutCard({ workout, theme, expanded = false, onToggle }) {
  return (
    <div style={{
      background: theme.surface1, border: `0.5px solid ${theme.border}`,
      borderRadius: AC_RADIUS.lg, overflow: 'hidden',
    }}>
      <button onClick={onToggle} style={{
        all: 'unset', cursor: 'pointer', display: 'block', width: '100%',
        padding: '14px 16px', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, background: theme.accentSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: theme.accent, fontSize: 13, fontWeight: 600, letterSpacing: -0.2,
              fontFamily: 'var(--ac-mono)',
            }}>{workout.initials}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, letterSpacing: -0.2 }}>{workout.name}</div>
              <div style={{ fontSize: 12, color: theme.textSec, marginTop: 1 }}>{workout.date} · {workout.duration}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: theme.textSec, fontFamily: 'var(--ac-mono)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {workout.rpe && `RPE ${workout.rpe}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: theme.textTer, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>Volume</div>
            <div style={{ fontFamily: 'var(--ac-mono)', fontSize: 18, color: theme.text, fontWeight: 540, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4 }}>
              {workout.volume}<span style={{ fontSize: 11, color: theme.textSec, marginLeft: 2 }}>kg</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: theme.textTer, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>Sets</div>
            <div style={{ fontFamily: 'var(--ac-mono)', fontSize: 18, color: theme.text, fontWeight: 540, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4 }}>
              {workout.sets}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {workout.spark && <Sparkline data={workout.spark} color={theme.accent}/>}
          </div>
        </div>
      </button>
      {expanded && (
        <div style={{ borderTop: `0.5px solid ${theme.border}`, padding: '8px 16px 14px' }}>
          {workout.exercises.map((ex, i) => <ExerciseRow key={i} ex={ex} theme={theme} compact />)}
        </div>
      )}
    </div>
  );
}

// ── ExerciseRow ─────────────────────────────────────────────────────────────
function ExerciseRow({ ex, theme, compact = false, active = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: compact ? '10px 0' : '14px 16px',
      background: active ? theme.accentSoft : 'transparent',
      borderRadius: active ? AC_RADIUS.md : 0,
      borderBottom: compact ? `0.5px solid ${theme.border}` : 'none',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 540, color: theme.text, letterSpacing: -0.2, textWrap: 'pretty' }}>
          {ex.name}
        </div>
        <div style={{ fontSize: 11, color: theme.textSec, marginTop: 2, fontFamily: 'var(--ac-mono)', letterSpacing: 0.2 }}>
          {ex.sets}×{ex.reps} · {ex.weight}
        </div>
      </div>
      {ex.rpe != null && <RPEDot rpe={ex.rpe} theme={theme}/>}
    </div>
  );
}

function RPEDot({ rpe, theme }) {
  // 1-10 scale. Pill with dots.
  const color = rpe >= 9 ? theme.bad : rpe >= 7 ? theme.warn : theme.good;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', borderRadius: 999,
      border: `0.5px solid ${theme.border}`,
      fontSize: 11, color: theme.textSec, fontFamily: 'var(--ac-mono)', letterSpacing: 0.5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color }}/>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>RPE {rpe}</span>
    </div>
  );
}

// ── PersonaChip ─────────────────────────────────────────────────────────────
// Legacy — persona system removed. Kept as a simple tag chip for ComponentsPage.
function PersonaChip({ persona, selected = false, theme, onClick, detailed = false }) {
  const p = { accent: '#FF6A3D', accentSoft: 'rgba(255,106,61,0.14)', label: persona || 'Tag', tagline: 'Deprecated — legacy component.' };
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', display: 'flex',
      flexDirection: detailed ? 'column' : 'row',
      alignItems: detailed ? 'flex-start' : 'center', gap: detailed ? 10 : 8,
      padding: detailed ? '16px 16px' : '8px 12px 8px 8px',
      borderRadius: detailed ? AC_RADIUS.lg : 999,
      background: selected ? p.accentSoft : theme.surface1,
      border: `0.5px solid ${selected ? p.accent : theme.border}`,
      boxShadow: selected ? `inset 0 0 0 1px ${p.accent}` : 'none',
      transition: 'all .15s',
      width: detailed ? '100%' : 'auto', boxSizing: 'border-box',
    }}>
      <div style={{
        width: detailed ? 36 : 24, height: detailed ? 36 : 24, borderRadius: '50%',
        background: `radial-gradient(closest-side, ${p.accent}, ${p.accentSoft})`,
        flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: '30%', borderRadius: '50%', background: p.accent, opacity: 0.9 }}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: detailed ? 15 : 13, fontWeight: 600, color: theme.text, letterSpacing: -0.2 }}>{p.label}</div>
        {detailed && <div style={{ fontSize: 12, color: theme.textSec, marginTop: 2, lineHeight: 1.4, textWrap: 'pretty' }}>{p.tagline}</div>}
      </div>
      {detailed && (
        <button onClick={(e) => e.stopPropagation()} style={{
          all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 16,
          background: theme.surface3, border: `0.5px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          alignSelf: 'flex-start', flexShrink: 0, marginLeft: 'auto', marginTop: -2,
        }}>
          <svg width="12" height="14" viewBox="0 0 12 14" fill={theme.text}>
            <path d="M2 1v12l9-6z"/>
          </svg>
        </button>
      )}
    </button>
  );
}

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ title, action, theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 20px', marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: theme.textTer, letterSpacing: 1.6, textTransform: 'uppercase' }}>
        {title}
      </div>
      {action && <div style={{ fontSize: 12, color: theme.textSec }}>{action}</div>}
    </div>
  );
}

// ── Generative shapes (for empty states, hero backgrounds) ──────────────────
function GenerativeShape({ variant = 'mesh', color, size = 200 }) {
  if (variant === 'mesh') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <radialGradient id="m1" cx="30%" cy="30%"><stop offset="0%" stopColor={color} stopOpacity="0.8"/><stop offset="100%" stopColor={color} stopOpacity="0"/></radialGradient>
          <radialGradient id="m2" cx="70%" cy="70%"><stop offset="0%" stopColor={color} stopOpacity="0.5"/><stop offset="100%" stopColor={color} stopOpacity="0"/></radialGradient>
        </defs>
        <rect width="200" height="200" fill="url(#m1)"/>
        <rect width="200" height="200" fill="url(#m2)"/>
      </svg>
    );
  }
  return null;
}

// ── Striped placeholder ────────────────────────────────────────────────────
function Placeholder({ label, w = '100%', h = 120, theme }) {
  const stripe = `repeating-linear-gradient(-45deg, ${theme.surface2}, ${theme.surface2} 8px, ${theme.surface1} 8px, ${theme.surface1} 16px)`;
  return (
    <div style={{
      width: w, height: h, background: stripe,
      border: `0.5px dashed ${theme.borderStrong}`, borderRadius: AC_RADIUS.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--ac-mono)', fontSize: 11, color: theme.textSec, letterSpacing: 0.5,
    }}>{label}</div>
  );
}

// ── Tabbar ──────────────────────────────────────────────────────────────────
function TabBar({ active = 'home', theme }) {
  const items = [
    { k: 'home', label: 'Today', icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l7-5 7 5v8a2 2 0 0 1-2 2h-2v-6H7v6H5a2 2 0 0 1-2-2V8z"/></svg> },
    { k: 'program', label: 'Program', icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M7 2v4M13 2v4M3 9h14"/></svg> },
    { k: 'voice', label: '', icon: (c) => null },
    { k: 'log', label: 'Log', icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><path d="M3 5h14M3 10h14M3 15h10"/></svg> },
    { k: 'settings', label: 'Me', icon: (c) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="7" r="3"/><path d="M3 17c1-3.5 4-5 7-5s6 1.5 7 5"/></svg> },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      padding: '8px 14px 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
      background: theme.glass,
      backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      borderTop: `0.5px solid ${theme.border}`,
    }}>
      {items.map(it => {
        if (it.k === 'voice') {
          return (
            <div key={it.k} style={{
              width: 56, height: 56, borderRadius: 28, marginTop: -28,
              background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 0 3px ${theme.bg}, 0 0 24px ${theme.accentGlow}`,
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#1a0f0a" strokeWidth="2" strokeLinecap="round">
                <rect x="8" y="3" width="6" height="11" rx="3"/><path d="M5 10v1a6 6 0 0 0 12 0v-1M11 17v3"/>
              </svg>
            </div>
          );
        }
        const c = active === it.k ? theme.text : theme.textTer;
        return (
          <div key={it.k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 44 }}>
            {it.icon(c)}
            <div style={{ fontSize: 10, color: c, fontWeight: 540, letterSpacing: 0.1 }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  VoiceOrb, PrimaryButton, MetricTile, Sparkline, WorkoutCard, ExerciseRow,
  RPEDot, PersonaChip, SectionHeader, GenerativeShape, Placeholder, TabBar,
});
