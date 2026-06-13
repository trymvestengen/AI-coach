export const GOAL_OPTIONS = [
  { value: "build_muscle", label: "Bygg muskler" },
  { value: "lose_weight", label: "Gå ned i vekt" },
  { value: "get_stronger", label: "Bli sterkere" },
  { value: "improve_endurance", label: "Bedre kondis" },
  { value: "maintain", label: "Holde formen" },
]

export const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Nybegynner", sub: "Under 1 år" },
  { value: "intermediate", label: "Middels", sub: "1-3 år" },
  { value: "advanced", label: "Erfaren", sub: "3+ år" },
]

export const FREQUENCY_OPTIONS = [
  { value: "2", label: "1-2", sub: "dager/uke" },
  { value: "4", label: "3-4", sub: "dager/uke" },
  { value: "6", label: "5-6", sub: "dager/uke" },
  { value: "7", label: "7", sub: "dager/uke" },
]

export const EQUIPMENT_OPTIONS = [
  { value: "gym", label: "Treningssenter" },
  { value: "home_basic", label: "Hjemmegym basic" },
  { value: "bodyweight", label: "Bare bodyweight" },
  { value: "other", label: "Annet" },
]

export const GENDER_OPTIONS = [
  { value: "male", label: "Mann" },
  { value: "female", label: "Kvinne" },
  { value: "other", label: "Vil ikke si" },
]

export const TOTAL_OBLIGATORY_STEPS = 8 // steps 4-11
export const TOTAL_OPTIONAL_STEPS = 2 // steps 12-13
export const TOTAL_PROGRESS_STEPS = TOTAL_OBLIGATORY_STEPS + TOTAL_OPTIONAL_STEPS // 10
