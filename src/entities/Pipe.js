/**
 * Pipe.js — Pipe obstacle entity with gap.
 * Implemented in task 2.4.
 *
 * Requirements: 2.3, 2.5, 7.2, 7.3
 */

import { Entity } from './Entity.js';
import CONFIG from '../config.js';

export class Pipe extends Entity {
  /**
   * @param {number} x          - Horizontal position (left edge of pipe)
   * @param {number} width      - Pipe width in pixels
   * @param {number} height     - Canvas height (pipes span the full canvas height)
   * @param {number} gapY       - Y coordinate of the gap center
   * @param {number} gapHeight  - Height of the gap in pixels
   */
  constructor(x, width, height, gapY, gapHeight) {
    // The entity spans the full canvas height; x and y are the top-left corner
    super(x, 0, width, height, -CONFIG.pipeSpeed, 0);

    /** @type {number} Y coordinate of the gap center */
    this.gapY = gapY;

    /** @type {number} Height of the gap between top and bottom pipe segments */
    this.gapHeight = gapHeight;

    /** @type {boolean} Whether Ghosty has already passed this pipe (for scoring) */
    this.scored = false;

    /** @type {'top'|'bottom'|null} Which segment hosts cake on this pipe */
    this.cakeSide = null;
    /** @type {boolean} Whether this pipe's cake is still collectable/visible */
    this.hasCake = false;
    /** @type {boolean} Whether this pipe's cake has already been collected */
    this.cakeCollected = false;
  }

  /**
   * Returns the bounding box for the top pipe segment.
   * The top segment extends from y=0 down to the top edge of the gap.
   *
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getTopSegment() {
    const topHeight = this.gapY - this.gapHeight / 2;
    return {
      x: this.x,
      y: 0,
      width: this.width,
      height: topHeight,
    };
  }

  /**
   * Returns the bounding box for the bottom pipe segment.
   * The bottom segment extends from the bottom edge of the gap to the canvas bottom.
   *
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getBottomSegment() {
    const bottomY = this.gapY + this.gapHeight / 2;
    return {
      x: this.x,
      y: bottomY,
      width: this.width,
      height: this.height - bottomY,
    };
  }

  /**
   * Checks whether this pipe has moved completely off the left edge of the screen.
   *
   * @param {number} [canvasWidth] - Canvas width (unused; off-screen is x + width < 0)
   * @returns {boolean} true if the pipe is fully off-screen to the left
   */
  // eslint-disable-next-line no-unused-vars
  isOffScreen(canvasWidth) {
    return this.x + this.width < 0;
  }

  /**
   * Moves the pipe leftward by its velocityX value each frame.
   *
   * @param {number} [deltaTime=1] - Time step (frames elapsed)
   */
  update(deltaTime = 1) {
    this.x += this.velocityX * deltaTime;
  }

  /**
   * Renders both pipe segments onto the canvas.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context
   */
  render(ctx) {
    ctx.fillStyle = CONFIG.pipeColor;

    const top = this.getTopSegment();
    const bottom = this.getBottomSegment();

    // Draw top segment
    ctx.fillRect(top.x, top.y, top.width, top.height);

    // Draw bottom segment
    ctx.fillRect(bottom.x, bottom.y, bottom.width, bottom.height);
  }
}

export default Pipe;
