// WorkoutLog.jsx — past workouts, expandable.

function RpeDots({ rpe }) {
  // 10 dots, fills up to rpe (rounded)
  const n = 10;
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{
          width: 5, height: 5, borderRadius: 999,
          background: i < Math.round(rpe)
            ? (rpe >= 9 ? '#F87171' : rpe >= 7.5 ? 'var(--accent)' : 'var(--fg-1)')
            : 'rgba(255,255,255,0.08)',
        }}/>
      ))}
    </div>
  );
}

function WorkoutCard({ w, expanded, onToggle }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button onClick={onToggle} style={{
        width: '100%', textAlign: 'left', background: 'none', border: 'none',
        color: 'inherit', cursor: 'pointer', padding: 16, display: 'block',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--fg-2)', fontWeight: 500, letterSpacing: '-0.005em' }}>
              {w.date}
            </div>
            <div className="title-m" style={{ marginTop: 2 }}>{w.name}</div>
          </div>
          {w.prs > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'var(--accent)', fontWeight: 600,
              padding: '4px 8px', background: 'var(--accent-soft)', borderRadius: 999,
            }}>
              <Icon.Bolt size={10}/> {w.prs} PR{w.prs > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
          <div className="tnum" style={{ fontSize: 13, color: 'var(--fg-1)', fontWeight: 500 }}>
            {w.duration}
          </div>
          <div style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--fg-3)' }}/>
          <div className="tnum" style={{ fontSize: 13, color: 'var(--fg-1)', fontWeight: 500 }}>
            {w.volume}
          </div>
          <div style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--fg-3)' }}/>
          <div className="tnum" style={{ fontSize: 13, color: 'var(--fg-1)', fontWeight: 500 }}>
            {w.sets} sets
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RpeDots rpe={w.rpe}/>
            <span className="tnum" style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 600 }}>
              {w.rpe.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Exercise summary row */}
        <div style={{
          marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6,
        }}>
          {w.exercises.slice(0, expanded ? w.exercises.length : 4).map((e, i) => (
            <div key={i} style={{
              fontSize: 11, fontWeight: 500, padding: '4px 9px',
              background: 'var(--bg-3)', border: '1px solid var(--border-1)',
              borderRadius: 999, color: 'var(--fg-1)',
              letterSpacing: '-0.003em',
            }}>
              {e.name}
            </div>
          ))}
          {!expanded && w.exercises.length > 4 && (
            <div style={{
              fontSize: 11, fontWeight: 500, padding: '4px 9px',
              color: 'var(--fg-2)',
            }}>
              +{w.exercises.length - 4} more
            </div>
          )}
        </div>
      </button>

      {/* Expanded set detail */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border-1)',
          padding: '8px 16px 16px',
        }}>
          {w.exercises.map((e, i) => (
            <div key={i} style={{
              padding: '12px 0',
              borderBottom: i === w.exercises.length - 1 ? 'none' : '1px solid var(--border-1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.008em' }}>
                  {e.name}
                  {e.pr && (
                    <span style={{
                      marginLeft: 8, fontSize: 10, color: 'var(--accent)',
                      fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
                    }}>PR</span>
                  )}
                </div>
                <div className="tnum" style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 500 }}>
                  {e.sets.length} sets
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {e.sets.map((s, j) => (
                  <div key={j} style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr 1fr 28px',
                    alignItems: 'center', gap: 10,
                    fontSize: 13, color: 'var(--fg-1)',
                    padding: '2px 0',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 600 }}>{j + 1}</div>
                    <div className="tnum" style={{ fontWeight: 500 }}>{s.w} kg</div>
                    <div className="tnum" style={{ fontWeight: 500 }}>{s.r} reps</div>
                    <div className="tnum" style={{
                      fontSize: 11, color: s.rpe >= 9 ? '#F87171' : 'var(--fg-2)',
                      fontWeight: 600, textAlign: 'right',
                    }}>
                      @{s.rpe}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutLog({ onBack, onOpenCoach }) {
  const [expandedId, setExpandedId] = React.useState('w1');

  const workouts = [
    { id: 'w1', date: 'Thursday, April 23', name: 'Pull B', duration: '48 min', volume: '6,120 kg',
      sets: 21, rpe: 7.8, prs: 2,
      exercises: [
        { name: 'Deadlift', pr: true, sets: [
          { w: 140, r: 5, rpe: 7 }, { w: 150, r: 5, rpe: 8 }, { w: 160, r: 3, rpe: 9.5 },
        ]},
        { name: 'Pull-up', pr: false, sets: [
          { w: 0, r: 10, rpe: 7 }, { w: 0, r: 9, rpe: 8 }, { w: 0, r: 7, rpe: 9 },
        ]},
        { name: 'Barbell Row', pr: true, sets: [
          { w: 70, r: 8, rpe: 7 }, { w: 75, r: 8, rpe: 8 }, { w: 75, r: 7, rpe: 9 },
        ]},
        { name: 'Face Pull', pr: false, sets: [
          { w: 22, r: 15, rpe: 6 }, { w: 22, r: 15, rpe: 7 }, { w: 22, r: 13, rpe: 8 },
        ]},
        { name: 'Hammer Curl', pr: false, sets: [
          { w: 14, r: 12, rpe: 7 }, { w: 14, r: 12, rpe: 8 }, { w: 14, r: 10, rpe: 8.5 },
        ]},
      ],
    },
    { id: 'w2', date: 'Tuesday, April 21', name: 'Push A', duration: '54 min', volume: '5,840 kg',
      sets: 19, rpe: 8.1, prs: 1,
      exercises: [
        { name: 'Bench Press', pr: true, sets: [] },
        { name: 'Overhead Press', pr: false, sets: [] },
        { name: 'Incline DB Press', pr: false, sets: [] },
        { name: 'Cable Fly', pr: false, sets: [] },
        { name: 'Tricep Pushdown', pr: false, sets: [] },
      ],
    },
    { id: 'w3', date: 'Sunday, April 19', name: 'Legs', duration: '61 min', volume: '8,210 kg',
      sets: 23, rpe: 8.6, prs: 0,
      exercises: [
        { name: 'Squat', pr: false, sets: [] },
        { name: 'RDL', pr: false, sets: [] },
        { name: 'Bulgarian Split Squat', pr: false, sets: [] },
        { name: 'Leg Curl', pr: false, sets: [] },
        { name: 'Calf Raise', pr: false, sets: [] },
        { name: 'Ab Wheel', pr: false, sets: [] },
      ],
    },
    { id: 'w4', date: 'Friday, April 17', name: 'Pull A', duration: '46 min', volume: '5,420 kg',
      sets: 18, rpe: 7.5, prs: 0,
      exercises: [
        { name: 'Weighted Pull-up', pr: false, sets: [] },
        { name: 'Chest-Supported Row', pr: false, sets: [] },
        { name: 'Lat Pulldown', pr: false, sets: [] },
        { name: 'Rear Delt Fly', pr: false, sets: [] },
      ],
    },
  ];

  return (
    <div className="screen">
      <div style={{ height: 54 }}/>

      {/* Header */}
      <div style={{ padding: '6px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="display-l">Workouts</div>
          <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 2, fontWeight: 500 }}>
            23 sessions · this month
          </div>
        </div>
        <button style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'var(--bg-2)', border: '1px solid var(--border-1)',
          color: 'var(--fg-0)', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          <Icon.Plus size={18}/>
        </button>
      </div>

      {/* Monthly summary band */}
      <div style={{ padding: '0 20px 14px' }}>
        <div className="card" style={{
          padding: 14,
          background: 'linear-gradient(120deg, rgba(255,107,53,0.07), transparent 60%), var(--bg-2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div className="caption">April total</div>
              <div className="metric" style={{ marginTop: 6 }}>
                74.2<span style={{ fontSize: 15, color: 'var(--fg-2)', fontWeight: 500, marginLeft: 4 }}>tonnes</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Icon.ArrowUp size={10}/> 8.4% vs March
              </div>
            </div>
            <Sparkline points={[4.2, 5.1, 4.8, 6.0, 5.9, 6.4, 6.1, 7.0, 7.8, 7.5, 8.1, 8.6]} width={110} height={36} color="var(--accent)"/>
          </div>
        </div>
      </div>

      {/* Workout list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {workouts.map(w => (
          <WorkoutCard key={w.id} w={w}
            expanded={expandedId === w.id}
            onToggle={() => setExpandedId(expandedId === w.id ? null : w.id)}/>
        ))}
      </div>

      <CoachFAB onClick={onOpenCoach}/>
      <TabBar active="workout"/>
    </div>
  );
}

Object.assign(window, { WorkoutLog });
