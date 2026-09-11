import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createCopilotSession, installCopilotBridge } from '../utils/copilotSession.js';

/**
 * Bind a Copilot session to the live Editor canvas map.
 */
export function useCopilotSession({
  getFrames,
  getCanvas,
  getActiveIndex,
  setActiveIndex,
  getDeviceFrame,
  getWhiteScreenshot,
  updateFrame,
  onDirty,
}) {
  const [ui, setUi] = useState({
    enabled: false,
    paused: true,
    token: null,
    generation: 0,
    status: null,
  });

  const ctxRef = useRef({});
  ctxRef.current = {
    getFrames,
    getCanvas,
    getActiveIndex,
    setActiveIndex,
    getDeviceFrame,
    getWhiteScreenshot,
    updateFrame,
  };

  const session = useMemo(
    () =>
      createCopilotSession({
        getCtx: () => ctxRef.current,
        onDirty,
      }),
    [onDirty],
  );

  useEffect(() => {
    const unsub = session.subscribe((event) => {
      setUi({
        enabled: session.enabled,
        paused: session.paused,
        token: session.token,
        generation: session.generation,
        status: event,
      });
    });
    const uninstall = installCopilotBridge(session);
    return () => {
      unsub();
      uninstall();
      session.disable();
    };
  }, [session]);

  const enable = useCallback(() => session.enable(), [session]);
  const disable = useCallback(() => session.disable(), [session]);
  const pause = useCallback(() => session.pause(), [session]);
  const resume = useCallback(() => session.resume(), [session]);
  const bump = useCallback((reason) => session.bump(reason), [session]);
  const dispatch = useCallback(
    (op, args, opts) => session.dispatch(op, args, opts),
    [session],
  );
  const getEditorState = useCallback(() => session.getEditorState(), [session]);

  /** Demo / smoke: run a short presented sequence on the active frame. */
  const runDemo = useCallback(async () => {
    if (!session.enabled) session.enable();
    if (session.paused) session.resume();
    const state = await session.getEditorState();
    const idx = state.state?.activeIndex >= 0 ? state.state.activeIndex : 0;
    const gen0 = state.generation;
    await session.dispatch('selectFrame', { frameIndex: idx }, { present: true, expectedGeneration: gen0 });
    const g1 = session.generation;
    await session.dispatch('selectDevice', { frameIndex: idx }, { present: true, expectedGeneration: g1 });
    const device = state.state?.frames?.[idx]?.device;
    const nextAngle = Math.max(-30, Math.min(30, (device?.angle || 0) - 8));
    const g2 = session.generation;
    await session.dispatch(
      'setDeviceAngle',
      { frameIndex: idx, degrees: nextAngle },
      { present: true, expectedGeneration: g2 },
    );
  }, [session]);

  return {
    ...ui,
    enable,
    disable,
    pause,
    resume,
    bump,
    dispatch,
    getEditorState,
    runDemo,
    session,
  };
}
