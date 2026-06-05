/**
 * Entity.js — Base class for all game entities.
 * Implemented in task 2.1.
 *
 * Requirements: 1.6, 8.4
 */

export class Entity {
  /**
   * @param {number} x        - Horizontal position in pixels
   * @param {number} y        - Vertical position in pixels
   * @param {number} width    - Entity width in pixels
   * @param {number} height   - Entity height in pixels
   * @param {number} [velocityX=0] - Horizontal velocity in px/frame
   * @param {number} [velocityY=0] - Vertical velocity in px/frame
   */
  constructor(x, y, width, height, velocityX = 0, velocityY = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  /**
   * Returns the axis-aligned bounding box for this entity.
   * Used by CollisionDetector for AABB collision checks.
   *
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getBoundingBox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Update entity state for the current frame.
   * Subclasses should override this to implement their own update logic.
   *
   * @param {number} [deltaTime=1] - Time step (frames elapsed)
   */
  // eslint-disable-next-line no-unused-vars
  update(deltaTime = 1) {
    // Base implementation is a no-op stub.
    // Subclasses (Ghosty, Pipe) override this.
  }

  /**
   * Render the entity onto the canvas.
   * Subclasses should override this to implement their own rendering.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context
   */
  // eslint-disable-next-line no-unused-vars
  render(ctx) {
    // Base implementation is a no-op stub.
    // Subclasses (Ghosty, Pipe) override this.
  }
}

export default Entity;
