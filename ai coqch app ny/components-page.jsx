// components-page.jsx — reference page for the component library
// Rendered at its own artboard inside the design canvas. Shows tokens (colors,
// type, radius) + each core component in its states for dev handoff.

function ComponentsPage({ theme, accent }) {
  const swatches = [
    ['bg','surface1','surface2','surface3','border','borderStrong'],
    ['text','textSec','textTer'],
    ['accent','accentSoft','accentGlow'],
    ['good','warn','bad'],
  ];
  return (
    <div style={{ background: theme.bg, minHeight: '100%', padding: '40px 36px', fontSize: 13, color: theme.text }}>
      <div style={{ fontSize: 32, fontWeight: 620, letterSpacing: -0.6, marginBottom: 4 }}>Component library</div>
      <div style={{ fontSize: 14, color: theme.textSec, marginBottom: 32 }}>Tokens, primitives, and composed components for handoff.</div>

      {/* ── Colors ───────────────────────────────────────────── */}
      <Section title="Colors">
        {swatches.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {row.map(k => (
              <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: theme.surface1, border: `0.5px solid ${theme.border}`, minWidth: 200 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: theme[k], border: `0.5px solid ${theme.border}` }}/>
                <div>
                  <div style={{ fontFamily: 'var(--ac-mono)', fontSize: 11, color: theme.text }}>{k}</div>
                  <div style={{ fontFamily: 'var(--ac-mono)', fontSize: 10, color: theme.textSec }}>{theme[k]}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </Section>

      {/* ── Typography ───────────────────────────────────────── */}
      <Section title="Typography">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: theme.surface1, border: `0.5px solid ${theme.border}`, borderRadius: 16, padding: 24 }}>
          {[['h1','Display'],['h2','Heading'],['h3','Subhead'],['body','Body text goes here'],['cap','Caption'],['over','OVERLINE']].map(([k, t]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
              <div style={{ width: 60, fontFamily: 'var(--ac-mono)', fontSize: 10, color: theme.textSec, letterSpacing: 0.4 }}>{k}</div>
              <div style={{
                fontSize: AC_TYPE[k].size, fontWeight: AC_TYPE[k].weight, letterSpacing: AC_TYPE[k].tracking,
                lineHeight: AC_TYPE[k].line + 'px', color: theme.text,
                textTransform: k === 'over' ? 'uppercase' : 'none',
              }}>{t}</div>
              <div style={{ marginLeft: 'auto', fontFamily: 'var(--ac-mono)', fontSize: 10, color: theme.textTer }}>{AC_TYPE[k].size}/{AC_TYPE[k].weight}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 24, marginTop: 12, paddingTop: 16, borderTop: `0.5px solid ${theme.border}` }}>
            <div>
              <div style={{ fontSize: 10, color: theme.textSec, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 }}>Metric Lg</div>
              <div style={{ fontFamily: 'var(--ac-mono)', fontSize: 52, fontWeight: 540, letterSpacing: -1.6, lineHeight: 1 }}>14.2<span style={{fontSize:18, color: theme.textSec, marginLeft: 2}}>k</span></div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: theme.textSec, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 }}>Metric</div>
              <div style={{ fontFamily: 'var(--ac-mono)', fontSize: 34, fontWeight: 540, letterSpacing: -1, lineHeight: 1 }}>7.8</div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Radii + spacing ──────────────────────────────────── */}
      <Section title="Radius & spacing">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {Object.entries(AC_RADIUS).map(([k, v]) => (
            <div key={k} style={{ width: 72, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, background: theme.surface2, border: `0.5px solid ${theme.border}`, borderRadius: v, marginBottom: 6 }}/>
              <div style={{ fontFamily: 'var(--ac-mono)', fontSize: 10, color: theme.textSec }}>{k} · {v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {AC_SPACE.slice(1).map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ width: 20, height: s, background: accent, borderRadius: 3, marginBottom: 6 }}/>
              <div style={{ fontFamily: 'var(--ac-mono)', fontSize: 9, color: theme.textSec }}>{s}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Orb states ───────────────────────────────────────── */}
      <Section title="Voice orb — states">
        <div style={{ display: 'flex', gap: 18 }}>
          {['idle','listening','thinking','speaking'].map(s => (
            <div key={s} style={{ textAlign: 'center', background: theme.surface1, border: `0.5px solid ${theme.border}`, borderRadius: 14, padding: 16, width: 140 }}>
              <VoiceOrb size={100} state={s} accent={accent} accentGlow={`${accent}66`}/>
              <div style={{ fontSize: 11, color: theme.textSec, marginTop: 8, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>{s}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Buttons ──────────────────────────────────────────── */}
      <Section title="Primary button">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <PrimaryButton accent={accent} theme={theme}>Default</PrimaryButton>
          <PrimaryButton accent={accent} theme={theme} voiceActive>Voice-active glow</PrimaryButton>
        </div>
      </Section>

      {/* ── Metric tiles ─────────────────────────────────────── */}
      <Section title="Metric tile">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, maxWidth: 640 }}>
          <MetricTile label="Streak" value="12" unit="days" delta="+3" trend="up" theme={theme}/>
          <MetricTile label="Weekly vol" value="14.2" unit="k" delta="+8%" trend="up" theme={theme}/>
          <MetricTile label="Avg RPE" value="7.8" delta="−0.2" trend="down" theme={theme}/>
          <MetricTile label="Sessions" value="4/5" delta="On track" trend="flat" theme={theme}/>
        </div>
      </Section>

      {/* ── Exercise row + workout card ──────────────────────── */}
      <Section title="Exercise row / Workout card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 720 }}>
          <div style={{ background: theme.surface1, border: `0.5px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' }}>
            {[{ name: 'Barbell Bench Press', sets: 4, reps: '6-8', weight: '65 kg', rpe: 8 }, { name: 'Incline DB Press', sets: 3, reps: '10', weight: '22 kg', rpe: 7 }, { name: 'Cable Row', sets: 4, reps: '12', weight: '40 kg', rpe: 6 }].map((ex, i, a) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: i < a.length-1 ? `0.5px solid ${theme.border}` : 'none' }}>
                <ExerciseRow ex={ex} theme={theme}/>
              </div>
            ))}
          </div>
          <WorkoutCard workout={SAMPLE_WORKOUTS[0]} theme={theme}/>
        </div>
      </Section>

      {/* ── Coach voices ─────────────────────────────────────── */}
      <Section title="Coach — voice options">
        <div style={{ fontSize: 12, color: theme.textSec, marginBottom: 14, maxWidth: 520, lineHeight: 1.5 }}>
          Coach personality is permanently friendly. Three voice options selected at signup — coach gender mirrors the user's.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
          {[
            { name: 'Nora', tag: 'Warm female voice', selected: true },
            { name: 'Theo', tag: 'Warm male voice', selected: false },
            { name: 'Kai',  tag: 'Warm neutral voice', selected: false },
          ].map(c => (
            <div key={c.name} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: 14, borderRadius: AC_RADIUS.lg,
              background: c.selected ? `${accent}12` : theme.surface1,
              border: `0.5px solid ${c.selected ? accent : theme.border}`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 20, flexShrink: 0,
                background: `radial-gradient(closest-side, ${accent}, ${accent}22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--ac-mono)', fontSize: 13, fontWeight: 600, color: '#1a0f0a',
              }}>{c.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: -0.1 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: theme.textSec, marginTop: 2 }}>{c.tag}</div>
              </div>
              <button style={{
                all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 16,
                background: theme.surface3, border: `0.5px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="10" height="12" viewBox="0 0 12 14" fill={theme.text}><path d="M2 1v12l9-6z"/></svg>
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 600, color: 'var(--ac-textTer)', marginBottom: 14, opacity: 0.7 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, { ComponentsPage });
