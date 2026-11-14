/**
 * Spin-to-win wheel block for signup forms.
 *
 * The server draws the prize when the email is submitted; the wheel only animates to the
 * slice the server returned (wheelIndex). The browser never sees the odds. Slice labels
 * are copied into the block config by SignupForms before rendering (config.wheel.slices).
 *
 * Angles are measured clockwise from 12 o'clock, where the pointer sits.
 */
import type { Block } from '../types/inAppMessage';

export interface WheelBlockConfig {
  size?: number; // px, diameter
  colors?: string[]; // slice fills, repeated around the wheel
  textColor?: string; // '' or 'auto' picks black or white per slice
  borderColor?: string;
  pointerColor?: string;
  alignment?: 'left' | 'center' | 'right';
  padding?: number;
  slices?: string[]; // labels, filled in at render time
}

export const DEFAULT_WHEEL_COLORS = ['#111827', '#F3F4F6'];
const SPIN_MS = 4500;
const REDUCED_SPIN_MS = 600;
const SVG_NS = 'http://www.w3.org/2000/svg';

export interface WheelSliceShape {
  label: string;
  path: string;
  fill: string;
  textColor: string;
  centerAngle: number;
}

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}

/** Black or white, whichever reads better on the fill. */
export function contrastText(hex: string): string {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(String(hex || '').trim());
  if (!m) return '#111827';
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? '#111827' : '#FFFFFF';
}

/** Slice paths and colours in a 0..200 viewBox. */
export function wheelSlices(labels: string[], cfg: WheelBlockConfig = {}): WheelSliceShape[] {
  const n = labels.length;
  if (n === 0) return [];
  const colors = (cfg.colors && cfg.colors.length ? cfg.colors : DEFAULT_WHEEL_COLORS).filter(Boolean);
  const seg = 360 / n;
  const c = 100;
  const r = 98;
  return labels.map((label, i) => {
    let fill = colors[i % colors.length];
    // The last slice touches the first; with 3+ colors swap in one that matches neither neighbour.
    if (i === n - 1 && n > 1 && colors.length > 2 && n % colors.length === 1) fill = colors[1];
    const start = i * seg;
    const end = start + seg;
    const [x1, y1] = polar(c, c, r, start);
    const [x2, y2] = polar(c, c, r, end);
    const large = seg > 180 ? 1 : 0;
    const path = n === 1
      ? `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - 0.01} ${c - r} Z`
      : `M ${c} ${c} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
    const auto = !cfg.textColor || cfg.textColor === 'auto';
    return { label, path, fill, textColor: auto ? contrastText(fill) : cfg.textColor!, centerAngle: start + seg / 2 };
  });
}

/**
 * Rotation (degrees, clockwise) that brings slice `index` under the top pointer after
 * `turns` full turns. `jitter` (-1..1) moves the stop within the slice so it doesn't
 * always land dead centre; it stays clear of the slice edges.
 */
export function targetRotation(index: number, count: number, turns = 6, jitter = 0): number {
  const seg = 360 / count;
  const centre = (index + 0.5) * seg;
  const offset = Math.max(-1, Math.min(1, jitter)) * seg * 0.35;
  return turns * 360 + (360 - centre) + offset;
}

/**
 * Labels run from the rim towards the hub. The font shrinks so the label fits between
 * the hub and the rim (about 60 units, clear of the pointer); past 6px it is cut short instead.
 */
export function fitLabel(label: string, count: number): { text: string; fontSize: number } {
  const base = count > 8 ? 8 : count > 5 ? 9.5 : 11;
  const room = 60;
  const perChar = 0.6; // average glyph width as a share of font size
  let text = String(label || '').trim();
  let fontSize = Math.min(base, room / (perChar * Math.max(1, text.length)));
  if (fontSize < 6) {
    fontSize = 6;
    const max = Math.floor(room / (perChar * 6));
    text = `${text.slice(0, max - 1)}…`;
  }
  return { text, fontSize: Math.round(fontSize * 10) / 10 };
}

/** Wheel block: an SVG wheel with a pointer. Shows nothing when the form has no slices. */
export function renderWheelBlock(block: Block): HTMLElement {
  const cfg: WheelBlockConfig = ((block.config as any).wheel || {}) as WheelBlockConfig;
  const labels = Array.isArray(cfg.slices) ? cfg.slices : [];
  const container = document.createElement('div');
  container.className = 'tappd-block-wheel';
  if (!labels.length) return container;

  const size = Math.max(160, Math.min(480, Number(cfg.size) || 280));
  container.style.textAlign = cfg.alignment || 'center';
  container.style.padding = `${Number(cfg.padding ?? 8)}px`;

  const frame = document.createElement('div');
  frame.style.position = 'relative';
  frame.style.display = 'inline-block';
  frame.style.width = `${size}px`;
  frame.style.maxWidth = '100%';
  frame.style.aspectRatio = '1 / 1';
  container.appendChild(frame);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Prize wheel: ${labels.join(', ')}`);
  frame.appendChild(svg);

  const spinner = document.createElementNS(SVG_NS, 'g');
  spinner.setAttribute('class', 'tappd-wheel-spinner');
  (spinner as any).style.transformOrigin = '100px 100px';
  (spinner as any).style.transformBox = 'view-box';
  svg.appendChild(spinner);

  const shapes = wheelSlices(labels, cfg);
  for (const s of shapes) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', s.path);
    path.setAttribute('fill', s.fill);
    path.setAttribute('stroke', cfg.borderColor || '#FFFFFF');
    path.setAttribute('stroke-width', '1');
    spinner.appendChild(path);

    // Labels run from the hub outwards along the middle of the slice.
    const text = document.createElementNS(SVG_NS, 'text');
    const fitted = fitLabel(s.label, labels.length);
    text.setAttribute('x', '176');
    text.setAttribute('y', '100');
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-size', String(fitted.fontSize));
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', 'inherit');
    text.setAttribute('fill', s.textColor);
    text.setAttribute('transform', `rotate(${(s.centerAngle - 90).toFixed(3)} 100 100)`);
    text.textContent = fitted.text;
    spinner.appendChild(text);
  }

  const rim = document.createElementNS(SVG_NS, 'circle');
  rim.setAttribute('cx', '100');
  rim.setAttribute('cy', '100');
  rim.setAttribute('r', '98');
  rim.setAttribute('fill', 'none');
  rim.setAttribute('stroke', cfg.borderColor || '#FFFFFF');
  rim.setAttribute('stroke-width', '3');
  svg.appendChild(rim);

  const hub = document.createElementNS(SVG_NS, 'circle');
  hub.setAttribute('cx', '100');
  hub.setAttribute('cy', '100');
  hub.setAttribute('r', '12');
  hub.setAttribute('fill', cfg.borderColor || '#FFFFFF');
  hub.setAttribute('stroke', cfg.pointerColor || '#111827');
  hub.setAttribute('stroke-width', '2');
  svg.appendChild(hub);

  const pointer = document.createElementNS(SVG_NS, 'path');
  pointer.setAttribute('d', 'M 100 18 L 90 0 L 110 0 Z');
  pointer.setAttribute('fill', cfg.pointerColor || '#111827');
  pointer.setAttribute('stroke', '#FFFFFF');
  pointer.setAttribute('stroke-width', '1.5');
  svg.appendChild(pointer);

  const live = document.createElement('span');
  live.className = 'tappd-wheel-status';
  live.setAttribute('aria-live', 'polite');
  live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;';
  container.appendChild(live);

  return container;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}

