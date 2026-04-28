// Social.jsx — friends feed, follow, leaderboard.

function Avatar({ name, size = 36, hue = 30, imgBg = null, ring = false }) {
  const initial = name.charAt(0).toUpperCase();
  // Deterministic hue from name
  const h = hue ?? (name.charCodeAt(0) * 37) % 360;
  const bg = imgBg || `linear-gradient(135deg, hsl(${h} 60% 45%), hsl(${(h+40)%360} 55% 28%))`;
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: bg,
      display: 'grid', placeItems: 'center',
      color: '#fff', fontWeight: 600, fontSize: size * 0.38,
      letterSpacing: '-0.01em', flexShrink: 0,
      boxShadow: ring ? '0 0 0 2px var(--bg-0), 0 0 0 4px var(--accent)' : 'none',
    }}>
      {initial}
    </div>
  );
}

function MuscleTag({ label, accent }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase',
      padding: '3px 7px', borderRadius: 6,
      background: accent ? 'var(--accent-soft)' : 'rgba(255,255,255,0.06)',
      color: accent ? 'var(--accent)' : 'var(--fg-2)',
    }}>{label}</div>
  );
}

function FeedCard({ post }) {
  const [liked, setLiked] = React.useState(post.liked);
  const [likes, setLikes] = React.useState(post.likes);
  const toggleLike = () => {
    setLiked(l => {
      setLikes(n => n + (l ? -1 : 1));
      return !l;
    });
  };
  return (
    <div className="card" style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Avatar name={post.user} hue={post.hue} size={38}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.008em' }}>
            {post.user}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 500 }}>
            {post.when} · {post.duration}
          </div>
        </div>
        {post.pr && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: 'var(--accent)', fontWeight: 700,
            padding: '4px 8px', background: 'var(--accent-soft)', borderRadius: 999,
            letterSpacing: 0.4, textTransform: 'uppercase',
          }}>
            <Icon.Bolt size={10}/> PR
          </div>
        )}
      </div>

      {/* Workout title */}
      <div className="title-m" style={{ marginBottom: 4 }}>{post.name}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {post.tags.map((t, i) => <MuscleTag key={i} label={t} accent={i === 0}/>)}
      </div>

      {/* Metrics row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8, marginBottom: 12,
        padding: '12px 0',
        borderTop: '1px solid var(--border-1)',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <div>
          <div className="caption" style={{ marginBottom: 3 }}>Volume</div>
          <div className="metric-s">{post.volume}</div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 3 }}>Sets</div>
          <div className="metric-s">{post.sets}</div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 3 }}>Avg RPE</div>
          <div className="metric-s">{post.rpe}</div>
        </div>
      </div>

      {/* Top exercises */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
        {post.exercises.map((e, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 13, color: 'var(--fg-1)',
          }}>
            <span style={{ fontWeight: 500, letterSpacing: '-0.005em' }}>
              {e.pr && <span style={{ color: 'var(--accent)', marginRight: 6, fontSize: 10, fontWeight: 700 }}>★</span>}
              {e.name}
            </span>
            <span className="tnum" style={{ color: 'var(--fg-2)', fontWeight: 500 }}>{e.detail}</span>
          </div>
        ))}
      </div>

      {/* Action row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 18,
        paddingTop: 10, borderTop: '1px solid var(--border-1)',
      }}>
        <button onClick={toggleLike} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: liked ? 'var(--accent)' : 'var(--fg-2)',
          fontSize: 13, fontWeight: 500,
        }}>
          <Icon.Heart size={16} filled={liked}/>
          <span className="tnum">{likes}</span>
        </button>
        <button style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--fg-2)', fontSize: 13, fontWeight: 500,
        }}>
          <Icon.Comment size={16}/>
          <span className="tnum">{post.comments}</span>
        </button>
        <button style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: 'var(--fg-2)', marginLeft: 'auto',
        }}>
          <Icon.Share size={16}/>
        </button>
      </div>
    </div>
  );
}

function SuggestionRow({ s, onFollow }) {
  const [following, setFollowing] = React.useState(false);
  return (
    <div style={{
      width: 150, flexShrink: 0,
      background: 'var(--bg-2)', border: '1px solid var(--border-1)',
      borderRadius: 16, padding: 12,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <Avatar name={s.name} hue={s.hue} size={48}/>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.008em', marginTop: 8, textAlign: 'center' }}>
        {s.name}
      </div>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2, textAlign: 'center' }}>
        {s.mutuals} mutual · {s.streak}w streak
      </div>
      <button onClick={() => setFollowing(f => !f)} style={{
        marginTop: 10, width: '100%',
        padding: '7px 0', borderRadius: 999,
        background: following ? 'transparent' : 'var(--accent)',
        color: following ? 'var(--fg-1)' : '#1A0A04',
        border: following ? '1px solid var(--border-2)' : 'none',
        fontSize: 12, fontWeight: 600, letterSpacing: '-0.005em',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        {following ? (<><Icon.Check size={12}/> Following</>) : (<><Icon.UserPlus size={12}/> Follow</>)}
      </button>
    </div>
  );
}

function LeaderRow({ r, rank, me }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px',
      background: me ? 'var(--accent-soft)' : 'transparent',
      borderRadius: 12,
      border: me ? '1px solid rgba(255,107,53,0.22)' : '1px solid transparent',
    }}>
      <div className="tnum" style={{
        width: 18, textAlign: 'center',
        fontSize: 12, color: rank <= 3 ? 'var(--accent)' : 'var(--fg-3)',
        fontWeight: 700,
      }}>
        {rank}
      </div>
      <Avatar name={r.name} hue={r.hue} size={30}/>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em' }}>
        {r.name}{me && <span style={{ color: 'var(--accent)', marginLeft: 6, fontWeight: 500, fontSize: 11 }}>· You</span>}
      </div>
      <div className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>{r.volume}</div>
    </div>
  );
}

function Social({ onOpenCoach }) {
  const [tab, setTab] = React.useState('feed'); // feed | discover

  const feed = [
    { user: 'markus', hue: 200, when: '38 min ago', duration: '52 min',
      name: 'Heavy Squat Day', tags: ['Legs','Lower'],
      volume: '9,420 kg', sets: 22, rpe: 8.4, pr: true, likes: 12, liked: false, comments: 3,
      exercises: [
        { name: 'Back Squat', detail: '140 × 5', pr: true },
        { name: 'RDL', detail: '120 × 8', pr: false },
        { name: 'Leg Press', detail: '200 × 10', pr: false },
      ]
    },
    { user: 'sofia_k', hue: 330, when: '2h ago', duration: '46 min',
      name: 'Push Session', tags: ['Push','Chest','Triceps'],
      volume: '5,840 kg', sets: 19, rpe: 7.9, pr: false, likes: 8, liked: true, comments: 1,
      exercises: [
        { name: 'Bench Press', detail: '70 × 6', pr: false },
        { name: 'Overhead Press', detail: '42.5 × 8', pr: false },
        { name: 'Cable Fly', detail: '15 × 12', pr: false },
      ]
    },
    { user: 'jonas_berg', hue: 150, when: 'yesterday', duration: '61 min',
      name: 'Pull A', tags: ['Pull','Back','Biceps'],
      volume: '7,120 kg', sets: 21, rpe: 8.2, pr: true, likes: 24, liked: false, comments: 6,
      exercises: [
        { name: 'Deadlift', detail: '170 × 3', pr: true },
        { name: 'Pull-up', detail: '+15 × 6', pr: false },
        { name: 'Barbell Row', detail: '80 × 8', pr: false },
      ]
    },
  ];

  const suggestions = [
    { name: 'emma_w', hue: 280, mutuals: 4, streak: 8 },
    { name: 'tobias', hue: 40, mutuals: 2, streak: 12 },
    { name: 'linnea.f', hue: 180, mutuals: 6, streak: 5 },
    { name: 'david_ol', hue: 10, mutuals: 1, streak: 3 },
  ];

  const leaderboard = [
    { name: 'jonas_berg', hue: 150, volume: '74.2 t' },
    { name: 'markus', hue: 200, volume: '68.0 t' },
    { name: 'Nora (you)', hue: 20, volume: '62.4 t', me: true },
    { name: 'sofia_k', hue: 330, volume: '58.1 t' },
    { name: 'emma_w', hue: 280, volume: '51.9 t' },
  ];

  return (
    <div className="screen">
      <div style={{ height: 54 }}/>

      {/* Header */}
      <div style={{ padding: '6px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="display-l">Social</div>
          <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 2, fontWeight: 500 }}>
            18 friends training this week
          </div>
        </div>
        <button style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'var(--bg-2)', border: '1px solid var(--border-1)',
          color: 'var(--fg-0)', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          <Icon.Search size={18}/>
        </button>
      </div>

      {/* Segmented control */}
      <div style={{ padding: '4px 20px 12px' }}>
        <div style={{
          display: 'flex', background: 'var(--bg-2)',
          border: '1px solid var(--border-1)', borderRadius: 999, padding: 3,
        }}>
          {[
            { id: 'feed', label: 'Feed' },
            { id: 'discover', label: 'Discover' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 999,
                background: tab === t.id ? 'var(--bg-4)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: tab === t.id ? 'var(--fg-0)' : 'var(--fg-2)',
                fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em',
                transition: 'background 160ms var(--ease-out)',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px' }}>
        {tab === 'feed' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {feed.map((p, i) => <FeedCard key={i} post={p}/>)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Suggestions */}
            <div>
              <div className="caption" style={{ marginBottom: 10, padding: '0 2px' }}>People you may know</div>
              <div style={{
                display: 'flex', gap: 10, overflowX: 'auto',
                margin: '0 -20px', padding: '0 20px',
              }}>
                {suggestions.map((s, i) => <SuggestionRow key={i} s={s}/>)}
              </div>
            </div>

            {/* Leaderboard */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 2px 8px' }}>
                <div className="caption">Weekly leaderboard</div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 500 }}>by volume</div>
              </div>
              <div className="card" style={{ padding: 6 }}>
                {leaderboard.map((r, i) => (
                  <LeaderRow key={i} r={r} rank={i + 1} me={r.me}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <CoachFAB onClick={onOpenCoach}/>
      <TabBar active="social"/>
    </div>
  );
}

Object.assign(window, { Social });
