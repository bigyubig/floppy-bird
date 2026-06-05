/**
 * Renderer.js — Handles all canvas drawing operations.
 * Implemented in task 10.1.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 9.4
 */

import CONFIG from '../config.js';

/**
 * Text position constants for renderText().
 */
export const TextPosition = Object.freeze({
  TOP_CENTER: 'top_center',
  MIDDLE_CENTER: 'middle_center',
  BOTTOM_CENTER: 'bottom_center',
});

/**
 * Renderer manages all canvas draw calls for a single frame.
 *
 * Rendering order per frame:
 *   1. Background
 *   2. Pipes
 *   3. Ghosty
 *   4. Score / UI text
 */
export class Renderer {
  /**
   * @param {HTMLCanvasElement}          canvas      - The canvas element to draw on
   * @param {CanvasRenderingContext2D}   [ctx]       - Optional pre-existing 2D context; derived from canvas when omitted
   * @param {number}                     [scaleFactor=1] - Current scale factor (canvasWidth / 400)
   */
  constructor(canvas, ctx, scaleFactor) {
    // Support both constructor(canvas, scaleFactor) and constructor(canvas, ctx, scaleFactor)
    if (typeof ctx === 'number') {
      // Called as constructor(canvas, scaleFactor)
      scaleFactor = ctx;
      ctx = null;
    }

    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;

    /** @type {CanvasRenderingContext2D} */
    this.ctx = ctx || canvas.getContext('2d');

    /** @type {number} */
    this.scaleFactor = (scaleFactor !== undefined && scaleFactor !== null) ? scaleFactor : 1;

    /** @type {HTMLImageElement|null} */
    this.cakeSprite = null;
  }

  // ── Scale helpers ───────────────────────────────────────────────────────

  /**
   * Update the scale factor used for proportional sizing.
   * Call this after every canvas resize.
   *
   * @param {number} scaleFactor
   */
  setScaleFactor(scaleFactor) {
    this.scaleFactor = scaleFactor;
  }

  /**
   * Return the scaled font size for score / UI text.
   * Base size is 36px at 1× scale.
   *
   * @param {number} [base=36]
   * @returns {number}
   */
  _scaledFontSize(base = 36) {
    return Math.round(base * this.scaleFactor);
  }

  // ── Core draw primitives ────────────────────────────────────────────────

  /**
   * Clear the entire canvas.
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Clear the entire canvas and fill it with the background colour.
   * Convenience method that combines clear() and renderBackground().
   * Alias for the full "clear canvas to background" operation.
   *
   * Requirements: 7.6
   */
  clearCanvas() {
    this.renderBackground();
  }

