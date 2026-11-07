/**
 * Message Renderer for In-App Messages
 * Layout values come from resolveIamCanvasLayout (dashboard preview parity).
 */

import type { InAppMessage, InAppMessageConfig } from '../types/inAppMessage';
import { renderBlocks, type BlockRenderCallbacks } from './blockRenderer';
import {
  applyStyleMap,
  resolveIamBannerContainerStyle,
  resolveIamCloseButtonStyle,
  resolveIamFullscreenContainerStyle,
  resolveIamModalContainerStyle,
  resolveIamNotificationContainerStyle,
  resolveIamNotificationViewportPaddingPx,
  resolveIamOverlayOpacity,
  resolveIamScrollPaddingPx,
  resolveIamViewportPaddingPx,
  shouldShowIamCloseButton,
} from '../resolveIamCanvasLayout';

function makeBlockCallbacks(message: InAppMessage, options: RenderOptions): BlockRenderCallbacks {
  return {
    onButtonClick: (link, text, action) => {
      options.onButtonClick?.(message._id, link, text, action);
    },
    onFormSubmit: (formData, submitAction) => {
      options.onFormSubmit?.(message._id, formData, submitAction);
    },
  };
}

interface RenderOptions {
  onDismiss?: (messageId: string) => void;
  onButtonClick?: (messageId: string, link: string, text: string, action?: any) => void;
  onFormSubmit?: (messageId: string, formData: Record<string, any>, submitAction?: any) => void;
  onNavigatePage?: (messageId: string, pageIndex: number) => void;
  containerId?: string;
  currentPageIndex?: number;
}

function getBlocks(config: InAppMessageConfig, pageIndex: number = 0): any[] {
  if (config.pages && config.pages.length > 0) {
    const targetPage = config.pages[pageIndex] || config.pages[0];
    const pageBlocks = targetPage.blocks || [];
    if (pageBlocks.length > 0) return pageBlocks;
    return config.blocks || [];
  }
  return config.blocks || [];
}

function partitionPinnedRows(blocks: any[]) {
  const top: any[] = [];
  const bottom: any[] = [];
  const normal: any[] = [];
  for (const b of blocks || []) {
    const pin = b?.type === 'row' ? b?.config?.row?.pin : undefined;
    if (pin === 'top') top.push(b);
    else if (pin === 'bottom') bottom.push(b);
    else normal.push(b);
  }
  return { top, bottom, normal };
}

function getCurrentPageIndex(config: InAppMessageConfig, options: RenderOptions): number {
  if (options.currentPageIndex !== undefined) {
    return options.currentPageIndex;
  }
  return 0;
}

function applyOverlayViewportPadding(overlayEl: HTMLElement, config: InAppMessageConfig): void {
  overlayEl.style.padding = `${resolveIamViewportPaddingPx(config)}px`;
  overlayEl.style.boxSizing = 'border-box';
}

