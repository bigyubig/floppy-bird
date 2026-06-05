/**
 * EntityManager.js — Creates, manages, and destroys game entities.
 * Implemented in task 6.1.
 *
 * Requirements: 1.7, 2.1, 2.2, 2.3, 2.4, 2.7, 5.8
 */

import CONFIG from '../config.js';
import { Ghosty } from '../entities/Ghosty.js';
import { Pipe } from '../entities/Pipe.js';

export class EntityManager {
  /**
   * @param {HTMLCanvasElement} canvas      - The game canvas element
   * @param {number}            scaleFactor - Current scale factor (canvasWidth / baseCanvasWidth)
   */
  constructor(canvas, scaleFactor) {
    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;

    /** @type {number} */
    this.scaleFactor = scaleFactor;

    /** @type {Pipe[]} — All active pipe entities */
    this._pipes = [];

    /** @type {Ghosty|null} — The player-controlled Ghosty entity */
    this._ghosty = null;

    /**
     * Frame counter used to time pipe spawning.
     * Incremented once per update() call.
     * @type {number}
     */
    this.frameCount = 0;

    /**
     * Current score — the number of pipes Ghosty has successfully passed.
     * @type {number}
     */
    this.score = 0;

    /** @type {number} Countdown in spawned pipes until next cake appears. */
    this._pipesUntilNextCake = this._nextCakePipeGap();

    /** @type {number} Lifetime cakes collected (for life gauge progress). */
    this.cakesCollected = 0;
    /** @type {number} Current progress toward next extra life [0..cakesPerLife-1]. */
    this.cakeGaugeProgress = 0;
    /** @type {number} Stored spare lives available for revive. */
    this.extraLives = 0;
  }

  // ── Ghosty ────────────────────────────────────────────────────────────────

  /**
   * Creates and returns a new Ghosty entity positioned at x=50, y=center.
   * Velocity is initialized to 0.
   *
   * Requirements: 1.7
   *
   * @returns {Ghosty}
   */
  createGhosty() {
    const canvasHeight = this.canvas.height;
    const size = 40 * this.scaleFactor;
    const x = 50 * this.scaleFactor;
    const y = canvasHeight / 2 - size / 2;

    this._ghosty = new Ghosty(x, y, size, size);
    return this._ghosty;
  }

  /**
   * Returns the current Ghosty instance, or null if not yet created.
   *
   * @returns {Ghosty|null}
   */
  getGhosty() {
    return this._ghosty;
  }

  // ── Pipes ─────────────────────────────────────────────────────────────────

  /**
   * Spawns the first pipe of a round already partially on screen so the player
   * does not wait for the regular spawn interval before seeing an obstacle.
   *
   * @returns {Pipe}
   */
  spawnInitialPipe() {
    const pipe = this.spawnPipe();
    // Place it immediately visible on the right side: right edge aligns
    // with the canvas right edge.
    pipe.x = this.canvas.width - pipe.width;
    return pipe;
  }

  /**
   * Spawns a new Pipe at the right edge of the canvas with a randomized gap.
   *
   * Gap center Y is chosen uniformly in [CONFIG.minGapY, canvasHeight - CONFIG.maxGapYOffset].
   * Both minGapY and maxGapYOffset are scaled by the current scaleFactor.
   *
   * Requirements: 2.1, 2.4
   *
   * @returns {Pipe}
   */
  spawnPipe() {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    const pipeWidth = 60 * this.scaleFactor;
    const gapHeight = CONFIG.gapHeight * this.scaleFactor;
    const minGapY = CONFIG.minGapY * this.scaleFactor;
    const maxGapY = canvasHeight - CONFIG.maxGapYOffset * this.scaleFactor;

    // Randomize gap center within valid bounds
    const gapY = minGapY + Math.random() * (maxGapY - minGapY);

    // Spawn at the right edge (right outside/at boundary depending on width),
    // so newly generated pipes appear promptly from the right side.
    const x = canvasWidth;

    const pipe = new Pipe(x, pipeWidth, canvasHeight, gapY, gapHeight);
    this._maybeAttachCake(pipe);
    this._pipes.push(pipe);
    return pipe;
  }

