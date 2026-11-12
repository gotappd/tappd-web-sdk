/**
 * Image shapes for in-app messages. Every shape is built from corner radii because that is what
 * both the web and React Native can draw; CSS clip-path has no React Native equivalent.
 * Same file in `@tappd/web-sdk`, the React Native SDK and the dashboard: keep them in sync.
 */
export type ImageShape = 'square' | 'rounded' | 'soft' | 'pill' | 'circle' | 'arch' | 'leaf';
export interface ImageCorners {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
}
/** Corner radii for a saved shape, or null when unset or unknown so older messages stay as they were. */
export declare function imageShapeCorners(shape: unknown): ImageCorners | null;
/** A circle needs a square image, so it is cropped to fill one. */
export declare function imageShapeIsSquareCrop(shape: unknown): boolean;
/** Radii that fit a measured image, scaled down the way CSS does for overlapping corners. */
export declare function fitImageCorners(corners: ImageCorners, width: number, height: number): ImageCorners;
//# sourceMappingURL=iamImageShape.d.ts.map