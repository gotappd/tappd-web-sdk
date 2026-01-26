/**
 * Message Renderer for In-App Messages
 * Renders message containers (banner, popup, modal)
 */

import type { InAppMessage, InAppMessageConfig } from '../types/inAppMessage';
import { renderBlocks } from './blockRenderer';

interface RenderOptions {
  onDismiss?: (messageId: string) => void;
  onButtonClick?: (messageId: string, link: string, text: string, action?: any) => void;
  onFormSubmit?: (messageId: string, formData: Record<string, any>, submitAction?: any) => void;
  onNavigatePage?: (messageId: string, pageIndex: number) => void;
  containerId?: string;
  currentPageIndex?: number;
}

/**
 * Get blocks from message config
 */
function getBlocks(config: InAppMessageConfig, pageIndex: number = 0): any[] {
  // Support both legacy blocks and new pages structure
  if (config.pages && config.pages.length > 0) {
    // Use specified page's blocks or first page
    const targetPage = config.pages[pageIndex] || config.pages[0];
    return targetPage.blocks || [];
  }
  return config.blocks || [];
}

/**
 * Get current page index
 */
function getCurrentPageIndex(config: InAppMessageConfig, options: RenderOptions): number {
  if (options.currentPageIndex !== undefined) {
    return options.currentPageIndex;
  }
  return 0;
}

/**
 * Apply container styles
 */
function applyContainerStyles(
  container: HTMLElement,
  config: InAppMessageConfig
): void {
  const containerSettings = config.containerSettings;
  if (!containerSettings) return;

  if (containerSettings.backgroundColor) {
    container.style.backgroundColor = containerSettings.backgroundColor;
  }

  if (containerSettings.borderRadius !== undefined) {
    container.style.borderRadius = `${containerSettings.borderRadius}px`;
  }

  if (containerSettings.borderWidth !== undefined) {
    const borderStyle = containerSettings.borderStyle || 'solid';
    const borderColor = containerSettings.borderColor || '#000000';
    container.style.border = `${containerSettings.borderWidth}px ${borderStyle} ${borderColor}`;
  }

  if (containerSettings.maxWidth) {
    const maxWidthUnit = containerSettings.maxWidthUnit || 'px';
    container.style.maxWidth = `${containerSettings.maxWidth}${maxWidthUnit}`;
  }
}

/**
 * Apply content styles
 */
