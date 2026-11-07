/**
 * Merge per-page IAM `settings` over `containerSettings` for surface background.
 * Page keys override container when defined (not undefined).
 *
 * Keep in sync with packages/shared/src/mergeIamPageSurfaceSettings.js (published SDK has no @tappd/shared dep).
 */
export declare function mergeIamPageSurfaceSettings(containerSettings: Record<string, any> | null | undefined, pageSettings: Record<string, any> | null | undefined): Record<string, any>;
//# sourceMappingURL=mergeIamPageSurfaceSettings.d.ts.map