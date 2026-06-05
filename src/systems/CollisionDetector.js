/**
 * CollisionDetector.js — AABB collision detection between Ghosty, pipes, and boundaries.
 * Implemented in task 4.1.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import CONFIG from '../config.js';

export class CollisionDetector {
  /**
   * @param {number} canvasHeight - Canvas height in pixels used for boundary checks
   */
  constructor(canvasHeight) {
    /** @type {number} Canvas height for bottom boundary collision detection */
    this.canvasHeight = canvasHeight;
  }

  /**
   * Checks whether two axis-aligned bounding boxes overlap.
   * Returns true if there is at least one pixel of overlap on both axes.
   *
   * The AABB overlap test: two boxes overlap if and only if neither
   * box is fully to the left, right, above, or below the other.
   *
   * Requirements: 3.1, 3.2
   *
   * @param {{ x: number, y: number, width: number, height: number }} box1
   * @param {{ x: number, y: number, width: number, height: number }} box2
   * @returns {boolean} true if the boxes overlap
   */
  checkAABBCollision(box1, box2) {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  /**
   * Determines whether Ghosty's bounding box lies entirely within the
   * vertical gap of a pipe pair (i.e. no collision with either segment).
   *
   * Ghosty is in the gap when:
   *   - Ghosty's top edge (y) is >= the bottom of the top pipe segment (gapY - gapHeight/2)
   *   - Ghosty's bottom edge (y + height) is <= the top of the bottom pipe segment (gapY + gapHeight/2)
   *
   * Requirements: 3.3
   *
   * @param {import('../entities/Ghosty.js').Ghosty} ghosty
   * @param {import('../entities/Pipe.js').Pipe} pipe
   * @returns {boolean} true if Ghosty is entirely within the gap (no collision)
   */
  isGhostyInGap(ghosty, pipe) {
    const gapTop = pipe.gapY - pipe.gapHeight / 2;    // bottom edge of top pipe
    const gapBottom = pipe.gapY + pipe.gapHeight / 2; // top edge of bottom pipe

    const ghostyBox = ghosty.getBoundingBox();

    return (
      ghostyBox.y >= gapTop &&
      ghostyBox.y + ghostyBox.height <= gapBottom
    );
  }

  /**
   * Checks whether Ghosty collides with either the top or bottom segment of a pipe.
   *
   * Uses AABB collision against each pipe segment's bounding box.
   * Returns true if Ghosty overlaps with the top segment OR the bottom segment.
   *
   * Requirements: 3.1, 3.2
   *
   * @param {import('../entities/Ghosty.js').Ghosty} ghosty
   * @param {import('../entities/Pipe.js').Pipe} pipe
   * @returns {boolean} true if Ghosty collides with either pipe segment
   */
  checkGhostyPipeCollision(ghosty, pipe) {
    const ghostyBox = ghosty.getBoundingBox();
    const topSegment = this._insetBox(pipe.getTopSegment(), CONFIG.pipeCollisionInset);
    const bottomSegment = this._insetBox(pipe.getBottomSegment(), CONFIG.pipeCollisionInset);

    return (
      this.checkAABBCollision(ghostyBox, topSegment) ||
      this.checkAABBCollision(ghostyBox, bottomSegment)
    );
  }

  /**
   * Shrinks a box inward by inset pixels on all sides.
   * Used to make pipe death zones slightly smaller than visual geometry.
   *
   * @param {{ x: number, y: number, width: number, height: number }} box
   * @param {number} inset
   * @returns {{ x: number, y: number, width: number, height: number }}
   * @private
   */
  _insetBox(box, inset) {
    const safeInsetX = Math.min(inset, box.width / 2);
    const safeInsetY = Math.min(inset, box.height / 2);
    const width = Math.max(0, box.width - safeInsetX * 2);
    const height = Math.max(0, box.height - safeInsetY * 2);
    return {
      x: box.x + safeInsetX,
      y: box.y + safeInsetY,
      width,
      height,
    };
  }

  /**
   * Checks whether Ghosty has hit the top or bottom boundary of the canvas.
   *
   * - Top boundary: Ghosty's top edge is above the allowed top padding
   *   (y < -CONFIG.topBoundaryPadding)
   * - Bottom boundary: Ghosty is fully below the canvas AND Ghosty's top edge
   *   is at least CONFIG.gameOverBottomPadding pixels below canvasHeight
   *
   * Requirements: 3.4, 3.5
   *
   * @param {import('../entities/Ghosty.js').Ghosty} ghosty
   * @returns {boolean} true if Ghosty is outside the canvas boundaries
   */
  checkGhostyBoundaryCollision(ghosty) {
    const box = ghosty.getBoundingBox();
    const topBoundaryCollision = box.y < -CONFIG.topBoundaryPadding;
    const bottomBoundaryCollision =
      box.y > this.canvasHeight + CONFIG.gameOverBottomPadding;
    return topBoundaryCollision || bottomBoundaryCollision;
  }
}

export default CollisionDetector;
