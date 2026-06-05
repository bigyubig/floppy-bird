/**
 * PhysicsEngine.js — Applies gravity, velocity clamping, and position updates.
 * Implemented in task 3.1.
 *
 * Requirements: 1.4, 1.8, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import CONFIG from '../config.js';

/**
 * @typedef {Object} PhysicsConfig
 * @property {number} gravity              - Gravitational acceleration (px/frame²)
 * @property {number} flapVelocity         - Velocity applied on flap input (px/frame)
 * @property {number} maxUpwardVelocity    - Maximum upward speed, most negative (px/frame)
 * @property {number} maxDownwardVelocity  - Maximum downward speed, most positive (px/frame)
 */

export class PhysicsEngine {
  /**
   * @param {Partial<PhysicsConfig>} [config={}] - Optional overrides for physics constants.
   *   Defaults to values from CONFIG.
   */
  constructor(config = {}) {
    this.gravity = config.gravity ?? CONFIG.gravity;
    this.flapVelocity = config.flapVelocity ?? CONFIG.flapVelocity;
    this.maxUpwardVelocity = config.maxUpwardVelocity ?? CONFIG.maxUpwardVelocity;
    this.maxDownwardVelocity = config.maxDownwardVelocity ?? CONFIG.maxDownwardVelocity;
  }

  /**
   * Applies gravitational acceleration to an entity's vertical velocity.
   * Increments velocityY by gravity * deltaTime each call.
   *
   * @param {import('../entities/Entity.js').Entity} entity - The entity to update
   * @param {number} [deltaTime=1] - Time step in frames
   */
  applyGravity(entity, deltaTime = 1) {
    entity.velocityY += this.gravity * deltaTime;
  }

  /**
   * Clamps an entity's vertical velocity to the configured min/max range.
   * Prevents velocityY from exceeding terminal velocities in either direction.
   *
   * @param {import('../entities/Entity.js').Entity} entity - The entity to clamp
   */
  clampVelocity(entity) {
    if (entity.velocityY < this.maxUpwardVelocity) {
      entity.velocityY = this.maxUpwardVelocity;
    } else if (entity.velocityY > this.maxDownwardVelocity) {
      entity.velocityY = this.maxDownwardVelocity;
    }
  }

  /**
   * Updates an entity's vertical position based on its current velocity.
   * Adds velocityY * deltaTime to the entity's y coordinate.
   *
   * @param {import('../entities/Entity.js').Entity} entity - The entity to move
   * @param {number} [deltaTime=1] - Time step in frames
   */
  updatePosition(entity, deltaTime = 1) {
    entity.y += entity.velocityY * deltaTime;
  }

  /**
   * Applies an instantaneous flap by setting velocityY to the configured flapVelocity.
   * This is always a fixed value regardless of current velocity.
   *
   * @param {import('../entities/Entity.js').Entity} entity - The entity to flap
   */
  applyFlap(entity) {
    entity.velocityY = this.flapVelocity;
  }
}

export default PhysicsEngine;
