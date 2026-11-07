/**
 * In-app message display priority — inlined for published web-sdk
 * (no @tappd/shared dependency). Keep in sync with
 * packages/shared/src/iamDisplayPriority.js.
 */
export declare const IAM_DISPLAY_PRIORITY_VALUES: readonly ["low", "normal", "high", "critical"];
export type IamDisplayPriority = (typeof IAM_DISPLAY_PRIORITY_VALUES)[number];
/** Higher number = shown first when multiple IAMs are eligible. */
export declare const IAM_DISPLAY_PRIORITIES: Record<IamDisplayPriority, number>;
export declare function normalizeIamDisplayPriority(raw: unknown): IamDisplayPriority;
export declare function iamDisplayPriorityRank(raw: unknown): number;
export declare function sortInAppMessagesByPriority<T extends {
    displayPriority?: string;
    createdAt?: Date | string | number;
}>(messages: T[]): T[];
//# sourceMappingURL=iamDisplayPriority.d.ts.map