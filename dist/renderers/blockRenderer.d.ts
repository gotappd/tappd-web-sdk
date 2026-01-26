/**
 * Block Renderer for In-App Messages
 * Renders individual blocks (image, text, button, HTML)
 */
import type { Block } from '../types/inAppMessage';
/**
 * Render an image block
 */
export declare function renderImageBlock(block: Block): HTMLElement;
/**
 * Render a text block
 */
export declare function renderTextBlock(block: Block): HTMLElement;
/**
 * Render a button block
 */
export declare function renderButtonBlock(block: Block, onButtonClick?: (link: string, text: string, action?: any) => void): HTMLElement;
/**
 * Render an HTML block
 */
export declare function renderHtmlBlock(block: Block): HTMLElement;
/**
 * Render a block based on its type
 */
export declare function renderBlock(block: Block, onButtonClick?: (link: string, text: string, action?: any) => void): HTMLElement;
/**
 * Render multiple blocks
 */
export declare function renderBlocks(blocks: Block[], onButtonClick?: (link: string, text: string, action?: any) => void): HTMLElement[];
//# sourceMappingURL=blockRenderer.d.ts.map