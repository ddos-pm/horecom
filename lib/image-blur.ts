/**
 * Shared blur placeholder for product images.
 *
 * A 10×10 light-gray PNG encoded inline. Browser paints it instantly
 * (no extra request) while next/image fetches the real photo. LCP
 * registers on the blur if the photo is slow — which it currently is
 * for the Tilda-CDN-hosted catalog.
 *
 * Generated with `sharp` (small grey square, ~120 bytes after base64).
 * Same gray for every product is intentional: per-product blur hashes
 * would require a build-time script or a DB column, and the visual
 * difference for a generic neutral placeholder is imperceptible at
 * card sizes.
 */
export const PRODUCT_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAFklEQVR42mP8X8/AwMDIQAQAAA/wB1QFGiEAAAAASUVORK5CYII=";

/** next/image quality used for product photos. */
export const PRODUCT_IMAGE_QUALITY = 72;
