/**
 * physics.test.js — Property-based tests for PhysicsEngine.
 * Properties 1, 2, 3 from design document.
 * Implemented in tasks 3.2, 3.3, 3.4.
 *
 * **Validates: Requirements 1.8, 8.3**
 */

import fc from 'fast-check';
import { PhysicsEngine } from '../../src/systems/PhysicsEngine.js';
import CONFIG from '../../src/config.js';

/**
 * Property 1: Gravity Application
 * Validates: Requirements 1.4, 8.2
 *
 * For any initial vertical velocity, applying gravitational acceleration of
 * 0.5 pixels per frame squared for N frames SHALL increase the velocity by
 * exactly 0.5 * N pixels per frame.
 */
describe('PhysicsEngine — Property 1: Gravity Application', () => {
  it('velocityY increases by exactly gravity * deltaTime after a single applyGravity call', () => {
    fc.assert(
      fc.property(
        // initial velocityY: any realistic float
        fc.float({ min: -50, max: 50, noNaN: true }),
        // deltaTime: any positive frame count
        fc.integer({ min: 1, max: 100 }),
        (initialVelocity, deltaTime) => {
          const engine = new PhysicsEngine();
          const entity = { velocityY: initialVelocity };

          engine.applyGravity(entity, deltaTime);

          const expectedVelocity = initialVelocity + engine.gravity * deltaTime;
          return Math.abs(entity.velocityY - expectedVelocity) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('multiple applyGravity calls accumulate correctly (N calls with deltaTime=1 equals single call with deltaTime=N)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -50, max: 50, noNaN: true }),
        fc.integer({ min: 1, max: 20 }),
        (initialVelocity, frameCount) => {
          const engine = new PhysicsEngine();

          // Apply gravity frameCount times with deltaTime=1
          const entityMultiple = { velocityY: initialVelocity };
          for (let i = 0; i < frameCount; i++) {
            engine.applyGravity(entityMultiple, 1);
          }

          // Apply gravity once with deltaTime=frameCount
          const entitySingle = { velocityY: initialVelocity };
          engine.applyGravity(entitySingle, frameCount);

          return Math.abs(entityMultiple.velocityY - entitySingle.velocityY) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('works with any starting velocity — final velocityY equals initialVelocity + gravity * deltaTime', () => {
    fc.assert(
      fc.property(
        // Wide range of starting velocities, including boundary values
        fc.oneof(
          fc.float({ min: -1000, max: 1000, noNaN: true }),
          fc.constant(0),
          fc.constant(-10),
          fc.constant(10)
        ),
        fc.integer({ min: 1, max: 50 }),
        (initialVelocity, deltaTime) => {
          const engine = new PhysicsEngine();
          const entity = { velocityY: initialVelocity };

          engine.applyGravity(entity, deltaTime);

          const expected = initialVelocity + engine.gravity * deltaTime;
          return Math.abs(entity.velocityY - expected) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Velocity Clamping
 * Validates: Requirements 1.8, 8.3
 *
 * For any velocity value, the velocity clamping function SHALL ensure the
 * result is within the range [-10, 10] pixels per frame, where values below
 * -10 are clamped to -10 and values above 10 are clamped to 10.
 */
describe('PhysicsEngine — Property 2: Velocity Clamping', () => {
  it('velocityY is always within [maxUpwardVelocity, maxDownwardVelocity] after clampVelocity()', () => {
    fc.assert(
      fc.property(
        // arbitrary velocity — includes values well outside [-10, 10]
        fc.float({ min: -1000, max: 1000, noNaN: true }),
        (initialVelocity) => {
          const engine = new PhysicsEngine();
          const entity = { velocityY: initialVelocity };

          engine.clampVelocity(entity);

          return (
            entity.velocityY >= engine.maxUpwardVelocity &&
            entity.velocityY <= engine.maxDownwardVelocity
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('values already within bounds remain unchanged after clampVelocity()', () => {
    fc.assert(
      fc.property(
        // velocity constrained to be within the valid range
        fc.float({
          min: Math.fround(CONFIG.maxUpwardVelocity),
          max: Math.fround(CONFIG.maxDownwardVelocity),
          noNaN: true,
        }),
        (initialVelocity) => {
          const engine = new PhysicsEngine();
          const entity = { velocityY: initialVelocity };

          engine.clampVelocity(entity);

          return Math.abs(entity.velocityY - initialVelocity) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('velocities below maxUpwardVelocity are clamped to exactly maxUpwardVelocity', () => {
    fc.assert(
      fc.property(
        // velocity strictly below -10 (the default maxUpwardVelocity)
        // Use double for precise boundary — filter out the boundary value itself
        fc.double({ min: -1000, max: -10, noNaN: true }).filter(v => v < -10),
        (initialVelocity) => {
          const engine = new PhysicsEngine();
          const entity = { velocityY: initialVelocity };

          engine.clampVelocity(entity);

          return Math.abs(entity.velocityY - engine.maxUpwardVelocity) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('velocities above maxDownwardVelocity are clamped to exactly maxDownwardVelocity', () => {
    fc.assert(
      fc.property(
        // velocity strictly above 10 (the default maxDownwardVelocity)
        // Use double for precise boundary — filter out the boundary value itself
        fc.double({ min: 10, max: 1000, noNaN: true }).filter(v => v > 10),
        (initialVelocity) => {
          const engine = new PhysicsEngine();
          const entity = { velocityY: initialVelocity };

          engine.clampVelocity(entity);

          return Math.abs(entity.velocityY - engine.maxDownwardVelocity) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clamping is idempotent — applying clampVelocity twice gives the same result as once', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 1000, noNaN: true }),
        (initialVelocity) => {
          const engine = new PhysicsEngine();

          const entityOnce = { velocityY: initialVelocity };
          engine.clampVelocity(entityOnce);

          const entityTwice = { velocityY: initialVelocity };
          engine.clampVelocity(entityTwice);
          engine.clampVelocity(entityTwice);

          return Math.abs(entityOnce.velocityY - entityTwice.velocityY) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clamping works correctly with custom physics config bounds', () => {
    fc.assert(
      fc.property(
        // Custom symmetric bounds between 1 and 50
        fc.integer({ min: 1, max: 50 }),
        // Velocity can be anything in a wide range
        fc.float({ min: -200, max: 200, noNaN: true }),
        (bound, initialVelocity) => {
          const engine = new PhysicsEngine({
            maxUpwardVelocity: -bound,
            maxDownwardVelocity: bound,
          });
          const entity = { velocityY: initialVelocity };

          engine.clampVelocity(entity);

          return (
            entity.velocityY >= -bound &&
            entity.velocityY <= bound
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Position Update
 * Validates: Requirements 8.4
 *
 * For any initial position and velocity, updating the position by adding the
 * velocity SHALL result in a new position equal to the initial position plus
 * the velocity value.
 */
describe('PhysicsEngine — Property 3: Position Update', () => {
  it('y increases by exactly velocityY * deltaTime after a single updatePosition call', () => {
    fc.assert(
      fc.property(
        // initial y position: any realistic float
        fc.float({ min: -1000, max: 1000, noNaN: true }),
        // initial velocityY: any realistic float
        fc.float({ min: -50, max: 50, noNaN: true }),
        // deltaTime: any positive integer frame count
        fc.integer({ min: 1, max: 100 }),
        (initialY, initialVelocityY, deltaTime) => {
          const engine = new PhysicsEngine();
          const entity = { y: initialY, velocityY: initialVelocityY };

          engine.updatePosition(entity, deltaTime);

          const expectedY = initialY + initialVelocityY * deltaTime;
          return Math.abs(entity.y - expectedY) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('works with any starting position — y changes by exactly velocityY * deltaTime', () => {
    fc.assert(
      fc.property(
        // Wide range of starting positions, including boundary values
        fc.oneof(
          fc.float({ min: -10000, max: 10000, noNaN: true }),
          fc.constant(0),
          fc.constant(-1),
          fc.constant(1)
        ),
        fc.float({ min: -10, max: 10, noNaN: true }),
        fc.integer({ min: 1, max: 60 }),
        (initialY, velocityY, deltaTime) => {
          const engine = new PhysicsEngine();
          const entity = { y: initialY, velocityY };

          engine.updatePosition(entity, deltaTime);

          const expectedY = initialY + velocityY * deltaTime;
          return Math.abs(entity.y - expectedY) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deltaTime scales movement correctly — larger deltaTime produces proportionally larger displacement', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -50, max: 50, noNaN: true }),
        // Two different deltaTime values, constrained so dt2 = 2 * dt1
        fc.integer({ min: 1, max: 50 }),
        (velocityY, dt1) => {
          const dt2 = dt1 * 2;
          const engine = new PhysicsEngine();

          const entity1 = { y: 0, velocityY };
          const entity2 = { y: 0, velocityY };

          engine.updatePosition(entity1, dt1);
          engine.updatePosition(entity2, dt2);

          // Displacement with dt2 should be exactly twice the displacement with dt1
          const displacement1 = entity1.y;
          const displacement2 = entity2.y;
          return Math.abs(displacement2 - 2 * displacement1) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });
});
