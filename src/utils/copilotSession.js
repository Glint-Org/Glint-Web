/**
 * Copilot session - generation lock, pause/takeover, telepresence events.
 * Agents dispatch ops through here; Manual edits bump generation via bump().
 */
import { CANVAS_AGENT_OPS, runCanvasOp } from './canvasAgent.js';

const CHANNEL = 'glint-copilot';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function newToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `copilot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {{ getCtx: () => object, onDirty?: () => void }} opts
 */
export function createCopilotSession({ getCtx, onDirty } = {}) {
  let enabled = false;
  let paused = true;
  let token = null;
  let generation = 0;
  let applying = false;
  let status = null;
  const listeners = new Set();

  const emit = (event) => {
    status = event;
    for (const fn of listeners) {
      try {
        fn(event);
      } catch {
        /* ignore listener errors */
      }
    }
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(CHANNEL);
        bc.postMessage({ type: 'glint-copilot-event', ...event });
        bc.close();
      }
    } catch {
      /* SSR / restricted */
    }
  };

  const api = {
    get enabled() {
      return enabled;
    },
    get paused() {
      return paused;
    },
    get token() {
      return token;
    },
    get generation() {
      return generation;
    },
    get applying() {
      return applying;
    },
    get status() {
      return status;
    },
    get ops() {
      return [...CANVAS_AGENT_OPS];
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** Human (or successful agent) mutate - agents must re-getEditorState. */
    bump(reason = 'edit') {
      generation += 1;
      emit({ phase: 'generation', generation, reason, at: Date.now() });
      return generation;
    },

    enable() {
      enabled = true;
      paused = false;
      token = newToken();
      emit({ phase: 'session', enabled: true, paused: false, token, generation, at: Date.now() });
      return { token, generation };
    },

    disable() {
      enabled = false;
      paused = true;
      token = null;
      emit({ phase: 'session', enabled: false, paused: true, token: null, generation, at: Date.now() });
    },

    pause() {
      paused = true;
      emit({ phase: 'session', enabled, paused: true, token, generation, at: Date.now() });
    },

    resume() {
      if (!enabled) return false;
      paused = false;
      emit({ phase: 'session', enabled: true, paused: false, token, generation, at: Date.now() });
      return true;
    },

    getState() {
      return {
        ok: true,
        generation,
        enabled,
        paused,
        token: enabled ? token : null,
        ops: [...CANVAS_AGENT_OPS],
      };
    },

    async getEditorState() {
      const ctx = getCtx?.();
      if (!ctx) return { ok: false, error: 'no_ctx', generation };
      const res = await runCanvasOp(ctx, 'getEditorState', {});
      return { ...res, generation, enabled, paused };
    },

    /**
     * @param {string} op
     * @param {object} args
     * @param {{ present?: boolean, paceMs?: number, expectedGeneration?: number, token?: string }} opts
     */
    async dispatch(op, args = {}, opts = {}) {
      const {
        present = true,
        paceMs = 380,
        expectedGeneration = null,
        token: callerToken = null,
      } = opts;

      if (!enabled) return { ok: false, error: 'session_disabled' };
      if (paused) return { ok: false, error: 'paused' };
      if (callerToken && callerToken !== token) return { ok: false, error: 'bad_token' };
      if (expectedGeneration != null && expectedGeneration !== generation) {
        return {
          ok: false,
          error: 'stale_generation',
          generation,
          expectedGeneration,
        };
      }

      const ctx = getCtx?.();
      if (!ctx) return { ok: false, error: 'no_ctx' };

      const label = describeOp(op, args);
      applying = true;
      emit({
        phase: 'select',
        op,
        args,
        label,
        frameIndex: args.frameIndex ?? args.index ?? args.sourceIndex,
        present,
        generation,
        at: Date.now(),
      });

      if (present && paceMs > 0) await sleep(paceMs);

      if (paused) {
        applying = false;
        emit({ phase: 'aborted', op, reason: 'paused', at: Date.now() });
        return { ok: false, error: 'paused' };
      }

      emit({
        phase: 'apply',
        op,
        args,
        label,
        frameIndex: args.frameIndex ?? args.index ?? args.sourceIndex,
        present,
        generation,
        at: Date.now(),
      });

      let result;
      try {
        result = await runCanvasOp(ctx, op, args);
      } catch (err) {
        applying = false;
        emit({ phase: 'error', op, error: String(err?.message || err), at: Date.now() });
        return { ok: false, error: 'op_threw', detail: String(err?.message || err) };
      }

      if (result?.ok && op !== 'getEditorState' && op !== 'selectFrame' && op !== 'selectDevice') {
        generation += 1;
        onDirty?.();
      }

      applying = false;
      emit({
        phase: 'done',
        op,
        args,
        label,
        result,
        generation,
        at: Date.now(),
      });

      return { ...result, generation };
    },
  };

  return api;
}

function describeOp(op, args) {
  switch (op) {
    case 'selectFrame':
      return `Select Frame ${(args.frameIndex ?? args.index ?? 0) + 1}`;
    case 'selectDevice':
      return `Select device on Frame ${(args.frameIndex ?? args.index ?? 0) + 1}`;
    case 'setDeviceScale':
      return `Scale → ${args.pct ?? args.scalePct}%`;
    case 'setDeviceAngle':
      return `Rotation → ${args.degrees ?? args.angle}°`;
    case 'setScreenshot':
      return args.url ? 'Replace screenshot' : 'Clear screenshot';
    case 'matchDeviceTransform':
      return `Match transform from Frame ${(args.sourceIndex ?? 0) + 1}`;
    case 'getEditorState':
      return 'Read editor state';
    default:
      return op;
  }
}

/** Attach a stable bridge on window for local agents / future MCP. */
export function installCopilotBridge(session) {
  if (typeof window === 'undefined') return () => {};
  const bridge = {
    channel: CHANNEL,
    get enabled() {
      return session.enabled;
    },
    get generation() {
      return session.generation;
    },
    getToken: () => (session.enabled ? session.token : null),
    getEditorState: () => session.getEditorState(),
    dispatch: (op, args, opts) => session.dispatch(op, args, opts),
    ops: () => session.ops,
  };
  window.__GLINT_COPILOT__ = bridge;
  return () => {
    if (window.__GLINT_COPILOT__ === bridge) delete window.__GLINT_COPILOT__;
  };
}