function applyContentStyles(
  contentContainer: HTMLElement,
  config: InAppMessageConfig
): void {
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

/**
 * Render a banner message
 */
function renderBanner(
  message: InAppMessage,
  options: RenderOptions
): HTMLElement {
  const config = message.config;
  const messageType = config.messageType || 'banner';
  const position = config.position || 'top';
  const blocks = getBlocks(config);

  // Create banner container
  const banner = document.createElement('div');
  banner.id = `tappd-message-${message._id}`;
  banner.className = `tappd-message tappd-message-banner tappd-message-${position}`;

  // Position styles
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

  // Apply container styles
  applyContainerStyles(banner, config);

  // Create content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'tappd-message-content';
  contentWrapper.style.padding = '16px';
  contentWrapper.style.display = 'flex';
  contentWrapper.style.alignItems = 'center';
  contentWrapper.style.justifyContent = 'space-between';
  contentWrapper.style.maxWidth = '1200px';
  contentWrapper.style.margin = '0 auto';

  // Create blocks container
  const blocksContainer = document.createElement('div');
  blocksContainer.className = 'tappd-message-blocks';
  blocksContainer.style.flex = '1';

  // Apply content styles
  applyContentStyles(blocksContainer, config);

  // Render blocks
  const blockElements = renderBlocks(blocks, (link, text, action) => {
    if (options.onButtonClick) {
      options.onButtonClick(message._id, link, text, action);
    }
  });

  blockElements.forEach((blockEl) => {
    blocksContainer.appendChild(blockEl);
  });

  contentWrapper.appendChild(blocksContainer);

  // Add dismiss button if dismissible
  if (config.dismissible !== false) {
    const dismissButton = document.createElement('button');
    dismissButton.className = 'tappd-message-dismiss';
    dismissButton.innerHTML = '×';
    dismissButton.style.background = 'none';
    dismissButton.style.border = 'none';
    dismissButton.style.fontSize = '24px';
    dismissButton.style.cursor = 'pointer';
    dismissButton.style.padding = '0 8px';
    dismissButton.style.marginLeft = '16px';
    dismissButton.setAttribute('aria-label', 'Dismiss');

    dismissButton.addEventListener('click', () => {
      if (options.onDismiss) {
        options.onDismiss(message._id);
      }
    });

    contentWrapper.appendChild(dismissButton);
  }

  banner.appendChild(contentWrapper);

  // Add animation
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

/**
 * Render a popup message
 */
function renderPopup(
  message: InAppMessage,
  options: RenderOptions
): HTMLElement {
  const config = message.config;
  const blocks = getBlocks(config);
  const overlay = config.overlay !== false;
  const overlayOpacity = config.overlayOpacity || 0.5;

  // Create overlay
  const overlayEl = document.createElement('div');
  overlayEl.className = 'tappd-message-overlay';
  overlayEl.style.position = 'fixed';
  overlayEl.style.top = '0';
  overlayEl.style.left = '0';
  overlayEl.style.right = '0';
  overlayEl.style.bottom = '0';
  overlayEl.style.backgroundColor = overlay
    ? `rgba(0, 0, 0, ${overlayOpacity})`
    : 'transparent';
  overlayEl.style.zIndex = '999998';
  overlayEl.style.display = 'flex';
  overlayEl.style.alignItems = 'center';
  overlayEl.style.justifyContent = 'center';

  // Add click to dismiss on overlay
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl && config.dismissible !== false) {
      if (options.onDismiss) {
        options.onDismiss(message._id);
      }
    }
  });

  // Create popup container
  const popup = document.createElement('div');
  popup.id = `tappd-message-${message._id}`;
  popup.className = 'tappd-message tappd-message-popup';
  popup.style.position = 'relative';
  popup.style.backgroundColor = '#ffffff';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  popup.style.maxWidth = '500px';
  popup.style.width = '90%';
  popup.style.maxHeight = '90vh';
  popup.style.overflow = 'auto';
  popup.style.zIndex = '999999';

  // Apply container styles
  applyContainerStyles(popup, config);

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'tappd-message-content';
  contentContainer.style.padding = '24px';

  // Apply content styles
  applyContentStyles(contentContainer, config);

  // Render blocks
  const blockElements = renderBlocks(blocks, (link, text, action) => {
    if (options.onButtonClick) {
      options.onButtonClick(message._id, link, text, action);
    }
  });

  blockElements.forEach((blockEl) => {
    contentContainer.appendChild(blockEl);
  });

  popup.appendChild(contentContainer);

  // Add close button if enabled
  if ((config.showCloseButton !== false && config.closeButton !== false) && (config.showCloseButton !== undefined || config.closeButton !== undefined)) {
    const closeButton = document.createElement('button');
    closeButton.className = 'tappd-message-close';
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '8px';
    closeButton.style.right = '8px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.width = '32px';
    closeButton.style.height = '32px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.setAttribute('aria-label', 'Close');

    closeButton.addEventListener('click', () => {
      if (options.onDismiss) {
        options.onDismiss(message._id);
      }
    });

    popup.appendChild(closeButton);
  }

  overlayEl.appendChild(popup);

  // Add animation
  const animation = config.animation || 'fade';
  if (animation === 'fade') {
    popup.style.opacity = '0';
    popup.style.transform = 'scale(0.95)';
    setTimeout(() => {
      popup.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      popup.style.opacity = '1';
      popup.style.transform = 'scale(1)';
    }, 10);
  } else if (animation === 'slide') {
    popup.style.transform = 'translateY(20px)';
    popup.style.opacity = '0';
    setTimeout(() => {
      popup.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      popup.style.opacity = '1';
      popup.style.transform = 'translateY(0)';
    }, 10);
  }

  return overlayEl;
}

/**
 * Render a modal message (similar to popup but larger)
 */