function appendCloseButton(
  parent: HTMLElement,
  config: InAppMessageConfig,
  onDismiss: () => void
): void {
  if (!shouldShowIamCloseButton(config)) return;
  const { size, color, layout } = resolveIamCloseButtonStyle(config);
  const closeButton = document.createElement('button');
  closeButton.className = 'tappd-message-close';
  closeButton.innerHTML = '×';
  applyStyleMap(closeButton, {
    position: 'absolute',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '10',
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${Math.floor(size * 0.85)}px`,
    color,
    ...layout,
  });
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.addEventListener('click', onDismiss);
  parent.appendChild(closeButton);
}

function appendMultiPageNav(
  parent: HTMLElement,
  message: InAppMessage,
  options: RenderOptions,
  config: InAppMessageConfig,
  currentPageIndex: number
): void {
  if (!config.pages || config.pages.length <= 1 || config.showNavigationButtons === false) return;

  const navContainer = document.createElement('div');
  navContainer.style.position = 'absolute';
  navContainer.style.bottom = '20px';
  navContainer.style.left = '50%';
  navContainer.style.transform = 'translateX(-50%)';
  navContainer.style.display = 'flex';
  navContainer.style.gap = '10px';
  navContainer.style.zIndex = '10';

  const pagesLength = config.pages.length;
  const lastPageIndex = pagesLength - 1;

  const prevButton = document.createElement('button');
  prevButton.textContent = '← Previous';
  prevButton.disabled = currentPageIndex === 0;
  prevButton.style.padding = '8px 16px';
  prevButton.style.cursor = currentPageIndex === 0 ? 'not-allowed' : 'pointer';
  prevButton.style.opacity = currentPageIndex === 0 ? '0.5' : '1';
  prevButton.addEventListener('click', () => {
    if (currentPageIndex > 0 && options.onNavigatePage) {
      options.onNavigatePage(message._id, currentPageIndex - 1);
    }
  });

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next →';
  nextButton.disabled = currentPageIndex >= lastPageIndex;
  nextButton.style.padding = '8px 16px';
  nextButton.style.cursor = currentPageIndex >= lastPageIndex ? 'not-allowed' : 'pointer';
  nextButton.style.opacity = currentPageIndex >= lastPageIndex ? '0.5' : '1';
  nextButton.addEventListener('click', () => {
    if (currentPageIndex < lastPageIndex && options.onNavigatePage) {
      options.onNavigatePage(message._id, currentPageIndex + 1);
    }
  });

  navContainer.appendChild(prevButton);
  navContainer.appendChild(nextButton);
  parent.appendChild(navContainer);
}

function attachPageSwipe(
  el: HTMLElement,
  message: InAppMessage,
  options: RenderOptions,
  config: InAppMessageConfig,
  currentPageIndex: number
): void {
  if (!config.pages || config.pages.length <= 1 || !options.onNavigatePage) return;
  el.style.touchAction = 'pan-y';
  let startX = 0;
  let startY = 0;
  el.addEventListener('pointerdown', (e: PointerEvent) => {
    startX = e.clientX;
    startY = e.clientY;
  });
  el.addEventListener('pointerup', (e: PointerEvent) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    const last = config.pages!.length - 1;
    if (dx < 0 && currentPageIndex < last) {
      options.onNavigatePage!(message._id, currentPageIndex + 1);
    } else if (dx > 0 && currentPageIndex > 0) {
      options.onNavigatePage!(message._id, currentPageIndex - 1);
    }
  });
}

function applyContentStyles(contentContainer: HTMLElement, config: InAppMessageConfig): void {
  const contentSettings = config.contentSettings;
  if (!contentSettings) return;

  if (contentSettings.defaultFontFamily) {
    contentContainer.style.fontFamily = contentSettings.defaultFontFamily;
  }
  if (contentSettings.defaultFontSize) {
    contentContainer.style.fontSize = contentSettings.defaultFontSize;
  }
  if (contentSettings.defaultTextColor) {
    contentContainer.style.color = contentSettings.defaultTextColor;
  }
  if (contentSettings.contentAlignment) {
    contentContainer.style.textAlign = contentSettings.contentAlignment;
  }
  if (contentSettings.defaultLineHeight) {
    contentContainer.style.lineHeight = contentSettings.defaultLineHeight;
  }
}

function createScrollStack(
  message: InAppMessage,
  options: RenderOptions,
  config: InAppMessageConfig,
  blocks: any[],
  pageIndex: number,
  fillParent = false
): HTMLElement {
  const pinned = partitionPinnedRows(blocks);
  const outer = document.createElement('div');
  outer.style.display = 'flex';
  outer.style.flexDirection = 'column';
  outer.style.width = '100%';
  if (fillParent) {
    outer.style.height = '100%';
    outer.style.flex = '1';
    outer.style.minHeight = '0';
  } else {
    outer.style.maxHeight = 'inherit';
  }

  const pinnedTop = document.createElement('div');
  pinnedTop.style.position = 'sticky';
  pinnedTop.style.top = '0';
  pinnedTop.style.zIndex = '2';

  const pinnedBottom = document.createElement('div');
  pinnedBottom.style.position = 'sticky';
  pinnedBottom.style.bottom = '0';
  pinnedBottom.style.zIndex = '2';

  const scrollArea = document.createElement('div');
  scrollArea.className = 'tappd-message-content';
  scrollArea.style.padding = `${resolveIamScrollPaddingPx()}px`;
  scrollArea.style.overflow = 'auto';
  scrollArea.style.width = '100%';
  if (fillParent) {
    scrollArea.style.flex = '1';
    scrollArea.style.minHeight = '0';
  }
  applyContentStyles(scrollArea, config);

  const cb = makeBlockCallbacks(message, options);
  renderBlocks(pinned.top, cb).forEach((el) => pinnedTop.appendChild(el));
  renderBlocks(pinned.normal, cb).forEach((el) => scrollArea.appendChild(el));
  renderBlocks(pinned.bottom, cb).forEach((el) => pinnedBottom.appendChild(el));

  if (pinned.top.length) outer.appendChild(pinnedTop);
  outer.appendChild(scrollArea);
  if (pinned.bottom.length) outer.appendChild(pinnedBottom);
  attachPageSwipe(outer, message, options, config, pageIndex);
  return outer;
}

function renderBanner(message: InAppMessage, options: RenderOptions): HTMLElement {
  const config = message.config;
  const position = config.position || 'top';
  const currentPageIndex = getCurrentPageIndex(config, options);
  const blocks = getBlocks(config, currentPageIndex);

  const banner = document.createElement('div');
  banner.id = `tappd-message-${message._id}`;
  banner.className = `tappd-message tappd-message-banner tappd-message-${position}`;
  banner.style.position = 'fixed';
  banner.style.left = '0';
  banner.style.right = '0';
  banner.style.width = '100%';
  banner.style.zIndex = '999999';

  if (position === 'top') {
    banner.style.top = '0';
  } else if (position === 'bottom') {
    banner.style.bottom = '0';
  } else {
    banner.style.top = '50%';
    banner.style.transform = 'translateY(-50%)';
  }

  applyStyleMap(banner, resolveIamBannerContainerStyle(config, currentPageIndex));

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'tappd-message-content';
  contentWrapper.style.display = 'flex';
  contentWrapper.style.alignItems = 'center';
  contentWrapper.style.justifyContent = 'space-between';

  const blocksContainer = document.createElement('div');
  blocksContainer.className = 'tappd-message-blocks';
  blocksContainer.style.flex = '1';
  applyContentStyles(blocksContainer, config);

  renderBlocks(blocks, makeBlockCallbacks(message, options)).forEach((blockEl) => {
    blocksContainer.appendChild(blockEl);
  });

  contentWrapper.appendChild(blocksContainer);

  if (config.dismissible !== false) {
    const dismissButton = document.createElement('button');
    dismissButton.className = 'tappd-message-dismiss';
    dismissButton.innerHTML = '×';
    dismissButton.style.background = 'none';
    dismissButton.style.border = 'none';
    dismissButton.style.fontSize = '24px';
    dismissButton.style.cursor = 'pointer';
    dismissButton.style.flexShrink = '0';
    dismissButton.setAttribute('aria-label', 'Dismiss');
    dismissButton.addEventListener('click', () => options.onDismiss?.(message._id));
    contentWrapper.appendChild(dismissButton);
  }

  banner.appendChild(contentWrapper);
  appendMultiPageNav(banner, message, options, config, currentPageIndex);
  attachPageSwipe(banner, message, options, config, currentPageIndex);

  const animation = config.animation || 'slide';
  if (animation === 'slide') {
    if (position === 'top') {
      banner.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        banner.style.transition = 'transform 0.3s ease-out';
        banner.style.transform = 'translateY(0)';
      }, 10);
    } else if (position === 'bottom') {
      banner.style.transform = 'translateY(100%)';
      setTimeout(() => {
        banner.style.transition = 'transform 0.3s ease-out';
        banner.style.transform = 'translateY(0)';
      }, 10);
    }
  } else if (animation === 'fade') {
    banner.style.opacity = '0';
    setTimeout(() => {
      banner.style.transition = 'opacity 0.3s ease-out';
      banner.style.opacity = '1';
    }, 10);
  }

  return banner;
}

function renderOverlayModalShell(
  message: InAppMessage,
  options: RenderOptions,
  className: string
): HTMLElement {
  const config = message.config;
  const currentPageIndex = getCurrentPageIndex(config, options);
  const blocks = getBlocks(config, currentPageIndex);
  const overlay = config.overlay !== false;
  const overlayOpacity = resolveIamOverlayOpacity(config);

  const overlayEl = document.createElement('div');
  overlayEl.className = 'tappd-message-overlay';
  overlayEl.style.position = 'fixed';
  overlayEl.style.inset = '0';
  overlayEl.style.backgroundColor = overlay ? `rgba(0, 0, 0, ${overlayOpacity})` : 'transparent';
  overlayEl.style.zIndex = '999998';
  overlayEl.style.display = 'flex';
  overlayEl.style.justifyContent = 'center';
  const widthMode = config.containerSettings?.widthMode || 'custom';
  if (widthMode === 'full') {
    overlayEl.style.flexDirection = 'column';
    overlayEl.style.alignItems = 'stretch';
  } else {
    overlayEl.style.alignItems = 'center';
  }
  applyOverlayViewportPadding(overlayEl, config);

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl && config.dismissible !== false) {
      options.onDismiss?.(message._id);
    }
  });

  const shell = document.createElement('div');
  shell.id = `tappd-message-${message._id}`;
  shell.className = `tappd-message ${className}`;
  shell.style.position = 'relative';
  shell.style.overflow = 'hidden';
  shell.style.zIndex = '999999';
  shell.style.boxSizing = 'border-box';
  shell.style.display = 'flex';
  shell.style.flexDirection = 'column';
  applyStyleMap(shell, resolveIamModalContainerStyle(config, currentPageIndex));

  appendCloseButton(shell, config, () => options.onDismiss?.(message._id));
  shell.appendChild(createScrollStack(message, options, config, blocks, currentPageIndex, false));
  appendMultiPageNav(shell, message, options, config, currentPageIndex);

  overlayEl.appendChild(shell);

  const animation = config.animation || 'fade';
  if (animation === 'fade') {
    shell.style.opacity = '0';
    shell.style.transform = 'scale(0.95)';
    requestAnimationFrame(() => {
      shell.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      shell.style.opacity = '1';
      shell.style.transform = 'scale(1)';
    });
  } else if (animation === 'slide') {
    shell.style.transform = 'translateY(20px)';
    shell.style.opacity = '0';
    requestAnimationFrame(() => {
      shell.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      shell.style.opacity = '1';
      shell.style.transform = 'translateY(0)';
    });
  }

  return overlayEl;
}

function renderPopup(message: InAppMessage, options: RenderOptions): HTMLElement {
  return renderOverlayModalShell(message, options, 'tappd-message-popup');
}

function renderModal(message: InAppMessage, options: RenderOptions): HTMLElement {
  return renderOverlayModalShell(message, options, 'tappd-message-modal');
}

function renderFullScreen(message: InAppMessage, options: RenderOptions): HTMLElement {
  const config = message.config;
  const currentPageIndex = getCurrentPageIndex(config, options);
  const blocks = getBlocks(config, currentPageIndex);

  const fullScreen = document.createElement('div');
  fullScreen.id = `tappd-message-${message._id}`;
  fullScreen.className = 'tappd-message tappd-message-fullscreen';
  fullScreen.style.position = 'fixed';
  fullScreen.style.inset = '0';
  fullScreen.style.width = '100%';
  fullScreen.style.height = '100%';
  fullScreen.style.zIndex = '999999';
  fullScreen.style.overflow = 'hidden';
  fullScreen.style.boxSizing = 'border-box';
  applyStyleMap(fullScreen, resolveIamFullscreenContainerStyle(config, currentPageIndex));

  appendCloseButton(fullScreen, config, () => options.onDismiss?.(message._id));
  fullScreen.appendChild(createScrollStack(message, options, config, blocks, currentPageIndex, true));
  appendMultiPageNav(fullScreen, message, options, config, currentPageIndex);

  const animation = config.animation || 'fade';
  if (animation === 'fade') {
    fullScreen.style.opacity = '0';
    setTimeout(() => {
      fullScreen.style.transition = 'opacity 0.3s ease-out';
      fullScreen.style.opacity = '1';
    }, 10);
  }

  return fullScreen;
}

function renderNotification(message: InAppMessage, options: RenderOptions): HTMLElement {
  const config = message.config;
  const containerSettings = config.containerSettings;
  const currentPageIndex = getCurrentPageIndex(config, options);
  const blocks = getBlocks(config, currentPageIndex);
  const position = containerSettings?.notificationPosition || config.notificationPosition || 'top';
  const animationDirection = containerSettings?.notificationAnimation || config.notificationAnimation || 'down';
  const edgePad = resolveIamNotificationViewportPaddingPx();

  const root = document.createElement('div');
  root.className = 'tappd-message-notification-root';
  root.style.position = 'fixed';
  root.style.inset = '0';
  root.style.zIndex = '999999';
  root.style.display = 'flex';
  root.style.padding = `${edgePad}px`;
  root.style.boxSizing = 'border-box';
  root.style.pointerEvents = 'none';

  if (position === 'top') {
    root.style.alignItems = 'flex-start';
    root.style.justifyContent = 'center';
  } else if (position === 'bottom') {
    root.style.alignItems = 'flex-end';
    root.style.justifyContent = 'center';
  } else if (position === 'left') {
    root.style.alignItems = 'center';
    root.style.justifyContent = 'flex-start';
  } else {
    root.style.alignItems = 'center';
    root.style.justifyContent = 'flex-end';
  }

  const notification = document.createElement('div');
  notification.id = `tappd-message-${message._id}`;
  notification.className = `tappd-message tappd-message-notification tappd-message-notification-${position}`;
  notification.style.position = 'relative';
  notification.style.pointerEvents = 'auto';
  notification.style.boxSizing = 'border-box';
  notification.style.overflow = 'hidden';
  notification.style.display = 'flex';
  notification.style.flexDirection = 'column';
  applyStyleMap(notification, resolveIamNotificationContainerStyle(config, currentPageIndex));

  appendCloseButton(notification, config, () => options.onDismiss?.(message._id));
  notification.appendChild(createScrollStack(message, options, config, blocks, currentPageIndex, false));

  root.appendChild(notification);

  const initialTransform = (() => {
    if (animationDirection === 'up') return 'translateY(100%)';
    if (animationDirection === 'down') return 'translateY(-100%)';
    if (animationDirection === 'left') return 'translateX(100%)';
    if (animationDirection === 'right') return 'translateX(-100%)';
    return 'translateY(-100%)';
  })();

  notification.style.transform = initialTransform;
  setTimeout(() => {
    notification.style.transition = 'transform 0.3s ease-out';
    notification.style.transform = 'translateY(0) translateX(0)';
  }, 10);

  return root;
}

export function renderMessage(
  message: InAppMessage,
  options: RenderOptions = {}
): HTMLElement {
  const config = message.config;
  const messageType = config.containerSettings?.displayType || config.messageType || 'modal';

  let container: HTMLElement;

  switch (messageType) {
    case 'banner':
      container = renderBanner(message, options);
      break;
    case 'popup':
      container = renderModal(message, options);
      break;
    case 'modal':
      container = renderModal(message, options);
      break;
    case 'full_screen':
    case 'fullscreen':
      container = renderFullScreen(message, options);
      break;
    case 'notification':
      container = renderNotification(message, options);
      break;
    default:
      container = renderModal(message, options);
  }

  const targetContainer = options.containerId
    ? document.getElementById(options.containerId)
    : document.body;

  if (targetContainer) {
    targetContainer.appendChild(container);
  } else {
    document.body.appendChild(container);
  }

  return container;
}
