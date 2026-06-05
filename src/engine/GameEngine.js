/**
 * GameEngine.js — Main game loop and subsystem coordinator.
 *
 * Integrates StateManager, PhysicsEngine, EntityManager, CollisionDetector,
 * InputHandler, Renderer, and AudioSystem into a single playable game.
 *
 * Implemented in tasks 14.1-14.5 and 15.1-15.2.
 *
 * Requirements: 1.4, 1.5, 1.6, 2.1, 2.2, 3.6, 4.4, 4.5, 5.x, 6.1, 6.2,
 *               9.1, 9.2, 9.5, 10.1, 10.2, 10.5, 10.6, 10.7
 */

import CONFIG from '../config.js';
import { StateManager, GameState } from './StateManager.js';
import { InputHandler } from './InputHandler.js';
import AudioSystem from './AudioSystem.js';
import { PhysicsEngine } from '../systems/PhysicsEngine.js';
import { EntityManager } from '../systems/EntityManager.js';
import { CollisionDetector } from '../systems/CollisionDetector.js';
import { Renderer } from '../systems/Renderer.js';
import {
  resizeCanvas,
  calculateScaleFactor,
} from '../utils/canvasSizing.js';

/**
 * Coordinates all game subsystems and drives the main loop.
 */
export class GameEngine {
  /**
   * @param {HTMLCanvasElement} canvas - The game canvas element.
   */
  constructor(canvas) {
    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;

    /** @type {number} Scale factor relative to the baseline width (400px). */
    this.scaleFactor = calculateScaleFactor(canvas.width || CONFIG.baseCanvasWidth);

    // ── Subsystems ──────────────────────────────────────────────────────────
    this.stateManager = new StateManager();
    this.physicsEngine = new PhysicsEngine();
    this.entityManager = new EntityManager(canvas, this.scaleFactor);
    this.collisionDetector = new CollisionDetector(canvas.height);
    this.renderer = new Renderer(canvas, this.scaleFactor);
    this.inputHandler = new InputHandler(canvas);
    this.audioSystem = new AudioSystem();

    // ── Loop state ──────────────────────────────────────────────────────────
    /** @type {boolean} Whether init() succeeded and the game may start. */
    this.canStart = false;
    /** @type {boolean} Whether the rAF loop is currently running. */
    this._running = false;
    /** @type {number|null} Current requestAnimationFrame handle. */
    this._rafId = null;

    /** @type {HTMLImageElement|null} Cached Ghosty sprite (re-applied on reset). */
    this._sprite = null;
    /** @type {string|null} Last error message shown to the player, if any. */
    this._errorMessage = null;
    /** @type {number} Remaining invincibility time in frames. */
    this._invincibleFrames = 0;

    // Bind handlers so they can be added/removed reliably.
    this._frame = this._frame.bind(this);
    this._handleResize = this._handleResize.bind(this);
  }

  // ── Initialization ─────────────────────────────────────────────────────────

  /**
   * Initialize the engine: size the canvas, validate the viewport, load assets,
   * wire input, and register the resize listener.
   *
   * Resolves once initialization completes. On a critical failure (viewport too
   * small or image load failure) the engine displays an error and leaves
   * `canStart` false so the loop will not run.
   *
   * Requirements: 5.1, 9.1, 9.2, 9.3, 10.5, 10.6, 10.7
   *
   * @returns {Promise<void>}
   */
  async init() {
    const vw = this._viewportWidth();
    const vh = this._viewportHeight();

    // Size the canvas to fit the viewport (aspect ratio locked, objects scale down).
    this._applyCanvasSize(vw, vh);

    // Create the player entity at its starting position.
    this.entityManager.createGhosty();

    // Load the Ghosty sprite (critical asset, 10s timeout).
    try {
      this._sprite = await this._loadImage(CONFIG.ghostySpritePath, CONFIG.imageLoadTimeout);
      const ghosty = this.entityManager.getGhosty();
      if (ghosty) ghosty.sprite = this._sprite;
      // Non-critical visual reward sprite.
      const cakeSprite = await this._loadImage(CONFIG.cakeSpritePath, CONFIG.imageLoadTimeout);
      this.renderer.cakeSprite = cakeSprite;
    } catch (err) {
      this._showError(
        'Failed to load ghosty.png. Please refresh to try again. ' +
          'Press F5 or refresh the page to try again.'
      );
      this.canStart = false;
      return;
    }

    // Load audio (non-critical; never throws, game continues without sound).
    await this.audioSystem.load();

    // Wire input and resize handling.
    this.inputHandler.attach((inputType) => this.handleInput(inputType));
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('resize', this._handleResize);
    }