  /**
   * Updates all active pipes by advancing their position by one frame.
   * Pipes that are fully off the left edge are removed automatically.
   *
   * Requirements: 2.2, 2.3
   *
   * @param {number} [deltaTime=1] - Time step in frames
   */
  updatePipes(deltaTime = 1) {
    for (const pipe of this._pipes) {
      pipe.update(deltaTime);
    }
    // Remove pipes that have scrolled off screen
    this._pipes = this._pipes.filter(pipe => !pipe.isOffScreen(this.canvas.width));
  }

  /**
   * Explicitly removes a single pipe from the active collection.
   *
   * @param {Pipe} pipe - The pipe to remove
   */
  removePipe(pipe) {
    this._pipes = this._pipes.filter(p => p !== pipe);
  }

  /**
   * Returns a copy of the current active pipe array.
   *
   * @returns {Pipe[]}
   */
  getPipes() {
    return [...this._pipes];
  }

  /**
   * Returns an AABB for the cake attached to a pipe, or null when no active cake.
   *
   * @param {Pipe} pipe
   * @returns {{x:number,y:number,width:number,height:number}|null}
   */
  getCakeBoundingBox(pipe) {
    if (!pipe.hasCake || pipe.cakeCollected || pipe.cakeSide == null) return null;
    const cakeSize = 28 * CONFIG.cakeScale * this.scaleFactor;
    const x = pipe.x + pipe.width / 2 - cakeSize / 2;
    const offset = CONFIG.cakeOffsetFromPipe * this.scaleFactor;
    const gapTop = pipe.gapY - pipe.gapHeight / 2;
    const gapBottom = pipe.gapY + pipe.gapHeight / 2;
    const safeTopY = gapTop + offset;
    const safeBottomY = gapBottom - offset - cakeSize;

    // If the gap cannot host the cake with required clearances, hide the cake.
    if (safeTopY > safeBottomY) return null;

    if (pipe.cakeSide === 'top') {
      return {
        x,
        y: safeTopY,
        width: cakeSize,
        height: cakeSize,
      };
    }

    return {
      x,
      y: safeBottomY,
      width: cakeSize,
      height: cakeSize,
    };
  }

  /**
   * Checks whether Ghosty collects any active cake.
   * Collected cake gives bonus score once and is hidden immediately.
   *
   * @param {Ghosty} ghosty
   * @returns {boolean} true if at least one cake was collected this frame
   */
  checkCakeCollection(ghosty) {
    const g = ghosty.getBoundingBox();
    let collected = false;

    for (const pipe of this._pipes) {
      const cake = this.getCakeBoundingBox(pipe);
      if (!cake) continue;
      const overlap =
        g.x < cake.x + cake.width &&
        g.x + g.width > cake.x &&
        g.y < cake.y + cake.height &&
        g.y + g.height > cake.y;
      if (overlap) {
        pipe.cakeCollected = true;
        pipe.hasCake = false;
        this.score += CONFIG.cakeScoreBonus;
        this.cakesCollected += 1;
        this.cakeGaugeProgress += 1;
        if (this.cakeGaugeProgress >= CONFIG.cakesPerLife) {
          this.cakeGaugeProgress = 0;
          this.extraLives = Math.min(CONFIG.lifeGaugeMaxLives, this.extraLives + 1);
        }
        collected = true;
      }
    }

    return collected;
  }

  // ── Score Tracking ────────────────────────────────────────────────────────

