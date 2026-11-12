/**
 * Countdown block logic for in-app messages, with no rendering in it.
 * Same file in `@tappd/web-sdk`, the React Native SDK and the dashboard: keep them in sync.
 */
export type CountdownUnit = 'days' | 'hours' | 'minutes' | 'seconds';
export interface CountdownSettings {
    /** 'date' and 'dynamic' count down to `endAt`; 'duration' starts when the message is first shown. */
    mode?: 'date' | 'dynamic' | 'duration';
    /** ISO date, or epoch seconds or milliseconds. Liquid is resolved before delivery. */
    endAt?: string;
    durationSeconds?: number;
    showDays?: boolean;
    showHours?: boolean;
    showMinutes?: boolean;
    showSeconds?: boolean;
}
export interface CountdownPart {
    unit: CountdownUnit;
    label: string;
    value: string;
}
/** Parses an end date. Returns null for anything unusable, such as Liquid that resolved to nothing. */
export declare function parseCountdownEnd(value: unknown): number | null;
/**
 * When this countdown ends, as a timestamp, or null when it has nothing valid to count to.
 * A duration timer keeps running for the session and starts again once it has finished.
 */
export declare function resolveCountdownEnd(settings: CountdownSettings, blockId: string, now?: number): number | null;
/**
 * Remaining time split into the units being shown. A hidden unit rolls into the next one down,
 * and the smallest unit rounds up so a timer never reads zero while time is left.
 */
export declare function countdownParts(remainingMs: number, settings: CountdownSettings): CountdownPart[];
/** The same time as a sentence for screen readers. */
export declare function countdownSpokenText(parts: CountdownPart[]): string;
//# sourceMappingURL=iamCountdown.d.ts.map