    this.canStart = true;
  }

  // ── Loop control ─────────────────────────────────────────────────────────

  /**
   * Begin the game loop using requestAnimationFrame.
   * No-op if initialization failed or the loop is already running.
   *
   * Requirements: 10.1
   */
  start() {
    if (!this.canStart || this._running) return;
    this._running = true;
    if (typeof requestAnimationFrame === 'function') {
      this._rafId = requestAnimationFrame(this._frame);
    }
  }

  /**
   * Stop the game loop.
   */
  stop() {
    this._running = false;
    if (this._rafId != null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._rafId);
    }
    this._rafId = null;
  }

  /**
   * Internal rAF callback. Uses a fixed timestep of one frame per tick to keep
   * spawn timing and physics deterministic (per the fixed-timestep design).
   * @private
   */
  _frame() {
    if (!this._running) return;
    this.update(1);
    this.render();
    if (typeof requestAnimationFrame === 'function') {
      this._rafId = requestAnimationFrame(this._frame);
    }
  }

  // ── Simulation ─────────────────────────────────────────────────────────────

  /**
   * Advance the simulation by one (or more) frames.
   * Only mutates state while PLAYING.
   *
   * Requirements: 1.4, 1.6, 2.1, 2.2, 3.6, 4.1, 4.2, 4.3
   *
   * @param {number} [deltaTime=1] - Time step in frames.
   */
  update(deltaTime = 1) {
    if (!this.stateManager.isPlaying()) return;

    const ghosty = this.entityManager.getGhosty();
    if (!ghosty) return;

    // Physics: gravity -> clamp -> position -> rotation.
    this.physicsEngine.applyGravity(ghosty, deltaTime);
    this.physicsEngine.clampVelocity(ghosty);
    this.physicsEngine.updatePosition(ghosty, deltaTime);
    // Touching the top should not end the game: keep Ghosty pinned to
    // the allowed top padding distance.
    if (ghosty.y < -CONFIG.topBoundaryPadding) {
      ghosty.y = -CONFIG.topBoundaryPadding;
      if (ghosty.velocityY < 0) ghosty.velocityY = 0;
    }
    if (this._invincibleFrames > 0) {
      this._invincibleFrames = Math.max(0, this._invincibleFrames - deltaTime);
    }
    ghosty.updateRotation();

    // Pipes: advance frame counter + move/remove pipes, then spawn if due.
    this.entityManager.update(deltaTime);
    if (this.entityManager.shouldSpawnPipe()) {
      this.entityManager.spawnPipe();
    }

    // Scoring.
    this.entityManager.checkAndUpdateScore(ghosty);
    const gotCake = this.entityManager.checkCakeCollection(ghosty);
    if (gotCake) this.audioSystem.playYummy();

    // Collisions are ignored during revive invincibility.
    if (this._invincibleFrames <= 0) {
      let collided = this.collisionDetector.checkGhostyBoundaryCollision(ghosty);
      if (!collided) {
        for (const pipe of this.entityManager.getPipes()) {
          if (this.collisionDetector.checkGhostyPipeCollision(ghosty, pipe)) {
            collided = true;
            break;
          }
        }
      }
      if (collided) {
        if (this.entityManager.consumeExtraLife()) {
          // Revive in-place: keep score/pipes/state, stabilize Ghosty, grant i-frames.
          ghosty.velocityY = 0;
          const maxY = this.canvas.height - ghosty.height;
          ghosty.y = Math.max(-CONFIG.topBoundaryPadding, Math.min(ghosty.y, maxY));
          this._invincibleFrames = CONFIG.reviveInvincibleSeconds * 60;
        } else {
          this.stateManager.transitionTo(GameState.GAME_OVER);
          this.stateManager.updateHighScore(this.entityManager.getScore());
          this.audioSystem.playGameOver();
        }
      }
    }
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  /**
   * Draw the current frame: background -> pipes -> ghosty -> score -> UI text.
   *
   * Requirements: 4.4, 4.5, 5.2, 5.5, 7.9, 7.10
   */
  render() {
    this.renderer.renderBackground();
    this.renderer.renderPipes(this.entityManager.getPipes());
    this.renderer.renderCakes(this.entityManager.getPipes());

    const ghosty = this.entityManager.getGhosty();
    if (ghosty) this.renderer.renderGhosty(ghosty);

    const state = this.stateManager.getCurrentState();
    if (state === GameState.MENU) {
      this.renderer.drawMenu();
    } else if (state === GameState.PLAYING) {
      this.renderer.renderScore(this.entityManager.getScore());
      this.renderer.renderLifeGauge(this.entityManager.getLifeGauge());
    } else if (state === GameState.GAME_OVER) {
      this.renderer.drawGameOver(
        this.entityManager.getScore(),
        this.stateManager.getHighScore()
      );
    }
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  /**
   * Handle a normalized flap input depending on the current state.
   * - MENU: start the game.
   * - PLAYING: flap Ghosty and play the jump sound.
   * - GAME_OVER: reset and start a new game.
   *
   * Requirements: 1.1, 1.2, 1.3, 1.5, 5.3, 5.6, 5.7, 5.8, 5.9, 5.10, 6.1
   *
   * @param {string} [inputType] - The InputType that triggered this (unused).
   */
  // eslint-disable-next-line no-unused-vars
  handleInput(inputType) {
    const state = this.stateManager.getCurrentState();

    if (state === GameState.MENU) {
      this.stateManager.transitionTo(GameState.PLAYING);
      // Spawn first obstacle immediately when gameplay starts.
      if (this.entityManager.getPipes().length === 0) {
        this.entityManager.spawnInitialPipe();
      }
    } else if (state === GameState.PLAYING) {
      const ghosty = this.entityManager.getGhosty();
      if (ghosty) {
        this.physicsEngine.applyFlap(ghosty);
        ghosty.updateRotation();
      }
      this.audioSystem.playJump();
    } else if (state === GameState.GAME_OVER) {
      this.reset();
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  /**
   * Reset the game to a fresh PLAYING session: clear pipes, reset score,
   * re-create Ghosty (re-applying the cached sprite), and enter PLAYING.
   *
   * Requirements: 5.6, 5.7, 5.8, 5.9
   */
  reset() {
    this.entityManager.reset();

    const ghosty = this.entityManager.getGhosty();
    if (ghosty && this._sprite) ghosty.sprite = this._sprite;

    if (!this.stateManager.isPlaying()) {
      this.stateManager.transitionTo(GameState.PLAYING);
    }
    this._invincibleFrames = 0;
    // After restart, show the first pipe immediately on the right side.
    if (this.entityManager.getPipes().length === 0) {
      this.entityManager.spawnInitialPipe();
    }
  }

  // ── Queries ──────────────────────────────────────────────────────────────

  /** @returns {string} The current game state. */
  getState() {
    return this.stateManager.getCurrentState();
  }

  /** @returns {number} The current score. */
  getScore() {
    return this.entityManager.getScore();
  }

  /** @returns {string|null} The last error message displayed, if any. */
  getErrorMessage() {
    return this._errorMessage;
  }

  // ── Responsive resize (Tasks 15.1, 15.2) ───────────────────────────────────

  /**
   * Window resize handler. Recomputes canvas dimensions while preserving all
   * game state (score, positions, velocities, mode).
   *
   * Requirements: 9.1, 9.2, 9.3, 9.5
   * @private
   */
  _handleResize() {
    const vw = this._viewportWidth();
    const vh = this._viewportHeight();

    this._applyCanvasSize(vw, vh);
  }

  /**
   * Resize the canvas buffer and propagate the new scale factor to subsystems.
   * Does not modify any gameplay state.
   * @private
   */
  _applyCanvasSize(viewportWidth, viewportHeight) {
    this.scaleFactor = resizeCanvas(this.canvas, viewportWidth, viewportHeight);
    this.renderer.setScaleFactor(this.scaleFactor);
    this.entityManager.setScaleFactor(this.scaleFactor);
    this.collisionDetector.canvasHeight = this.canvas.height;
  }

  // ── Asset loading helpers ──────────────────────────────────────────────────

  /**
   * Load an image with a timeout guard.
   *
   * @param {string} path    - Image path.
   * @param {number} timeout - Timeout in milliseconds.
   * @returns {Promise<HTMLImageElement>} Resolves with the loaded image, rejects on failure/timeout.
   * @private
   */
  _loadImage(path, timeout) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error(`Image load timed out: ${path}`));
      }, timeout);

      img.onload = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(img);
      };

      img.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Failed to load image: ${path}`));
      };

      img.src = path;
    });
  }

  // ── Error display ──────────────────────────────────────────────────────────

  /**
   * Display an error message to the player via the #errorMessage element.
   * @param {string} message
   * @private
   */
  _showError(message) {
    this._errorMessage = message;
    if (typeof document !== 'undefined' && document.getElementById) {
      const el = document.getElementById('errorMessage');
      if (el) {
        el.textContent = message;
        el.style.display = 'block';
      }
    }
  }

  /**
   * Hide any currently displayed error message.
   * @private
   */
  _hideError() {
    this._errorMessage = null;
    if (typeof document !== 'undefined' && document.getElementById) {
      const el = document.getElementById('errorMessage');
      if (el) {
        el.textContent = '';
        el.style.display = 'none';
      }
    }
  }

  // ── Viewport helpers ───────────────────────────────────────────────────────

  /** @returns {number} Current viewport width. @private */
  _viewportWidth() {
    return typeof window !== 'undefined' && window.innerWidth
      ? window.innerWidth
      : this.canvas.width;
  }

  /** @returns {number} Current viewport height. @private */
  _viewportHeight() {
    return typeof window !== 'undefined' && window.innerHeight
      ? window.innerHeight
      : this.canvas.height;
  }
}

export default GameEngine;
