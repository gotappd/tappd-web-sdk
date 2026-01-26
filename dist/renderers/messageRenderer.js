/**
 * Message Renderer for In-App Messages
 * Renders message containers (banner, popup, modal)
 */
import { renderBlocks } from './blockRenderer';
/**
 * Get blocks from message config
 */
function getBlocks(config) {
    // Support both legacy blocks and new pages structure
    if (config.pages && config.pages.length > 0) {
        // Use first page's blocks
        return config.pages[0].blocks || [];
    }
    return config.blocks || [];
}
/**
 * Apply container styles
 */
function applyContainerStyles(container, config) {
    const containerSettings = config.containerSettings;
    if (!containerSettings)
        return;
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
function applyContentStyles(contentContainer, config) {
    const contentSettings = config.contentSettings;
    if (!contentSettings)
        return;
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
function renderBanner(message, options) {
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
    }
    else if (position === 'bottom') {
        banner.style.bottom = '0';
    }
    else {
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
        }
        else if (position === 'bottom') {
            banner.style.transform = 'translateY(100%)';
            setTimeout(() => {
                banner.style.transition = 'transform 0.3s ease-out';
                banner.style.transform = 'translateY(0)';
            }, 10);
        }
    }
    else if (animation === 'fade') {
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
function renderPopup(message, options) {
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
    if (config.closeButton !== false) {
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
    }
    else if (animation === 'slide') {
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
function renderModal(message, options) {
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
    if (config.closeButton !== false) {
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
    }
    else if (animation === 'slide') {
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
 * Render a message based on its type
 */
export function renderMessage(message, options = {}) {
    const config = message.config;
    const messageType = config.messageType || 'popup';
    let container;
    switch (messageType) {
        case 'banner':
            container = renderBanner(message, options);
            break;
        case 'popup':
            container = renderPopup(message, options);
            break;
        case 'modal':
            container = renderModal(message, options);
            break;
        default:
            container = renderPopup(message, options);
    }
    // Append to body or custom container
    const targetContainer = options.containerId
        ? document.getElementById(options.containerId)
        : document.body;
    if (targetContainer) {
        targetContainer.appendChild(container);
    }
    else {
        document.body.appendChild(container);
    }
    return container;
}
//# sourceMappingURL=messageRenderer.js.map