function renderModal(
  message: InAppMessage,
  options: RenderOptions
): HTMLElement {
  const config = message.config;
  const blocks = getBlocks(config);
  const overlay = config.overlay !== false;
  const overlayOpacity = config.overlayOpacity || 0.5;

  // Create overlay
  const overlayEl = document.createElement('div');
  overlayEl.className = 'tappd-message-overlay';
  overlayEl.style.position = 'fixed';
  overlayEl.style.top = '0';
  overlayEl.style.left = '0';
  overlayEl.style.right = '0';
  overlayEl.style.bottom = '0';
  overlayEl.style.backgroundColor = overlay
    ? `rgba(0, 0, 0, ${overlayOpacity})`
    : 'transparent';
  overlayEl.style.zIndex = '999998';
  overlayEl.style.display = 'flex';
  overlayEl.style.alignItems = 'center';
  overlayEl.style.justifyContent = 'center';

  // Add click to dismiss on overlay
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl && config.dismissible !== false) {
      if (options.onDismiss) {
        options.onDismiss(message._id);
      }
    }
  });

  // Create modal container
  const modal = document.createElement('div');
  modal.id = `tappd-message-${message._id}`;
  modal.className = 'tappd-message tappd-message-modal';
  modal.style.position = 'relative';
  modal.style.backgroundColor = '#ffffff';
  modal.style.borderRadius = '8px';
  modal.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
  modal.style.maxWidth = '600px';
  modal.style.width = '90%';
  modal.style.maxHeight = '90vh';
  modal.style.overflow = 'auto';
  modal.style.zIndex = '999999';

  // Apply container styles
  applyContainerStyles(modal, config);

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'tappd-message-content';
  contentContainer.style.padding = '32px';

  // Apply content styles
  applyContentStyles(contentContainer, config);

  // Render blocks
  const blockElements = renderBlocks(blocks, (link, text, action) => {
    if (options.onButtonClick) {
      options.onButtonClick(message._id, link, text, action);
    }
  });

  blockElements.forEach((blockEl) => {
    contentContainer.appendChild(blockEl);
  });

  modal.appendChild(contentContainer);

  // Add close button if enabled
  if ((config.showCloseButton !== false && config.closeButton !== false) && (config.showCloseButton !== undefined || config.closeButton !== undefined)) {
    const closeButton = document.createElement('button');
    closeButton.className = 'tappd-message-close';
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '12px';
    closeButton.style.right = '12px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '28px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.width = '36px';
    closeButton.style.height = '36px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.setAttribute('aria-label', 'Close');

    closeButton.addEventListener('click', () => {
      if (options.onDismiss) {
        options.onDismiss(message._id);
      }
    });

    modal.appendChild(closeButton);
  }

  overlayEl.appendChild(modal);

  // Add animation
  const animation = config.animation || 'fade';
  if (animation === 'fade') {
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    setTimeout(() => {
      modal.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    }, 10);
  } else if (animation === 'slide') {
    modal.style.transform = 'translateY(30px)';
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      modal.style.opacity = '1';
      modal.style.transform = 'translateY(0)';
    }, 10);
  }

  return overlayEl;
}

/**
 * Render a full screen message
 */