  /**
   * Fill the canvas with the configured background colour.
   * Alias: drawBackground()
   *
   * Requirements: 7.6
   */
  renderBackground() {
    this.ctx.fillStyle = CONFIG.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Alias kept for GameEngine compatibility */
  drawBackground() {
    this.renderBackground();
  }

  /**
   * Draw a single Pipe entity (both top and bottom segments).
   * Delegates to pipe.render() which uses CONFIG.pipeColor.
   *
   * Requirements: 7.2, 7.3
   *
   * @param {import('../entities/Pipe').Pipe} pipe
   */
  renderPipe(pipe) {
    pipe.render(this.ctx);
  }

  /**
   * Draw all pipes in the provided array.
   * Alias: drawPipes()
   *
   * @param {import('../entities/Pipe').Pipe[]} pipes
   */
  renderPipes(pipes) {
    for (const pipe of pipes) {
      this.renderPipe(pipe);
    }
  }

  /**
   * Draw all active cake rewards attached to pipes.
   * @param {import('../entities/Pipe').Pipe[]} pipes
   */
  renderCakes(pipes) {
    if (!this.cakeSprite) return;
    const size = 28 * CONFIG.cakeScale * this.scaleFactor;
    const offset = CONFIG.cakeOffsetFromPipe * this.scaleFactor;
    for (const pipe of pipes) {
      if (!pipe.hasCake || pipe.cakeCollected || !pipe.cakeSide) continue;
      const x = pipe.x + pipe.width / 2 - size / 2;
      const gapTop = pipe.gapY - pipe.gapHeight / 2;
      const gapBottom = pipe.gapY + pipe.gapHeight / 2;
      const safeTopY = gapTop + offset;
      const safeBottomY = gapBottom - offset - size;
      if (safeTopY > safeBottomY) continue;
      const y = pipe.cakeSide === 'top' ? safeTopY : safeBottomY;
      this.ctx.drawImage(this.cakeSprite, x, y, size, size);
    }
  }

  /** Alias kept for GameEngine compatibility */
  drawPipes(pipes) {
    this.renderPipes(pipes);
  }

  /**
   * Draw Ghosty with its current rotation applied.
   * Delegates to ghosty.render() which handles the canvas transform.
   * Alias: drawGhosty()
   *
   * Requirements: 7.1, 7.7, 7.8
   *
   * @param {import('../entities/Ghosty').Ghosty} ghosty
   */
  renderGhosty(ghosty) {
    ghosty.render(this.ctx);
  }

  /** Alias kept for GameEngine compatibility */
  drawGhosty(ghosty) {
    this.renderGhosty(ghosty);
  }

  /**
   * Draw the current score centred near the top of the canvas.
   * Optionally draws the high score below the current score.
   * Alias: drawScore()
   *
   * Requirements: 7.4, 7.9
   *
   * @param {number} score
   * @param {number} [highScore] - Optional high score to display below current score
   */
  renderScore(score, highScore) {
    const ctx = this.ctx;
    const fontSize = this._scaledFontSize(36);

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, Math.round(3 * this.scaleFactor));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const x = this.canvas.width / 2;
    const y = Math.round(this.canvas.height * 0.05); // 5% from the top

    ctx.strokeText(String(score), x, y);
    ctx.fillText(String(score), x, y);

    // Optionally show high score in smaller text below
    if (highScore !== undefined && highScore !== null) {
      const smallSize = this._scaledFontSize(20);
      ctx.font = `${smallSize}px Arial, sans-serif`;
      ctx.strokeText(`Best: ${highScore}`, x, y + fontSize + Math.round(4 * this.scaleFactor));
      ctx.fillText(`Best: ${highScore}`, x, y + fontSize + Math.round(4 * this.scaleFactor));
    }

    ctx.restore();
  }

  /** Alias kept for GameEngine compatibility */
  drawScore(score, highScore) {
    this.renderScore(score, highScore);
  }

  /**
   * Draw a text string at one of the predefined positions on the canvas.
   *
   * @param {string}       text
   * @param {TextPosition} position - One of TextPosition.TOP_CENTER / MIDDLE_CENTER / BOTTOM_CENTER
   */
  renderText(text, position) {
    const ctx = this.ctx;
    const fontSize = this._scaledFontSize(24);

    ctx.save();
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, Math.round(2 * this.scaleFactor));
    ctx.textAlign = 'center';

    const x = this.canvas.width / 2;
    let y;

    switch (position) {
      case TextPosition.TOP_CENTER:
        ctx.textBaseline = 'top';
        y = Math.round(this.canvas.height * 0.1);
        break;
      case TextPosition.BOTTOM_CENTER:
        ctx.textBaseline = 'bottom';
        y = Math.round(this.canvas.height * 0.9);
        break;
      case TextPosition.MIDDLE_CENTER:
      default:
        ctx.textBaseline = 'middle';
        y = this.canvas.height / 2;
        break;
    }

    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /**
   * Draw top-right life gauge (cake progress + spare lives).
   * @param {{progress:number, required:number, extraLives:number}} gauge
   */
  renderLifeGauge(gauge) {
    const ctx = this.ctx;
    const pad = 14 * this.scaleFactor;
    const barW = 140 * this.scaleFactor;
    const barH = 14 * this.scaleFactor;
    const x = this.canvas.width - pad - barW;
    const y = pad;

    const ratio = gauge.required > 0 ? Math.max(0, Math.min(1, gauge.progress / gauge.required)) : 0;
    const fillW = barW * ratio;

    ctx.save();
    // background
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, y, barW, barH);
    // fill
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(x, y, fillW, barH);
    // border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, this.scaleFactor);
    ctx.strokeRect(x, y, barW, barH);

