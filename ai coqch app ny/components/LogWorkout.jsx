// LogWorkout.jsx — active workout set-logging screen (dark, Hevy-inspired)

function SetRow({ n, prev, weight, reps, done, active, onCheck, type = 'normal' }) {
  const typeColor = {
    normal: 'var(--fg-0)',
    warmup: '#FBBF24',
    failure: '#F87171',
    dropset: '#60A5FA',
  }[type];
  const typeLabel = { warmup: 'W', failure: 'F', dropset: 'D' }[type];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '32px 1fr 1fr 1fr 40px',
      alignItems: 'center', gap: 6,
      padding: '12px 4px',
      borderBottom: '1px solid var(--border-1)',
      background: done ? 'rgba(74,222,128,0.04)' : active ? 'rgba(255,107,53,0.06)' : 'transparent',
    }}>
      <div style={{ textAlign: 'center' }}>
        {typeLabel ? (
          <span style={{
            display: 'inline-block', width: 22, height: 22, borderRadius: 6,
            background: 'var(--bg-3)', color: typeColor,
            fontSize: 11, fontWeight: 700, lineHeight: '22px',
          }}>{typeLabel}</span>
        ) : (
          <span className="tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-0)' }}>{n}</span>
        )}
      </div>
      <div className="tnum" style={{ fontSize: 13, color: 'var(--fg-3)', fontWeight: 500, textAlign: 'center' }}>
        {prev || '–'}
      </div>
      <div className="tnum" style={{
        fontSize: 17, fontWeight: 600, textAlign: 'center',
        color: active ? 'var(--fg-0)' : done ? 'var(--fg-1)' : 'var(--fg-2)',
        letterSpacing: '-0.01em',
        position: 'relative',
      }}>
        {weight}
        {active && <span style={{
          position: 'absolute', right: '22%', top: 2, bottom: 2, width: 1.5,
          background: 'var(--accent)',
          animation: 'caret 1s steps(2) infinite',
        }}/>}
      </div>
      <div className="tnum" style={{
        fontSize: 17, fontWeight: 600, textAlign: 'center',
        color: active ? 'var(--fg-0)' : done ? 'var(--fg-1)' : 'var(--fg-2)',
        letterSpacing: '-0.01em',
      }}>
        {reps}
      </div>
      <button onClick={onCheck} style={{
        justifySelf: 'center',
        width: 28, height: 28, borderRadius: 8,
        background: done ? 'var(--success)' : 'var(--bg-3)',
        border: 'none', color: done ? '#0A0A0B' : 'var(--fg-3)',
        display: 'grid', placeItems: 'center', cursor: 'pointer',
      }}>
        <Icon.Check size={14}/>
      </button>
    </div>
  );
}

