/**
 * Block Renderer for In-App Messages
 * Renders individual blocks (image, text, button, HTML)
 */

import type { Block, BlockConfig } from '../types/inAppMessage';

/**
 * Render an image block
 */
export function renderImageBlock(block: Block): HTMLElement {
  const config = block.config.image;
  if (!config) {
    return document.createElement('div');
  }

  const img = document.createElement('img');
  img.src = config.url || '';
  img.alt = config.alt || '';
  
  if (config.width) {
    img.style.width = config.width;
  }
  if (config.height) {
    img.style.height = config.height;
  }

  // Handle alignment
  const container = document.createElement('div');
  container.className = 'tappd-block-image';
  
  if (config.alignment === 'full') {
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
  } else {
    container.style.textAlign = config.alignment || 'left';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'inline-block';
  }

  img.addEventListener('error', () => {
    img.style.display = 'none';
  });

  container.appendChild(img);
  return container;
}

/**
 * Render a text block
 */
export function renderTextBlock(block: Block): HTMLElement {
  const config = block.config.text;
  if (!config) {
    return document.createElement('div');
  }

  const container = document.createElement('div');
  container.className = 'tappd-block-text';

  // Apply alignment
  const alignment = config.alignment || 'left';
  container.style.textAlign = alignment;

  // Apply font size
  if (config.fontSize) {
    const fontSizeMap: Record<string, string> = {
      'sm': '0.875rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    };
    container.style.fontSize = fontSizeMap[config.fontSize] || config.fontSize;
  }

  // Apply font weight
  if (config.fontWeight) {
    container.style.fontWeight = config.fontWeight === 'bold' ? '700' : '400';
  }

  // Apply color
  if (config.color) {
    container.style.color = config.color;
  }

  // Set content (sanitize HTML)
  const content = config.content || '';
  // Basic HTML escaping and line break handling
  const sanitizedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
  
  container.innerHTML = sanitizedContent;
  return container;
}

/**
 * Render a button block
 */
export function renderButtonBlock(
  block: Block,
  onButtonClick?: (link: string, text: string, action?: any) => void
): HTMLElement {
  const config = block.config.button;
  if (!config) {
    return document.createElement('div');
  }

  const container = document.createElement('div');
  container.className = 'tappd-block-button';
  
  // Apply alignment
  const alignment = config.alignment || 'left';
  container.style.textAlign = alignment;

  const button = document.createElement('button');
  button.textContent = config.text || 'Click Here';
  button.className = 'tappd-button';

  // Apply button styles
  if (config.textColor) {
    button.style.color = config.textColor;
  }
  if (config.backgroundColor) {
    button.style.backgroundColor = config.backgroundColor;
  }
  
  // Default button styles
  button.style.padding = '10px 20px';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '14px';
  button.style.fontWeight = '500';
  button.style.transition = 'opacity 0.2s';

  // Add hover effect
  button.addEventListener('mouseenter', () => {
    button.style.opacity = '0.9';
  });
  button.addEventListener('mouseleave', () => {
    button.style.opacity = '1';
  });

  // Handle click - support bridge actions and href="tappd.closeIAM()"
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check for special href patterns like "tappd.closeIAM()"
    const link = config.link || '#';
    if (link.includes('tappd.closeIAM()')) {
      const messageIdMatch = link.match(/tappd\.closeIAM\(['"]?([^'")]*)['"]?\)/);
      const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
      if ((window as any).tappd && (window as any).tappd.closeIAM) {
        (window as any).tappd.closeIAM(messageId);
        if (onButtonClick) {
          onButtonClick(link, config.text || '');
        }
        return;
      }
    }
    
    // Check for tappd.nextPage() or tappd.previousPage()
    if (link.includes('tappd.nextPage()')) {
      const messageIdMatch = link.match(/tappd\.nextPage\(['"]?([^'")]*)['"]?\)/);
      const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
      if ((window as any).tappd && (window as any).tappd.nextPage) {
        (window as any).tappd.nextPage(messageId);
        if (onButtonClick) {
          onButtonClick(link, config.text || '');
        }
        return;
      }
    }
    
    if (link.includes('tappd.previousPage()')) {
      const messageIdMatch = link.match(/tappd\.previousPage\(['"]?([^'")]*)['"]?\)/);
      const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
      if ((window as any).tappd && (window as any).tappd.previousPage) {
        (window as any).tappd.previousPage(messageId);
        if (onButtonClick) {
          onButtonClick(link, config.text || '');
        }
        return;
      }
    }
    
    // Check if action is configured
    if (config.action && config.action.type !== 'none') {
      if (onButtonClick) {
        // Pass action data to handler
        onButtonClick(config.link || '#', config.text || '', config.action);
      }
    } else if (onButtonClick) {
      // Legacy: use link
      onButtonClick(config.link || '#', config.text || '');
    } else {
      // Default behavior
      if (config.link && config.link !== '#') {
        if (config.linkBehavior === 'browser' || !config.linkBehavior) {
          window.open(config.link, '_blank');
        } else {
          window.location.href = config.link;
        }
      }
    }
  });

  container.appendChild(button);
  return container;
}

