import { useCallback, useState } from 'react';
import { getTemplateSlides } from '../utils/templateEngine';
import { bindSlideToFrameShot } from '../utils/templateDevices';
import { getPlaceholderScreenshots } from '../utils/placeholderScreenshots';

export const MIN_FRAMES = 1;
export const MAX_FRAMES = 10;
export const DEFAULT_FRAME_COUNT = 5;

let _id = 0;
export function newFrameId() {
  _id += 1;
  return `frame-${Date.now()}-${_id}`;
}

export function createEmptyFrame(screenshotUrl = null) {
  return {
    id: newFrameId(),
    design: null,
    screenshotUrl,
  };
}

/** Build frames from a template pack + optional user screenshots. */
export function framesFromTemplate(template, userScreenshots = []) {
  const slides = getTemplateSlides(template);
  const count = Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, slides.length || DEFAULT_FRAME_COUNT));
  const placeholders = getPlaceholderScreenshots(count);
  const frames = [];
  for (let i = 0; i < count; i++) {
    frames.push({
      id: newFrameId(),
      design: bindSlideToFrameShot(slides[i]) || null,
      screenshotUrl: userScreenshots[i] || placeholders[i] || null,
    });
  }
  return frames;
}

/** Build frames from screenshots only (no design). */
export function framesFromScreenshots(urls = []) {
  const count = Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, urls.length || DEFAULT_FRAME_COUNT));
  const placeholders = getPlaceholderScreenshots(count);
  const frames = [];
  for (let i = 0; i < count; i++) {
    frames.push(createEmptyFrame(urls[i] || placeholders[i] || null));
  }
  return frames;
}

export function useFrames(initialFrames) {
  const [frames, setFrames] = useState(
    () => (initialFrames?.length ? initialFrames : framesFromScreenshots([])),
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const activeFrame = frames[activeIndex] || frames[0] || null;

  const addFrame = useCallback((afterIndex) => {
    setFrames((prev) => {
      if (prev.length >= MAX_FRAMES) return prev;
      const idx = afterIndex == null ? prev.length - 1 : afterIndex;
      const placeholders = getPlaceholderScreenshots(1);
      const next = [...prev];
      next.splice(idx + 1, 0, createEmptyFrame(placeholders[0]));
      return next;
    });
    setActiveIndex((i) => {
      const at = afterIndex == null ? frames.length - 1 : afterIndex;
      return Math.min(at + 1, MAX_FRAMES - 1);
    });
  }, [frames.length]);

  const duplicateFrame = useCallback((index) => {
    setFrames((prev) => {
      if (prev.length >= MAX_FRAMES || !prev[index]) return prev;
      const src = prev[index];
      const copy = {
        id: newFrameId(),
        design: src.design ? JSON.parse(JSON.stringify(src.design)) : null,
        screenshotUrl: src.screenshotUrl,
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setActiveIndex(index + 1);
  }, []);

  const deleteFrame = useCallback((index) => {
    setFrames((prev) => {
      if (prev.length <= MIN_FRAMES) return prev;
      return prev.filter((_, i) => i !== index);
    });
    setActiveIndex((i) => {
      if (index < i) return i - 1;
      if (index === i) return Math.max(0, i - 1);
      return i;
    });
  }, []);

  const moveFrame = useCallback((index, dir) => {
    setFrames((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(j, 0, item);
      return next;
    });
    setActiveIndex((i) => {
      if (i === index) return index + dir;
      if (dir < 0 && i === index - 1) return index;
      if (dir > 0 && i === index + 1) return index;
      return i;
    });
  }, []);

  const updateFrame = useCallback((index, patch) => {
    setFrames((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  }, []);

  /** Apply template pack into frames; keep existing screenshots when possible. */
  const applyTemplatePack = useCallback((template, { resizeToPack = true } = {}) => {
    const slides = getTemplateSlides(template);
    setFrames((prev) => {
      const keepUrls = prev.map((f) => f.screenshotUrl);
      const targetCount = resizeToPack
        ? Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, slides.length || prev.length || DEFAULT_FRAME_COUNT))
        : prev.length;
      const placeholders = getPlaceholderScreenshots(targetCount);
      const next = [];
      for (let i = 0; i < targetCount; i++) {
        next.push({
          id: prev[i]?.id || newFrameId(),
          design: bindSlideToFrameShot(slides[i]) || null,
          screenshotUrl: keepUrls[i] || placeholders[i] || null,
          fabricJson: null,
          fabricRestoreKey: null,
        });
      }
      return next;
    });
    setActiveIndex(0);
  }, []);

  /** Clear designs but keep frames + screenshots. */
  const clearDesigns = useCallback(() => {
    setFrames((prev) => prev.map((f) => ({ ...f, design: null })));
  }, []);

  /** Map uploaded screenshots 1:1 onto frames (extend/shrink within limits). */
  const mapScreenshots = useCallback((urls) => {
    setFrames((prev) => {
      const count = Math.min(
        MAX_FRAMES,
        Math.max(prev.length, Math.min(urls.length || prev.length, MAX_FRAMES)),
      );
      const placeholders = getPlaceholderScreenshots(count);
      const next = [];
      for (let i = 0; i < count; i++) {
        next.push({
          id: prev[i]?.id || newFrameId(),
          design: prev[i]?.design || null,
          screenshotUrl: urls[i] || prev[i]?.screenshotUrl || placeholders[i] || null,
        });
      }
      return next;
    });
  }, []);

  return {
    frames,
    setFrames,
    activeIndex,
    setActiveIndex,
    activeFrame,
    addFrame,
    duplicateFrame,
    deleteFrame,
    moveFrame,
    updateFrame,
    applyTemplatePack,
    clearDesigns,
    mapScreenshots,
  };
}
