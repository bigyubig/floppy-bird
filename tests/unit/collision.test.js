/**
 * collision.test.js — Property-based tests for CollisionDetector.
 * Properties 9, 10, 11 from design document.
 * Implemented in tasks 4.2, 4.3, 4.4.
 */

import fc from 'fast-check';
import { CollisionDetector } from '../../src/systems/CollisionDetector.js';
import { Ghosty } from '../../src/entities/Ghosty.js';
import { Pipe } from '../../src/entities/Pipe.js';
import CONFIG from '../../src/config.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a plain Ghosty-like object without loading sprites or calling update().
 * Ghosty extends Entity which exposes getBoundingBox() — we instantiate it
 * directly so the property tests can control x/y/width/height freely.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} [width=40]
 * @param {number} [height=40]
 */
function makeGhosty(x, y, width = 40, height = 40) {
  const g = new Ghosty(x, y, width, height);
  return g;
}

/**
 * Build a Pipe with a known gap.
 *
 * @param {number} pipeX
 * @param {number} pipeWidth
 * @param {number} canvasHeight
 * @param {number} gapY       - gap centre
 * @param {number} gapHeight
 */
function makePipe(pipeX, pipeWidth, canvasHeight, gapY, gapHeight) {
  return new Pipe(pipeX, pipeWidth, canvasHeight, gapY, gapHeight);
}

// ---------------------------------------------------------------------------
// Property 9: AABB Collision Detection  (task 4.2)
// ---------------------------------------------------------------------------

/**
 * Property 9: AABB Collision Detection
 * Validates: Requirements 3.1, 3.2
 *
 * For any two axis-aligned bounding boxes where box1's right edge is greater
 * than box2's left edge AND box1's left edge is less than box2's right edge
 * AND box1's bottom edge is greater than box2's top edge AND box1's top edge
 * is less than box2's bottom edge, the AABB collision function SHALL return
 * true.
 */
