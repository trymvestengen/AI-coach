// app.jsx — composes everything onto a design canvas.
// Three iPhone frames (Home, Workout Log, Voice Session) + Tweaks.

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#FF6B35",
  "orbIntensity": 1,
  "persona": "friend"
}/*EDITMODE-END*/;

function InteractivePhone({ tweaks, setTweaks }) {
  // The middle "hero" artboard — fully interactive: Home → Voice → back.
  const [screen, setScreen] = React.useState('home'); // home | voice | workout
  const openCoach = () => setScreen('voice');
  const openWorkout = () => setScreen('workout');
  const close = () => setScreen('home');

  let child;
  if (screen === 'voice') {
    child = <VoiceSession
      onClose={close}
      persona={tweaks.persona}
      setPersona={(p) => setTweaks({ persona: p })}
      orbIntensity={tweaks.orbIntensity}
      accentColor={tweaks.accent}/>;
  } else if (screen === 'workout') {
    child = <WorkoutLog onBack={close} onOpenCoach={openCoach}/>;
  } else {
    child = <Home onOpenCoach={openCoach} onOpenWorkout={openWorkout}/>;
  }

  return (
    <IOSDevice width={390} height={844} dark={true} title="" showStatusBar={true}>
      {child}
    </IOSDevice>
  );
}

function App() {
  const [tweaks, setTweaks] = useTweaks(DEFAULT_TWEAKS);

  // Apply accent globally via CSS variable
  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accent);
    // derive soft + glow
    const hex = tweaks.accent.replace('#','');
    const r = parseInt(hex.slice(0,2), 16);
    const g = parseInt(hex.slice(2,4), 16);
    const b = parseInt(hex.slice(4,6), 16);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${r},${g},${b},0.14)`);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.55)`);
  }, [tweaks.accent]);

  return (
    <>
      <DesignCanvas>
        <DCSection id="hero" title="AI Coach" subtitle="Voice-first strength app · dark · deep orange accent">
          <DCArtboard id="home" label="Home · Today" width={390} height={844}>
            <IOSDevice width={390} height={844} dark={true} showStatusBar={true}>
              <Home onOpenCoach={() => {}} onOpenWorkout={() => {}}/>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="voice" label="Voice Session · Hero" width={390} height={844}>
            <IOSDevice width={390} height={844} dark={true} showStatusBar={true}>
              <VoiceSession
                onClose={() => {}}
                persona={tweaks.persona}
                setPersona={(p) => setTweaks({ persona: p })}
                orbIntensity={tweaks.orbIntensity}
                accentColor={tweaks.accent}/>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="log" label="Workout Log" width={390} height={844}>
            <IOSDevice width={390} height={844} dark={true} showStatusBar={true}>
              <WorkoutLog onBack={() => {}} onOpenCoach={() => {}}/>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="social" label="Social · Feed" width={390} height={844}>
            <IOSDevice width={390} height={844} dark={true} showStatusBar={true}>
              <Social onOpenCoach={() => {}}/>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="exerciseDetail" label="Exercise · Detail" width={390} height={844}>
            <IOSDevice width={390} height={844} dark={true} showStatusBar={true}>
              <ExerciseDetail onBack={() => {}} onLog={() => {}}/>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="logWorkout" label="Active Workout · Log" width={390} height={844}>
            <IOSDevice width={390} height={844} dark={true} showStatusBar={true}>
              <LogWorkout onBack={() => {}} onOpenExercise={() => {}} onFinish={() => {}}/>
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="flow" title="Interactive" subtitle="Click the coach button on Home — the full loop runs here">
          <DCArtboard id="live" label="Live prototype · Home → Voice → Log" width={390} height={844}>
            <InteractivePhone tweaks={tweaks} setTweaks={setTweaks}/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel>
        <TweakSection title="Accent color">
          <TweakRadio
            value={tweaks.accent}
            onChange={(v) => setTweaks({ accent: v })}
            options={[
              { value: '#FF6B35', label: 'Deep orange (default)' },
              { value: '#FFB347', label: 'Warm amber' },
              { value: '#E6327A', label: 'Magenta' },
              { value: '#C6F432', label: 'Electric lime' },
              { value: '#7C5CFF', label: 'Iris violet' },
            ]}/>
        </TweakSection>

        <TweakSection title="Orb intensity" subtitle="How much the blob morphs">
          <TweakSlider
            value={tweaks.orbIntensity}
            onChange={(v) => setTweaks({ orbIntensity: v })}
            min={0.3} max={2} step={0.1}/>
        </TweakSection>

        <TweakSection title="Coach persona">
          <TweakRadio
            value={tweaks.persona}
            onChange={(v) => setTweaks({ persona: v })}
            options={[
              { value: 'friend',   label: 'Friend · warm, explains why' },
              { value: 'sergeant', label: 'Sergeant · short, high energy' },
              { value: 'analyst',  label: 'Analyst · data-first' },
            ]}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
