/**
 * Message Renderer for In-App Messages
 * Layout values come from resolveIamCanvasLayout (dashboard preview parity).
 */
import type { InAppMessage } from '../types/inAppMessage';
interface RenderOptions {
    onDismiss?: (messageId: string) => void;
    onButtonClick?: (messageId: string, link: string, text: string, action?: any) => void;
    onFormSubmit?: (messageId: string, formData: Record<string, any>, submitAction?: any) => void;
    onNavigatePage?: (messageId: string, pageIndex: number) => void;
    containerId?: string;
    currentPageIndex?: number;
}
export declare function renderMessage(message: InAppMessage, options?: RenderOptions): HTMLElement;
export {};
//# sourceMappingURL=messageRenderer.d.ts.map