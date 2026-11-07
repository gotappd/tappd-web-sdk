/**
 * IAM canvas layout — keep in sync with packages/shared/src/resolveIamCanvasLayout.js
 * (published web-sdk has no @tappd/shared dependency).
 */
import { mergeIamPageSurfaceSettings } from './mergeIamPageSurfaceSettings';
import { IAM_BANNER_OUTER_PADDING_PX, IAM_DEFAULT_OVERLAY_OPACITY, IAM_DEFAULT_VIEWPORT_PADDING_PX, IAM_FULLSCREEN_SCROLL_PADDING_PX, } from './iamLayoutDefaults';
export const IAM_NOTIFICATION_VIEWPORT_PADDING_PX = 12;
export const IAM_NOTIFICATION_CARD_PADDING_PX = 16;
export const IAM_MODAL_SHELL_MAX_WIDTH_PERCENT = 90;
export const IAM_MODAL_SHELL_MAX_HEIGHT_PERCENT = 90;
export const IAM_MODAL_DEFAULT_BORDER_RADIUS_PX = 8;
export const IAM_CLOSE_BUTTON_INSET_PX = 8;
function pageSettings(config, pageIndex = 0) {
    var _a, _b;
    return (_b = (_a = config === null || config === void 0 ? void 0 : config.pages) === null || _a === void 0 ? void 0 : _a[pageIndex]) === null || _b === void 0 ? void 0 : _b.settings;
}
function rgbaFromHex(color, opacityPct) {
    const hex = String(color).replace('#', '');
    if (hex.length < 6)
        return color;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacityPct / 100})`;
}
function applySurfaceBackground(style, surface, fallbackBg) {
    var _a;
    if (surface.backgroundImageEnabled === true && surface.backgroundImage) {
        style.backgroundImage = `url(${surface.backgroundImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
        if (surface.backgroundColor)
            style.backgroundColor = surface.backgroundColor;
        return;
    }
    const color = surface.backgroundColor || fallbackBg;
    if (!color)
        return;
    const opacity = (_a = surface.backgroundOpacity) !== null && _a !== void 0 ? _a : 100;
    style.backgroundColor = opacity < 100 ? rgbaFromHex(color, opacity) : color;
}
function applyContainerBorder(style, containerSettings) {
    const borderWidth = containerSettings.borderWidth || 0;
    const borderStyle = containerSettings.borderStyle || 'none';
    if (borderWidth > 0 && borderStyle !== 'none') {
        style.border = `${borderWidth}px ${borderStyle} ${containerSettings.borderColor || '#000000'}`;
    }
    if (containerSettings.borderRadius !== undefined) {
        style.borderRadius = `${containerSettings.borderRadius}px`;
    }
}
function baseContainerFields(containerSettings) {
    const cs = containerSettings || {};
    const style = {};
    const widthMode = cs.widthMode || 'custom';
    if (widthMode === 'full') {
        style.width = '100%';
        style.maxWidth = '100%';
    }
    else if (cs.customWidth) {
        style.width = cs.customWidth;
    }
    if (cs.maxWidth != null && cs.maxWidthUnit && widthMode !== 'full') {
        const u = cs.maxWidthUnit;
        style.maxWidth = u === '%' ? `${cs.maxWidth}%` : `${cs.maxWidth}${u === 'px' ? 'px' : ''}`;
    }
    if (cs.padding !== undefined)
        style.padding = `${cs.padding}px`;
    if (cs.margin !== undefined)
        style.margin = `${cs.margin}px`;
    return { style, widthMode, cs };
}
export function applyStyleMap(el, style) {
    for (const [key, value] of Object.entries(style)) {
        if (value !== undefined && value !== null) {
            el.style[key] = value;
        }
    }
}
export function resolveIamOverlayOpacity(config) {
    var _a;
    return (_a = config === null || config === void 0 ? void 0 : config.overlayOpacity) !== null && _a !== void 0 ? _a : IAM_DEFAULT_OVERLAY_OPACITY;
}
export function resolveIamViewportPaddingPx(config) {
    var _a;
    const pad = (_a = config === null || config === void 0 ? void 0 : config.containerSettings) === null || _a === void 0 ? void 0 : _a.viewportPadding;
    return pad === undefined ? IAM_DEFAULT_VIEWPORT_PADDING_PX : pad;
}
export function resolveIamScrollPaddingPx() {
    return IAM_FULLSCREEN_SCROLL_PADDING_PX;
}
export function shouldShowIamCloseButton(config) {
    var _a;
    if ((config === null || config === void 0 ? void 0 : config.showCloseButton) === false || (config === null || config === void 0 ? void 0 : config.closeButton) === false)
        return false;
    if (((_a = config === null || config === void 0 ? void 0 : config.containerSettings) === null || _a === void 0 ? void 0 : _a.showCloseButton) === false)
        return false;
    return true;
}
export function resolveIamCloseButtonStyle(config) {
    const cs = (config === null || config === void 0 ? void 0 : config.containerSettings) || {};
    const raw = cs.closeButtonStyle || {};
    const size = typeof raw.size === 'number' && Number.isFinite(raw.size)
        ? Math.min(Math.max(raw.size, 20), 64)
        : 28;
    const position = cs.closeButtonPosition || (config === null || config === void 0 ? void 0 : config.closeButtonPosition) || 'top-right';
    const pos = String(position);
    const inset = `${IAM_CLOSE_BUTTON_INSET_PX}px`;
    const layout = {};
    if (pos.includes('top'))
        layout.top = inset;
    if (pos.includes('bottom'))
        layout.bottom = inset;
    if (pos.includes('left'))
        layout.left = inset;
    if (pos.includes('right'))
        layout.right = inset;
    return { size, color: raw.color || '#111111', position, layout };
}
export function resolveIamBannerContainerStyle(config, pageIndex = 0) {
    const containerSettings = (config === null || config === void 0 ? void 0 : config.containerSettings) || {};
    const surface = mergeIamPageSurfaceSettings(containerSettings, pageSettings(config, pageIndex));
    const fallbackBg = containerSettings.backgroundColor || (config === null || config === void 0 ? void 0 : config.backgroundColor);
    const style = { padding: `${IAM_BANNER_OUTER_PADDING_PX}px` };
    applySurfaceBackground(style, surface, fallbackBg);
    applyContainerBorder(style, containerSettings);
    return style;
}
export function resolveIamModalContainerStyle(config, pageIndex = 0) {
    var _a;
    const containerSettings = (config === null || config === void 0 ? void 0 : config.containerSettings) || {};
    const surface = mergeIamPageSurfaceSettings(containerSettings, pageSettings(config, pageIndex));
    const { style, widthMode, cs } = baseContainerFields(containerSettings);
    applySurfaceBackground(style, surface, containerSettings.backgroundColor || (config === null || config === void 0 ? void 0 : config.backgroundColor));
    applyContainerBorder(style, containerSettings);
    if (!style.width && widthMode !== 'full' && !cs.customWidth) {
        style.width = `${IAM_MODAL_SHELL_MAX_WIDTH_PERCENT}%`;
    }
    if (!style.maxWidth && widthMode !== 'full') {
        style.maxWidth = `${IAM_MODAL_SHELL_MAX_WIDTH_PERCENT}%`;
    }
    // Viewport units — % max-height collapses when the shell is content-sized (no explicit height).
    if (!style.maxHeight) {
        style.maxHeight = `${IAM_MODAL_SHELL_MAX_HEIGHT_PERCENT}vh`;
    }
    if (!style.backgroundColor && !style.backgroundImage) {
        style.backgroundColor = '#FFFFFF';
    }
    if (!style.borderRadius) {
        style.borderRadius = `${(_a = cs.borderRadius) !== null && _a !== void 0 ? _a : IAM_MODAL_DEFAULT_BORDER_RADIUS_PX}px`;
    }
    return style;
}
export function resolveIamFullscreenContainerStyle(config, pageIndex = 0) {
    var _a;
    const containerSettings = (config === null || config === void 0 ? void 0 : config.containerSettings) || {};
    const base = resolveIamModalContainerStyle(config, pageIndex);
    base.maxWidth = '100%';
    base.width = '100%';
    base.maxHeight = '100%';
    base.height = '100%';
    base.borderRadius = '0';
    base.padding = `${(_a = containerSettings.padding) !== null && _a !== void 0 ? _a : 0}px`;
    return base;
}
export function resolveIamNotificationContainerStyle(config, pageIndex = 0) {
    const containerSettings = (config === null || config === void 0 ? void 0 : config.containerSettings) || {};
    const base = resolveIamModalContainerStyle(config, pageIndex);
    if (containerSettings.padding === undefined) {
        base.padding = `${IAM_NOTIFICATION_CARD_PADDING_PX}px`;
    }
    if (!base.maxWidth)
        base.maxWidth = '92%';
    if (!base.maxHeight)
        base.maxHeight = '72%';
    return base;
}
export function resolveIamNotificationViewportPaddingPx() {
    return IAM_NOTIFICATION_VIEWPORT_PADDING_PX;
}
//# sourceMappingURL=resolveIamCanvasLayout.js.map