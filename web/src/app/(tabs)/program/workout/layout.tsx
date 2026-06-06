export default function WorkoutLayout({ children }: { children: React.ReactNode }) {
  // Fullscreen — no BottomNav. The (tabs) layout adds BottomNav for its children,
  // but this nested layout overrides only the content area; we still want the
  // workout to take the entire screen. Render a flex column that fills available
  // height and contains nothing but the workout.
  return <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>{children}</div>
}
