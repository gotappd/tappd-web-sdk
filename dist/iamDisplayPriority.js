/**
 * In-app message display priority — inlined for published web-sdk
 * (no @tappd/shared dependency). Keep in sync with
 * packages/shared/src/iamDisplayPriority.js.
 */
export const IAM_DISPLAY_PRIORITY_VALUES = ['low', 'normal', 'high', 'critical'];
/** Higher number = shown first when multiple IAMs are eligible. */
export const IAM_DISPLAY_PRIORITIES = {
    low: 0,
    normal: 10,
    high: 20,
    critical: 30,
};
export function normalizeIamDisplayPriority(raw) {
    if (raw == null || raw === '')
        return 'normal';
    const s = String(raw).toLowerCase().trim();
    if (Object.prototype.hasOwnProperty.call(IAM_DISPLAY_PRIORITIES, s)) {
        return s;
    }
    return 'normal';
}
export function iamDisplayPriorityRank(raw) {
    return IAM_DISPLAY_PRIORITIES[normalizeIamDisplayPriority(raw)];
}
export function sortInAppMessagesByPriority(messages) {
    if (!Array.isArray(messages) || messages.length < 2) {
        return Array.isArray(messages) ? messages.slice() : [];
    }
    return messages.slice().sort((a, b) => {
        const rankDiff = iamDisplayPriorityRank(b === null || b === void 0 ? void 0 : b.displayPriority) - iamDisplayPriorityRank(a === null || a === void 0 ? void 0 : a.displayPriority);
        if (rankDiff !== 0)
            return rankDiff;
        const aTime = (a === null || a === void 0 ? void 0 : a.createdAt) != null ? new Date(a.createdAt).getTime() : 0;
        const bTime = (b === null || b === void 0 ? void 0 : b.createdAt) != null ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
    });
}
//# sourceMappingURL=iamDisplayPriority.js.map