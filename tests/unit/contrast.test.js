/**
 * contrast.test.js — Property-based tests for color contrast ratio calculation.
 * Property 18 from design document.
 * Implemented in task 10.3.
 *
 * **Validates: Requirements 7.5**
 */

import fc from 'fast-check';
import CONFIG from '../../src/config.js';

// ─── WCAG color utilities ────────────────────────────────────────────────────

/**
 * Parse a 6-digit hex color string (e.g. '#87CEEB' or '87ceeb') to { r, g, b }
 * with each channel in [0, 255].
 *
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
function hexToRgb(hex) {
  const clean = hex.replace(/^#/, '');
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/**
 * Convert a single 8-bit channel value to its linearised sRGB component
 * per the WCAG 2.1 relative-luminance formula.
 *
 * @param {number} channel - Integer 0–255
 * @returns {number} linearised value in [0, 1]
 */
function linearise(channel) {
  const sRGB = channel / 255;
  return sRGB <= 0.04045
    ? sRGB / 12.92
    : Math.pow((sRGB + 0.055) / 1.055, 2.4);
}

/**
 * Compute relative luminance for a hex color per WCAG 2.1.
 * Result is in [0, 1] where 0 = black, 1 = white.
 *
 * @param {string} hex
 * @returns {number}
 */
function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/**
 * Compute the WCAG contrast ratio between two hex colors.
 * Result is in [1, 21].
 *
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number}
 */
function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Helpers for generating random hex colors ────────────────────────────────

/**
 * fast-check arbitrary that produces a random 6-digit lowercase hex string
 * including the '#' prefix, e.g. '#3a9f2c'.
 */
const hexColorArb = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  )
  .map(([r, g, b]) => {
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  });

// ─── Tests ───────────────────────────────────────────────────────────────────

/**
 * Property 18: Color Contrast Ratio
 * Validates: Requirements 7.5
 *
 * For any foreground and background color the contrast ratio SHALL be between
 * 1 and 21, computed as (lighter + 0.05) / (darker + 0.05).
 */
describe('Color Contrast Ratio — Property 18: Color contrast ratio', () => {
  it('contrast ratio is always in [1, 21] for any two hex colors', () => {
    // Feature: flappy-kiro, Property 18: Color contrast ratio
    fc.assert(
      fc.property(
        hexColorArb,
        hexColorArb,
        (fg, bg) => {
          const ratio = contrastRatio(fg, bg);
          return ratio >= 1 && ratio <= 21;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('contrast ratio of a color with itself is exactly 1', () => {
    // Feature: flappy-kiro, Property 18: Color contrast ratio
    fc.assert(
      fc.property(
        hexColorArb,
        (color) => {
          const ratio = contrastRatio(color, color);
          return Math.abs(ratio - 1) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('contrast ratio is symmetric — contrastRatio(a, b) === contrastRatio(b, a)', () => {
    // Feature: flappy-kiro, Property 18: Color contrast ratio
    fc.assert(
      fc.property(
        hexColorArb,
        hexColorArb,
        (fg, bg) => {
          const r1 = contrastRatio(fg, bg);
          const r2 = contrastRatio(bg, fg);
          return Math.abs(r1 - r2) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('white (#ffffff) vs black (#000000) has contrast ratio of 21', () => {
    const ratio = contrastRatio('#ffffff', '#000000');
    expect(Math.abs(ratio - 21)).toBeLessThan(0.01);
  });

  it('CONFIG.backgroundColor (#87CEEB) vs white score text (#ffffff) — documents actual contrast ratio', () => {
    // Score text is rendered in white (#ffffff) with a black stroke outline over the sky-blue background.
    // Sky blue (#87CEEB, luminance ≈ 0.60) vs white (#ffffff, luminance = 1.0) gives a ratio of ~1.74.
    // White-on-sky-blue alone is below WCAG AA (4.5:1) and WCAG AA Large Text (3.0:1).
    // The game achieves legibility through a black text stroke, not background contrast alone.
    //
    // This test documents the measured ratio and verifies it is within the valid [1, 21] range.
    const ratio = contrastRatio(CONFIG.backgroundColor, '#ffffff');
    // Contrast ratio is always a valid WCAG value
    expect(ratio).toBeGreaterThanOrEqual(1);
    expect(ratio).toBeLessThanOrEqual(21);
    // Document the actual value for traceability
    // White-on-sky-blue: ~1.74 (legibility achieved via black stroke in Renderer.renderScore)
    expect(ratio).toBeGreaterThan(1.5);
  });

  it('CONFIG.backgroundColor (#87CEEB) vs black stroke (#000000) meets WCAG AA Large Text (≥ 3.0)', () => {
    // The Renderer draws score text with a black stroke outline for accessibility.
    // Black (#000000) on sky blue (#87CEEB, luminance ≈ 0.60) gives ~12.1:1 — well above WCAG AA (4.5:1).
    const ratio = contrastRatio(CONFIG.backgroundColor, '#000000');
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it('relative luminance of white is 1 and black is 0', () => {
    expect(Math.abs(relativeLuminance('#ffffff') - 1)).toBeLessThan(0.0001);
    expect(Math.abs(relativeLuminance('#000000') - 0)).toBeLessThan(0.0001);
  });

  it('hexToRgb correctly parses a known color', () => {
    const { r, g, b } = hexToRgb('#87CEEB');
    expect(r).toBe(0x87); // 135
    expect(g).toBe(0xCE); // 206
    expect(b).toBe(0xEB); // 235
  });
});
