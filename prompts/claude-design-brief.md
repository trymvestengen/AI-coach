# Claude Design — Initial Brief for AI Coach

Paste this as your first message to Claude Design.

---

## PROMPT (copy from here)

I'm designing a voice-first AI fitness coach app called **AI Coach**. I need a complete visual prototype of the core screens. Here's the context:

**What the app is**
A mobile-first fitness app where users talk to an AI coach with their voice (hands-free during workouts). The coach builds personalized training programs, logs workouts, and coaches live during sessions. Works in both English and Norwegian. Think Future or Whoop meets ChatGPT voice mode — but specifically for strength and conditioning.

**Target users**
Three personas: total beginners, intermediate gym-goers, and advanced lifters. The UI has to feel approachable for beginners without looking dumbed-down for experienced users.

**Brand personality**
"Smart friend who happens to be a personal trainer." Warm, a little playful, data-literate, never preachy. Premium but not clinical. Closer to Linear or Arc than to MyFitnessPal. Confident typography, generous whitespace, a single bold accent color, no stock fitness imagery (no sweaty six-packs, please).

**Visual direction**
- Dark mode as default, with a matching light mode
- Soft, slightly glassy surfaces (subtle blur, low-contrast borders)
- One strong accent color that pulses during voice interaction — suggest an energetic but not neon hue (deep orange, electric lime, or magenta — pick one and stick with it)
- Rounded corners (12-20px), generous padding
- Typography: a modern geometric sans for UI (Inter, Geist, or similar), tabular numbers for all metrics
- Motion: smooth, confident, never bouncy. Think Things 3 or Arc.

**Core screens to design (in this order)**

1. **Voice Session** — THE hero screen. A big animated orb in the center that pulses with the conversation (idle → listening → thinking → speaking). Live transcription below the orb. Minimal controls: mute, end session, switch persona mode. This is the screen people will screenshot. Make it beautiful.

2. **Home / Today** — what the user sees when they open the app. Today's planned workout, a "Start voice session" CTA, quick stats (last workout, streak, weekly volume). Should feel like opening a coach's text message — warm, personal, not a dashboard.

3. **Workout Log** — list of past workouts. Each workout is a card with date, duration, exercises, volume/tonnage, RPE. Expandable to see sets and reps. Clean, scannable, with little trend sparklines where relevant.

4. **Program View** — the user's active training program. Week-by-week schedule with today highlighted. Each day shows planned exercises. Tap a day to see details. Should feel like a beautifully structured syllabus, not a spreadsheet.

5. **Onboarding flow (3-4 screens)** — welcome, set goal (build muscle / lose weight / get stronger / just move more), choose equipment (full gym / home / bodyweight), choose coach persona (Friend / Sergeant / Analyst) with a short audio sample for each. Keep it fast — no more than 4 taps to first voice session.

6. **Settings** — language toggle (English/Norwegian), persona switcher with descriptions, account, subscription, privacy.

**Key UI components to define as a system**
- Voice orb (multiple states)
- Workout card
- Exercise row (sets, reps, weight, RPE indicator)
- Primary button with voice-active glow state
- Metric tile (big number + small label + tiny delta)
- Persona chip (three variants: Friend, Sergeant, Analyst)

**Constraints**
- Mobile-first (iPhone 15 Pro viewport). Also show how the Home and Voice Session scale to a responsive web view.
- Must be accessible: text contrast, tap targets min 44x44, clear focus states.
- Voice Session screen has to look stunning even when you're sweaty, looking at your phone on a gym floor.
- No clutter — if a screen has more than 5 tappable regions, rethink it.

**Deliverables I want from you**
1. A complete color palette (dark + light) with hex codes
2. Typography scale (headings, body, caption, metric numbers)
3. All screens above as an interactive prototype I can click through
4. The design system components on a separate "components" page so my dev team can reference them
5. Export-ready specs so I can hand off to Claude Code (dev tool) to build the actual Next.js app

Start by proposing a color palette and the Voice Session screen. Once I approve those, build out the rest.

---

## Tips for working with Claude Design after

Once it replies, a few things to try:

- Ask for **variations**: "Show me 3 versions of the Voice Session screen with different orb styles."
- Ask for **dark + light side-by-side** so you can compare.
- When something is off: be specific. "The accent color is too neon — try a deeper, more sophisticated orange."
- When you like something: lock it in. "Keep this palette and typography for all future screens."
- Export to Canva if you want to collaborate with your co-founder, or export as URL to share.
- When you're ready to hand off to Claude Code: ask Claude Design for a "developer handoff" page with tokens (colors, spacing, typography) in both Figma-style and CSS variable format.
