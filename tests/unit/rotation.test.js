/**
 * rotation.test.js — Property-based tests for Ghosty rotation calculation.
 * Property 17 from design document.
 * Implemented in task 10.2.
 *
 * **Validates: Requirements 7.7, 7.8**
 */

import fc from 'fast-check';
import { Ghosty } from '../../src/entities/Ghosty.js';
import CONFIG from '../../src/config.js';

/**
 * Property 17: Rotation Calculation
 * Validates: Requirements 7.7, 7.8
 *
 * For any velocity value, the rotation angle calculation SHALL return a value
 * proportional to the velocity, where negative velocities produce
 * counterclockwise rotation (up to -25 degrees) and positive velocities
 * produce clockwise rotation (up to 90 degrees).
 */
describe('Ghosty — Property 17: Rotation Calculation', () => {
  /**
   * Helper: create a Ghosty and set its velocityY, then call updateRotation().
   */
  function rotationForVelocity(velocityY) {
    const ghosty = new Ghosty(50, 100);
    ghosty.velocityY = velocityY;
    ghosty.updateRotation();
    return ghosty.rotation;
  }

  it('rotation is always within [-25, 90] degrees for any velocity in the valid range', () => {
    // Feature: flappy-kiro, Property 17: Rotation Calculation
    fc.assert(
      fc.property(
        // Velocities spanning the full clamped range plus a buffer outside it
        fc.float({ min: CONFIG.maxUpwardVelocity, max: CONFIG.maxDownwardVelocity, noNaN: true }),
        (velocityY) => {
          const rotation = rotationForVelocity(velocityY);
          return rotation >= -25 && rotation <= 90;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('negative velocity (moving upward) always produces non-positive rotation (counterclockwise or zero)', () => {
    // Feature: flappy-kiro, Property 17: Rotation Calculation
    fc.assert(
      fc.property(
        // Strictly negative velocities — Ghosty is moving upward
        fc.float({ min: CONFIG.maxUpwardVelocity, max: 0, noNaN: true }).filter(v => v < 0),
        (velocityY) => {
          const rotation = rotationForVelocity(velocityY);
          return rotation <= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('positive velocity (moving downward) always produces non-negative rotation (clockwise or zero)', () => {
    // Feature: flappy-kiro, Property 17: Rotation Calculation
    fc.assert(
      fc.property(
        // Strictly positive velocities — Ghosty is falling
        fc.float({ min: 0, max: CONFIG.maxDownwardVelocity, noNaN: true }).filter(v => v > 0),
        (velocityY) => {
          const rotation = rotationForVelocity(velocityY);
          return rotation >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('zero velocity produces exactly 0° rotation', () => {
    const rotation = rotationForVelocity(0);
    expect(rotation).toBe(0);
  });

  it('maximum upward velocity (-10) produces exactly -25° rotation', () => {
    const rotation = rotationForVelocity(CONFIG.maxUpwardVelocity); // -10
    expect(Math.abs(rotation - (-25))).toBeLessThan(0.0001);
  });

  it('maximum downward velocity (+10) produces exactly +90° rotation', () => {
    const rotation = rotationForVelocity(CONFIG.maxDownwardVelocity); // 10
    expect(Math.abs(rotation - 90)).toBeLessThan(0.0001);
  });

  it('rotation is linear and proportional to velocity magnitude', () => {
    // Feature: flappy-kiro, Property 17: Rotation Calculation
    // Verify linearity: rotation(v1) / rotation(v2) === v1 / v2 for upward velocities.
    // Filter out near-zero values to avoid floating-point division instability.
    fc.assert(
      fc.property(
        fc.tuple(
          fc.float({ min: Math.fround(CONFIG.maxUpwardVelocity), max: Math.fround(-0.1), noNaN: true }),
          fc.float({ min: Math.fround(CONFIG.maxUpwardVelocity), max: Math.fround(-0.1), noNaN: true })
        ),
        ([v1, v2]) => {
          const r1 = rotationForVelocity(v1);
          const r2 = rotationForVelocity(v2);
          // Linear mapping: ratio of rotations should equal ratio of velocities
          const expectedRatio = v1 / v2;
          const actualRatio = r1 / r2;
          return Math.abs(actualRatio - expectedRatio) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rotation is linear and proportional for downward velocity', () => {
    // Feature: flappy-kiro, Property 17: Rotation Calculation
    // Filter out near-zero values to avoid floating-point division instability.
    fc.assert(
      fc.property(
        fc.tuple(
          fc.float({ min: Math.fround(0.1), max: Math.fround(CONFIG.maxDownwardVelocity), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(CONFIG.maxDownwardVelocity), noNaN: true })
        ),
        ([v1, v2]) => {
          const r1 = rotationForVelocity(v1);
          const r2 = rotationForVelocity(v2);
          const expectedRatio = v1 / v2;
          const actualRatio = r1 / r2;
          return Math.abs(actualRatio - expectedRatio) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });
});
