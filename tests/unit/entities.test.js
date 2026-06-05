/**
 * entities.test.js — Property-based tests for pipe entities and Ghosty.
 * Properties 4, 5, 6, 7, 8 from design document.
 * Implemented in tasks 2.3, 2.5, 6.2–6.6.
 */

import fc from 'fast-check';
import { Pipe } from '../../src/entities/Pipe.js';
import { EntityManager } from '../../src/systems/EntityManager.js';
import CONFIG from '../../src/config.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a minimal mock canvas accepted by EntityManager.
 * Width/height default to 900×600 (design resolution).
 */
function makeCanvas(width = 900, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// ── Property 4: Pipe Movement ─────────────────────────────────────────────────

/**
 * Property 4: Pipe Movement
 * Validates: Requirements 2.2
 *
 * For any initial pipe x-coordinate, moving the pipe at 2 pixels per frame for
 * N frames SHALL result in the pipe's x-coordinate decreasing by exactly 2 * N pixels.
 */
describe('Pipe — Property 4: Pipe Movement', () => {
  it('pipe x decreases by pipeSpeed * N after N update() calls', () => {
    fc.assert(
      fc.property(
        // initialX: starting position anywhere from 0 to 800px
        fc.integer({ min: 0, max: 800 }),
        // N: number of frames (1–200)
        fc.integer({ min: 1, max: 200 }),
        (initialX, n) => {
          const canvasHeight = 711;
          const pipe = new Pipe(
            initialX,
            /* width */ 60,
            /* canvasHeight */ canvasHeight,
            /* gapY */ 355,
            /* gapHeight */ 150
          );

          // Advance the pipe N frames (one frame at a time)
          for (let i = 0; i < n; i++) {
            pipe.update(1);
          }

          const expectedX = initialX - CONFIG.pipeSpeed * n;
          return Math.abs(pipe.x - expectedX) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('pipe x decreases by pipeSpeed * deltaTime for a single update with fractional deltaTime', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 800 }),
        // deltaTime: a positive real multiplier (0.5 – 5)
        fc.float({ min: 0.5, max: 5, noNaN: true }),
        (initialX, deltaTime) => {
          const pipe = new Pipe(initialX, 60, 711, 355, 150);
          pipe.update(deltaTime);
          const expectedX = initialX - CONFIG.pipeSpeed * deltaTime;
          return Math.abs(pipe.x - expectedX) < 0.001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('pipe movement is deterministic: same N always produces same final x', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 800 }),
        fc.integer({ min: 1, max: 100 }),
        (initialX, n) => {
          // Run twice from identical initial state
          const pipe1 = new Pipe(initialX, 60, 711, 355, 150);
          const pipe2 = new Pipe(initialX, 60, 711, 355, 150);

          for (let i = 0; i < n; i++) {
            pipe1.update(1);
            pipe2.update(1);
          }

          return pipe1.x === pipe2.x;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 5: Pipe Removal ──────────────────────────────────────────────────

/**
 * Property 5: Pipe Removal
 * Validates: Requirements 2.3
 *
 * For any pipe with x + width < 0, updatePipes() SHALL remove it.
 * Pipes still on screen (x + width >= 0) SHALL never be removed.
 */
describe('EntityManager — Property 5: Pipe Removal', () => {
  it('pipes with x + width < 0 are removed after updatePipes()', () => {
    fc.assert(
      fc.property(
        // Offscreen x: must satisfy x + 60 < 0, so x < -60
        fc.integer({ min: -300, max: -61 }),
        (offscreenX) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          // Manually inject an off-screen pipe
          const pipe = new Pipe(offscreenX, 60, canvas.height, 355, 150);
          em._pipes.push(pipe);

          // updatePipes with deltaTime=0 so positions don't change
          em.updatePipes(0);

          return em.getPipes().length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('pipes still on screen (x + width >= 0) are never removed', () => {
    fc.assert(
      fc.property(
        // On-screen x: must satisfy x + 60 >= 0, so x >= -59
        fc.integer({ min: -59, max: 800 }),
        (onscreenX) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          const pipe = new Pipe(onscreenX, 60, canvas.height, 355, 150);
          em._pipes.push(pipe);

          em.updatePipes(0);

          return em.getPipes().length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('only off-screen pipes are removed when mixed with on-screen pipes', () => {
    fc.assert(
      fc.property(
        // Number of on-screen pipes (1–5)
        fc.integer({ min: 1, max: 5 }),
        // Number of off-screen pipes (1–5)
        fc.integer({ min: 1, max: 5 }),
        (onCount, offCount) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          for (let i = 0; i < onCount; i++) {
            em._pipes.push(new Pipe(100, 60, canvas.height, 355, 150));
          }
          for (let i = 0; i < offCount; i++) {
            em._pipes.push(new Pipe(-100, 60, canvas.height, 355, 150));
          }

          em.updatePipes(0);

          return em.getPipes().length === onCount;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 6: Pipe Spawn Timing ─────────────────────────────────────────────

/**
 * Property 6: Pipe Spawn Timing
 * Validates: Requirements 2.1
 *
 * shouldSpawnPipe() returns true if and only if frameCount > 0 AND
 * frameCount % pipeSpawnInterval === 0.
 */
describe('EntityManager — Property 6: Pipe Spawn Timing', () => {
  it('shouldSpawnPipe() returns true at every multiple of pipeSpawnInterval (> 0)', () => {
    fc.assert(
      fc.property(
        // k: positive multiplier (1–50) → frameCount = k * 90
        fc.integer({ min: 1, max: 50 }),
        (k) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);
          em.frameCount = k * CONFIG.pipeSpawnInterval;
          return em.shouldSpawnPipe() === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('shouldSpawnPipe() returns false at frame 0', () => {
    const canvas = makeCanvas();
    const em = new EntityManager(canvas, 1);
    em.frameCount = 0;
    expect(em.shouldSpawnPipe()).toBe(false);
  });

  it('shouldSpawnPipe() returns false for all non-interval frames > 0', () => {
    fc.assert(
      fc.property(
        // frame: 1–4500, not a multiple of pipeSpawnInterval
        fc.integer({ min: 1, max: 4500 }).filter(f => f % CONFIG.pipeSpawnInterval !== 0),
        (frame) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);
          em.frameCount = frame;
          return em.shouldSpawnPipe() === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('update() increments frameCount and triggers spawning at correct intervals', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (k) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          // Advance to one frame before the k-th spawn interval
          em.frameCount = k * CONFIG.pipeSpawnInterval - 1;
          expect(em.shouldSpawnPipe()).toBe(false);

          em.update(1); // now frameCount === k * pipeSpawnInterval
          return em.shouldSpawnPipe() === true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ── Property 7: Gap Position Bounds ───────────────────────────────────────────

/**
 * Property 7: Gap Position Bounds
 * Validates: Requirements 2.4
 *
 * Every spawned pipe's gapY SHALL be within [minGapY, canvasHeight - maxGapYOffset]
 * (both values scaled by scaleFactor).
 */
describe('EntityManager — Property 7: Gap Position Bounds', () => {
  it('spawned pipe gapY is within [minGapY * scale, canvasHeight - maxGapYOffset * scale]', () => {
    fc.assert(
      fc.property(
        // canvasWidth: 200–1200 px, height is set so 900:600 ratio holds
        fc.integer({ min: 200, max: 1200 }),
        (canvasWidth) => {
          const canvasHeight = Math.round(canvasWidth * (600 / 900));
          const canvas = makeCanvas(canvasWidth, canvasHeight);
          const scaleFactor = canvasWidth / CONFIG.baseCanvasWidth;
          const em = new EntityManager(canvas, scaleFactor);

          const minGapY = CONFIG.minGapY * scaleFactor;
          const maxGapY = canvasHeight - CONFIG.maxGapYOffset * scaleFactor;

          // Skip degenerate canvases where bounds are inverted
          if (minGapY >= maxGapY) return true;

          const pipe = em.spawnPipe();
          return pipe.gapY >= minGapY && pipe.gapY <= maxGapY;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('gap bounds are respected across many random spawns at base scale', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (spawnCount) => {
          const canvas = makeCanvas(900, 600);
          const em = new EntityManager(canvas, 1);

          const minGapY = CONFIG.minGapY;
          const maxGapY = canvas.height - CONFIG.maxGapYOffset;

          const pipes = [];
          for (let i = 0; i < spawnCount; i++) {
            pipes.push(em.spawnPipe());
          }

          return pipes.every(p => p.gapY >= minGapY && p.gapY <= maxGapY);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 15: Reset Removes All Pipes ──────────────────────────────────────

/**
 * Property 15: Reset Removes All Pipes
 * Validates: Requirements 5.8
 *
 * For any game state containing N pipes, triggering reset() SHALL result in
 * getPipes() returning an empty array and frameCount resetting to 0.
 */
describe('EntityManager — Property 15: Reset Removes All Pipes', () => {
  it('getPipes() returns empty array after reset() regardless of how many pipes existed', () => {
    fc.assert(
      fc.property(
        // pipeCount: 0–20 pipes before reset
        fc.integer({ min: 0, max: 20 }),
        (pipeCount) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          // Spawn N pipes
          for (let i = 0; i < pipeCount; i++) {
            em.spawnPipe();
          }

          expect(em.getPipes().length).toBe(pipeCount);

          em.reset();

          return em.getPipes().length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('frameCount resets to 0 after reset()', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (frames) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);
          em.frameCount = frames;

          em.reset();

          return em.frameCount === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('reset() is idempotent: calling it multiple times always yields empty pipes and zero frameCount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (pipeCount, resetCount) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          for (let i = 0; i < pipeCount; i++) {
            em.spawnPipe();
          }

          for (let r = 0; r < resetCount; r++) {
            em.reset();
          }

          return em.getPipes().length === 0 && em.frameCount === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 8: Gap Height Invariant
 * Validates: Requirements 2.5
 *
 * For any pipe with a defined gap center Y-coordinate, the distance between
 * the bottom edge of the top pipe segment (gapY - gapHeight/2) and the top
 * edge of the bottom pipe segment (gapY + gapHeight/2) SHALL equal exactly
 * gapHeight pixels.
 */
describe('Pipe — Property 8: Gap Height Invariant', () => {
  it('top segment bottom edge + gap = bottom segment top edge, and gap equals gapHeight', () => {
    fc.assert(
      fc.property(
        // canvasHeight: a realistic canvas height (400–1200px)
        fc.integer({ min: 400, max: 1200 }),
        // gapHeight: a realistic gap (50–300px)
        fc.integer({ min: 50, max: 300 }),
        // gapY must be within [gapHeight/2, canvasHeight - gapHeight/2]
        // so both segments have positive heights
        fc.integer({ min: 50, max: 1150 }),
        (canvasHeight, gapHeight, rawGapY) => {
          const halfGap = gapHeight / 2;
          // Clamp gapY so that both segments exist with positive height
          const minGapY = halfGap;
          const maxGapY = canvasHeight - halfGap;
          if (minGapY >= maxGapY) return true; // skip degenerate cases
          const gapY = minGapY + (rawGapY % (maxGapY - minGapY));

          const pipe = new Pipe(
            /* x */ 100,
            /* width */ 60,
            /* height (canvasHeight) */ canvasHeight,
            gapY,
            gapHeight
          );

          const top = pipe.getTopSegment();
          const bottom = pipe.getBottomSegment();

          // The bottom edge of the top segment
          const topSegmentBottomEdge = top.y + top.height;
          // The top edge of the bottom segment
          const bottomSegmentTopEdge = bottom.y;

          // The gap between the two segments must equal gapHeight
          const actualGap = bottomSegmentTopEdge - topSegmentBottomEdge;

          return Math.abs(actualGap - gapHeight) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('top and bottom segments do not overlap', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 1200 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 50, max: 1150 }),
        (canvasHeight, gapHeight, rawGapY) => {
          const halfGap = gapHeight / 2;
          const minGapY = halfGap;
          const maxGapY = canvasHeight - halfGap;
          if (minGapY >= maxGapY) return true;
          const gapY = minGapY + (rawGapY % (maxGapY - minGapY));

          const pipe = new Pipe(100, 60, canvasHeight, gapY, gapHeight);
          const top = pipe.getTopSegment();
          const bottom = pipe.getBottomSegment();

          // Top segment must end before bottom segment begins
          const topBottom = top.y + top.height;
          const bottomTop = bottom.y;
          return topBottom <= bottomTop;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('top segment height + gap + bottom segment height = canvas height', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 1200 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 50, max: 1150 }),
        (canvasHeight, gapHeight, rawGapY) => {
          const halfGap = gapHeight / 2;
          const minGapY = halfGap;
          const maxGapY = canvasHeight - halfGap;
          if (minGapY >= maxGapY) return true;
          const gapY = minGapY + (rawGapY % (maxGapY - minGapY));

          const pipe = new Pipe(100, 60, canvasHeight, gapY, gapHeight);
          const top = pipe.getTopSegment();
          const bottom = pipe.getBottomSegment();

          const total = top.height + gapHeight + bottom.height;
          return Math.abs(total - canvasHeight) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('gap is correctly positioned at gapY center', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 1200 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 50, max: 1150 }),
        (canvasHeight, gapHeight, rawGapY) => {
          const halfGap = gapHeight / 2;
          const minGapY = halfGap;
          const maxGapY = canvasHeight - halfGap;
          if (minGapY >= maxGapY) return true;
          const gapY = minGapY + (rawGapY % (maxGapY - minGapY));

          const pipe = new Pipe(100, 60, canvasHeight, gapY, gapHeight);
          const top = pipe.getTopSegment();
          const bottom = pipe.getBottomSegment();

          // The midpoint of the gap should be gapY
          const gapStart = top.y + top.height;
          const gapEnd = bottom.y;
          const gapMidpoint = (gapStart + gapEnd) / 2;

          return Math.abs(gapMidpoint - gapY) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });
});
