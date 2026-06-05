/**
 * Ghosty.js — Player-controlled ghost character entity.
 * Implemented in task 2.2.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.7, 7.1, 7.7, 7.8, 8.1
 */

import { Entity } from './Entity.js';
import CONFIG from '../config.js';

export class Ghosty extends Entity {
  /**
   * @param {number} x          - Initial horizontal position
   * @param {number} y          - Initial vertical position
   * @param {number} [width=40] - Sprite display width in pixels
   * @param {number} [height=40] - Sprite display height in pixels
   */
  constructor(x, y, width = 40, height = 40) {
    super(x, y, width, height, 0, 0);

    /**
     * The loaded sprite image for Ghosty.
     * Set to null until the image is loaded externally (e.g. by GameEngine).
     * @type {HTMLImageElement|null}
     */
    this.sprite = null;

    /**
     * Current rotation angle in degrees.
     * Negative = counterclockwise (nose-up), positive = clockwise (nose-down).
     * @type {number}
     */
    this.rotation = 0;
  }

  /**
   * Applies the flap velocity from CONFIG to give Ghosty an upward impulse.
   * Sets velocityY to CONFIG.flapVelocity (-8 px/frame).
   *
   * Requirements: 1.1, 1.2, 1.3, 8.1
   */
  applyFlap() {
    this.velocityY = CONFIG.flapVelocity;
  }

  /**
   * Updates the rotation angle based on the current vertical velocity.
   * - Negative velocityY (moving up)  → counterclockwise, clamped at -25°
   * - Positive velocityY (moving down) → clockwise, clamped at +90°
   *
   * The mapping is linear: velocityY is scaled to the rotation range proportionally.
   * Upward: rotation = (velocityY / CONFIG.maxUpwardVelocity) * (-25)
   *   When velocityY = -10 → rotation = -25°
   * Downward: rotation = (velocityY / CONFIG.maxDownwardVelocity) * 90
   *   When velocityY = 10 → rotation = 90°
   *
   * Requirements: 7.7, 7.8
   */
  updateRotation() {
    if (this.velocityY < 0) {
      // Moving upward: map [0, maxUpwardVelocity] → [0°, -25°]
      this.rotation = (this.velocityY / CONFIG.maxUpwardVelocity) * (-25);
    } else {
      // Moving downward (or stationary): map [0, maxDownwardVelocity] → [0°, 90°]
      this.rotation = (this.velocityY / CONFIG.maxDownwardVelocity) * 90;
    }
  }

  /**
   * Applies gravity (CONFIG.gravity) and velocity clamping each frame.
   * Also updates rotation after computing the new velocity.
   *
   * Physics update sequence per frame:
   *  1. velocityY += CONFIG.gravity * deltaTime
   *  2. Clamp velocityY to [CONFIG.maxUpwardVelocity, CONFIG.maxDownwardVelocity]
   *  3. y += velocityY * deltaTime
   *  4. updateRotation()
   *
   * Requirements: 1.4, 1.8
   *
   * @param {number} [deltaTime=1] - Time step in frames
   */
  update(deltaTime = 1) {
    // 1. Apply gravity
    this.velocityY += CONFIG.gravity * deltaTime;

    // 2. Clamp velocity
    if (this.velocityY < CONFIG.maxUpwardVelocity) {
      this.velocityY = CONFIG.maxUpwardVelocity;
    }
    if (this.velocityY > CONFIG.maxDownwardVelocity) {
      this.velocityY = CONFIG.maxDownwardVelocity;
    }

    // 3. Update position
    this.y += this.velocityY * deltaTime;

    // 4. Update rotation based on new velocity
    this.updateRotation();
  }

  /**
   * Renders Ghosty onto the canvas with the current rotation applied.
   * If the sprite is not loaded, falls back to a filled rectangle placeholder.
   *
   * Requirements: 7.1, 7.7, 7.8
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
   */
  render(ctx) {
    ctx.save();

    // Translate to the center of Ghosty for rotation pivot
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((this.rotation * Math.PI) / 180);

    if (this.sprite) {
      ctx.drawImage(
        this.sprite,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Placeholder rectangle when sprite is not yet loaded
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    ctx.restore();
  }
}

export default Ghosty;
