// Scroll → 3D timeline mapping and keyframe evaluation, ported from the source page's runtime.

export interface Keyframe {
  value: number;
  position: number;
  handles: [number, number, number, number];
  connectedRight: boolean;
}

/** Shared scroll state written by the page and read by the 3D scene each frame. */
export const scrollState = { progress: 0 };

/**
 * The source maps the viewport's bottom edge (scrollTop + viewport height) linearly between
 * anchor elements, each carrying a timeline percentage; the document bottom is 100%.
 */
export function timelineProgress(
  scrollTop: number,
  viewportH: number,
  scrollHeight: number,
  anchors: { position: number; percentage: number }[],
): number {
  const bottom = viewportH + scrollTop;
  const sorted = anchors.filter((a) => a.position > viewportH).sort((a, b) => a.position - b.position);
  let prev: (typeof sorted)[number] | undefined;
  let next: (typeof sorted)[number] | undefined;
  for (const a of sorted) {
    if (a.position <= bottom) prev = a;
    else {
      next = a;
      break;
    }
  }
  const from = Math.max(prev ? prev.position : viewportH, viewportH);
  const fromPct = prev ? prev.percentage : 0;
  const to = next ? next.position : scrollHeight;
  const toPct = next ? next.percentage : 1;
  if (from === to) return fromPct;
  return fromPct + ((bottom - from) / (to - from)) * (toPct - fromPct);
}

/** Cubic-bezier easing with control points (x1,y1) (x2,y2), solved for x = t. */
function bezier(x1: number, y1: number, x2: number, y2: number, t: number): number {
  if (x1 === y1 && x2 === y2) return t;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u;
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = sx(u) - t;
    const d = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(x) < 1e-6 || Math.abs(d) < 1e-6) break;
    u -= x / d;
  }
  u = Math.min(1, Math.max(0, u));
  return ((ay * u + by) * u + cy) * u;
}

/** Theatre.js-style keyframed track: hold outside the range, bezier between connected keys. */
export function evaluate(keys: Keyframe[], p: number): number {
  if (p <= keys[0].position) return keys[0].value;
  const last = keys[keys.length - 1];
  if (p >= last.position) return last.value;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p >= a.position && p <= b.position) {
      if (!a.connectedRight) return a.value;
      const t = (p - a.position) / (b.position - a.position || 1);
      const e = bezier(a.handles[2], a.handles[3], b.handles[0], b.handles[1], t);
      return a.value + (b.value - a.value) * e;
    }
  }
  return last.value;
}