    ctx.font = `${Math.round(14 * this.scaleFactor)}px Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`Cake ${gauge.progress}/${gauge.required}`, x + barW, y + barH + 4 * this.scaleFactor);
    ctx.fillText(`Lives +${gauge.extraLives}`, x + barW, y - 2 * this.scaleFactor);
    ctx.restore();
  }

  // ── Composite screen renders ────────────────────────────────────────────

  /**
   * Draw the game-over overlay showing the final score and high score.
   * Alias: drawGameOver()
   *
   * Requirements: 5.5, 7.9
   *
   * @param {number} score
   * @param {number} highScore
   */
  renderGameOver(score, highScore) {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Semi-transparent dark overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();

    // "Game Over" heading
    const headingSize = this._scaledFontSize(48);
    ctx.save();
    ctx.font = `bold ${headingSize}px Arial, sans-serif`;
    ctx.fillStyle = '#ff4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, Math.round(3 * this.scaleFactor));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Game Over', cw / 2, ch * 0.35);
    ctx.fillText('Game Over', cw / 2, ch * 0.35);
    ctx.restore();

    // Score line
    const scoreSize = this._scaledFontSize(28);
    ctx.save();
    ctx.font = `${scoreSize}px Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, Math.round(2 * this.scaleFactor));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(`Score: ${score}`, cw / 2, ch * 0.48);
    ctx.fillText(`Score: ${score}`, cw / 2, ch * 0.48);
    ctx.strokeText(`Best: ${highScore}`, cw / 2, ch * 0.56);
    ctx.fillText(`Best: ${highScore}`, cw / 2, ch * 0.56);
    ctx.restore();

    // Restart instruction
    const hintSize = this._scaledFontSize(20);
    ctx.save();
    ctx.font = `${hintSize}px Arial, sans-serif`;
    ctx.fillStyle = '#dddddd';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, Math.round(1 * this.scaleFactor));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Tap or press Space to restart', cw / 2, ch * 0.68);
    ctx.fillText('Tap or press Space to restart', cw / 2, ch * 0.68);
    ctx.restore();
  }

  /** Alias kept for GameEngine compatibility */
  drawGameOver(score, highScore) {
    this.renderGameOver(score, highScore);
  }

  /**
   * Draw the waiting / menu screen ("tap to start" message).
   * Alias: drawWaitingScreen()
   *
   * Requirements: 5.2
   */
  renderWaitingScreen() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Title
    const titleSize = this._scaledFontSize(40);
    ctx.save();
    ctx.font = `bold ${titleSize}px Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, Math.round(3 * this.scaleFactor));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Flappy Kiro', cw / 2, ch * 0.35);
    ctx.fillText('Flappy Kiro', cw / 2, ch * 0.35);
    ctx.restore();

    // Tap-to-start hint
    const hintSize = this._scaledFontSize(22);
    ctx.save();
    ctx.font = `${hintSize}px Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, Math.round(2 * this.scaleFactor));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Tap or press Space to start', cw / 2, ch * 0.55);
    ctx.fillText('Tap or press Space to start', cw / 2, ch * 0.55);
    ctx.restore();
  }

  /** Alias kept for GameEngine compatibility */
  drawWaitingScreen() {
    this.renderWaitingScreen();
  }

  /**
   * Draw the menu / waiting screen.
   * Alias for renderWaitingScreen() kept for spec task 10.1 compatibility.
   * Draws "Click or Tap to Start" overlay text in the center of the canvas.
   *
   * Requirements: 5.2
   */
  drawMenu() {
    this.renderWaitingScreen();
  }
}

export default Renderer;
