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
    size?: number;
    colors?: string[];
    textColor?: string;
    borderColor?: string;
    pointerColor?: string;
    alignment?: 'left' | 'center' | 'right';
    padding?: number;
    slices?: string[];
}
export declare const DEFAULT_WHEEL_COLORS: string[];
export interface WheelSliceShape {
    label: string;
    path: string;
    fill: string;
    textColor: string;
    centerAngle: number;
}
/** Black or white, whichever reads better on the fill. */
export declare function contrastText(hex: string): string;
/** Slice paths and colours in a 0..200 viewBox. */
export declare function wheelSlices(labels: string[], cfg?: WheelBlockConfig): WheelSliceShape[];
/**
 * Rotation (degrees, clockwise) that brings slice `index` under the top pointer after
 * `turns` full turns. `jitter` (-1..1) moves the stop within the slice so it doesn't
 * always land dead centre; it stays clear of the slice edges.
 */
export declare function targetRotation(index: number, count: number, turns?: number, jitter?: number): number;
/**
 * Labels run from the rim towards the hub. The font shrinks so the label fits between
 * the hub and the rim (about 60 units, clear of the pointer); past 6px it is cut short instead.
 */
export declare function fitLabel(label: string, count: number): {
    text: string;
    fontSize: number;
};
/** Wheel block: an SVG wheel with a pointer. Shows nothing when the form has no slices. */
export declare function renderWheelBlock(block: Block): HTMLElement;
/**
 * Spins the first wheel inside `root` to `index` and resolves when it stops. Resolves at
 * once when there is no wheel, so callers can always await it.
 */
export declare function spinWheel(root: ParentNode | null | undefined, index: number, rand?: () => number): Promise<void>;
/** Copies slice labels into every wheel block of a form config (top level and inside rows). */
export declare function fillWheelSlices(config: any, labels: string[]): any;
//# sourceMappingURL=wheel.d.ts.map