/**
 * Spins the first wheel inside `root` to `index` and resolves when it stops. Resolves at
 * once when there is no wheel, so callers can always await it.
 */
export function spinWheel(root: ParentNode | null | undefined, index: number, rand: () => number = Math.random): Promise<void> {
  const wheel = root?.querySelector?.('.tappd-block-wheel') as HTMLElement | null;
  const spinner = wheel?.querySelector('.tappd-wheel-spinner') as SVGGElement | null;
  const count = wheel?.querySelectorAll('.tappd-wheel-spinner path').length || 0;
  if (!wheel || !spinner || !count || index < 0 || index >= count) return Promise.resolve();

  const reduced = prefersReducedMotion();
  const ms = reduced ? REDUCED_SPIN_MS : SPIN_MS;
  const deg = targetRotation(index, count, reduced ? 1 : 6, rand() * 2 - 1);
  const style = (spinner as any).style as CSSStyleDeclaration;
  style.transition = `transform ${ms}ms cubic-bezier(0.15, 0.85, 0.2, 1)`;
  // Next frame, so the transition runs from the resting position.
  return new Promise((resolve) => {
    const done = () => {
      const label = wheel.querySelectorAll('.tappd-wheel-spinner text')[index]?.textContent || '';
      const status = wheel.querySelector('.tappd-wheel-status');
      if (status && label) status.textContent = `You won ${label}`;
      resolve();
    };
    requestAnimationFrame(() => {
      style.transform = `rotate(${deg}deg)`;
      setTimeout(done, ms + 150);
    });
  });
}

/** Copies slice labels into every wheel block of a form config (top level and inside rows). */
export function fillWheelSlices(config: any, labels: string[]): any {
  const walk = (v: any): any => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: any = {};
      for (const k of Object.keys(v)) out[k] = walk(v[k]);
      if (out.type === 'wheel' && out.config) out.config = { ...out.config, wheel: { ...(out.config.wheel || {}), slices: labels } };
      return out;
    }
    return v;
  };
  return walk(config);
}