function LogWorkout({ onBack, onOpenExercise, onFinish }) {
  const [sets, setSets] = React.useState([
    { n: 1, prev: '80 × 5', weight: 82.5, reps: 5, done: true, type: 'normal' },
    { n: 2, prev: '80 × 5', weight: 82.5, reps: 5, done: true, type: 'normal' },
    { n: 3, prev: '80 × 4', weight: 82.5, reps: 0, done: false, active: true, type: 'normal' },
    { n: 4, prev: '77.5 × 5', weight: 82.5, reps: 0, done: false, type: 'normal' },
  ]);
  const [duration, setDuration] = React.useState('12:34');
  const [restOn, setRestOn] = React.useState(true);
  const [restSeconds, setRestSeconds] = React.useState(92);

  React.useEffect(() => {
    if (!restOn) return;
    const id = setInterval(() => setRestSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [restOn]);

  const fmtRest = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const toggleSet = (i) => {
    setSets(arr => arr.map((s, idx) => idx === i ? { ...s, done: !s.done, active: false } : s));
  };

  const totalVolume = sets.filter(s => s.done).reduce((a,s) => a + s.weight * s.reps, 0);
  const doneCount = sets.filter(s => s.done).length;

  return (
    <div className="screen">
      <div style={{ height: 54 }}/>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px 12px',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'var(--fg-0)',
          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
          padding: 6,
        }}>
          <Icon.Chevron dir="down" size={16}/>
          <span>Log Workout</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{
            width: 36, height: 36, borderRadius: 999, background: 'var(--bg-2)',
            border: '1px solid var(--border-1)', color: 'var(--fg-0)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <Icon.Alarm size={18}/>
          </button>
          <button onClick={onFinish} style={{
            height: 36, padding: '0 16px', borderRadius: 999,
            background: 'var(--accent)', color: '#1A0A04',
            border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em',
          }}>
            Finish
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-1)',
        borderBottom: '1px solid var(--border-1)',
        display: 'flex', alignItems: 'center', gap: 28,
      }}>
        <div>
          <div className="caption">Duration</div>
          <div className="tnum" style={{ marginTop: 4, fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
            {duration}
          </div>
        </div>
        <div>
          <div className="caption">Volume</div>
          <div className="tnum" style={{ marginTop: 4, fontSize: 15, fontWeight: 600 }}>
            {totalVolume.toFixed(0)} kg
          </div>
        </div>
        <div>
          <div className="caption">Sets</div>
          <div className="tnum" style={{ marginTop: 4, fontSize: 15, fontWeight: 600 }}>
            {doneCount}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <MuscleBody width={28} view="front" highlight={['chest','shoulders','triceps']}/>
          <MuscleBody width={28} view="back" highlight={['triceps']}/>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 160 }}>
        {/* Exercise header */}
        <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onOpenExercise} style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'var(--bg-2)', border: '1px solid var(--border-1)',
            color: 'var(--fg-0)', cursor: 'pointer',
            display: 'grid', placeItems: 'center', padding: 0,
          }}>
            <MuscleBody width={22} view="front" highlight={['chest']}/>
          </button>
          <button onClick={onOpenExercise} style={{
            flex: 1, background: 'none', border: 'none', padding: 0,
            color: 'var(--accent)', textAlign: 'left', cursor: 'pointer',
            fontSize: 17, fontWeight: 600, letterSpacing: '-0.012em',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            Bench Press (Barbell)
            <Icon.Info size={15}/>
          </button>
          <button style={{
            background: 'none', border: 'none', color: 'var(--fg-2)',
            cursor: 'pointer', padding: 4,
          }}>
            <Icon.More size={18}/>
          </button>
        </div>

        {/* Notes placeholder */}
        <div style={{ padding: '0 20px 8px' }}>
          <div style={{ fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic' }}>
            Add notes here…
          </div>
        </div>

        {/* Rest timer row */}
        <div style={{ padding: '6px 20px 12px' }}>
          <button onClick={() => setRestOn(!restOn)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: restOn ? 'var(--accent)' : 'var(--fg-2)',
            fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em',
            padding: 0,
          }}>
            <Icon.Alarm size={14}/>
            Rest Timer: {restOn ? (
              <span className="tnum" style={{ color: 'var(--accent)' }}>{fmtRest(restSeconds)}</span>
            ) : 'OFF'}
          </button>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 1fr 1fr 40px',
          gap: 6,
          padding: '8px 24px',
          borderTop: '1px solid var(--border-1)',
          background: 'var(--bg-1)',
        }}>
          <div className="caption" style={{ textAlign: 'center' }}>Set</div>
          <div className="caption" style={{ textAlign: 'center' }}>Previous</div>
          <div className="caption" style={{ textAlign: 'center' }}>↔ kg</div>
          <div className="caption" style={{ textAlign: 'center' }}>Reps</div>
          <div className="caption" style={{ textAlign: 'center' }}>
            <Icon.Check size={12}/>
          </div>
        </div>

        {/* Set rows */}
        <div style={{ padding: '0 20px' }}>
          {sets.map((s, i) => (
            <SetRow key={i} {...s} onCheck={() => toggleSet(i)}/>
          ))}
        </div>

        {/* Add set + voice-log hint */}
        <div style={{ padding: '12px 20px 0', display: 'flex', gap: 8 }}>
          <button style={{
            flex: 1, height: 44, borderRadius: 14,
            background: 'var(--bg-3)', border: '1px solid var(--border-1)',
            color: 'var(--fg-0)', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, letterSpacing: '-0.008em',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon.Plus size={16}/> Add Set
          </button>
          <button style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'var(--accent)', color: '#1A0A04', border: 'none', cursor: 'pointer',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 8px 24px -8px var(--accent-glow)',
          }}>
            <Icon.Mic size={18}/>
          </button>
        </div>

        {/* Next exercise preview */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="caption" style={{ marginBottom: 8 }}>Up next</div>
          <div className="card" style={{
            padding: 12, display: 'flex', alignItems: 'center', gap: 12,
            opacity: 0.7,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--bg-3)', display: 'grid', placeItems: 'center',
            }}>
              <MuscleBody width={20} view="front" highlight={['shoulders']}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.008em' }}>
                Overhead Press
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>
                3 × 8 · 47.5 kg target
              </div>
            </div>
            <Icon.Chevron size={14}/>
          </div>
        </div>
      </div>

      {/* Voice coach FAB */}
      <CoachFAB onClick={() => {}}/>
    </div>
  );
}

Object.assign(window, { LogWorkout });
