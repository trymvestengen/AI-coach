// VoiceSession.jsx — the hero screen.
// Liquid blob orb morphing to amplitude, live transcription, minimal controls.

function LiquidOrb({ state = 'listening', intensity = 1, hue = null }) {
  // state: idle | listening | thinking | speaking
  // Renders a soft blob using layered SVG paths driven by sine-sum animation.
  const [t, setT] = React.useState(0);
  const rafRef = React.useRef(0);
  React.useEffect(() => {
    let start = performance.now();
    const tick = (now) => {
      setT((now - start) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // State-dependent parameters
  const cfg = {
    idle:      { amp: 4,  speed: 0.4, rings: 2, glow: 0.4 },
    listening: { amp: 14, speed: 1.3, rings: 3, glow: 0.9 },
    thinking:  { amp: 8,  speed: 2.4, rings: 4, glow: 0.7 },
    speaking:  { amp: 18, speed: 1.7, rings: 3, glow: 1.0 },
  }[state];

  const cx = 140, cy = 140, baseR = 78;
  const amp = cfg.amp * intensity;

  // Generate a closed smooth blob path by sampling N points around the circle
  // and offsetting radius with a sum of sines (different frequency per point angle).
  const buildBlob = (seed, radiusBias = 0) => {
    const N = 64;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const s1 = Math.sin(a * 3 + t * cfg.speed + seed) * amp;
      const s2 = Math.sin(a * 5 - t * cfg.speed * 1.3 + seed * 2) * amp * 0.6;
      const s3 = Math.sin(a * 2 + t * cfg.speed * 0.7) * amp * 0.4;
      const r = baseR + radiusBias + s1 + s2 + s3;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    // catmull-rom-ish smooth close
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < N; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % N];
      const mx = (p0[0] + p1[0]) / 2;
      const my = (p0[1] + p1[1]) / 2;
      d += ` Q${p0[0].toFixed(1)},${p0[1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
    }
    d += ' Z';
    return d;
  };

  const accent = hue || '#FF6B35';

  return (
    <div style={{ width: 280, height: 280, position: 'relative' }}>
      {/* outer glow halo */}
      <div style={{
        position: 'absolute', inset: -40,
        background: `radial-gradient(circle at 50% 50%, ${accent}${Math.round(cfg.glow * 55).toString(16).padStart(2,'0')} 0%, transparent 60%)`,
        filter: 'blur(12px)',
        pointerEvents: 'none',
      }}/>
      <svg width="280" height="280" viewBox="0 0 280 280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="orbFill" cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#FFC9A8"/>
            <stop offset="18%" stopColor="#FF9762"/>
            <stop offset="55%" stopColor={accent}/>
            <stop offset="100%" stopColor="#9A2E10"/>
          </radialGradient>
          <radialGradient id="orbInner" cx="42%" cy="38%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45"/>
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0"/>
          </radialGradient>
          <filter id="orbBlur"><feGaussianBlur stdDeviation="0.5"/></filter>
          <filter id="orbSoft"><feGaussianBlur stdDeviation="4"/></filter>
        </defs>

        {/* soft outer blob (ghost) */}
        <path d={buildBlob(1.7, 14)} fill={accent} fillOpacity={0.12} filter="url(#orbSoft)"/>
        {/* outline ring */}
        <path d={buildBlob(0.5, 6)} fill="none" stroke={accent} strokeOpacity={0.35} strokeWidth="1"/>
        {/* main body */}
        <path d={buildBlob(0, 0)} fill="url(#orbFill)" filter="url(#orbBlur)"/>
        {/* inner secondary blob for depth */}
        <path d={buildBlob(2.3, -22)} fill="#FFD9BE" fillOpacity={0.22}/>
        {/* specular highlight */}
        <path d={buildBlob(0, 0)} fill="url(#orbInner)"/>
      </svg>
    </div>
  );
}

function Transcript({ lines }) {
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);
  return (
    <div ref={scrollRef} style={{
      flex: 1, overflowY: 'auto', padding: '0 28px',
      maskImage: 'linear-gradient(to bottom, transparent 0, black 14%, black 86%, transparent 100%)',
    }}>
      {lines.map((l, i) => {
        const isCoach = l.who === 'coach';
        const isCurrent = i === lines.length - 1;
        return (
          <div key={i} style={{
            marginBottom: 14,
            opacity: isCurrent ? 1 : 0.42,
            transition: 'opacity 400ms var(--ease-out)',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: isCoach ? 'var(--accent)' : 'var(--fg-3)',
              marginBottom: 4,
            }}>
              {isCoach ? 'Coach' : 'You'}
            </div>
            <div style={{
              fontSize: isCurrent ? 19 : 16,
              lineHeight: 1.35,
              letterSpacing: '-0.012em',
              fontWeight: isCurrent ? 500 : 400,
              color: isCurrent ? 'var(--fg-0)' : 'var(--fg-1)',
              textWrap: 'pretty',
            }}>
              {l.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PersonaChip({ persona, onClick }) {
  const styles = {
    friend:   { dot: '#FF6B35', label: 'Friend' },
    sergeant: { dot: '#F87171', label: 'Sergeant' },
    analyst:  { dot: '#60A5FA', label: 'Analyst' },
  }[persona];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '7px 12px 7px 10px',
      background: 'rgba(25,26,29,0.7)',
      border: '1px solid var(--border-2)',
      borderRadius: 999,
      color: 'var(--fg-0)',
      fontSize: 12, fontWeight: 500, letterSpacing: '-0.005em',
      cursor: 'pointer', backdropFilter: 'blur(16px)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: styles.dot }}/>
      {styles.label}
    </button>
  );
}

function VoiceSession({ onClose, persona = 'friend', setPersona, orbIntensity = 1, accentColor }) {
  const [state, setState] = React.useState('listening'); // idle | listening | thinking | speaking
  const [muted, setMuted] = React.useState(false);
  const [inputMode, setInputMode] = React.useState('voice'); // 'voice' | 'text'
  const [draft, setDraft] = React.useState('');
  const inputRef = React.useRef(null);
  const [lines, setLines] = React.useState([
    { who: 'coach', text: "Good morning. You're on push day — bench, overhead, incline. How's the shoulder feeling after Tuesday?" },
    { who: 'user',  text: 'Feels solid. A little tight but nothing weird.' },
    { who: 'coach', text: "Nice. Let's warm it up properly then. Empty bar bench, 12 reps, slow on the way down." },
    { who: 'user',  text: "Okay — starting warm-up now." },
  ]);
  const [elapsed, setElapsed] = React.useState(183); // 3:03

  const sendText = () => {
    const t = draft.trim();
    if (!t) return;
    setLines(ls => [...ls, { who: 'user', text: t }]);
    setDraft('');
    setState('thinking');
    // simulate coach reply
    setTimeout(() => {
      setState('speaking');
      setLines(ls => [...ls, { who: 'coach', text: "Got it — logging that. Ready for the next set whenever you are." }]);
      setTimeout(() => setState('listening'), 2600);
    }, 900);
  };

  React.useEffect(() => {
    if (inputMode === 'text' && inputRef.current) inputRef.current.focus();
  }, [inputMode]);

  // demo: cycle states to show animation variety (paused in text mode)
  React.useEffect(() => {
    if (inputMode === 'text') return;
    const seq = ['listening', 'thinking', 'speaking', 'listening'];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % seq.length;
      setState(seq[i]);
    }, 3200);
    return () => clearInterval(id);
  }, [inputMode]);

  // demo timer
  React.useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const statusText = inputMode === 'text'
    ? (state === 'thinking' ? 'Thinking' : state === 'speaking' ? 'Coach is replying' : 'Type a message')
    : ({
        idle: 'Tap to talk',
        listening: 'Listening',
        thinking: 'Thinking',
        speaking: 'Coach is speaking',
      }[state]);

  return (
    <div className="screen" style={{
      background: 'radial-gradient(ellipse at 50% 38%, #1B1512 0%, #0A0A0B 48%)',
    }}>
      {/* status bar spacer (iOS frame draws its own) */}
      <div style={{ height: 54 }}/>

      {/* top row: close + persona + timer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px 0',
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'rgba(25,26,29,0.7)', border: '1px solid var(--border-2)',
          color: 'var(--fg-0)', display: 'grid', placeItems: 'center',
          cursor: 'pointer', backdropFilter: 'blur(12px)',
        }}>
          <Icon.X size={18}/>
        </button>
        <PersonaChip persona={persona} onClick={() => {
          const order = ['friend', 'sergeant', 'analyst'];
          setPersona && setPersona(order[(order.indexOf(persona) + 1) % 3]);
        }}/>
        <div className="tnum" style={{
          fontSize: 13, color: 'var(--fg-2)', fontWeight: 500,
          letterSpacing: '-0.005em',
          minWidth: 36, textAlign: 'right',
        }}>
          {fmt(elapsed)}
        </div>
      </div>

      {/* Orb area */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 28, paddingBottom: 14,
      }}>
        <LiquidOrb state={state} intensity={orbIntensity} hue={accentColor}/>
        <div style={{
          marginTop: 8,
          fontSize: 12, fontWeight: 600, letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: state === 'listening' ? 'var(--accent)' : 'var(--fg-2)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999,
            background: state === 'listening' ? 'var(--accent)' : 'var(--fg-2)',
            animation: state === 'listening' ? 'dotPulse 1.2s ease-in-out infinite' : 'none',
          }}/>
          {statusText}
        </div>
      </div>

      {/* Transcript */}
      <Transcript lines={lines}/>

      {/* Bottom controls — swap between voice controls and text composer */}
      {inputMode === 'voice' ? (
        <div style={{
          padding: '16px 24px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <button onClick={() => setMuted(m => !m)} aria-label={muted ? 'Unmute' : 'Mute'} style={{
            width: 56, height: 56, borderRadius: 999,
            background: muted ? 'rgba(248,113,113,0.12)' : 'rgba(25,26,29,0.7)',
            border: `1px solid ${muted ? 'rgba(248,113,113,0.4)' : 'var(--border-2)'}`,
            color: muted ? '#F87171' : 'var(--fg-0)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            backdropFilter: 'blur(16px)',
          }}>
            {muted ? <Icon.MicOff size={22}/> : <Icon.Mic size={22}/>}
          </button>

          <button onClick={onClose} style={{
            height: 56, minWidth: 160, borderRadius: 999,
            background: 'var(--accent)', color: '#1A0A04',
            border: 'none', cursor: 'pointer',
            fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
            padding: '0 26px',
            boxShadow: '0 12px 36px -10px var(--accent-glow)',
          }}>
            End session
          </button>

          <button onClick={() => { setInputMode('text'); setState('idle'); }}
            aria-label="Switch to text"
            style={{
              width: 56, height: 56, borderRadius: 999,
              background: 'rgba(25,26,29,0.7)',
              border: '1px solid var(--border-2)',
              color: 'var(--fg-0)',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              backdropFilter: 'blur(16px)',
            }}>
            <Icon.Keyboard size={22}/>
          </button>
        </div>
      ) : (
        <div style={{
          padding: '14px 16px 28px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <button onClick={() => { setInputMode('voice'); setState('listening'); }}
            aria-label="Switch to voice"
            style={{
              width: 48, height: 48, borderRadius: 999, flexShrink: 0,
              background: 'rgba(25,26,29,0.7)',
              border: '1px solid var(--border-2)',
              color: 'var(--fg-0)',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              backdropFilter: 'blur(16px)',
            }}>
            <Icon.Mic size={20}/>
          </button>

          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(25,26,29,0.85)',
            border: '1px solid var(--border-2)',
            borderRadius: 26, padding: '4px 4px 4px 16px',
            backdropFilter: 'blur(16px)',
            minHeight: 48,
          }}>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); } }}
              placeholder="Message your coach…"
              style={{
                flex: 1, minWidth: 0,
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--fg-0)', fontFamily: 'inherit',
                fontSize: 15, fontWeight: 400, letterSpacing: '-0.008em',
                padding: '10px 0',
              }}/>
            <button onClick={sendText}
              disabled={!draft.trim()}
              aria-label="Send"
              style={{
                width: 40, height: 40, borderRadius: 999, flexShrink: 0,
                background: draft.trim() ? 'var(--accent)' : 'var(--bg-3)',
                color: draft.trim() ? '#1A0A04' : 'var(--fg-3)',
                border: 'none',
                display: 'grid', placeItems: 'center',
                cursor: draft.trim() ? 'pointer' : 'default',
                transition: 'background 160ms var(--ease-out)',
                boxShadow: draft.trim() ? '0 6px 18px -6px var(--accent-glow)' : 'none',
              }}>
              <Icon.ArrowUp size={16}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { VoiceSession, LiquidOrb });
