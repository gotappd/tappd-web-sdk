/**
 * IAM canvas layout — keep in sync with packages/shared/src/resolveIamCanvasLayout.js
 * (published web-sdk has no @tappd/shared dependency).
 */
export declare const IAM_NOTIFICATION_VIEWPORT_PADDING_PX = 12;
export declare const IAM_NOTIFICATION_CARD_PADDING_PX = 16;
export declare const IAM_MODAL_SHELL_MAX_WIDTH_PERCENT = 90;
export declare const IAM_MODAL_SHELL_MAX_HEIGHT_PERCENT = 90;
export declare const IAM_MODAL_DEFAULT_BORDER_RADIUS_PX = 8;
export declare const IAM_CLOSE_BUTTON_INSET_PX = 8;
type StyleMap = Record<string, string>;
export declare function applyStyleMap(el: HTMLElement, style: StyleMap): void;
export declare function resolveIamOverlayOpacity(config: any): number;
export declare function resolveIamViewportPaddingPx(config: any): number;
export declare function resolveIamScrollPaddingPx(): number;
export declare function shouldShowIamCloseButton(config: any): boolean;
export declare function resolveIamCloseButtonStyle(config: any): {
    size: number;
    color: any;
    position: any;
    layout: StyleMap;
};
export declare function resolveIamBannerContainerStyle(config: any, pageIndex?: number): StyleMap;
export declare function resolveIamModalContainerStyle(config: any, pageIndex?: number): StyleMap;
export declare function resolveIamFullscreenContainerStyle(config: any, pageIndex?: number): StyleMap;
export declare function resolveIamNotificationContainerStyle(config: any, pageIndex?: number): StyleMap;
export declare function resolveIamNotificationViewportPaddingPx(): number;
export {};
//# sourceMappingURL=resolveIamCanvasLayout.d.ts.map