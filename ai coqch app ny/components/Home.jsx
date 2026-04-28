// Home.jsx — the "Today" screen. Feels like opening a coach's message.

function Home({ onOpenCoach, onOpenWorkout }) {
  // Streak: last 7 days
  const streak = [true, true, false, true, true, true, false]; // Mon..Sun, today = Sat
  const todayIdx = 5;
  const dayLabels = ['M','T','W','T','F','S','S'];

  return (
    <div className="screen">
      {/* Status bar spacer (iOS frame draws its own clock) */}
      <div style={{ height: 54 }}/>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 120 }}>
        {/* Header */}
        <div style={{ padding: '8px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 500, letterSpacing: '-0.005em' }}>
              Saturday, April 25
            </div>
            <div className="display-l" style={{ marginTop: 2 }}>Morning, Nora.</div>
          </div>
        </div>

        {/* Coach message card */}
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{
            background: 'linear-gradient(180deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02))',
            border: '1px solid rgba(255,107,53,0.18)',
            borderRadius: 24,
            padding: 18,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* mini orb in top-right */}
            <div style={{
              position: 'absolute', top: 14, right: 14,
              width: 36, height: 36, borderRadius: 999,
              background: 'radial-gradient(circle at 32% 32%, #FFC9A8, var(--accent) 55%, #9A2E10)',
              boxShadow: '0 0 22px rgba(255,107,53,0.45), inset 0 0 6px rgba(255,255,255,0.35)',
            }}/>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              textTransform: 'uppercase', color: 'var(--accent)',
              marginBottom: 6,
            }}>
              Coach · Friend
            </div>
            <div style={{
              fontSize: 17, lineHeight: 1.38, letterSpacing: '-0.012em',
              color: 'var(--fg-0)', textWrap: 'pretty', fontWeight: 400,
              paddingRight: 40,
            }}>
              You're on push day. Bench's been climbing nicely — let's hit 82.5 for 5 today, then see how the shoulder feels.
            </div>
            <button onClick={onOpenCoach} style={{
              marginTop: 16,
              width: '100%', height: 52, borderRadius: 16,
              background: 'var(--accent)', color: '#1A0A04',
              border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 10px 30px -10px var(--accent-glow)',
            }}>
              <Icon.Mic size={18}/>
              Start voice session
            </button>
          </div>
        </div>

        {/* Today's workout card */}
        <div style={{ padding: '14px 20px 0' }}>
          <div className="caption" style={{ padding: '8px 2px 6px' }}>Today's workout</div>
          <button onClick={onOpenWorkout} style={{
            width: '100%', textAlign: 'left',
            background: 'var(--bg-2)', border: '1px solid var(--border-1)',
            borderRadius: 20, padding: 18, cursor: 'pointer', color: 'inherit',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="title-l" style={{ marginBottom: 2 }}>Push A</div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 500 }}>
                  Upper/Lower · Week 4 of 8
                </div>
              </div>
              <div style={{
                padding: '6px 10px', borderRadius: 999,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
              }}>
                ~52 min
              </div>
            </div>

            <div style={{
              marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {[
                { n: 'Bench Press', sets: '4 × 5', target: '82.5 kg' },
                { n: 'Overhead Press', sets: '3 × 8', target: '47.5 kg' },
                { n: 'Incline DB Press', sets: '3 × 10', target: '22.5 kg' },
                { n: 'Cable Fly', sets: '3 × 12', target: '—' },
                { n: 'Tricep Pushdown', sets: '3 × 12', target: '32 kg' },
              ].map((e, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border-1)',
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: 999,
                    background: i === 0 ? 'var(--accent)' : 'var(--fg-3)',
                  }}/>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500, letterSpacing: '-0.008em' }}>
                    {e.n}
                  </div>
                  <div className="tnum" style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 500 }}>
                    {e.sets}
                  </div>
                  <div className="tnum" style={{ fontSize: 13, color: 'var(--fg-1)', fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
                    {e.target}
                  </div>
                </div>
              ))}
            </div>
          </button>
        </div>

        {/* Metric row */}
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Streak tile */}
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-2)' }}>
                <Icon.Flame size={13}/>
                <div className="caption" style={{ color: 'var(--fg-2)' }}>Streak</div>
              </div>
              <div className="metric" style={{ marginTop: 8 }}>5<span style={{ fontSize: 15, color: 'var(--fg-2)', fontWeight: 500, marginLeft: 4 }}>weeks</span></div>
              <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
                {streak.map((on, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      height: 22, borderRadius: 6,
                      background: i === todayIdx
                        ? 'var(--accent)'
                        : on ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
                      border: i === todayIdx ? 'none' : '1px solid var(--border-1)',
                    }}/>
                    <div style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 4, fontWeight: 600 }}>{dayLabels[i]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume tile */}
            <div className="card" style={{ padding: 14 }}>
              <div className="caption">Weekly volume</div>
              <div className="metric" style={{ marginTop: 8 }}>
                18.4<span style={{ fontSize: 15, color: 'var(--fg-2)', fontWeight: 500, marginLeft: 3 }}>t</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Icon.ArrowUp size={11}/>  12% vs last
                </div>
                <Sparkline points={[10,12,11,14,13,16,18]} width={58} height={20} color="var(--accent)"/>
              </div>
            </div>
          </div>
        </div>

        {/* Last workout recap */}
        <div style={{ padding: '18px 20px 0' }}>
          <div className="caption" style={{ padding: '8px 2px 6px' }}>Last session</div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="title-m">Pull B</div>
                <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2 }}>Thursday · 48 min</div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', fontWeight: 600, padding: '4px 8px', background: 'var(--accent-soft)', borderRadius: 999 }}>
                <Icon.Bolt size={11}/> 2 PRs
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
              <div>
                <div className="caption" style={{ marginBottom: 4 }}>Volume</div>
                <div className="metric-s">6,120 kg</div>
              </div>
              <div style={{ width: 1, background: 'var(--border-1)' }}/>
              <div>
                <div className="caption" style={{ marginBottom: 4 }}>Sets</div>
                <div className="metric-s">21</div>
              </div>
              <div style={{ width: 1, background: 'var(--border-1)' }}/>
              <div>
                <div className="caption" style={{ marginBottom: 4 }}>Avg RPE</div>
                <div className="metric-s">7.8</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CoachFAB onClick={onOpenCoach}/>
      <TabBar active="home"/>
    </div>
  );
}

Object.assign(window, { Home });
