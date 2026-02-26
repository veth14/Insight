/**
 * responsive.ts
 *
 * Proportional scaling utilities so the UI looks identical across
 * different phone screen sizes (small Android, iPhone SE, iPhone Pro Max, tablets, etc.)
 *
 * Reference design dimensions — these match what was used when building the screens.
 * Adjust if your Figma / emulator was a different size.
 */
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Reference device: iPhone 14 / Pixel 6a  (390 × 844 logical pixels)
const BASE_WIDTH  = 390;
const BASE_HEIGHT = 844;

// ─── Core scale functions ─────────────────────────────────────────────────────

/**
 * Horizontal scale.
 * Use for widths, horizontal padding/margins, icon sizes.
 *
 * @example  width: scale(48)
 */
export const scale = (size: number): number =>
    Math.round(PixelRatio.roundToNearestPixel((SCREEN_W / BASE_WIDTH) * size));

/**
 * Vertical scale.
 * Use for heights, vertical padding/margins.
 *
 * @example  height: vs(56)
 */
export const vs = (size: number): number =>
    Math.round(PixelRatio.roundToNearestPixel((SCREEN_H / BASE_HEIGHT) * size));

/**
 * Moderate scale — recommended for font sizes and border radii.
 * Scales less aggressively than `scale` so text doesn't blow up on tablets.
 *
 * factor = 0 → no scaling (fixed size)
 * factor = 1 → same as `scale`
 * factor = 0.5 (default) → halfway between
 *
 * @example  fontSize: ms(14)
 */
export const ms = (size: number, factor: number = 0.5): number =>
    Math.round(PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor));

// ─── Convenience aliases ──────────────────────────────────────────────────────

/** Screen width of the current device */
export const SW = SCREEN_W;

/** Screen height of the current device */
export const SH = SCREEN_H;

/**
 * Returns a percentage of the screen width.
 * @example  width: wp(90)  // 90% of screen width
 */
export const wp = (percent: number): number =>
    Math.round(PixelRatio.roundToNearestPixel((SCREEN_W * percent) / 100));

/**
 * Returns a percentage of the screen height.
 * @example  height: hp(10)  // 10% of screen height
 */
export const hp = (percent: number): number =>
    Math.round(PixelRatio.roundToNearestPixel((SCREEN_H * percent) / 100));