function renderFullScreen(
  message: InAppMessage,
  options: RenderOptions
): HTMLElement {
  const config = message.config;
  const currentPageIndex = getCurrentPageIndex(config, options);
  const blocks = getBlocks(config, currentPageIndex);

  // Create full screen container
  const fullScreen = document.createElement('div');
  fullScreen.id = `tappd-message-${message._id}`;
  fullScreen.className = 'tappd-message tappd-message-fullscreen';
  fullScreen.style.position = 'fixed';
  fullScreen.style.top = '0';
  fullScreen.style.left = '0';
  fullScreen.style.right = '0';
  fullScreen.style.bottom = '0';
  fullScreen.style.width = '100%';
  fullScreen.style.height = '100%';
  fullScreen.style.zIndex = '999999';
  fullScreen.style.backgroundColor = config.backgroundColor || '#ffffff';
  fullScreen.style.overflow = 'auto';

  // Apply container styles
  applyContainerStyles(fullScreen, config);

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'tappd-message-content';
  contentContainer.style.padding = '32px';
  contentContainer.style.width = '100%';
  contentContainer.style.height = '100%';
  contentContainer.style.display = 'flex';
  contentContainer.style.flexDirection = 'column';

  // Apply content styles
  applyContentStyles(contentContainer, config);

  // Add close button if enabled
  if ((config.showCloseButton !== false && config.closeButton !== false) && (config.showCloseButton !== undefined || config.closeButton !== undefined)) {
    const closeButton = document.createElement('button');
    closeButton.className = 'tappd-message-close';
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '16px';
    closeButton.style.right = '16px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '32px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.width = '40px';
    closeButton.style.height = '40px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.zIndex = '10';
    closeButton.setAttribute('aria-label', 'Close');

    closeButton.addEventListener('click', () => {
      if (options.onDismiss) {
        options.onDismiss(message._id);
      }
    });

    fullScreen.appendChild(closeButton);
  }

  // Add navigation buttons if multiple pages
  if (config.pages && config.pages.length > 1 && config.showNavigationButtons !== false) {
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
    fullScreen.appendChild(navContainer);
  }

  // Render blocks
  const blockElements = renderBlocks(blocks, (link, text, action) => {
    if (options.onButtonClick) {
      options.onButtonClick(message._id, link, text, action);
    }
  });

  blockElements.forEach((blockEl) => {
    contentContainer.appendChild(blockEl);
  });

  fullScreen.appendChild(contentContainer);

  // Add animation
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

/**
 * Render a notification message
 */
function renderNotification(
  message: InAppMessage,
  options: RenderOptions
): HTMLElement {
  const config = message.config;
  const currentPageIndex = getCurrentPageIndex(config, options);
  const blocks = getBlocks(config, currentPageIndex);
  const position = config.notificationPosition || 'top';
  const animationDirection = config.notificationAnimation || 'down';

  // Create notification container
  const notification = document.createElement('div');
  notification.id = `tappd-message-${message._id}`;
  notification.className = `tappd-message tappd-message-notification tappd-message-notification-${position}`;
  
  // Position styles
  notification.style.position = 'fixed';
  notification.style.zIndex = '999999';
  notification.style.backgroundColor = config.backgroundColor || '#ffffff';
  notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  notification.style.borderRadius = '8px';
  notification.style.padding = '16px';
  notification.style.maxWidth = '400px';
  notification.style.width = '90%';
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.gap = '12px';

  // Set position
  if (position === 'top') {
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
  } else if (position === 'bottom') {
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
  } else if (position === 'left') {
    notification.style.left = '20px';
    notification.style.top = '50%';
    notification.style.transform = 'translateY(-50%)';
  } else if (position === 'right') {
    notification.style.right = '20px';
    notification.style.top = '50%';
    notification.style.transform = 'translateY(-50%)';
  }

  // Find image and text blocks
  const imageBlock = blocks.find(b => b.type === 'image');
  const textBlocks = blocks.filter(b => b.type === 'text' || b.type === 'html');

  // Render image on left
  if (imageBlock) {
    const imageContainer = document.createElement('div');
    imageContainer.style.flexShrink = '0';
    const imageEl = renderBlocks([imageBlock], (link, text, action) => {
      if (options.onButtonClick) {
        options.onButtonClick(message._id, link, text, action);
      }
    })[0];
    imageContainer.appendChild(imageEl);
    notification.appendChild(imageContainer);
  }

  // Render text on right
  if (textBlocks.length > 0) {
    const textContainer = document.createElement('div');
    textContainer.style.flex = '1';
    const textElements = renderBlocks(textBlocks, (link, text, action) => {
      if (options.onButtonClick) {
        options.onButtonClick(message._id, link, text, action);
      }
    });
    textElements.forEach((el) => {
      textContainer.appendChild(el);
    });
    notification.appendChild(textContainer);
  }

  // Add close button if enabled
  if ((config.showCloseButton !== false && config.closeButton !== false) && (config.showCloseButton !== undefined || config.closeButton !== undefined)) {
    const closeButton = document.createElement('button');
    closeButton.className = 'tappd-message-close';
    closeButton.innerHTML = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.width = '24px';
    closeButton.style.height = '24px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.flexShrink = '0';
    closeButton.setAttribute('aria-label', 'Close');

    closeButton.addEventListener('click', () => {
      if (options.onDismiss) {
        options.onDismiss(message._id);
      }
    });

    notification.appendChild(closeButton);
  }

  // Add slide animation
  const initialTransform = (() => {
    if (animationDirection === 'up') return 'translateY(100%)';
    if (animationDirection === 'down') return 'translateY(-100%)';
    if (animationDirection === 'left') return 'translateX(100%)';
    if (animationDirection === 'right') return 'translateX(-100%)';
    return 'translateY(-100%)';
  })();

  notification.style.transform = position === 'top' || position === 'bottom'
    ? `translateX(-50%) ${initialTransform}`
    : initialTransform;

  setTimeout(() => {
    notification.style.transition = 'transform 0.3s ease-out';
    notification.style.transform = position === 'top' || position === 'bottom'
      ? 'translateX(-50%) translateY(0)'
      : position === 'left' || position === 'right'
      ? 'translateY(-50%) translateX(0)'
      : 'translateX(-50%) translateY(0)';
  }, 10);

  return notification;
}

/**
 * Render a message based on its type
 */
export function renderMessage(
  message: InAppMessage,
  options: RenderOptions = {}
): HTMLElement {
  const config = message.config;
  const messageType = config.messageType || 'popup';

  let container: HTMLElement;

  switch (messageType) {
    case 'banner':
      container = renderBanner(message, options);
      break;
    case 'popup':
      // Map popup to modal behavior
      container = renderModal(message, options);
      break;
    case 'modal':
      container = renderModal(message, options);
      break;
    case 'full_screen':
      container = renderFullScreen(message, options);
      break;
    case 'notification':
      container = renderNotification(message, options);
      break;
    default:
      container = renderModal(message, options);
  }

  // Append to body or custom container
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

