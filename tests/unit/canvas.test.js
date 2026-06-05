/**
 * canvas.test.js — Property-based tests for canvas sizing and scaling.
 * Properties 19, 20, 21 from design document.
 * Implemented in tasks 12.2, 12.3, 12.4.
 */

import fc from 'fast-check';
import {
  calculateCanvasSize,
  calculateScaleFactor,
  resizeCanvas,
} from '../../src/utils/canvasSizing.js';
import CONFIG from '../../src/config.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Viewport width/height arbitrary: 100–2000 px */
const viewportArb = fc.record({
  w: fc.integer({ min: 100, max: 2000 }),
  h: fc.integer({ min: 100, max: 2000 }),
});

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Property 19: Canvas Aspect Ratio
 * **Validates: Requirements 9.1, 9.2**
 *
 * For any viewport dimensions (viewportWidth, viewportHeight), the calculated
 * canvas dimensions SHALL maintain the configured aspect ratio
 * (canvasWidth / canvasHeight = CONFIG.aspectRatio) and fit within the viewport
 * (canvasWidth <= viewportWidth AND canvasHeight <= viewportHeight).
 */
describe('Canvas Sizing — Property 19: Canvas Aspect Ratio', () => {
  it('width / height equals CONFIG.aspectRatio for any viewport size', () => {
    fc.assert(
      fc.property(viewportArb, ({ w, h }) => {
        const { width, height } = calculateCanvasSize(w, h);
        const ratio = width / height;
        // Allow small floating-point tolerance
        return Math.abs(ratio - CONFIG.aspectRatio) < 0.0001;
      }),
      { numRuns: 100 }
    );
  });

  it('canvas width is always <= viewport width', () => {
    fc.assert(
      fc.property(viewportArb, ({ w, h }) => {
        const { width } = calculateCanvasSize(w, h);
        return width <= Math.max(1, w) + 0.0001;
      }),
      { numRuns: 100 }
    );
  });

  it('canvas height is always <= viewport height', () => {
    fc.assert(
      fc.property(viewportArb, ({ w, h }) => {
        const { height } = calculateCanvasSize(w, h);
        return height <= Math.max(1, h) + 0.0001;
      }),
      { numRuns: 100 }
    );
  });

  it('aspect ratio is maintained for viewports that are wider than they are tall', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 600, max: 2000 }), // wide
        fc.integer({ min: 100, max: 599 }),  // short
        (w, h) => {
          const { width, height } = calculateCanvasSize(w, h);
          return Math.abs(width / height - CONFIG.aspectRatio) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('aspect ratio is maintained for viewports that are taller than they are wide', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 599 }),  // narrow
        fc.integer({ min: 600, max: 2000 }), // tall
        (w, h) => {
          const { width, height } = calculateCanvasSize(w, h);
          return Math.abs(width / height - CONFIG.aspectRatio) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Property 20: Proportional Element Scaling
 * **Validates: Requirements 9.4**
 *
 * For any canvas width, all game elements SHALL scale proportionally where
 * scaledSize = baseSize * (canvasWidth / baseCanvasWidth), ensuring consistent visual
 * proportions across different canvas sizes.
 */
describe('Canvas Sizing — Property 20: Proportional Element Scaling', () => {
  it('calculateScaleFactor returns canvasWidth / CONFIG.baseCanvasWidth', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4000 }),
        (canvasWidth) => {
          const scale = calculateScaleFactor(canvasWidth);
          const expected = canvasWidth / CONFIG.baseCanvasWidth;
          return Math.abs(scale - expected) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('scale factor is exactly 1.0 at baseCanvasWidth', () => {
    const scale = calculateScaleFactor(CONFIG.baseCanvasWidth);
    expect(Math.abs(scale - 1.0)).toBeLessThan(0.0001);
  });

  it('doubling canvas width doubles the scale factor (proportionality)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000 }),
        (canvasWidth) => {
          const scale1 = calculateScaleFactor(canvasWidth);
          const scale2 = calculateScaleFactor(canvasWidth * 2);
          return Math.abs(scale2 - scale1 * 2) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('resizeCanvas returns scale factor equal to calculateScaleFactor of the computed canvas width', () => {
    // Note: canvas.width is an integer IDL attribute — it truncates fractional
    // pixel values.  resizeCanvas computes the scale factor from the
    // floating-point width BEFORE that truncation, so we verify the returned
    // scale equals calculateScaleFactor(calculateCanvasSize(...).width).
    fc.assert(
      fc.property(viewportArb, ({ w, h }) => {
        const canvas = document.createElement('canvas');
        const returnedScale = resizeCanvas(canvas, w, h);

        // The scale is derived from the floating-point width, not the integer
        // canvas.width attribute.
        const { width } = calculateCanvasSize(w, h);
        const expectedScale = calculateScaleFactor(width);

        return Math.abs(returnedScale - expectedScale) < 0.0001;
      }),
      { numRuns: 100 }
    );
  });

  it('scale factor is monotonically increasing with canvas width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1999 }),
        (w1) => {
          const w2 = w1 + 1;
          return calculateScaleFactor(w1) < calculateScaleFactor(w2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Property 21: Resize State Preservation
 * **Validates: Requirements 9.5**
 *
 * After resizeCanvas(), canvas.width and canvas.height match
 * calculateCanvasSize() output; canvas.style dimensions are set as pixel
 * strings; calling resizeCanvas() multiple times always produces consistent
 * results.
 *
 * Implementation note: canvas.width / canvas.height are integer IDL attributes
 * in HTML — they truncate any fractional value.  The style strings, however,
 * preserve the floating-point value as returned by calculateCanvasSize().
 */
describe('Canvas Sizing — Property 21: Resize State Preservation', () => {
  it('canvas.width and canvas.height are the integer-truncated calculateCanvasSize() values after resizeCanvas()', () => {
    fc.assert(
      fc.property(viewportArb, ({ w, h }) => {
        const canvas = document.createElement('canvas');
        resizeCanvas(canvas, w, h);

        const { width, height } = calculateCanvasSize(w, h);
        // canvas.width is a DOMstring → integer conversion (truncation)
        return (
          canvas.width === Math.trunc(width) &&
          canvas.height === Math.trunc(height)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('canvas.style.width and canvas.style.height are set as pixel strings matching calculateCanvasSize()', () => {
    fc.assert(
      fc.property(viewportArb, ({ w, h }) => {
        const canvas = document.createElement('canvas');
        resizeCanvas(canvas, w, h);

        const { width, height } = calculateCanvasSize(w, h);
        return (
          canvas.style.width === `${width}px` &&
          canvas.style.height === `${height}px`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('calling resizeCanvas() multiple times with the same viewport produces identical results', () => {
    fc.assert(
      fc.property(viewportArb, ({ w, h }) => {
        const canvas = document.createElement('canvas');

        const scale1 = resizeCanvas(canvas, w, h);
        const w1 = canvas.width;
        const h1 = canvas.height;
        const sw1 = canvas.style.width;
        const sh1 = canvas.style.height;

        // Call again — should be idempotent
        const scale2 = resizeCanvas(canvas, w, h);

        return (
          Math.abs(scale1 - scale2) < 0.0001 &&
          canvas.width === w1 &&
          canvas.height === h1 &&
          canvas.style.width === sw1 &&
          canvas.style.height === sh1
        );
      }),
      { numRuns: 100 }
    );
  });

  it('resize with different viewport produces dimensions consistent with calculateCanvasSize()', () => {
    fc.assert(
      fc.property(
        viewportArb,
        viewportArb,
        ({ w: w1, h: h1 }, { w: w2, h: h2 }) => {
          const canvas = document.createElement('canvas');

          // First resize
          resizeCanvas(canvas, w1, h1);

          // Second resize with (possibly) different dimensions
          resizeCanvas(canvas, w2, h2);

          const { width, height } = calculateCanvasSize(w2, h2);
          return (
            canvas.width === Math.trunc(width) &&
            canvas.height === Math.trunc(height) &&
            canvas.style.width === `${width}px` &&
            canvas.style.height === `${height}px`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
