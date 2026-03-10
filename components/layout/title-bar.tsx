export function TitleBar() {
  return (
    <div className="flex h-10 items-center justify-between border-b border-[var(--line-strong)] bg-[var(--titlebar-surface)] px-3">
      <div className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-full bg-[#ff5f57]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[#ffbd2e]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--titlebar-ink)]">
        <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--brand)] text-[10px] font-semibold text-white">
          S
        </span>
        CEOClaw — PM Dashboard
      </div>
      <div className="w-12" />
    </div>
  );
}