/**
 * Render an HTML block
 */
export function renderHtmlBlock(block: Block): HTMLElement {
  const config = block.config.html;
  if (!config) {
    return document.createElement('div');
  }

  const container = document.createElement('div');
  container.className = 'tappd-block-html';

  // Basic HTML sanitization (in production, use a proper sanitization library)
  // For now, we'll allow HTML but be cautious
  const content = config.content || '';
  
  // Create a temporary container to parse HTML safely
  const temp = document.createElement('div');
  temp.innerHTML = content;
  
  // Move all nodes to the container
  while (temp.firstChild) {
    container.appendChild(temp.firstChild);
  }

  // Ensure images are responsive
  const images = container.querySelectorAll('img');
  images.forEach((img) => {
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
  });

  // Handle href="tappd.closeIAM()" and similar in HTML links/anchor tags
  const links = container.querySelectorAll('a[href]');
  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href.includes('tappd.closeIAM()')) {
      const messageIdMatch = href.match(/tappd\.closeIAM\(['"]?([^'")]*)['"]?\)/);
      const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if ((window as any).tappd && (window as any).tappd.closeIAM) {
          (window as any).tappd.closeIAM(messageId);
        }
      });
    } else if (href.includes('tappd.nextPage()')) {
      const messageIdMatch = href.match(/tappd\.nextPage\(['"]?([^'")]*)['"]?\)/);
      const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if ((window as any).tappd && (window as any).tappd.nextPage) {
          (window as any).tappd.nextPage(messageId);
        }
      });
    } else if (href.includes('tappd.previousPage()')) {
      const messageIdMatch = href.match(/tappd\.previousPage\(['"]?([^'")]*)['"]?\)/);
      const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if ((window as any).tappd && (window as any).tappd.previousPage) {
          (window as any).tappd.previousPage(messageId);
        }
      });
    }
  });

  return container;
}

/**
 * Render a block based on its type
 */
export function renderBlock(
  block: Block,
  onButtonClick?: (link: string, text: string, action?: any) => void
): HTMLElement {
  switch (block.type) {
    case 'image':
      return renderImageBlock(block);
    case 'text':
      return renderTextBlock(block);
    case 'button':
      return renderButtonBlock(block, onButtonClick);
    case 'html':
      return renderHtmlBlock(block);
    default:
      return document.createElement('div');
  }
}

/**
 * Render multiple blocks
 */
export function renderBlocks(
  blocks: Block[],
  onButtonClick?: (link: string, text: string, action?: any) => void
): HTMLElement[] {
  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  
  return sortedBlocks.map((block) => renderBlock(block, onButtonClick));
}

