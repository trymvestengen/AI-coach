// screens.jsx — AI Coach screens
// Each screen receives { theme, t (copy), persona, accent } and fills an IOSDevice.

// ════════════════════════════════════════════════════════════════════════════
// HOME / TODAY
// ════════════════════════════════════════════════════════════════════════════
function ScreenHome({ theme, t, accent, persona }) {
  return (
    <div style={{ background: theme.bg, minHeight: '100%', paddingBottom: 110, position: 'relative' }}>
      <div style={{ height: 54 }}/>
      {/* greeting */}
      <div style={{ padding: '16px 20px 18px' }}>
        <div style={{ fontSize: 11, color: theme.textTer, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>
          {new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
        </div>
        <div style={{ fontSize: 30, fontWeight: 620, color: theme.text, letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 6 }}>
          {t.greeting}
        </div>
        <div style={{ fontSize: 15, color: theme.textSec, lineHeight: 1.4, textWrap: 'pretty' }}>
          {t.subgreeting}
        </div>
      </div>

      {/* Start voice session CTA */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: theme.surface1, border: `0.5px solid ${theme.border}`,
          borderRadius: 22, padding: 18,
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, opacity: 0.7 }}>
            <VoiceOrb size={160} state="idle" accent={accent} accentGlow={`${accent}55`}/>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, color: accent, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Coach · ready</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: theme.text, letterSpacing: -0.3, marginBottom: 4, textWrap:'pretty' }}>
              {t.plannedWorkout}: Upper A
            </div>
            <div style={{ fontSize: 13, color: theme.textSec, marginBottom: 18 }}>
              6 exercises · ~52 min · Hypertrophy
            </div>
            <PrimaryButton accent={accent} theme={theme} fullWidth icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#1a0f0a" strokeWidth="2" strokeLinecap="round">
                <rect x="7" y="2" width="6" height="11" rx="3"/><path d="M4 10v1a6 6 0 0 0 12 0v-1M10 17v3M7 20h6"/>
              </svg>
            }>{t.startSession}</PrimaryButton>
          </div>
        </div>
      </div>

      {/* 2 small metric tiles */}
      <div style={{ padding: '0 20px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricTile label="Streak" value="12" unit="days" delta="+3 vs last wk" trend="up" theme={theme} compact/>
        <MetricTile label="Weekly volume" value="14.2" unit="k kg" delta="+8%" trend="up" theme={theme} compact/>
      </div>

      {/* Friends activity */}
      <SectionHeader title="Friends · active today" action="See all" theme={theme}/>
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SAMPLE_FRIENDS_FEED.map((f, i) => (
            <FriendFeedCard key={i} item={f} theme={theme} accent={accent}/>
          ))}
        </div>
      </div>

      {/* People you might follow */}
      <SectionHeader title="People you might follow" theme={theme}/>
      <div style={{ padding: '0 0 10px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, padding: '0 20px' }}>
          {SAMPLE_SUGGESTIONS.map((u, i) => (
            <SuggestedUserCard key={i} user={u} theme={theme} accent={accent}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Social: friend feed card ────────────────────────────────────────────────
function FriendFeedCard({ item, theme, accent }) {
  return (
    <button style={{
      all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: AC_RADIUS.lg,
      background: theme.surface1, border: `0.5px solid ${theme.border}`,
      boxSizing: 'border-box', width: '100%',
    }}>
      <Avatar name={item.name} hue={item.hue} size={40} theme={theme}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: -0.2 }}>{item.name}</div>
        <div style={{ fontSize: 12, color: theme.textSec, marginTop: 1, textWrap: 'pretty' }}>{item.detail}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--ac-mono)', fontSize: 14, color: theme.text, fontWeight: 540, letterSpacing: -0.3 }}>{item.metric}</div>
        <div style={{ fontSize: 10, color: theme.textTer, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{item.when}</div>
      </div>
    </button>
  );
}

// ── Social: suggested user (horizontal scroller) ────────────────────────────
function SuggestedUserCard({ user, theme, accent }) {
  return (
    <div style={{
      width: 160, flexShrink: 0, padding: 14,
      background: theme.surface1, border: `0.5px solid ${theme.border}`,
      borderRadius: AC_RADIUS.lg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <Avatar name={user.name} hue={user.hue} size={52} theme={theme}/>
      <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: -0.2, textAlign: 'center' }}>{user.name}</div>
      <div style={{ fontSize: 11, color: theme.textSec, textAlign: 'center', lineHeight: 1.4 }}>{user.bio}</div>
      <button style={{
        all: 'unset', cursor: 'pointer', marginTop: 4,
        padding: '8px 14px', borderRadius: 999,
        background: accent, color: '#1a0f0a',
        fontSize: 12, fontWeight: 600, letterSpacing: -0.1,
      }}>Follow</button>
    </div>
  );
}

function Avatar({ name, hue = 20, size = 40, theme }) {
  const initials = name.split(' ').map(w => w[0]).slice(0,2).join('');
  return (
    <div style={{
      width: size, height: size, borderRadius: size/2, flexShrink: 0,
      background: `radial-gradient(closest-side, oklch(0.72 0.12 ${hue}), oklch(0.4 0.08 ${hue}))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.36, fontWeight: 600, letterSpacing: -0.4,
      border: `0.5px solid ${theme.border}`,
    }}>{initials}</div>
  );
}

const SAMPLE_FRIENDS_FEED = [
  { name: 'Jonas R.',   detail: 'Lower A · 5×5 back squat @ 100 kg', metric: '11.3k kg', when: '24 min', hue: 40 },
  { name: 'Aïda S.',    detail: 'Zone 2 ride, 45 min',                metric: '45:12',    when: '1h',    hue: 340 },
  { name: 'Henrik L.',  detail: 'Hit PR: bench 92.5 kg', metric: 'PR',       when: '2h',    hue: 200 },
];

const SAMPLE_SUGGESTIONS = [
  { name: 'Ingrid Bø',   bio: 'Intermediate · pull-day twin',   hue: 20  },
  { name: 'Marcus T.',   bio: 'Powerlifting · Oslo',            hue: 260 },
  { name: 'Sara Ø.',     bio: 'Beginner · on day 18',           hue: 140 },
  { name: 'Kai Nielsen', bio: 'Conditioning + climb',           hue: 60  },
];

// ════════════════════════════════════════════════════════════════════════════
// VOICE SESSION — hero screen
// ════════════════════════════════════════════════════════════════════════════
function ScreenVoiceSession({ theme, t, accent, coach, orbState = 'listening' }) {
  const coachName = (coach && coach.name) || 'Coach';
  const stateLabel = { idle: t.idle, listening: t.listening, thinking: t.thinking, speaking: t.speaking }[orbState];
  const transcriptLines = {
    listening: [
      { who: 'coach', text: "How's your shoulder feeling from last session?" },
      { who: 'user',  text: "Little tender on the left side, maybe a 3 out of 10." },
    ],
    speaking: [
      { who: 'user',  text: "Ready when you are." },
      { who: 'coach', text: "Let's drop the incline press and add single-arm landmine instead. Start with 12kg." },
    ],
    thinking: [
      { who: 'user',  text: "Can we swap squats for something easier on my knee today?" },
    ],
    idle: [],
  }[orbState];

  return (
    <div style={{
      background: `radial-gradient(ellipse 120% 80% at 50% 20%, ${accent}12, transparent 70%), ${theme.bg}`,
      minHeight: '100%', position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {/* status bar area */}
      <div style={{ height: 54 }}/>

      {/* Top chrome: coach label (static) + close */}
      <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px 6px 6px', borderRadius: 999,
          background: theme.glass, border: `0.5px solid ${theme.border}`,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 11,
            background: `radial-gradient(closest-side, ${accent}, ${accent}33)`,
          }}/>
          <div style={{ fontSize: 12, color: theme.text, fontWeight: 540, letterSpacing: -0.1 }}>
            {coachName}
          </div>
        </div>
        <button style={{
          all: 'unset', width: 34, height: 34, borderRadius: 17,
          background: theme.glass, border: `0.5px solid ${theme.border}`,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" stroke={theme.textSec} strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
        </button>
      </div>

      {/* Orb */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 20, paddingBottom: 8, minHeight: 320 }}>
        <VoiceOrb size={240} state={orbState} accent={accent} accentGlow={`${accent}73`}/>
        <div style={{ marginTop: 28, fontSize: 11, color: theme.textTer, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>
          {stateLabel}
        </div>
      </div>

      {/* Transcript */}
      <div style={{ padding: '0 24px 12px', minHeight: 120 }}>
        {transcriptLines.length === 0 ? (
          <div style={{ textAlign: 'center', fontSize: 14, color: theme.textTer, fontFamily: 'var(--ac-mono)', letterSpacing: 0.2 }}>
            Tap the orb to start talking.
          </div>
        ) : transcriptLines.map((l, i) => (
          <div key={i} style={{
            fontFamily: 'var(--ac-mono)', fontSize: 14, lineHeight: 1.6, letterSpacing: -0.1,
            color: l.who === 'coach' ? theme.text : theme.textSec,
            marginBottom: 8, textWrap: 'pretty',
            opacity: i === transcriptLines.length-1 ? 1 : 0.55,
          }}>
            <span style={{ color: l.who === 'coach' ? accent : theme.textTer, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', marginRight: 8, fontWeight: 600 }}>
              {l.who === 'coach' ? 'Coach' : 'You'}
            </span>
            {l.text}
          </div>
        ))}
      </div>

      {/* Bottom controls — mute + end. No persona swap (coach is permanent). */}
      <div style={{ padding: '0 20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <CircleBtn theme={theme} label={t.mute} icon={
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={theme.text} strokeWidth="1.8" strokeLinecap="round">
            <rect x="7" y="3" width="6" height="9" rx="3"/><path d="M4 9v1a6 6 0 0 0 12 0V9M10 16v3"/><path d="M3 3l14 14" stroke={theme.bad}/>
          </svg>
        }/>
        <button style={{
          all: 'unset', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          height: 56, padding: '0 26px', borderRadius: 28,
          background: theme.bad, color: '#fff',
          fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
          boxShadow: `0 8px 20px rgba(0,0,0,0.3)`,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="#fff"><rect x="2" y="2" width="10" height="10" rx="2"/></svg>
          {t.end} session
        </button>
        <CircleBtn theme={theme} label="Keyboard" icon={
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={theme.text} strokeWidth="1.8" strokeLinecap="round">
            <rect x="2" y="5" width="16" height="10" rx="2"/>
            <path d="M5 9h1M8 9h1M11 9h1M14 9h1M6 12h8"/>
          </svg>
        }/>
      </div>
    </div>
  );
}

function CircleBtn({ theme, icon, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button style={{
        all: 'unset', cursor: 'pointer',
        width: 56, height: 56, borderRadius: 28,
        background: theme.surface1, border: `0.5px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</button>
      <div style={{ fontSize: 10, color: theme.textSec, letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WORKOUT LOG
// ════════════════════════════════════════════════════════════════════════════
function ScreenLog({ theme, t, accent }) {
  const [expanded, setExpanded] = React.useState(0);
  const [filter, setFilter] = React.useState('All');

  // Filter chips derive from the active program's day types.
  // Only include types that the program actually contains AND that have logged sessions.
  const loggedTypes = React.useMemo(() => {
    const present = new Set(SAMPLE_WORKOUTS.map(w => w.type).filter(Boolean));
    return ACTIVE_PROGRAM_DAY_TYPES.filter(t => present.has(t));
  }, []);
  const chips = ['All', ...loggedTypes];

  const visible = filter === 'All'
    ? SAMPLE_WORKOUTS
    : SAMPLE_WORKOUTS.filter(w => w.type === filter);

  const monthVolume = visible.reduce((acc, w) => {
    const v = parseInt(String(w.volume).replace(/[^0-9]/g, ''), 10);
    return acc + (Number.isFinite(v) ? v : 0);
  }, 0);

  return (
    <div style={{ background: theme.bg, minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ height: 54 }}/>
      <div style={{ padding: '14px 20px 20px' }}>
        <div style={{ fontSize: 30, fontWeight: 620, color: theme.text, letterSpacing: -0.8, marginBottom: 4 }}>{t.log}</div>
        <div style={{ fontSize: 13, color: theme.textSec }}>28 sessions · 12 weeks</div>
      </div>

      {/* Program-driven filter chips — horizontally scrollable */}
      <div style={{
        padding: '0 20px 20px', display: 'flex', gap: 8,
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {chips.map((k) => {
          const active = filter === k;
          return (
            <button key={k} onClick={() => setFilter(k)} style={{
              all: 'unset', cursor: 'pointer', flexShrink: 0,
              padding: '8px 14px', borderRadius: 999,
              background: active ? theme.text : theme.surface1,
              border: `0.5px solid ${active ? theme.text : theme.border}`,
              color: active ? theme.bg : theme.textSec,
              fontSize: 12, fontWeight: 540, letterSpacing: -0.1,
            }}>{k}</button>
          );
        })}
      </div>

      {/* Month header */}
      <div style={{ padding: '0 20px 10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: theme.textTer, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600 }}>April</div>
        <div style={{ fontSize: 12, color: theme.textSec, fontFamily: 'var(--ac-mono)' }}>
          {visible.length} {visible.length === 1 ? 'session' : 'sessions'}{monthVolume > 0 ? ` · ${(monthVolume/1000).toFixed(1)}k kg` : ''}
        </div>
      </div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map((w, i) => (
          <WorkoutCard key={w.name + w.date} workout={w} theme={theme}
            expanded={expanded === i} onToggle={() => setExpanded(expanded === i ? -1 : i)}/>
        ))}
        {visible.length === 0 && (
          <div style={{
            padding: '30px 20px', textAlign: 'center', borderRadius: 16,
            background: theme.surface1, border: `0.5px dashed ${theme.border}`,
            color: theme.textSec, fontSize: 13,
          }}>No {filter} sessions logged yet.</div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PROGRAM VIEW — with tappable exercise rows → detail drawer
// ════════════════════════════════════════════════════════════════════════════
const INITIAL_UPPER_B = [
  { id: 'e1', name: 'Incline DB Press',       sets: 4, targetReps: '8-10', targetWeight: 22.5, rpe: 8,
    setLog: [{r:10,w:20},{r:9,w:22.5},{r:8,w:22.5},{r:null,w:null}] },
  { id: 'e2', name: 'Chest-supported Row',    sets: 4, targetReps: '10',   targetWeight: 18, rpe: 7,
    setLog: [{r:null,w:null},{r:null,w:null},{r:null,w:null},{r:null,w:null}] },
  { id: 'e3', name: 'Seated Shoulder Press',  sets: 3, targetReps: '10-12',targetWeight: 14, rpe: 7,
    setLog: [{r:null,w:null},{r:null,w:null},{r:null,w:null}] },
  { id: 'e4', name: 'Lat Pulldown',           sets: 3, targetReps: '12',   targetWeight: 45, rpe: 8,
    setLog: [{r:null,w:null},{r:null,w:null},{r:null,w:null}] },
  { id: 'e5', name: 'Cable Fly',              sets: 3, targetReps: '12-15',targetWeight: 12, rpe: 7,
    setLog: [{r:null,w:null},{r:null,w:null},{r:null,w:null}] },
  { id: 'e6', name: 'Face Pull',              sets: 3, targetReps: '15',   targetWeight: 10, rpe: 6,
    setLog: [{r:null,w:null},{r:null,w:null},{r:null,w:null}] },
];

function ScreenProgram({ theme, t, accent, initialExerciseId = null }) {
  const days = [
    { d: 'Mon', ex: 6, done: true,  today: false },
    { d: 'Tue', ex: 5, done: true,  today: false },
    { d: 'Wed', ex: 0, done: false, today: false },
    { d: 'Thu', ex: 6, done: false, today: true  },
    { d: 'Fri', ex: 5, done: false, today: false },
    { d: 'Sat', ex: 4, done: false, today: false },
    { d: 'Sun', ex: 0, done: false, today: false },
  ];
  const [exercises, setExercises] = React.useState(INITIAL_UPPER_B);
  const [openId, setOpenId] = React.useState(initialExerciseId);
  const open = exercises.find(e => e.id === openId);

  const removeExercise = (id) => {
    setExercises(xs => xs.filter(e => e.id !== id));
    setOpenId(null);
  };
  const updateExercise = (id, patch) => {
    setExercises(xs => xs.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  return (
    <div style={{ background: theme.bg, minHeight: '100%', paddingBottom: 110, position: 'relative' }}>
      <div style={{ height: 54 }}/>
      <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: theme.textTer, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 }}>Week 4 of 12</div>
          <div style={{ fontSize: 28, fontWeight: 620, color: theme.text, letterSpacing: -0.8 }}>Hypertrophy 4×</div>
        </div>
        <div style={{
          fontFamily: 'var(--ac-mono)', fontSize: 11, color: accent,
          padding: '6px 10px', borderRadius: 999, background: `${accent}18`, border: `0.5px solid ${accent}40`,
          letterSpacing: 0.4,
        }}>ACTIVE</div>
      </div>

      <div style={{ padding: '0 20px 22px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const done = i < 3;
            const current = i === 3;
            return (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 2,
                background: done ? accent : current ? `${accent}55` : theme.surface1,
                border: current ? `0.5px solid ${accent}` : 'none',
                boxSizing: 'border-box',
              }}/>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: theme.textSec, fontFamily: 'var(--ac-mono)', letterSpacing: 0.2 }}>
          <span>3 of 12 weeks</span><span>8 weeks to go</span>
        </div>
      </div>

      <SectionHeader title="This week" theme={theme}/>
      <div style={{ padding: '0 20px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {days.map((d, i) => (
            <div key={i} style={{
              padding: '10px 0 12px', borderRadius: 14,
              background: d.today ? accent : d.done ? theme.surface2 : theme.surface1,
              border: `0.5px solid ${d.today ? accent : theme.border}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              opacity: d.ex === 0 ? 0.55 : 1,
            }}>
              <div style={{ fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: d.today ? '#1a0f0a' : theme.textTer, fontWeight: 600 }}>{d.d}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: d.today ? '#1a0f0a' : theme.text, fontFamily: 'var(--ac-mono)' }}>{i+14}</div>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: d.done ? (d.today ? '#1a0f0a' : accent) : 'transparent' }}/>
            </div>
          ))}
        </div>
      </div>

      <SectionHeader title="Thursday · Upper B" action={`${exercises.length} exercises`} theme={theme}/>
      <div style={{ padding: '0 20px' }}>
        <div style={{ background: theme.surface1, border: `0.5px solid ${theme.border}`, borderRadius: AC_RADIUS.lg, overflow: 'hidden' }}>
          {exercises.map((ex, i) => (
            <div key={ex.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 8px 8px 16px',
              borderBottom: i < exercises.length-1 ? `0.5px solid ${theme.border}` : 'none',
            }}>
              <button onClick={() => setOpenId(ex.id)} style={{
                all: 'unset', cursor: 'pointer', flex: 1, minWidth: 0,
                padding: '6px 0',
              }}>
                <div style={{ fontSize: 14, fontWeight: 540, color: theme.text, letterSpacing: -0.2 }}>{ex.name}</div>
                <div style={{ fontSize: 11, color: theme.textSec, marginTop: 2, fontFamily: 'var(--ac-mono)', letterSpacing: 0.2 }}>
                  {ex.sets}×{ex.targetReps} · {ex.targetWeight} kg
                </div>
              </button>
              <button onClick={(e) => { e.stopPropagation(); }} style={{
                all: 'unset', cursor: 'pointer',
                padding: '6px 10px', borderRadius: 999,
                fontSize: 11, color: theme.textSec, fontWeight: 540, letterSpacing: 0.1,
                background: theme.surface2, border: `0.5px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <svg width="11" height="11" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M1 4h8l-2-2M11 8H3l2 2"/></svg>
                Swap
              </button>
              <button onClick={() => setOpenId(ex.id)} style={{
                all: 'unset', cursor: 'pointer', padding: '6px 8px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <ExerciseProgressRing ex={ex} theme={theme} accent={accent}/>
                <svg width="8" height="12" viewBox="0 0 8 12" stroke={theme.textTer} strokeWidth="1.5" fill="none"><path d="M2 1l4 5-4 5"/></svg>
              </button>
            </div>
          ))}
          <button style={{
            all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
            padding: '14px 16px', borderTop: `0.5px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: accent, fontWeight: 540, letterSpacing: -0.1,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" stroke={accent} strokeWidth="1.8" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
            Add exercise
          </button>
        </div>
      </div>

      {open && (
        <ExerciseDetailSheet
          theme={theme} accent={accent}
          exercise={open}
          onClose={() => setOpenId(null)}
          onUpdate={(patch) => updateExercise(open.id, patch)}
          onRemove={() => removeExercise(open.id)}
        />
      )}
    </div>
  );
}

function ExerciseProgressRing({ ex, theme, accent }) {
  const done = ex.setLog.filter(s => s.done).length;
  const pct = done / ex.sets;
  const r = 9, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 26, height: 26, flexShrink: 0 }}>
      <svg width="26" height="26" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="13" cy="13" r={r} stroke={theme.border} strokeWidth="2" fill="none"/>
        <circle cx="13" cy="13" r={r} stroke={accent} strokeWidth="2" fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: theme.textSec, fontFamily: 'var(--ac-mono)', fontVariantNumeric: 'tabular-nums',
      }}>{done}/{ex.sets}</div>
    </div>
  );
}

// ── Exercise detail sheet ───────────────────────────────────────────────────
function ExerciseDetailSheet({ theme, accent, exercise, onClose, onUpdate, onRemove }) {
  const ex = exercise;

  const addSet = () => onUpdate({ sets: ex.sets + 1, setLog: [...ex.setLog, { r: null, w: null }] });
  const removeSet = (i) => onUpdate({ sets: Math.max(1, ex.sets - 1), setLog: ex.setLog.filter((_, k) => k !== i) });
  const editSet = (i, patch) => onUpdate({ setLog: ex.setLog.map((s, k) => k === i ? { ...s, ...patch } : s) });

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
      background: theme.bg, animation: 'acSlideUp .22s cubic-bezier(.2,.7,.3,1)',
    }}>
      <div style={{ height: 54 }}/>
      {/* Header */}
      <div style={{ padding: '10px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onClose} style={{
          all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 17,
          background: theme.surface1, border: `0.5px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="14" viewBox="0 0 10 14" stroke={theme.text} strokeWidth="1.8" fill="none" strokeLinecap="round"><path d="M8 1L2 7l6 6"/></svg>
        </button>
        <div style={{ flex: 1 }}/>
        <button onClick={onRemove} style={{
          all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 999,
          fontSize: 12, color: theme.bad, fontWeight: 540,
          border: `0.5px solid ${theme.bad}44`,
        }}>Remove</button>
      </div>

      <div style={{ padding: '10px 20px 4px' }}>
        <div style={{ fontSize: 11, color: theme.textTer, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }}>Exercise</div>
        <div style={{ fontSize: 26, fontWeight: 620, color: theme.text, letterSpacing: -0.6, lineHeight: 1.15 }}>{ex.name}</div>
        <div style={{ fontSize: 13, color: theme.textSec, marginTop: 6, fontFamily: 'var(--ac-mono)' }}>
          Target · {ex.sets}×{ex.targetReps} @ {ex.targetWeight} kg · RPE {ex.rpe}
        </div>
      </div>

      {/* Sets table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: 8,
          padding: '0 0 8px', fontSize: 10, color: theme.textTer,
          letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
        }}>
          <div>Set</div><div>Reps</div><div>Weight (kg)</div><div/>
        </div>
        <div style={{ background: theme.surface1, border: `0.5px solid ${theme.border}`, borderRadius: AC_RADIUS.lg, overflow: 'hidden' }}>
          {ex.setLog.map((s, i) => {
            const done = !!s.done;
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 1fr 40px', gap: 8, alignItems: 'center',
                padding: '10px 12px',
                background: done ? `${accent}0c` : 'transparent',
                borderBottom: i < ex.setLog.length-1 ? `0.5px solid ${theme.border}` : 'none',
                transition: 'background .15s',
              }}>
                <div style={{
                  fontFamily: 'var(--ac-mono)', fontSize: 13,
                  color: done ? accent : theme.textSec,
                  fontVariantNumeric: 'tabular-nums', textAlign: 'center', fontWeight: done ? 600 : 400,
                }}>{i+1}</div>
                <NumField theme={theme} accent={accent} value={s.r} placeholder={ex.targetReps} min={1} step={1} onChange={(v) => editSet(i, { r: v })}/>
                <NumField theme={theme} accent={accent} value={s.w} placeholder={ex.targetWeight} min={0} step={0.5} onChange={(v) => editSet(i, { w: v })}/>
                <button
                  onClick={() => editSet(i, { done: !done, r: s.r ?? ex.targetReps, w: s.w ?? ex.targetWeight })}
                  aria-label={done ? `Undo set ${i+1}` : `Confirm set ${i+1}`}
                  style={{
                    all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? accent : 'transparent',
                    border: `1px solid ${done ? accent : theme.borderStrong}`,
                    justifySelf: 'end',
                    transition: 'all .12s',
                  }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={done ? '#1a0f0a' : theme.textTer} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 7.5l3 3 7-7"/>
                  </svg>
                </button>
              </div>
            );
          })}
          <button onClick={addSet} style={{
            all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
            padding: '12px 12px', borderTop: `0.5px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 13, color: accent, fontWeight: 540,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" stroke={accent} strokeWidth="1.8" strokeLinecap="round"><path d="M6 2v8M2 6h8"/></svg>
            Add set
          </button>
        </div>

        <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: AC_RADIUS.md, background: `${accent}10`, border: `0.5px solid ${accent}30` }}>
          <div style={{ fontSize: 11, color: accent, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Coach tip</div>
          <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.5, textWrap: 'pretty' }}>
            Keep the elbows tucked around 45°. Your last session showed +2.5 kg headroom on set 3 — try 25 kg if 22.5 feels easy.
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 20px 30px' }}>
        <PrimaryButton accent={accent} theme={theme} fullWidth voiceActive>Start set 1</PrimaryButton>
      </div>
    </div>
  );
}

function NumField({ theme, accent, value, placeholder, step = 1, min = 0, onChange }) {
  return (
    <input
      type="number" step={step} min={min} inputMode="decimal"
      value={value ?? ''} placeholder={String(placeholder ?? '')}
      onChange={(e) => {
        if (e.target.value === '') return onChange(null);
        const n = Number(e.target.value);
        if (!Number.isFinite(n)) return;
        onChange(Math.max(min, n));
      }}
      style={{
        width: '100%', boxSizing: 'border-box', height: 36,
        padding: '0 10px', borderRadius: 9,
        background: theme.surface2, border: `0.5px solid ${theme.border}`,
        color: theme.text, fontFamily: 'var(--ac-mono)', fontSize: 14, fontVariantNumeric: 'tabular-nums',
        outline: 'none',
      }}
      onFocus={(e) => e.target.style.borderColor = accent}
      onBlur={(e) => e.target.style.borderColor = theme.border}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ONBOARDING — real signup flow, 5 steps
// 1. Welcome   2. Account   3. Profile (gender drives coach gender)
// 4. Goal      5. Equipment
// Coach personality is permanently FRIENDLY. Coach gender mirrors user gender.
// ════════════════════════════════════════════════════════════════════════════

function ScreenOnboardWelcome({ theme, accent }) {
  return (
    <div style={{ background: theme.bg, minHeight: '100%', padding: '80px 28px 40px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <VoiceOrb size={200} state="idle" accent={accent} accentGlow={`${accent}66`}/>
        <div style={{ marginTop: 40, fontSize: 30, fontWeight: 620, color: theme.text, letterSpacing: -0.8, textAlign: 'center', lineHeight: 1.1 }}>
          Meet your coach.
        </div>
        <div style={{ marginTop: 12, fontSize: 15, color: theme.textSec, textAlign: 'center', lineHeight: 1.5, maxWidth: 280 }}>
          Talk to it like a friend. It builds your program, counts your reps, and keeps you honest.
        </div>
      </div>
      <PrimaryButton accent={accent} theme={theme} fullWidth>Create account</PrimaryButton>
      <div style={{ textAlign: 'center', fontSize: 12, color: theme.textTer, marginTop: 14 }}>I already have an account</div>
    </div>
  );
}

// ── Shared form primitives ──────────────────────────────────────────────────
function OBStepHeader({ theme, step, title, sub }) {
  return (
    <>
      <div style={{ fontSize: 11, color: theme.textTer, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--ac-mono)' }}>
        Step {step} of 4
      </div>
      <div style={{ fontSize: 26, fontWeight: 620, color: theme.text, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 14, color: theme.textSec, marginBottom: 22, lineHeight: 1.5, textWrap: 'pretty' }}>{sub}</div>}
    </>
  );
}

function OBField({ theme, accent, label, placeholder, type = 'text', value = '', suffix }) {
  const [v, setV] = React.useState(value);
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 11, color: theme.textTer, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: theme.surface1, border: `0.5px solid ${focus ? accent : theme.border}`,
        borderRadius: AC_RADIUS.md, padding: '0 14px', height: 48,
        transition: 'border-color .15s',
      }}>
        <input
          type={type} value={v} placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: theme.text, fontSize: 15, fontFamily: 'inherit', letterSpacing: -0.1,
            padding: 0,
          }}
        />
        {suffix && <span style={{ color: theme.textSec, fontSize: 13, fontFamily: 'var(--ac-mono)' }}>{suffix}</span>}
      </div>
    </label>
  );
}

// 2. ACCOUNT ────────────────────────────────────────────────────────────────
function ScreenOnboardAccount({ theme, accent }) {
  return (
    <div style={{ background: theme.bg, minHeight: '100%', padding: '70px 20px 30px', display: 'flex', flexDirection: 'column' }}>
      <OBStepHeader theme={theme} step={1} title="Create your account" sub="Used to save your programs and sync across devices."/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <OBField theme={theme} accent={accent} label="Name" placeholder="Mia Knudsen"/>
        <OBField theme={theme} accent={accent} label="Email" type="email" placeholder="you@domain.com"/>
        <OBField theme={theme} accent={accent} label="Password" type="password" placeholder="At least 8 characters"/>
      </div>
      <div style={{ fontSize: 11, color: theme.textTer, textAlign: 'center', lineHeight: 1.5, marginBottom: 14, textWrap: 'pretty' }}>
        By continuing you agree to our <span style={{ color: theme.textSec, textDecoration: 'underline' }}>Terms</span> and <span style={{ color: theme.textSec, textDecoration: 'underline' }}>Privacy policy</span>.
      </div>
      <PrimaryButton accent={accent} theme={theme} fullWidth>Continue</PrimaryButton>
    </div>
  );
}

// 3. PROFILE ────────────────────────────────────────────────────────────────
// Gender choice also sets coach gender (woman → woman coach, man → man coach).
function ScreenOnboardProfile({ theme, accent, gender = 'f', onGender }) {
  return (
    <div style={{ background: theme.bg, minHeight: '100%', padding: '70px 20px 30px', display: 'flex', flexDirection: 'column' }}>
      <OBStepHeader theme={theme} step={2} title="About you"
        sub="Helps your coach program the right loads. Your coach matches your gender."/>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: theme.textTer, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Gender</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{k:'f', label: 'Woman'}, {k:'m', label: 'Man'}, {k:'x', label: 'Prefer not to say'}].map(g => {
            const active = gender === g.k;
            return (
              <button key={g.k} onClick={() => onGender && onGender(g.k)} style={{
                all: 'unset', cursor: 'pointer', flex: g.k === 'x' ? 1.4 : 1, textAlign: 'center',
                padding: '12px 8px', borderRadius: 12, fontSize: 13, fontWeight: 540, letterSpacing: -0.1,
                background: active ? `${accent}15` : theme.surface1,
                border: `0.5px solid ${active ? accent : theme.border}`,
                color: active ? theme.text : theme.textSec,
              }}>{g.label}</button>
            );
          })}
        </div>
        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: `${accent}0C`, border: `0.5px solid ${accent}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: accent, flexShrink: 0 }}/>
          <div style={{ fontSize: 12, color: theme.textSec, lineHeight: 1.4 }}>
            Your coach will be <strong style={{ color: theme.text, fontWeight: 600 }}>{gender === 'f' ? 'Nora (woman)' : gender === 'm' ? 'Theo (man)' : 'Kai (neutral)'}</strong> — warm, encouraging, explains the why.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}><OBField theme={theme} accent={accent} label="Age" type="number" placeholder="28" suffix="yrs"/></div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}><OBField theme={theme} accent={accent} label="Height" type="number" placeholder="172" suffix="cm"/></div>
        <div style={{ flex: 1 }}><OBField theme={theme} accent={accent} label="Weight" type="number" placeholder="68" suffix="kg"/></div>
      </div>

      <div style={{ flex: 1 }}/>
      <PrimaryButton accent={accent} theme={theme} fullWidth>Continue</PrimaryButton>
    </div>
  );
}

// 4. GOAL ───────────────────────────────────────────────────────────────────
function ScreenOnboardGoal({ theme, accent }) {
  const goals = [
    { k: 'muscle', label: 'Build muscle', sub: 'Hypertrophy programs' },
    { k: 'strong', label: 'Get stronger', sub: 'Strength-focused' },
    { k: 'lose',   label: 'Lose weight',  sub: 'Conditioning + lifts' },
    { k: 'move',   label: 'Just move more', sub: 'Easy-on routines' },
  ];
  return (
    <div style={{ background: theme.bg, minHeight: '100%', padding: '70px 20px 30px', display: 'flex', flexDirection: 'column' }}>
      <OBStepHeader theme={theme} step={3} title="What brings you here?" sub="Pick one. You can change it later."/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {goals.map((g, i) => (
          <button key={g.k} style={{
            all: 'unset', cursor: 'pointer', padding: '16px 18px', borderRadius: AC_RADIUS.lg,
            background: i === 0 ? `${accent}15` : theme.surface1,
            border: `0.5px solid ${i === 0 ? accent : theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, letterSpacing: -0.2 }}>{g.label}</div>
              <div style={{ fontSize: 12, color: theme.textSec, marginTop: 2 }}>{g.sub}</div>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 11, border: `1.2px solid ${i === 0 ? accent : theme.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {i === 0 && <div style={{ width: 10, height: 10, borderRadius: 5, background: accent }}/>}
            </div>
          </button>
        ))}
      </div>
      <PrimaryButton accent={accent} theme={theme} fullWidth>Continue</PrimaryButton>
    </div>
  );
}

// 5. EQUIPMENT ──────────────────────────────────────────────────────────────
function ScreenOnboardEquipment({ theme, accent }) {
  const opts = [
    { k: 'gym',   label: 'Full gym',   sub: 'Barbells, machines, cables', icon: '▦' },
    { k: 'home',  label: 'Home setup', sub: 'DBs + bench + maybe rack',   icon: '◈' },
    { k: 'body',  label: 'Bodyweight', sub: 'No equipment needed',        icon: '◉' },
  ];
  return (
    <div style={{ background: theme.bg, minHeight: '100%', padding: '70px 20px 30px', display: 'flex', flexDirection: 'column' }}>
      <OBStepHeader theme={theme} step={4} title="What do you have access to?" sub="Programs adapt to your setup."/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {opts.map((g, i) => (
          <button key={g.k} style={{
            all: 'unset', cursor: 'pointer', padding: 16, borderRadius: AC_RADIUS.lg,
            background: i === 0 ? `${accent}15` : theme.surface1,
            border: `0.5px solid ${i === 0 ? accent : theme.border}`,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: i === 0 ? accent : theme.surface3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: i === 0 ? '#1a0f0a' : theme.text, fontFamily: 'var(--ac-mono)',
            }}>{g.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, letterSpacing: -0.2 }}>{g.label}</div>
              <div style={{ fontSize: 12, color: theme.textSec, marginTop: 2 }}>{g.sub}</div>
            </div>
          </button>
        ))}
      </div>
      <PrimaryButton accent={accent} theme={theme} fullWidth voiceActive>Start first session</PrimaryButton>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════════════════════════
function ScreenSettings({ theme, t, accent, coach, lang, onLang }) {
  const c = coach || { name: 'Nora', gender: 'f', blurb: 'Warm, encouraging, explains the why.' };
  return (
    <div style={{ background: theme.bg, minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ height: 54 }}/>
      <div style={{ padding: '14px 20px 22px' }}>
        <div style={{ fontSize: 30, fontWeight: 620, color: theme.text, letterSpacing: -0.8 }}>{t.settings}</div>
      </div>

      {/* Account card */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ background: theme.surface1, border: `0.5px solid ${theme.border}`, borderRadius: AC_RADIUS.lg, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22,
            background: `radial-gradient(closest-side, ${accent}, ${accent}22)`,
          }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>Mia Knudsen</div>
            <div style={{ fontSize: 12, color: theme.textSec, marginTop: 2 }}>Coach Pro · Oslo</div>
          </div>
          <svg width="8" height="12" viewBox="0 0 8 12" stroke={theme.textTer} strokeWidth="1.5" fill="none"><path d="M2 1l4 5-4 5"/></svg>
        </div>
      </div>

      <SectionHeader title="Language" theme={theme}/>
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', padding: 4, borderRadius: 12, background: theme.surface1, border: `0.5px solid ${theme.border}` }}>
          {[['en','English'],['no','Norsk']].map(([k, l]) => (
            <button key={k} onClick={() => onLang && onLang(k)} style={{
              all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 9,
              background: lang === k ? theme.surface3 : 'transparent',
              fontSize: 13, fontWeight: 540, color: lang === k ? theme.text : theme.textSec,
            }}>{l}</button>
          ))}
        </div>
      </div>

      <SectionHeader title="Your coach" theme={theme}/>
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ background: theme.surface1, border: `0.5px solid ${theme.border}`, borderRadius: AC_RADIUS.lg, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24, flexShrink: 0,
            background: `radial-gradient(closest-side, ${accent}, ${accent}22)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--ac-mono)', fontSize: 14, fontWeight: 600, color: '#1a0f0a',
          }}>{c.name[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, letterSpacing: -0.1 }}>
              {c.name} <span style={{ color: theme.textTer, fontWeight: 500, fontSize: 12, marginLeft: 6 }}>· friendly</span>
            </div>
            <div style={{ fontSize: 12, color: theme.textSec, marginTop: 3, lineHeight: 1.45, textWrap: 'pretty' }}>{c.blurb}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: theme.textTer, marginTop: 8, padding: '0 4px', lineHeight: 1.4 }}>
          Your coach's gender matches yours. Change it in your profile.
        </div>
      </div>

      <SectionHeader title="More" theme={theme}/>
      <div style={{ padding: '0 20px' }}>
        <div style={{ background: theme.surface1, border: `0.5px solid ${theme.border}`, borderRadius: AC_RADIUS.lg, overflow: 'hidden' }}>
          {[
            { l: 'Subscription', r: 'Pro · Annual' },
            { l: 'Privacy & data', r: '' },
            { l: 'Voice transcripts', r: 'Keep 30 days' },
            { l: 'Notifications', r: '' },
            { l: 'About', r: 'v1.0.2' },
          ].map((r, i, a) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '14px 16px',
              borderBottom: i < a.length-1 ? `0.5px solid ${theme.border}` : 'none',
            }}>
              <div style={{ flex: 1, fontSize: 15, color: theme.text, letterSpacing: -0.1 }}>{r.l}</div>
              <div style={{ fontSize: 13, color: theme.textSec, marginRight: 8, fontFamily: r.r.match(/\d/) ? 'var(--ac-mono)' : 'inherit' }}>{r.r}</div>
              <svg width="7" height="11" viewBox="0 0 8 12" stroke={theme.textTer} strokeWidth="1.5" fill="none"><path d="M2 1l4 5-4 5"/></svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Sample data
// ════════════════════════════════════════════════════════════════════════════
// Program day types → used to drive the Log filter chips.
// Derived from whatever day types the user's active program contains.
const SAMPLE_WORKOUTS = [
  {
    initials: 'UA', name: 'Upper A — Push focus', type: 'Upper A', date: 'Yesterday', duration: '54 min',
    volume: '8,420', sets: 22, rpe: 7.8, spark: [3,4,5,4,6,7,8,7,9,8],
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '6-8', weight: '65 kg', rpe: 8 },
      { name: 'Incline DB Press',    sets: 3, reps: '10', weight: '22 kg', rpe: 7 },
      { name: 'Cable Row',           sets: 4, reps: '10-12', weight: '40 kg', rpe: 7 },
      { name: 'Seated Shoulder Press', sets: 3, reps: '12', weight: '14 kg', rpe: 8 },
    ],
  },
  {
    initials: 'LA', name: 'Lower A — Squat day', type: 'Lower A', date: 'Mon, Apr 21', duration: '61 min',
    volume: '11,200', sets: 20, rpe: 8.2, spark: [4,5,6,5,7,6,8,9,9,10],
    exercises: [
      { name: 'Back Squat', sets: 5, reps: '5', weight: '85 kg', rpe: 9 },
      { name: 'Romanian Deadlift', sets: 4, reps: '8', weight: '70 kg', rpe: 8 },
      { name: 'Walking Lunges', sets: 3, reps: '12/leg', weight: '12 kg', rpe: 7 },
    ],
  },
  {
    initials: 'UB', name: 'Upper B — Pull focus', type: 'Upper B', date: 'Sat, Apr 19', duration: '48 min',
    volume: '6,950', sets: 18, rpe: 7.2, spark: [5,6,5,6,7,6,8,7,7,8],
    exercises: [
      { name: 'Weighted Pull-ups', sets: 4, reps: '6-8', weight: '+10 kg', rpe: 8 },
      { name: 'Chest-supported Row', sets: 4, reps: '10', weight: '18 kg', rpe: 7 },
    ],
  },
  {
    initials: 'C', name: 'Zone 2 · Bike', type: 'Conditioning', date: 'Thu, Apr 17', duration: '32 min',
    volume: '—', sets: 1, rpe: 5.0, spark: [3,3,4,4,4,5,5,5,4,4],
    exercises: [{ name: 'Stationary bike', sets: 1, reps: '32 min', weight: 'Z2', rpe: 5 }],
  },
];

// The user's active program — drives the Log filter chips.
// In the real app this would come from the active Program object.
const ACTIVE_PROGRAM_DAY_TYPES = ['Upper A', 'Upper B', 'Lower A', 'Lower B', 'Conditioning'];

Object.assign(window, {
  ScreenHome, ScreenVoiceSession, ScreenLog, ScreenProgram,
  ScreenOnboardWelcome, ScreenOnboardAccount, ScreenOnboardProfile,
  ScreenOnboardGoal, ScreenOnboardEquipment,
  ScreenSettings, SAMPLE_WORKOUTS,
});
