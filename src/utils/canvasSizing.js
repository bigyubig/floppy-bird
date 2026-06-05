/**
 * canvasSizing.js — Responsive canvas sizing utilities.
 *
 * Fits the canvas inside the viewport while locking the configured aspect ratio
 * (900×600 / 3:2). Areas outside the canvas are left to the page background
 * (black letterboxing). Game elements scale via calculateScaleFactor().
 */

import CONFIG from '../config.js';

/**
 * Calculate canvas dimensions that maintain the configured aspect ratio (900/600)
 * while fitting entirely within the given viewport. No minimum viewport is
 * enforced — the canvas and all game objects shrink to fit smaller screens.
 *
 * @param {number} viewportWidth  - Viewport width in pixels
 * @param {number} viewportHeight - Viewport height in pixels
 * @returns {{ width: number, height: number }} Canvas dimensions
 */
export function calculateCanvasSize(viewportWidth, viewportHeight) {
  const vw = Math.max(1, viewportWidth);
  const vh = Math.max(1, viewportHeight);
  const targetRatio = CONFIG.aspectRatio; // 900/600 (width / height)

  // Fit by width first; letterbox top/bottom when viewport is taller than ratio.
  let width = vw;
  let height = width / targetRatio;

  // Fit by height instead; letterbox left/right when viewport is wider than ratio.
  if (height > vh) {
    height = vh;
    width = height * targetRatio;
  }

  return { width, height };
}

/**
 * Calculate the scale factor relative to the base canvas width.
 *
 * All game elements are sized as `baseSize * scaleFactor` so that they
 * remain proportional regardless of the actual canvas width.
 *
 * @param {number} canvasWidth - Current canvas width in pixels
 * @returns {number} Scale factor (1.0 at 400 px, the baseline width)
 */
export function calculateScaleFactor(canvasWidth) {
  return canvasWidth / CONFIG.baseCanvasWidth;
}

/**
 * Apply calculated dimensions to a canvas element and return the resulting
 * scale factor.  The canvas CSS size matches its pixel buffer size so there
 * is no blurriness due to devicePixelRatio differences (pixel-perfect fit).
 *
 * @param {HTMLCanvasElement} canvas         - The canvas element to resize
 * @param {number}            viewportWidth  - Current viewport width in pixels
 * @param {number}            viewportHeight - Current viewport height in pixels
 * @returns {number} The scale factor that should be propagated to all subsystems
 */
export function resizeCanvas(canvas, viewportWidth, viewportHeight) {
  const { width, height } = calculateCanvasSize(viewportWidth, viewportHeight);

  canvas.width = width;
  canvas.height = height;

  // Keep CSS size in sync so the canvas is not stretched by the browser
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  return calculateScaleFactor(width);
}
