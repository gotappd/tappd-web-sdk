/**
 * Type definitions for In-App Messages
 */
export type InAppMessageType = 'banner' | 'popup' | 'modal';
export type BannerPosition = 'top' | 'bottom' | 'center';
export type AnimationType = 'slide' | 'fade' | 'none';
export type Alignment = 'left' | 'center' | 'right' | 'full' | 'justify';
export type BlockType = 'image' | 'text' | 'button' | 'html';
export interface ImageBlockConfig {
    url: string;
    alt?: string;
    width?: string;
    height?: string;
    alignment?: Alignment;
}
export interface TextBlockConfig {
    content: string;
    alignment?: Alignment;
    fontSize?: string;
    fontWeight?: 'normal' | 'bold';
    color?: string;
}
export interface ButtonBlockConfig {
    text: string;
    link: string;
    textColor?: string;
    backgroundColor?: string;
    linkBehavior?: 'deeplink' | 'in_app' | 'browser';
    alignment?: Alignment;
    action?: {
        type: string;
        [key: string]: any;
    };
}
export interface HtmlBlockConfig {
    content: string;
}
export interface BlockConfig {
    image?: ImageBlockConfig;
    text?: TextBlockConfig;
    button?: ButtonBlockConfig;
    html?: HtmlBlockConfig;
}
export interface Block {
    id: string;
    type: BlockType;
    order: number;
    config: BlockConfig;
}
export interface InAppMessagePage {
    id: string;
    name: string;
    blocks: Block[];
    settings?: {
        backgroundColor?: string;
        backgroundImage?: string;
        maxWidth?: string;
        borderRadius?: string;
        [key: string]: any;
    };
}
export interface MessageContainerSettings {
    displayType?: InAppMessageType;
    maxWidth?: string;
    maxWidthUnit?: 'px' | 'em' | '%';
    backgroundColor?: string;
    backgroundOpacity?: number;
    backgroundImage?: string;
    backgroundImageEnabled?: boolean;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
    borderColor?: string;
    borderRadius?: number;
}
export interface ContentSettings {
    defaultFontFamily?: string;
    customFonts?: string[];
    contentAlignment?: 'left' | 'center' | 'right';
    defaultFontSize?: string;
    defaultLineHeight?: string;
    defaultTextColor?: string;
}
export interface TriggerConfig {
    type: 'delay' | 'event' | 'page_visit' | 'immediate';
    delay?: {
        value: number;
        unit: 'seconds' | 'minutes' | 'hours';
    };
    eventName?: string;
    pagePath?: string;
    conditions?: any;
}
export interface ExpirationConfig {
    type: 'duration' | 'event' | 'never';
    duration?: {
        value: number;
        unit: 'minutes' | 'hours' | 'days';
    };
    eventName?: string;
    conditions?: any;
}
export interface InAppMessageConfig {
    messageType: InAppMessageType;
    blocks?: Block[];
    pages?: InAppMessagePage[];
    position?: BannerPosition;
    animation?: AnimationType;
    backgroundColor?: string;
    dismissible?: boolean;
    closeButton?: boolean;
    overlay?: boolean;
    overlayOpacity?: number;
    containerSettings?: MessageContainerSettings;
    contentSettings?: ContentSettings;
    triggerConfig?: TriggerConfig;
    expirationConfig?: ExpirationConfig;
    version?: string;
}
export interface InAppMessage {
    _id: string;
    workspaceId: string;
    journeyId: string;
    enrollmentId: string;
    stepId: string;
    customerId: string;
    config: InAppMessageConfig;
    triggerConfig?: TriggerConfig;
    expirationConfig?: ExpirationConfig;
    status: 'pending' | 'delivered' | 'expired' | 'dismissed';
    triggeredAt?: Date | string;
    expiresAt?: Date | string;
    deliveredAt?: Date | string;
    dismissedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
//# sourceMappingURL=inAppMessage.d.ts.map