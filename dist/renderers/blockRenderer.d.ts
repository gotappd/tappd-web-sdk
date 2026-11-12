/**
 * Block Renderer for In-App Messages
 */
import type { Block } from '../types/inAppMessage';
export interface BlockRenderCallbacks {
    onButtonClick?: (link: string, text: string, action?: any) => void;
    onFormSubmit?: (formData: Record<string, any>, submitAction?: any) => void;
}
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
 * Single input block (dashboard `input` type)
 */
export declare function renderInputBlock(block: Block): HTMLElement;
/**
 * Form block with submit
 */
export declare function renderFormBlock(block: Block, callbacks?: BlockRenderCallbacks): HTMLElement;
/**
 * Spacer / vertical gap block
 */
export declare function renderSpacerBlock(block: Block): HTMLElement;
/**
 * Countdown timer. Time always comes from the clock, so it stays right after the tab sleeps, and
 * the interval stops by itself once the message has been removed from the page.
 */
export declare function renderCountdownBlock(block: Block): HTMLElement;
/**
 * Row block with nested blocks
 */
export declare function renderRowBlock(block: Block, callbacks?: BlockRenderCallbacks): HTMLElement;
/**
 * Render a block based on its type
 */
export declare function renderBlock(block: Block, callbacks?: BlockRenderCallbacks): HTMLElement;
/**
 * Render multiple blocks
 */
export declare function renderBlocks(blocks: Block[], callbacks?: BlockRenderCallbacks): HTMLElement[];
//# sourceMappingURL=blockRenderer.d.ts.map