  /**
   * Checks whether Ghosty has passed any unscored pipes and increments the
   * score accordingly.  A pipe is considered "passed" when Ghosty's left edge
   * (ghosty.x) has moved past the pipe's right edge (pipe.x + pipe.width) and
   * the pipe has not yet been marked as scored.
   *
   * Requirements: 4.1, 4.2, 4.3
   *
   * @param {Ghosty} ghosty - The Ghosty entity to test against
   */
  checkAndUpdateScore(ghosty) {
    for (const pipe of this._pipes) {
      if (ghosty.x > pipe.x + pipe.width && pipe.scored !== true) {
        pipe.scored = true;
        this.score += 1;
      }
    }
  }

  /**
   * Returns the current score.
   *
   * Requirements: 4.4, 4.5
   *
   * @returns {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * Returns life-gauge state for HUD rendering.
   * @returns {{progress:number, required:number, extraLives:number}}
   */
  getLifeGauge() {
    return {
      progress: this.cakeGaugeProgress,
      required: CONFIG.cakesPerLife,
      extraLives: this.extraLives,
    };
  }

  /**
   * Spend one extra life if available.
   * @returns {boolean} true when a life was consumed
   */
  consumeExtraLife() {
    if (this.extraLives <= 0) return false;
    this.extraLives -= 1;
    return true;
  }

  // ── Spawn Timing ──────────────────────────────────────────────────────────

  /**
   * Returns true if a new pipe should be spawned on the current frame.
   *
   * A pipe is spawned every CONFIG.pipeSpawnInterval frames (default 90).
   * The check is skipped when frameCount is 0 to avoid an immediate spawn
   * at the very first frame of gameplay.
   *
   * Requirements: 2.1
   *
   * @returns {boolean}
   */
  shouldSpawnPipe() {
    return this.frameCount > 0 && this.frameCount % CONFIG.pipeSpawnInterval === 0;
  }

  // ── Game Loop Integration ─────────────────────────────────────────────────

  /**
   * Advances the internal frame counter and updates all pipe positions.
   * Call once per game-loop frame while in the PLAYING state.
   *
   * Requirements: 2.2
   *
   * @param {number} [deltaTime=1] - Time step in frames
   */
  update(deltaTime = 1) {
    this.frameCount += deltaTime;
    this.updatePipes(deltaTime);
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  /**
   * Resets the EntityManager to its initial state:
   * - Clears all pipes
   * - Resets the frame counter to 0
   * - Resets the score to 0
   * - Keeps the Ghosty reference but re-creates her via createGhosty()
   *
   * Requirements: 5.8
   */
  reset() {
    this._pipes = [];
    this.frameCount = 0;
    this.score = 0;
    this._pipesUntilNextCake = this._nextCakePipeGap();
    this.cakesCollected = 0;
    this.cakeGaugeProgress = 0;
    this.extraLives = 0;
    if (this._ghosty) {
      // Re-initialise Ghosty to starting position and zero velocity
      this.createGhosty();
    }
  }

  // ── Scale ─────────────────────────────────────────────────────────────────

  /**
   * Updates the scale factor used when spawning new entities.
   * Does not retroactively resize already-spawned entities.
   *
   * @param {number} scaleFactor - New scale factor
   */
  setScaleFactor(scaleFactor) {
    this.scaleFactor = scaleFactor;
  }

  /**
   * Random number of pipes before next cake appears.
   * @returns {number}
   * @private
   */
  _nextCakePipeGap() {
    const min = CONFIG.cakeMinPipeGapCount;
    const max = CONFIG.cakeMaxPipeGapCount;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /**
   * Optionally attach a cake to this newly spawned pipe.
   * @param {Pipe} pipe
   * @private
   */
  _maybeAttachCake(pipe) {
    this._pipesUntilNextCake -= 1;
    if (this._pipesUntilNextCake > 0) return;

    pipe.hasCake = true;
    pipe.cakeCollected = false;
    pipe.cakeSide = Math.random() < 0.5 ? 'top' : 'bottom';
    this._pipesUntilNextCake = this._nextCakePipeGap();
  }
}

export default EntityManager;
