import { Bot, Pause, Play, Sparkles, X } from 'lucide-react';

/**
 * Mode 3 Copilot chrome — allow agent, pause/takeover, live status.
 */
export default function CopilotBar({
  enabled,
  paused,
  token,
  generation,
  status,
  onEnable,
  onDisable,
  onPause,
  onResume,
  onDemo,
}) {
  const label = status?.label || (enabled ? (paused ? 'Paused — you have control' : 'Listening for agent…') : null);
  const busy = status?.phase === 'select' || status?.phase === 'apply';

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-glint-border bg-glint-surface/95 backdrop-blur-md shadow-lg px-2.5 py-1.5 max-w-[min(560px,92vw)]">
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
          enabled
            ? paused
              ? 'bg-glint-surface-2 text-glint-text-secondary'
              : 'bg-glint-accent-muted text-glint-accent'
            : 'bg-glint-surface-2 text-glint-text-tertiary'
        }`}
        title="Copilot mode"
      >
        <Bot size={15} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-glint-text-tertiary">
            Copilot
          </span>
          {enabled ? (
            <span className="text-[10px] tabular-nums text-glint-text-tertiary">gen {generation}</span>
          ) : null}
        </div>
        <p className="text-[11px] text-glint-text truncate">
          {!enabled
            ? 'Manual mode — allow an agent to share this board'
            : busy
              ? label
              : label}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!enabled ? (
          <button
            type="button"
            onClick={onEnable}
            className="inline-flex items-center gap-1 rounded-lg bg-glint-accent text-glint-text-on-accent px-2.5 py-1 text-[11px] font-medium hover:bg-glint-accent-hover"
          >
            <Sparkles size={12} />
            Allow agent
          </button>
        ) : (
          <>
            {paused ? (
              <button
                type="button"
                onClick={onResume}
                className="inline-flex items-center gap-1 rounded-lg border border-glint-border px-2 py-1 text-[11px] text-glint-text-secondary hover:bg-glint-surface-2 hover:text-glint-text"
                title="Resume agent"
              >
                <Play size={12} />
                Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="inline-flex items-center gap-1 rounded-lg border border-glint-border px-2 py-1 text-[11px] text-glint-text-secondary hover:bg-glint-surface-2 hover:text-glint-text"
                title="Pause — take over"
              >
                <Pause size={12} />
                Pause
              </button>
            )}
            <button
              type="button"
              onClick={onDemo}
              className="rounded-lg border border-glint-border px-2 py-1 text-[11px] text-glint-text-secondary hover:bg-glint-surface-2 hover:text-glint-text"
              title="Run a short presented demo on the active frame"
            >
              Demo
            </button>
            <button
              type="button"
              onClick={onDisable}
              className="p-1 rounded-lg text-glint-text-tertiary hover:bg-glint-surface-2 hover:text-glint-text"
              title="Disable Copilot"
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>

      {enabled && token ? (
        <span
          className="hidden sm:inline text-[9px] font-mono text-glint-text-tertiary truncate max-w-[72px]"
          title={`Pair token: ${token}`}
        >
          {token.slice(0, 8)}
        </span>
      ) : null}
    </div>
  );
}
