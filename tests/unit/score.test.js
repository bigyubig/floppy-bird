/**
 * score.test.js — Property-based tests for score tracking in EntityManager.
 * Properties 12, 13, 14 from design document.
 * Implemented in tasks 13.2, 13.3, 13.4.
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import fc from 'fast-check';
import { EntityManager } from '../../src/systems/EntityManager.js';
import { Pipe } from '../../src/entities/Pipe.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal mock canvas accepted by EntityManager. */
function makeCanvas(width = 900, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Creates a minimal Ghosty-shaped object with just the x property needed by
 * checkAndUpdateScore(). Using a plain object avoids loading the sprite image.
 */
function makeGhosty(x) {
  return { x };
}

/**
 * Manually injects a Pipe into the EntityManager's pipe array so we can
 * control exact x / width / scored state without relying on spawnPipe().
 *
 * @param {EntityManager} em
 * @param {number} pipeX    - left edge of the pipe
 * @param {number} pipeWidth
 * @param {boolean} [scored=false]
 * @returns {Pipe}
 */
function injectPipe(em, pipeX, pipeWidth, scored = false) {
  const pipe = new Pipe(pipeX, pipeWidth, em.canvas.height, 300, 150);
  pipe.scored = scored;
  em._pipes.push(pipe);
  return pipe;
}

// ── Property 12: Score Detection ──────────────────────────────────────────────

/**
 * Property 12: Score Detection
 * Validates: Requirements 4.1
 *
 * For any Ghosty x-coordinate and pipe right-edge x-coordinate where
 * Ghosty's x is greater than the pipe's right edge, and the pipe is not
 * already marked as scored, the scoring check SHALL mark the pipe as scored.
 */
describe('EntityManager — Property 12: Score Detection', () => {
  it('pipe is marked scored when ghosty.x > pipe.x + pipe.width (pipe not yet scored)', () => {
    fc.assert(
      fc.property(
        // pipeX: left edge of pipe (0–300)
        fc.integer({ min: 0, max: 300 }),
        // pipeWidth: width of pipe (20–80)
        fc.integer({ min: 20, max: 80 }),
        // offset: how far past the pipe right edge ghosty is (1–100)
        fc.integer({ min: 1, max: 100 }),
        (pipeX, pipeWidth, offset) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          const pipe = injectPipe(em, pipeX, pipeWidth, false);
          const ghosty = makeGhosty(pipeX + pipeWidth + offset);

          em.checkAndUpdateScore(ghosty);

          return pipe.scored === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('pipe is NOT marked scored when ghosty.x === pipe.x + pipe.width (exactly at edge)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 300 }),
        fc.integer({ min: 20, max: 80 }),
        (pipeX, pipeWidth) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          const pipe = injectPipe(em, pipeX, pipeWidth, false);
          // ghosty.x exactly at the pipe's right edge — NOT past it
          const ghosty = makeGhosty(pipeX + pipeWidth);

          em.checkAndUpdateScore(ghosty);

          return pipe.scored === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('pipe is NOT marked scored when ghosty.x < pipe.x + pipe.width (not yet passed)', () => {
    fc.assert(
      fc.property(
        // pipeX must leave room for ghosty to be behind the pipe's right edge
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 20, max: 80 }),
        // shortfall: how far short of the right edge ghosty is (1–100)
        fc.integer({ min: 1, max: 100 }),
        (pipeX, pipeWidth, shortfall) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          const pipe = injectPipe(em, pipeX, pipeWidth, false);
          const ghosty = makeGhosty(pipeX + pipeWidth - shortfall);

          em.checkAndUpdateScore(ghosty);

          return pipe.scored === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('score increases when ghosty passes an unscored pipe, stays same when ghosty has not passed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 20, max: 60 }),
        fc.integer({ min: 1, max: 50 }),
        (pipeX, pipeWidth, offset) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          // One passed pipe, one not-yet-passed pipe
          injectPipe(em, pipeX, pipeWidth, false);
          injectPipe(em, pipeX + pipeWidth + offset + 50, pipeWidth, false);

          // Ghosty only past the first pipe
          const ghosty = makeGhosty(pipeX + pipeWidth + offset);
          em.checkAndUpdateScore(ghosty);

          return em.getScore() === 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 13: Score Increment ─────────────────────────────────────────────

/**
 * Property 13: Score Increment
 * Validates: Requirements 4.2
 *
 * When a pipe is marked as scored, the new score SHALL equal the previous
 * score plus 1. N pipes passed = score of N (starting from 0).
 */
describe('EntityManager — Property 13: Score Increment', () => {
  it('score increments by exactly 1 each time a new pipe is passed', () => {
    fc.assert(
      fc.property(
        // N: number of pipes to pass sequentially (1–20)
        fc.integer({ min: 1, max: 20 }),
        (n) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          // Space pipes apart so a single ghosty.x can pass all of them at once
          // by moving ghosty one step at a time and recording score.
          const pipeWidth = 60;
          const spacing = 100;

          // Inject N pipes at increasing x positions
          for (let i = 0; i < n; i++) {
            injectPipe(em, i * spacing, pipeWidth, false);
          }

          // Walk ghosty past each pipe one by one and verify score increments
          const scores = [];
          for (let i = 0; i < n; i++) {
            const pipeRightEdge = i * spacing + pipeWidth;
            const ghosty = makeGhosty(pipeRightEdge + 1);
            em.checkAndUpdateScore(ghosty);
            scores.push(em.getScore());
          }

          // scores should be [1, 2, 3, ..., n]
          return scores.every((s, idx) => s === idx + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('N pipes passed equals a score of N (starting from 0)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 15 }),
        (n) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          expect(em.getScore()).toBe(0);

          const pipeWidth = 60;
          const spacing = 100;

          for (let i = 0; i < n; i++) {
            injectPipe(em, i * spacing, pipeWidth, false);
          }

          // Move ghosty far to the right — past all pipes at once
          const ghosty = makeGhosty(n * spacing + pipeWidth + 1);
          em.checkAndUpdateScore(ghosty);

          return em.getScore() === n;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('score starts at 0 before any pipes are passed', () => {
    const canvas = makeCanvas();
    const em = new EntityManager(canvas, 1);
    expect(em.getScore()).toBe(0);
    expect(em.score).toBe(0);
  });

  it('each pipe contributes exactly +1 and no more to the total score', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (beforeCount, afterCount) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          const pipeWidth = 60;
          const spacing = 100;
          const total = beforeCount + afterCount;

          for (let i = 0; i < total; i++) {
            injectPipe(em, i * spacing, pipeWidth, false);
          }

          // Pass only the first `beforeCount` pipes
          const ghosty1 = makeGhosty((beforeCount - 1) * spacing + pipeWidth + 1);
          em.checkAndUpdateScore(ghosty1);
          const scoreAfterFirst = em.getScore();

          // Pass the remaining `afterCount` pipes
          const ghosty2 = makeGhosty((total - 1) * spacing + pipeWidth + 1);
          em.checkAndUpdateScore(ghosty2);
          const scoreAfterAll = em.getScore();

          return scoreAfterFirst === beforeCount && scoreAfterAll === total;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 14: Score Idempotence ────────────────────────────────────────────

/**
 * Property 14: Score Idempotence
 * Validates: Requirements 4.3
 *
 * For any pipe that is already marked as scored, subsequent scoring checks
 * for that same pipe SHALL NOT increment the score, regardless of how many
 * times the check is performed.
 */
describe('EntityManager — Property 14: Score Idempotence', () => {
  it('calling checkAndUpdateScore() multiple times on the same scored pipe does not change score', () => {
    fc.assert(
      fc.property(
        // pipeX / pipeWidth: pipe position
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 20, max: 80 }),
        // repeatCalls: how many extra times we call checkAndUpdateScore after the first
        fc.integer({ min: 1, max: 20 }),
        (pipeX, pipeWidth, repeatCalls) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          injectPipe(em, pipeX, pipeWidth, false);
          const ghosty = makeGhosty(pipeX + pipeWidth + 1);

          // First call — should score the pipe (score becomes 1)
          em.checkAndUpdateScore(ghosty);
          const scoreAfterFirst = em.getScore();

          // Repeat calls — score must not change
          for (let i = 0; i < repeatCalls; i++) {
            em.checkAndUpdateScore(ghosty);
          }
          const scoreAfterRepeats = em.getScore();

          return scoreAfterFirst === 1 && scoreAfterRepeats === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('pipe pre-marked as scored is never counted again', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 20, max: 80 }),
        fc.integer({ min: 1, max: 10 }),
        (pipeX, pipeWidth, callCount) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          // Pipe is already scored before any check
          injectPipe(em, pipeX, pipeWidth, true);
          const ghosty = makeGhosty(pipeX + pipeWidth + 1);

          for (let i = 0; i < callCount; i++) {
            em.checkAndUpdateScore(ghosty);
          }

          return em.getScore() === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('idempotence holds across many pipes: mix of scored and unscored', () => {
    fc.assert(
      fc.property(
        // scoredCount: pipes already scored (0–5)
        fc.integer({ min: 0, max: 5 }),
        // unscoredCount: pipes not yet scored (1–5)
        fc.integer({ min: 1, max: 5 }),
        // repeatCalls: extra repeat calls after the first scoring pass (1–10)
        fc.integer({ min: 1, max: 10 }),
        (scoredCount, unscoredCount, repeatCalls) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          const pipeWidth = 60;
          const spacing = 100;

          // Inject already-scored pipes first
          for (let i = 0; i < scoredCount; i++) {
            injectPipe(em, i * spacing, pipeWidth, true);
          }

          // Inject unscored pipes after
          for (let i = 0; i < unscoredCount; i++) {
            const idx = scoredCount + i;
            injectPipe(em, idx * spacing, pipeWidth, false);
          }

          // Ghosty is past ALL pipes
          const totalPipes = scoredCount + unscoredCount;
          const ghosty = makeGhosty((totalPipes - 1) * spacing + pipeWidth + 1);

          // First pass scores the unscored ones
          em.checkAndUpdateScore(ghosty);
          const scoreAfterFirst = em.getScore();

          // Repeated passes must not increment further
          for (let i = 0; i < repeatCalls; i++) {
            em.checkAndUpdateScore(ghosty);
          }
          const scoreAfterRepeats = em.getScore();

          // Only the previously unscored pipes should have been counted
          return scoreAfterFirst === unscoredCount && scoreAfterRepeats === unscoredCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('score is stable: getScore() returns the same value when called repeatedly without new passes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 2, max: 20 }),
        (pipeCount, queryCalls) => {
          const canvas = makeCanvas();
          const em = new EntityManager(canvas, 1);

          const pipeWidth = 60;
          const spacing = 100;

          for (let i = 0; i < pipeCount; i++) {
            injectPipe(em, i * spacing, pipeWidth, false);
          }

          // Score all pipes once
          const ghosty = makeGhosty((pipeCount - 1) * spacing + pipeWidth + 1);
          em.checkAndUpdateScore(ghosty);
          const expected = em.getScore();

          // Querying score multiple times must not change it
          const results = [];
          for (let i = 0; i < queryCalls; i++) {
            results.push(em.getScore());
          }

          return results.every(s => s === expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