describe('CollisionDetector — Property 9: AABB Collision Detection', () => {
  const detector = new CollisionDetector(600);

  it('returns true when two overlapping boxes are tested', () => {
    fc.assert(
      fc.property(
        // box1: random position/size
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        // overlap offset: how far box2 is shifted (must be < box1 width/height to guarantee overlap)
        fc.integer({ min: 1, max: 49 }),
        fc.integer({ min: 1, max: 49 }),
        (x1, y1, w1, h1, dx, dy) => {
          const box1 = { x: x1, y: y1, width: w1, height: h1 };
          // box2 overlaps box1 by shifting within bounds
          const box2 = {
            x: x1 + dx,
            y: y1 + dy,
            width: w1,
            height: h1,
          };
          // Only assert if they actually overlap (guard against edge cases)
          const overlapping =
            box1.x < box2.x + box2.width &&
            box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height &&
            box1.y + box1.height > box2.y;
          if (!overlapping) return true; // skip non-overlapping cases
          return detector.checkAABBCollision(box1, box2) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when box2 is fully to the right of box1 (no overlap)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 1, max: 80 }),
        fc.integer({ min: 1, max: 80 }),
        fc.integer({ min: 1, max: 100 }),
        (x1, y1, w1, h1, gap) => {
          const box1 = { x: x1, y: y1, width: w1, height: h1 };
          const box2 = { x: x1 + w1 + gap, y: y1, width: w1, height: h1 };
          return detector.checkAABBCollision(box1, box2) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when box2 is fully below box1 (no overlap)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 1, max: 80 }),
        fc.integer({ min: 1, max: 80 }),
        fc.integer({ min: 1, max: 100 }),
        (x1, y1, w1, h1, gap) => {
          const box1 = { x: x1, y: y1, width: w1, height: h1 };
          const box2 = { x: x1, y: y1 + h1 + gap, width: w1, height: h1 };
          return detector.checkAABBCollision(box1, box2) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when boxes are touching on the right edge (adjacent, not overlapping)', () => {
    // Touching edges: box1's right edge equals box2's left edge — not an overlap
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 1, max: 80 }),
        fc.integer({ min: 1, max: 80 }),
        (x1, y1, w1, h1) => {
          const box1 = { x: x1, y: y1, width: w1, height: h1 };
          // box2 starts exactly where box1 ends
          const box2 = { x: x1 + w1, y: y1, width: w1, height: h1 };
          return detector.checkAABBCollision(box1, box2) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when boxes are touching on the bottom edge (adjacent, not overlapping)', () => {
    // Touching edges: box1's bottom edge equals box2's top edge — not an overlap
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 1, max: 80 }),
        fc.integer({ min: 1, max: 80 }),
        (x1, y1, w1, h1) => {
          const box1 = { x: x1, y: y1, width: w1, height: h1 };
          // box2 starts exactly where box1 ends vertically
          const box2 = { x: x1, y: y1 + h1, width: w1, height: h1 };
          return detector.checkAABBCollision(box1, box2) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('collision detection is symmetric: checkAABBCollision(a, b) === checkAABBCollision(b, a)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (x1, y1, w1, h1, x2, y2, w2, h2) => {
          const box1 = { x: x1, y: y1, width: w1, height: h1 };
          const box2 = { x: x2, y: y2, width: w2, height: h2 };
          return (
            detector.checkAABBCollision(box1, box2) ===
            detector.checkAABBCollision(box2, box1)
          );
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Gap Non-Collision  (task 4.3)
// ---------------------------------------------------------------------------

/**
 * Property 10: Gap Non-Collision
 * Validates: Requirements 3.3
 *
 * For any Ghosty position where Ghosty's bounding box is entirely within the
 * gap space (Ghosty.y >= gapY - gapHeight/2 AND Ghosty.y + Ghosty.height <=
 * gapY + gapHeight/2), the collision detection function SHALL return false for
 * that pipe pair, and isGhostyInGap SHALL return true.
 */
describe('CollisionDetector — Property 10: Gap Non-Collision', () => {
  const CANVAS_HEIGHT = 600;
  const CANVAS_WIDTH = 400;

  it('checkGhostyPipeCollision returns false when Ghosty is centred in the gap', () => {
    const detector = new CollisionDetector(CANVAS_HEIGHT);

    // Ghosty fixed size of 40x40; pipe spans full canvas height
    const ghostyW = 40;
    const ghostyH = 40;
    const gapHeight = 150;
    const pipeWidth = 60;

    // Gap centre is in the safe zone [minGapY=150, canvasHeight-150=450]
    const gapY = CANVAS_HEIGHT / 2; // 300 — perfect centre
    const gapTop = gapY - gapHeight / 2;    // 225
    const gapBottom = gapY + gapHeight / 2; // 375

    // Ghosty centred in the gap
    const ghostyY = gapY - ghostyH / 2; // 280

    const pipe = makePipe(100, pipeWidth, CANVAS_HEIGHT, gapY, gapHeight);
    const ghosty = makeGhosty(100, ghostyY, ghostyW, ghostyH);

    // Sanity check: Ghosty is fully within the gap
    expect(ghosty.y).toBeGreaterThanOrEqual(gapTop);
    expect(ghosty.y + ghosty.height).toBeLessThanOrEqual(gapBottom);

    expect(detector.checkGhostyPipeCollision(ghosty, pipe)).toBe(false);
  });

  it('checkGhostyPipeCollision returns false for any Ghosty position fully inside the gap', () => {
    fc.assert(
      fc.property(
        // gapY: gap centre, constrained to [200, 400] so the gap fits comfortably
        fc.integer({ min: 200, max: 400 }),
        // gapHeight: between 80 and 200 to leave room for a 40px Ghosty
        fc.integer({ min: 80, max: 200 }),
        // Ghosty size: 20–50 in both axes (must fit inside the gap)
        fc.integer({ min: 10, max: 50 }),
        fc.integer({ min: 10, max: 50 }),
        (gapY, gapHeight, ghostyW, ghostyH) => {
          // Reject configurations where Ghosty cannot fit in the gap at all
          if (ghostyH >= gapHeight) return true;

          const gapTop = gapY - gapHeight / 2;
          const gapBottom = gapY + gapHeight / 2;

          // Place Ghosty with a 1px margin inside the gap boundaries
          const availableY = gapBottom - gapTop - ghostyH;
          if (availableY <= 0) return true; // gap too small for this Ghosty — skip

          // Place Ghosty at the vertical centre of the gap
          const ghostyY = gapTop + availableY / 2;

          // Ghosty at same x as pipe so horizontal overlap is guaranteed
          const pipeX = 100;
          const pipeWidth = 60;

          const detector = new CollisionDetector(CANVAS_HEIGHT);
          const pipe = makePipe(pipeX, pipeWidth, CANVAS_HEIGHT, gapY, gapHeight);
          const ghosty = makeGhosty(pipeX, ghostyY, ghostyW, ghostyH);

          // Double-check our test setup: Ghosty really is within the gap
          const ghostyTop = ghosty.getBoundingBox().y;
          const ghostyBottom = ghosty.getBoundingBox().y + ghosty.getBoundingBox().height;
          if (ghostyTop < gapTop || ghostyBottom > gapBottom) return true; // skip

          return detector.checkGhostyPipeCollision(ghosty, pipe) === false;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('isGhostyInGap returns true when Ghosty is fully inside the gap', () => {
    fc.assert(
      fc.property(
        // gapY: gap centre [200, 400]
        fc.integer({ min: 200, max: 400 }),
        // gapHeight: [80, 200]
        fc.integer({ min: 80, max: 200 }),
        // ghostyH: must be strictly smaller than gapHeight
        fc.integer({ min: 10, max: 50 }),
        (gapY, gapHeight, ghostyH) => {
          if (ghostyH >= gapHeight) return true;

          const gapTop = gapY - gapHeight / 2;
          const gapBottom = gapY + gapHeight / 2;
          const availableY = gapBottom - gapTop - ghostyH;
          if (availableY <= 0) return true;

          // Place Ghosty at the centre of the gap
          const ghostyY = gapTop + availableY / 2;

          const detector = new CollisionDetector(CANVAS_HEIGHT);
          const pipe = makePipe(100, 60, CANVAS_HEIGHT, gapY, gapHeight);
          const ghosty = makeGhosty(100, ghostyY, 40, ghostyH);

          // Guard: Ghosty must be properly inside
          const box = ghosty.getBoundingBox();
          if (box.y < gapTop || box.y + box.height > gapBottom) return true;

          return detector.isGhostyInGap(ghosty, pipe) === true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('isGhostyInGap returns false when Ghosty overlaps the top pipe segment', () => {
    fc.assert(
      fc.property(
        // gapY [250, 400], gapHeight [100, 200]
        fc.integer({ min: 250, max: 400 }),
        fc.integer({ min: 100, max: 200 }),
        fc.integer({ min: 10, max: 40 }),
        (gapY, gapHeight, ghostyH) => {
          const gapTop = gapY - gapHeight / 2;

          // Place Ghosty so its top edge is ABOVE gapTop (overlap with top pipe)
          const ghostyY = gapTop - ghostyH / 2; // centre straddles the boundary

          const detector = new CollisionDetector(CANVAS_HEIGHT);
          const pipe = makePipe(100, 60, CANVAS_HEIGHT, gapY, gapHeight);
          const ghosty = makeGhosty(100, ghostyY, 40, ghostyH);

          // Only test when Ghosty is genuinely above gapTop
          const box = ghosty.getBoundingBox();
          if (box.y >= gapTop) return true; // skip — not in violation

          return detector.isGhostyInGap(ghosty, pipe) === false;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('isGhostyInGap returns false when Ghosty overlaps the bottom pipe segment', () => {
    fc.assert(
      fc.property(
        // gapY [150, 350], gapHeight [100, 200]
        fc.integer({ min: 150, max: 350 }),
        fc.integer({ min: 100, max: 200 }),
        fc.integer({ min: 10, max: 40 }),
        (gapY, gapHeight, ghostyH) => {
          const gapBottom = gapY + gapHeight / 2;

          // Place Ghosty so its bottom edge is BELOW gapBottom (overlap with bottom pipe)
          const ghostyY = gapBottom - ghostyH / 2; // centre straddles the boundary

          const detector = new CollisionDetector(CANVAS_HEIGHT);
          const pipe = makePipe(100, 60, CANVAS_HEIGHT, gapY, gapHeight);
          const ghosty = makeGhosty(100, ghostyY, 40, ghostyH);

          // Only test when Ghosty's bottom is genuinely below gapBottom
          const box = ghosty.getBoundingBox();
          if (box.y + box.height <= gapBottom) return true; // skip

          return detector.isGhostyInGap(ghosty, pipe) === false;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('isGhostyInGap and checkGhostyPipeCollision agree: in-gap means no collision', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 200, max: 400 }),
        fc.integer({ min: 100, max: 200 }),
        fc.integer({ min: 10, max: 45 }),
        (gapY, gapHeight, ghostyH) => {
          if (ghostyH >= gapHeight) return true;

          const gapTop = gapY - gapHeight / 2;
          const gapBottom = gapY + gapHeight / 2;
          const availableY = gapBottom - gapTop - ghostyH;
          if (availableY <= 0) return true;

          const ghostyY = gapTop + availableY / 2;

          const detector = new CollisionDetector(CANVAS_HEIGHT);
          const pipe = makePipe(100, 60, CANVAS_HEIGHT, gapY, gapHeight);
          const ghosty = makeGhosty(100, ghostyY, 40, ghostyH);

          const box = ghosty.getBoundingBox();
          if (box.y < gapTop || box.y + box.height > gapBottom) return true;

          const inGap = detector.isGhostyInGap(ghosty, pipe);
          const collision = detector.checkGhostyPipeCollision(ghosty, pipe);

          // When Ghosty is in the gap, there should be no collision
          if (inGap) {
            return collision === false;
          }
          return true; // not in gap — don't assert
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('CollisionDetector — Pipe hitbox inset', () => {
  it('does not collide when Ghosty only enters top pipe by less than inset', () => {
    const canvasHeight = 600;
    const detector = new CollisionDetector(canvasHeight);
    const pipe = makePipe(100, 60, canvasHeight, 300, 200);

    const gapTop = pipe.gapY - pipe.gapHeight / 2;
    const ghostyH = 40;
    const penetration = CONFIG.pipeCollisionInset - 1; // within forgiveness zone
    // Ghosty top is only slightly above gapTop.
    const ghostyY = gapTop - penetration;
    const ghosty = makeGhosty(120, ghostyY, 20, ghostyH);

    expect(detector.checkGhostyPipeCollision(ghosty, pipe)).toBe(false);
  });

  it('collides when Ghosty enters top pipe deeper than inset', () => {
    const canvasHeight = 600;
    const detector = new CollisionDetector(canvasHeight);
    const pipe = makePipe(100, 60, canvasHeight, 300, 200);

    const gapTop = pipe.gapY - pipe.gapHeight / 2;
    const ghostyH = 40;
    const penetration = CONFIG.pipeCollisionInset + 1; // beyond forgiveness zone
    // Ghosty top is above gapTop by more than the forgiveness inset.
    const ghostyY = gapTop - penetration;
    const ghosty = makeGhosty(120, ghostyY, 20, ghostyH);

    expect(detector.checkGhostyPipeCollision(ghosty, pipe)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 11: Boundary Collision Detection  (task 4.4)
// ---------------------------------------------------------------------------

/**
 * Property 11: Boundary Collision Detection
 * Validates: Requirements 3.4, 3.5
 *
 * For any Ghosty position where y < -CONFIG.topBoundaryPadding OR
 * y > canvasHeight + CONFIG.gameOverBottomPadding, the
 * boundary collision function SHALL return true.
 */
describe('CollisionDetector — Property 11: Boundary Collision Detection', () => {
  it('returns true when Ghosty is above the top boundary padding', () => {
    fc.assert(
      fc.property(
        // canvasHeight: realistic sizes
        fc.integer({ min: 400, max: 900 }),
        // Ghosty y strictly < -topBoundaryPadding
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 10, max: 60 }),
        fc.integer({ min: 10, max: 60 }),
        (canvasHeight, overTop, ghostyW, ghostyH) => {
          const ghostyY = -CONFIG.topBoundaryPadding - overTop;
          const detector = new CollisionDetector(canvasHeight);
          const ghosty = makeGhosty(100, ghostyY, ghostyW, ghostyH);
          return detector.checkGhostyBoundaryCollision(ghosty) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when Ghosty is above screen but within top padding', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 900 }),
        fc.integer({ min: 10, max: 60 }),
        fc.integer({ min: 10, max: 60 }),
        (canvasHeight, ghostyW, ghostyH) => {
          const detector = new CollisionDetector(canvasHeight);
          const ghostyY = -CONFIG.topBoundaryPadding;
          const ghosty = makeGhosty(100, ghostyY, ghostyW, ghostyH);
          return detector.checkGhostyBoundaryCollision(ghosty) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns true when Ghosty is fully below the bottom boundary plus padding', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 900 }),
        fc.integer({ min: 10, max: 60 }),
        fc.integer({ min: 10, max: 60 }),
        fc.integer({ min: 1, max: 100 }),
        (canvasHeight, ghostyW, ghostyH, overflow) => {
          // Ghosty's top edge is below (canvasHeight + padding)
          const ghostyY = canvasHeight + CONFIG.gameOverBottomPadding + overflow;
          const detector = new CollisionDetector(canvasHeight);
          const ghosty = makeGhosty(100, ghostyY, ghostyW, ghostyH);
          return detector.checkGhostyBoundaryCollision(ghosty) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when Ghosty is below screen but has not passed bottom padding', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 900 }),
        fc.integer({ min: 10, max: 60 }),
        fc.integer({ min: 10, max: 60 }),
        (canvasHeight, ghostyW, ghostyH) => {
          const detector = new CollisionDetector(canvasHeight);
          const ghostyY = canvasHeight + CONFIG.gameOverBottomPadding;
          const ghosty = makeGhosty(100, ghostyY, ghostyW, ghostyH);
          return detector.checkGhostyBoundaryCollision(ghosty) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when Ghosty is fully within the canvas boundaries', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 900 }),
        fc.integer({ min: 10, max: 60 }),
        fc.integer({ min: 10, max: 60 }),
        (canvasHeight, ghostyW, ghostyH) => {
          if (ghostyH >= canvasHeight) return true;
          // ghostyY in [0, canvasHeight - ghostyH]
          const ghostyY = Math.floor((canvasHeight - ghostyH) / 2);
          const detector = new CollisionDetector(canvasHeight);
          const ghosty = makeGhosty(100, ghostyY, ghostyW, ghostyH);
          return detector.checkGhostyBoundaryCollision(ghosty) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
