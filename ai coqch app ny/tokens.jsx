// tokens.jsx — design tokens for AI Coach
// Dark-hero palette with deep orange accent. Light mode mirror below.
// Type scale: Geist Sans (UI) + Geist Mono (numbers, transcripts).

const AC_TOKENS = {
  dark: {
    // Surfaces — near-black with a warm undertone (oklch), lifts subtly per layer
    bg:        '#0C0B0A',       // app background
    surface1:  '#141311',       // card
    surface2:  '#1C1A17',       // raised card
    surface3:  '#252220',       // input / hover
    glass:     'rgba(28,26,23,0.55)',
    border:    'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.12)',
    // Text
    text:      '#F4F1EC',
    textSec:   'rgba(244,241,236,0.60)',
    textTer:   'rgba(244,241,236,0.36)',
    // Accent — deep orange, a little burnt, not neon
    accent:    '#FF6A3D',
    accentSoft:'rgba(255,106,61,0.18)',
    accentGlow:'rgba(255,106,61,0.45)',
    // Status
    good:      '#7FD4A0',
    warn:      '#F0B848',
    bad:       '#F07A6B',
  },
  light: {
    bg:        '#F7F5F1',
    surface1:  '#FFFFFF',
    surface2:  '#FBFAF7',
    surface3:  '#F0EDE7',
    glass:     'rgba(255,255,255,0.65)',
    border:    'rgba(20,15,10,0.08)',
    borderStrong: 'rgba(20,15,10,0.16)',
    text:      '#1A1814',
    textSec:   'rgba(26,24,20,0.62)',
    textTer:   'rgba(26,24,20,0.38)',
    accent:    '#E5562B',
    accentSoft:'rgba(229,86,43,0.10)',
    accentGlow:'rgba(229,86,43,0.28)',
    good:      '#3E9A66',
    warn:      '#B88220',
    bad:       '#C0503E',
  },
};

// Coach roster — one friendly personality, voice matches user gender preference
const AC_COACHES = {
  f: { name: 'Nora', label: 'Warm female voice' },
  m: { name: 'Theo', label: 'Warm male voice' },
  x: { name: 'Kai',  label: 'Warm neutral voice' },
};

// Type ramp (px)
const AC_TYPE = {
  h1:      { size: 34, weight: 620, tracking: -0.6, line: 40 },
  h2:      { size: 24, weight: 600, tracking: -0.4, line: 30 },
  h3:      { size: 19, weight: 600, tracking: -0.2, line: 24 },
  body:    { size: 15, weight: 440, tracking: -0.1, line: 22 },
  bodyMd:  { size: 15, weight: 540, tracking: -0.1, line: 22 },
  cap:     { size: 12, weight: 500, tracking:  0.2, line: 16 },
  over:    { size: 10, weight: 600, tracking:  1.2, line: 12 }, // UPPERCASE OVERLINES
  metric:  { size: 34, weight: 540, tracking: -1.0, line: 36 }, // tabular
  metricLg:{ size: 52, weight: 540, tracking: -1.6, line: 54 },
  metricSm:{ size: 22, weight: 540, tracking: -0.6, line: 24 },
};

const AC_RADIUS = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };
const AC_SPACE  = [0, 4, 8, 12, 16, 20, 24, 32, 40, 56];

// Font stacks
const AC_FONT_STACKS = {
  geist:   { ui: "'Geist', ui-sans-serif, system-ui, sans-serif", mono: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace" },
  inter:   { ui: "'Inter', ui-sans-serif, system-ui, sans-serif", mono: "'JetBrains Mono', ui-monospace, Menlo, monospace" },
  general: { ui: "'General Sans', ui-sans-serif, system-ui, sans-serif", mono: "'IBM Plex Mono', ui-monospace, Menlo, monospace" },
};

// Apply accent onto a theme (persona hue rotation removed — single brand accent)
function acResolveTheme(mode) {
  return { ...AC_TOKENS[mode] };
}

// Copy in EN/NO — tiny sample to demonstrate bilingual UI
const AC_COPY = {
  en: {
    today: 'Today',
    startSession: 'Start voice session',
    plannedWorkout: "Today's workout",
    lastWorkout: 'Last workout',
    streak: 'Streak',
    volume: 'Weekly volume',
    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Coach is speaking',
    idle: 'Tap to talk',
    mute: 'Mute',
    end: 'End',
    persona: 'Persona',
    greeting: 'Morning, Mia.',
    subgreeting: "You've got Upper A on deck — want to warm up together?",
    program: 'Program',
    log: 'Log',
    settings: 'Settings',
  },
  no: {
    today: 'I dag',
    startSession: 'Start økt med stemme',
    plannedWorkout: 'Dagens økt',
    lastWorkout: 'Siste økt',
    streak: 'Rekke',
    volume: 'Ukesvolum',
    listening: 'Lytter',
    thinking: 'Tenker',
    speaking: 'Coachen snakker',
    idle: 'Trykk for å snakke',
    mute: 'Demp',
    end: 'Avslutt',
    persona: 'Persona',
    greeting: 'God morgen, Mia.',
    subgreeting: 'Du har Overkropp A i dag — skal vi varme opp sammen?',
    program: 'Program',
    log: 'Logg',
    settings: 'Innstillinger',
  },
};

Object.assign(window, { AC_TOKENS, AC_COACHES, AC_TYPE, AC_RADIUS, AC_SPACE, AC_FONT_STACKS, AC_COPY, acResolveTheme });
