export type MuscleKey =
  | "chest" | "shoulders" | "triceps" | "biceps" | "forearms"
  | "upperBack" | "lats" | "lowerBack"
  | "abs" | "glutes" | "quads" | "hamstrings" | "calves"

export interface Exercise {
  id: string
  name: string
  equipment: string
  primary: string
  secondary: string[]
  highlight: MuscleKey[]
  view: "front" | "back"
  description: string
  tips: string[]
  pr: string
  lastUsed: string
  lastWeight: string
}

export const EXERCISES: Exercise[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    equipment: "Barbell",
    primary: "Chest",
    secondary: ["Shoulders", "Triceps"],
    highlight: ["chest", "shoulders", "triceps"],
    view: "front",
    description: "Compound pushing movement. Drive the bar off your chest using the full pec and front delt, locking out with the triceps. Keep shoulder blades pinched, feet planted.",
    tips: [
      "Bar path curves slightly back toward your face on the way up.",
      "Touch ~1–2 cm above the nipple line, not the sternum.",
      "Set up with a small arch — ribs up, butt on the bench, feet flat.",
    ],
    pr: "95 kg × 3", lastUsed: "2 days ago", lastWeight: "82.5 kg × 5",
  },
  {
    id: "incline-db-press",
    name: "Incline DB Press",
    equipment: "Dumbbell",
    primary: "Chest",
    secondary: ["Shoulders", "Triceps"],
    highlight: ["chest", "shoulders", "triceps"],
    view: "front",
    description: "Upper-chest focused pressing movement. The incline angle shifts load to the clavicular head of the pec. Keep elbows at ~60° to avoid shoulder impingement.",
    tips: [
      "Set bench to 30–45°. Higher angles shift load too much to shoulders.",
      "Pause briefly at the bottom to eliminate momentum.",
      "Retract and depress shoulder blades throughout the set.",
    ],
    pr: "32 kg × 8", lastUsed: "4 days ago", lastWeight: "28 kg × 10",
  },
  {
    id: "cable-fly",
    name: "Cable Fly",
    equipment: "Cable",
    primary: "Chest",
    secondary: [],
    highlight: ["chest"],
    view: "front",
    description: "Isolation movement that keeps constant tension on the pec throughout the full range of motion. Excellent for stretch-mediated hypertrophy.",
    tips: [
      "Slight bend in the elbows — don't let them straighten fully.",
      "Focus on squeezing the pecs at the midpoint, not just moving weight.",
      "Control the eccentric — resist the pull back to the start.",
    ],
    pr: "20 kg × 15", lastUsed: "4 days ago", lastWeight: "15 kg × 12",
  },
  {
    id: "overhead-press",
    name: "Overhead Press",
    equipment: "Barbell",
    primary: "Shoulders",
    secondary: ["Triceps", "Upper Back"],
    highlight: ["shoulders", "triceps"],
    view: "front",
    description: "Vertical pressing movement targeting the deltoids and triceps. A key indicator of upper-body pressing strength. Brace the core hard to protect the lower back.",
    tips: [
      "Tuck elbows slightly forward rather than flaring wide.",
      "Press slightly behind the head plane at the top.",
      "Push your head through at lockout — don't lean back.",
    ],
    pr: "72.5 kg × 3", lastUsed: "5 days ago", lastWeight: "65 kg × 5",
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    equipment: "Dumbbell",
    primary: "Shoulders",
    secondary: [],
    highlight: ["shoulders"],
    view: "front",
    description: "Isolation movement for the medial deltoid. Creates shoulder width. Best performed with moderate weight and strict form — avoid shrugging.",
    tips: [
      "Lead with the elbows, not the hands.",
      "Tilt the dumbbell slightly so the pinky side is higher (like pouring a jug).",
      "Stop at shoulder height — going higher recruits traps unnecessarily.",
    ],
    pr: "20 kg × 12", lastUsed: "5 days ago", lastWeight: "16 kg × 15",
  },
  {
    id: "face-pull",
    name: "Face Pull",
    equipment: "Cable",
    primary: "Shoulders",
    secondary: ["Upper Back"],
    highlight: ["shoulders", "upperBack"],
    view: "back",
    description: "Rear-delt and rotator-cuff focused pull. Excellent shoulder health exercise. Use a rope attachment and pull to face level with elbows high.",
    tips: [
      "Keep elbows high and flared out — above shoulder height.",
      "External-rotate at the end of the pull: 'show your biceps to the ceiling'.",
      "Light weight, high reps. This is a health movement, not a strength showcase.",
    ],
    pr: "30 kg × 20", lastUsed: "4 days ago", lastWeight: "22 kg × 15",
  },
  {
    id: "pull-up",
    name: "Pull Up",
    equipment: "Bodyweight",
    primary: "Lats",
    secondary: ["Biceps", "Upper Back"],
    highlight: ["lats", "biceps", "upperBack"],
    view: "back",
    description: "Vertical pulling compound movement. One of the best upper-body exercises. Full range of motion is key — dead hang at the bottom, chin over bar at top.",
    tips: [
      "Start from a dead hang with shoulders fully packed.",
      "Drive elbows down and back — think 'elbows to hips'.",
      "Control the descent over 2–3 seconds.",
    ],
    pr: "+20 kg × 5", lastUsed: "3 days ago", lastWeight: "+15 kg × 6",
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    equipment: "Cable",
    primary: "Lats",
    secondary: ["Biceps"],
    highlight: ["lats", "biceps"],
    view: "back",
    description: "Vertical pulling movement on a cable machine. Great for building lat width. Allows load variation not possible with pull-ups.",
    tips: [
      "Lean back slightly and pull to upper chest, not behind the neck.",
      "Initiate by depressing the shoulder blades before bending the elbows.",
      "Full stretch at the top — let arms reach overhead completely.",
    ],
    pr: "85 kg × 8", lastUsed: "3 days ago", lastWeight: "75 kg × 10",
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    equipment: "Barbell",
    primary: "Upper Back",
    secondary: ["Lats", "Biceps", "Lower Back"],
    highlight: ["upperBack", "lats", "biceps"],
    view: "back",
    description: "Horizontal pulling compound movement. Builds upper-back thickness and lat width. Hinge at the hips ~45° and row the bar to your lower abdomen.",
    tips: [
      "Pull to the belly button, not the chest — keeps the lats involved.",
      "Drive the elbows back and up, not straight back.",
      "Keep lower back flat — neutral spine throughout.",
    ],
    pr: "110 kg × 5", lastUsed: "3 days ago", lastWeight: "100 kg × 6",
  },
  {
    id: "chest-supported-row",
    name: "Chest-Supported Row",
    equipment: "Dumbbell",
    primary: "Upper Back",
    secondary: ["Lats", "Biceps"],
    highlight: ["upperBack", "lats"],
    view: "back",
    description: "Horizontal pull with chest supported on an incline bench. Eliminates lower-back involvement, letting you focus entirely on upper-back contraction.",
    tips: [
      "Pull elbows high and wide for upper traps; low and tight for lats.",
      "Pause and squeeze at the top for 1 second.",
      "Go heavier than you think — the support removes the stabilization tax.",
    ],
    pr: "36 kg × 10", lastUsed: "4 days ago", lastWeight: "30 kg × 10",
  },
  {
    id: "deadlift",
    name: "Deadlift",
    equipment: "Barbell",
    primary: "Lower Back",
    secondary: ["Glutes", "Hamstrings", "Upper Back"],
    highlight: ["lowerBack", "glutes", "hamstrings"],
    view: "back",
    description: "The king of posterior-chain movements. Builds total-body strength and mass. Brace hard, keep the bar close, and drive the floor away.",
    tips: [
      "Bar over mid-foot, about 2 cm from the shins before pulling.",
      "Take air before the pull — Valsalva brace throughout.",
      "Drive hips forward at lockout, don't hyperextend the lower back.",
    ],
    pr: "180 kg × 1", lastUsed: "6 days ago", lastWeight: "160 kg × 5",
  },
  {
    id: "back-squat",
    name: "Back Squat",
    equipment: "Barbell",
    primary: "Quads",
    secondary: ["Glutes", "Lower Back"],
    highlight: ["quads", "glutes"],
    view: "front",
    description: "Fundamental lower-body compound movement. High bar favors quad development; low bar favors posterior chain. Sit between the legs, not behind them.",
    tips: [
      "Knees track over the toes — never cave inward.",
      "Depth: aim for hip crease below the knee (parallel or below).",
      "Brace as if about to take a punch to the gut.",
    ],
    pr: "140 kg × 5", lastUsed: "5 days ago", lastWeight: "125 kg × 5",
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    equipment: "Barbell",
    primary: "Hamstrings",
    secondary: ["Glutes", "Lower Back"],
    highlight: ["hamstrings", "glutes", "lowerBack"],
    view: "back",
    description: "Hip hinge movement emphasizing the hamstrings eccentrically. Keep bar close to legs, hinge until hamstrings are fully stretched, then drive hips forward.",
    tips: [
      "The bar shouldn't leave your legs — drag it down your shins and thighs.",
      "Stop when you feel a strong hamstring stretch, not when the bar hits the floor.",
      "Soft bend in the knees — this is a hip hinge, not a squat.",
    ],
    pr: "130 kg × 6", lastUsed: "5 days ago", lastWeight: "115 kg × 8",
  },
  {
    id: "leg-press",
    name: "Leg Press",
    equipment: "Machine",
    primary: "Quads",
    secondary: ["Glutes"],
    highlight: ["quads", "glutes"],
    view: "front",
    description: "Machine-based lower-body push. Allows high volume without spinal loading. Foot position changes emphasis: high/wide = glutes, low/narrow = quads.",
    tips: [
      "Don't lock out the knees at the top — keep tension on the muscle.",
      "Control the descent — don't let the sled crash down.",
      "Maintain lower-back contact with the pad throughout.",
    ],
    pr: "280 kg × 10", lastUsed: "5 days ago", lastWeight: "240 kg × 12",
  },
  {
    id: "leg-curl",
    name: "Leg Curl",
    equipment: "Machine",
    primary: "Hamstrings",
    secondary: [],
    highlight: ["hamstrings"],
    view: "back",
    description: "Isolation movement for the hamstrings. Lying variant allows greater hip extension and a fuller stretch. Key supplemental exercise for hamstring hypertrophy.",
    tips: [
      "Pause and squeeze hard at full contraction.",
      "Control the eccentric over 3 seconds.",
      "Hips stay on the pad — don't lift the hips to cheat.",
    ],
    pr: "75 kg × 12", lastUsed: "5 days ago", lastWeight: "60 kg × 12",
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    equipment: "Barbell",
    primary: "Glutes",
    secondary: ["Hamstrings"],
    highlight: ["glutes", "hamstrings"],
    view: "back",
    description: "Glute-dominant hip extension movement. Bench supports the upper back. Drive hips up until body forms a straight line from knees to shoulders.",
    tips: [
      "Chin to chest at the top — don't look up.",
      "Feet placement: shins vertical when hips are fully extended.",
      "Brace the core — don't hyperextend the lower back at the top.",
    ],
    pr: "180 kg × 8", lastUsed: "5 days ago", lastWeight: "160 kg × 10",
  },
  {
    id: "calf-raise",
    name: "Calf Raise",
    equipment: "Machine",
    primary: "Calves",
    secondary: [],
    highlight: ["calves"],
    view: "back",
    description: "Isolation movement for the gastrocnemius and soleus. Full range of motion is critical — deep stretch at the bottom, full contraction at the top.",
    tips: [
      "Full range: let the heel drop well below the step level.",
      "Slow the eccentric — calves respond well to time under tension.",
      "Straight knee = more gastrocnemius; bent knee = more soleus.",
    ],
    pr: "120 kg × 15", lastUsed: "5 days ago", lastWeight: "100 kg × 15",
  },
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    equipment: "Barbell",
    primary: "Biceps",
    secondary: ["Forearms"],
    highlight: ["biceps", "forearms"],
    view: "front",
    description: "Classic bicep isolation. Supinated grip maximizes bicep involvement. Keep elbows stationary at the sides — don't swing the torso.",
    tips: [
      "Full extension at the bottom — don't cut the range short.",
      "Squeeze hard at the top and control the descent.",
      "Slightly narrower than shoulder-width grip to keep supination.",
    ],
    pr: "65 kg × 5", lastUsed: "3 days ago", lastWeight: "55 kg × 8",
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    equipment: "Dumbbell",
    primary: "Biceps",
    secondary: ["Forearms"],
    highlight: ["biceps", "forearms"],
    view: "front",
    description: "Neutral-grip curl that targets the brachialis and brachioradialis along with the bicep. Builds arm thickness. Can be done alternating or simultaneously.",
    tips: [
      "Neutral grip (thumbs up) throughout — no rotation.",
      "Elbows stay pinned to the sides.",
      "Great for lifters who feel elbow pain on supinated curls.",
    ],
    pr: "28 kg × 10", lastUsed: "3 days ago", lastWeight: "24 kg × 12",
  },
  {
    id: "tricep-pushdown",
    name: "Tricep Pushdown",
    equipment: "Cable",
    primary: "Triceps",
    secondary: [],
    highlight: ["triceps"],
    view: "back",
    description: "Cable isolation for the triceps. Use a rope or bar. Keep elbows pinned at your sides and fully extend at the bottom for maximum contraction.",
    tips: [
      "Elbows stay glued to your sides — don't let them flare.",
      "Flare the rope handles apart at the bottom for extra contraction.",
      "Slight forward lean to better isolate the lateral head.",
    ],
    pr: "55 kg × 12", lastUsed: "4 days ago", lastWeight: "45 kg × 15",
  },
  {
    id: "skullcrusher",
    name: "Skullcrusher",
    equipment: "Barbell",
    primary: "Triceps",
    secondary: [],
    highlight: ["triceps"],
    view: "back",
    description: "Lying tricep extension. One of the best mass builders for the long head of the tricep. Lower the bar to the forehead or slightly behind the head.",
    tips: [
      "Let the elbows drift slightly back during the lowering phase — stretches the long head.",
      "Keep upper arms perpendicular to the floor.",
      "Use an EZ bar to reduce wrist stress vs. straight bar.",
    ],
    pr: "65 kg × 8", lastUsed: "4 days ago", lastWeight: "55 kg × 10",
  },
  {
    id: "arnold-press",
    name: "Arnold Press",
    equipment: "Dumbbell",
    primary: "Shoulders",
    secondary: ["Triceps"],
    highlight: ["shoulders", "triceps"],
    view: "front",
    description: "Rotating dumbbell press created by Arnold Schwarzenegger. The rotation at the bottom engages the front delts through a longer range of motion.",
    tips: [
      "Start with palms facing you, rotate to facing forward as you press.",
      "Controlled rotation — not a sloppy swing.",
      "Great for front delt and overall shoulder hypertrophy.",
    ],
    pr: "28 kg × 10", lastUsed: "5 days ago", lastWeight: "24 kg × 10",
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    equipment: "Machine",
    primary: "Quads",
    secondary: [],
    highlight: ["quads"],
    view: "front",
    description: "Quad isolation machine. Targets the rectus femoris and vastus group. Excellent for finishing quad work or for those who can't squat heavy.",
    tips: [
      "Pause and squeeze hard at full extension.",
      "Seated position — adjust so knees align with the pivot.",
      "Slow the eccentric — quads benefit from time under tension.",
    ],
    pr: "100 kg × 12", lastUsed: "5 days ago", lastWeight: "80 kg × 15",
  },
  {
    id: "plank",
    name: "Plank",
    equipment: "Bodyweight",
    primary: "Abs",
    secondary: ["Lower Back"],
    highlight: ["abs", "lowerBack"],
    view: "front",
    description: "Isometric core stability exercise. Builds anti-extension strength and overall core endurance. Keep a straight line from head to heels.",
    tips: [
      "Squeeze glutes and abs hard — don't let hips sag or pike.",
      "Breathe normally — don't hold your breath.",
      "Progress by adding weight on the back or elevating feet.",
    ],
    pr: "3 min 20 sek", lastUsed: "2 days ago", lastWeight: "2 min 00 sek",
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    equipment: "Dumbbell",
    primary: "Quads",
    secondary: ["Glutes", "Abs"],
    highlight: ["quads", "glutes"],
    view: "front",
    description: "Front-loaded squat holding a dumbbell at the chest. Great for quad emphasis and as a teaching tool for squat mechanics. Keeps the torso upright.",
    tips: [
      "Hold the dumbbell vertically at chest height with both hands.",
      "Elbows track inside the knees at the bottom.",
      "Go deep — goblet squat naturally promotes good depth.",
    ],
    pr: "60 kg × 10", lastUsed: "7 days ago", lastWeight: "48 kg × 12",
  },
]

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id)
}

export const MUSCLE_GROUPS = [
  "Alle",
  "Bryst",
  "Rygg",
  "Skuldre",
  "Biceps",
  "Triceps",
  "Bein",
  "Glutes",
  "Mage",
] as const

export type MuscleGroup = typeof MUSCLE_GROUPS[number]

const MUSCLE_GROUP_MAP: Record<MuscleGroup, string[]> = {
  "Alle": [],
  "Bryst": ["Chest"],
  "Rygg": ["Upper Back", "Lats", "Lower Back"],
  "Skuldre": ["Shoulders"],
  "Biceps": ["Biceps"],
  "Triceps": ["Triceps"],
  "Bein": ["Quads", "Hamstrings", "Calves"],
  "Glutes": ["Glutes"],
  "Mage": ["Abs"],
}

export function filterExercises(group: MuscleGroup, query: string): Exercise[] {
  const q = query.toLowerCase().trim()
  return EXERCISES.filter(e => {
    const matchesGroup = group === "Alle" || MUSCLE_GROUP_MAP[group].includes(e.primary)
    const matchesQuery = q === "" || e.name.toLowerCase().includes(q) || e.primary.toLowerCase().includes(q)
    return matchesGroup && matchesQuery
  })
}
