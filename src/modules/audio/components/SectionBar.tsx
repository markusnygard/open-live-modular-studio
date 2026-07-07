// ── Section bar ───────────────────────────────────────────────────────────────
// Vertical label bar used in the MAIN tab for collapsible sections.
// Click to collapse/expand. Arrow indicator shows state.
export function SectionBar({ label, collapsed, onToggle, color = '#f97316' }: {
  label: string
  collapsed: boolean
  onToggle: () => void
  color?: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-start shrink-0 border-r border-zinc-800 cursor-pointer select-none"
      style={{ width: 16, background: collapsed ? 'transparent' : `${color}14`, minHeight: 40 }}
      onClick={onToggle}
      title={collapsed ? `Expand ${label}` : `Collapse ${label}`}
    >
      <span style={{ fontSize: 8, color, marginTop: 4, lineHeight: 1 }}>{collapsed ? '▶' : '▼'}</span>
      <span
        className="text-[8px] font-bold tracking-widest uppercase whitespace-nowrap"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color, marginTop: 3 }}
      >
        {label}
      </span>
    </div>
  )
}
