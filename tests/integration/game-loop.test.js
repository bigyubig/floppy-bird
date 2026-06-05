/**
 * game-loop.test.js — Integration tests for the full game loop.
 * Implemented in task 17.3.
 *
 * Drives GameEngine.update()/handleInput() manually (no requestAnimationFrame)
 * and mocks Image/Audio so the engine can initialize under jsdom.
 *
 * Requirements: All (end-to-end behavior)
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GameEngine } from '../../src/engine/GameEngine.js';
import { GameState } from '../../src/engine/StateManager.js';
import CONFIG from '../../src/config.js';

// A fake Image that resolves its load on the next tick.
class FakeImage {
  set src(value) {
    this._src = value;
    setTimeout(() => {
      if (typeof this.onload === 'function') this.onload();
    }, 0);
  }
  get src() {
    return this._src;
  }
}

/** Build a GameEngine, stub audio, and run init(). */
async function makeEngine() {
  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  canvas.width = 900;
  canvas.height = 600;
  document.body.appendChild(canvas);

  const engine = new GameEngine(canvas);
  engine.audioSystem.load = jest.fn(async () => {});
  engine.audioSystem.playJump = jest.fn();
  engine.audioSystem.playGameOver = jest.fn();
  engine.audioSystem.playYummy = jest.fn();

  await engine.init();
  return engine;
}

/** Disable all collisions so we can exercise pipe/score logic in isolation. */
function disableCollisions(engine) {
  engine.collisionDetector.checkGhostyBoundaryCollision = () => false;
  engine.collisionDetector.checkGhostyPipeCollision = () => false;
}

describe('Game Loop Integration', () => {
  let originalImage;

  beforeEach(() => {
    originalImage = global.Image;
    global.Image = FakeImage;
  });

  afterEach(() => {
    global.Image = originalImage;
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('cycles menu → playing → game over → playing', async () => {
    const engine = await makeEngine();

    // Starts in menu.
    expect(engine.getState()).toBe(GameState.MENU);

    // Input starts the game.
    engine.handleInput();
    expect(engine.getState()).toBe(GameState.PLAYING);

    // Force a boundary collision -> game over.
    const ghosty = engine.entityManager.getGhosty();
    ghosty.y = engine.canvas.height + 100;
    engine.update();
    expect(engine.getState()).toBe(GameState.GAME_OVER);
    expect(engine.audioSystem.playGameOver).toHaveBeenCalled();

    // Input restarts the game.
    engine.handleInput();
    expect(engine.getState()).toBe(GameState.PLAYING);
    expect(engine.getScore()).toBe(0);
  });

  it('spawns, moves, and removes pipes during gameplay', async () => {
    const engine = await makeEngine();
    engine.handleInput(); // -> playing
    disableCollisions(engine);

    // First pipe appears immediately when entering PLAYING.
    expect(engine.entityManager.getPipes().length).toBe(1);
    const firstPipe = engine.entityManager.getPipes()[0];
    expect(firstPipe.x + firstPipe.width).toBeCloseTo(engine.canvas.width, 5);

    // After exactly pipeSpawnInterval frames, one pipe is spawned.
    for (let i = 0; i < CONFIG.pipeSpawnInterval; i++) {
      engine.update();
    }
    const pipes = engine.entityManager.getPipes();
    expect(pipes.length).toBeGreaterThanOrEqual(2);

    // Pipe moves left at pipeSpeed px/frame.
    const startX = pipes[0].x;
    engine.update();
    engine.update();
    expect(engine.entityManager.getPipes()[0].x).toBeCloseTo(startX - CONFIG.pipeSpeed * 2, 5);

    // A pipe is removed once fully off the left edge.
    const beforeRemovalCount = engine.entityManager.getPipes().length;
    const pipe = engine.entityManager.getPipes()[0];
    pipe.x = -pipe.width - 1;
    engine.update();
    expect(engine.entityManager.getPipes().length).toBe(beforeRemovalCount - 1);
  });

  it('increments score once as a pipe is passed (idempotent)', async () => {
    const engine = await makeEngine();
    engine.handleInput(); // -> playing
    disableCollisions(engine);

    const ghosty = engine.entityManager.getGhosty();
    const pipe = engine.entityManager.spawnPipe();
    // Place the pipe entirely behind Ghosty so it counts as passed.
    pipe.x = ghosty.x - pipe.width - 10;

    expect(engine.getScore()).toBe(0);
    engine.update();
    expect(engine.getScore()).toBe(1);

    // Passing the same already-scored pipe again does not increment.
    engine.update();
    expect(engine.getScore()).toBe(1);
  });

  it('adds +5 score and plays yummy when cake is collected', async () => {
    const engine = await makeEngine();
    engine.handleInput(); // -> playing
    disableCollisions(engine);

    const ghosty = engine.entityManager.getGhosty();
    const pipe = engine.entityManager.spawnPipe();
    pipe.hasCake = true;
    pipe.cakeCollected = false;
    pipe.cakeSide = 'top';

    const cake = engine.entityManager.getCakeBoundingBox(pipe);
    ghosty.x = cake.x;
    ghosty.y = cake.y;

    const prevScore = engine.getScore();
    engine.update();

    expect(engine.getScore()).toBeGreaterThanOrEqual(prevScore + 5);
    expect(pipe.cakeCollected).toBe(true);
    expect(engine.audioSystem.playYummy).toHaveBeenCalled();
  });

  it('grants one extra life after collecting 3 cakes', async () => {
    const engine = await makeEngine();
    engine.handleInput();
    disableCollisions(engine);

    const ghosty = engine.entityManager.getGhosty();
    for (let i = 0; i < 3; i++) {
      const pipe = engine.entityManager.spawnPipe();
      pipe.hasCake = true;
      pipe.cakeCollected = false;
      pipe.cakeSide = 'top';
      const cake = engine.entityManager.getCakeBoundingBox(pipe);
      ghosty.x = cake.x;
      ghosty.y = cake.y;
      engine.update();
    }

    const gauge = engine.entityManager.getLifeGauge();
    expect(gauge.extraLives).toBe(1);
    expect(gauge.progress).toBe(0);
  });

  it('uses extra life to revive without restarting run', async () => {
    const engine = await makeEngine();
    engine.handleInput();
    disableCollisions(engine);

    // Seed one spare life directly to isolate revive behavior.
    engine.entityManager.extraLives = 1;

    // Re-enable boundary collision and trigger a fatal bottom hit.
    engine.collisionDetector.checkGhostyBoundaryCollision = (g) =>
      g.y > engine.canvas.height + CONFIG.gameOverBottomPadding;
    const ghosty = engine.entityManager.getGhosty();
    ghosty.y = engine.canvas.height + CONFIG.gameOverBottomPadding + 10;
    const prevScore = engine.getScore();
    const prevFrame = engine.entityManager.frameCount;
    const prevPipeCount = engine.entityManager.getPipes().length;
    engine.update();

    expect(engine.getState()).toBe(GameState.PLAYING);
    expect(engine.entityManager.extraLives).toBe(0);
    expect(engine.getScore()).toBe(prevScore);
    expect(engine.entityManager.frameCount).toBeGreaterThanOrEqual(prevFrame);
    expect(engine.entityManager.getPipes().length).toBeGreaterThanOrEqual(prevPipeCount);
  });

  it('becomes invincible for 2 seconds after revive and can pass through pipe', async () => {
    const engine = await makeEngine();
    engine.handleInput();

    // Give one spare life so first collision revives.
    engine.entityManager.extraLives = 1;
    const ghosty = engine.entityManager.getGhosty();

    // First frame: force a collision to consume life and trigger invincibility.
    engine.collisionDetector.checkGhostyBoundaryCollision = () => true;
    engine.collisionDetector.checkGhostyPipeCollision = () => true;
    engine.update();
    expect(engine.getState()).toBe(GameState.PLAYING);
    expect(engine.entityManager.extraLives).toBe(0);

    // During invincibility, collisions should be ignored.
    ghosty.y = engine.canvas.height + CONFIG.gameOverBottomPadding + 100;
    engine.update();
    expect(engine.getState()).toBe(GameState.PLAYING);

    // After 2 seconds (120 frames), collision should kill again.
    for (let i = 0; i < CONFIG.reviveInvincibleSeconds * 60; i++) {
      engine.update();
    }
    engine.update();
    expect(engine.getState()).toBe(GameState.GAME_OVER);
  });

  it('places cake outside pipe body with 30px distance', async () => {
    const engine = await makeEngine();
    engine.handleInput();
    disableCollisions(engine);

    const pipe = engine.entityManager.spawnPipe();
    pipe.hasCake = true;
    pipe.cakeCollected = false;

    pipe.cakeSide = 'top';
    const topCake = engine.entityManager.getCakeBoundingBox(pipe);
    const gapTop = pipe.gapY - pipe.gapHeight / 2;
    const gapBottom = pipe.gapY + pipe.gapHeight / 2;
    const offset = 30 * engine.entityManager.scaleFactor;
    expect(topCake.y).toBeCloseTo(gapTop + offset, 5);
    expect(topCake.y).toBeGreaterThanOrEqual(gapTop);
    expect(topCake.y + topCake.height).toBeLessThanOrEqual(gapBottom);

    pipe.cakeSide = 'bottom';
    const bottomCake = engine.entityManager.getCakeBoundingBox(pipe);
    expect(bottomCake.y + bottomCake.height).toBeCloseTo(gapBottom - offset, 5);
    expect(bottomCake.y).toBeGreaterThanOrEqual(gapTop);
    expect(bottomCake.y + bottomCake.height).toBeLessThanOrEqual(gapBottom);
  });

  it('triggers game over when a collision is detected', async () => {
    const engine = await makeEngine();
    engine.handleInput(); // -> playing

    // Move Ghosty below the bottom boundary.
    const ghosty = engine.entityManager.getGhosty();
    ghosty.y = engine.canvas.height + 100;
    engine.update();

    expect(engine.getState()).toBe(GameState.GAME_OVER);
    expect(engine.audioSystem.playGameOver).toHaveBeenCalledTimes(1);
  });

  it('clamps at top boundary without triggering game over', async () => {
    const engine = await makeEngine();
    engine.handleInput(); // -> playing
    disableCollisions(engine); // isolate top-boundary behavior

    const ghosty = engine.entityManager.getGhosty();
    ghosty.y = -150;
    ghosty.velocityY = -3;

    engine.update();

    expect(engine.getState()).toBe(GameState.PLAYING);
    expect(ghosty.y).toBe(-CONFIG.topBoundaryPadding);
    expect(ghosty.velocityY).toBeGreaterThanOrEqual(0);
  });

  it('handles input correctly in each game state', async () => {
    const engine = await makeEngine();

    // MENU: input starts the game.
    expect(engine.getState()).toBe(GameState.MENU);
    engine.handleInput();
    expect(engine.getState()).toBe(GameState.PLAYING);

    // PLAYING: input flaps Ghosty and plays the jump sound.
    const ghosty = engine.entityManager.getGhosty();
    ghosty.velocityY = 5;
    engine.handleInput();
    expect(ghosty.velocityY).toBe(CONFIG.flapVelocity);
    expect(engine.audioSystem.playJump).toHaveBeenCalled();

    // GAME_OVER: input resets and restarts.
    ghosty.y = engine.canvas.height + 100;
    engine.update();
    expect(engine.getState()).toBe(GameState.GAME_OVER);

    engine.handleInput();
    expect(engine.getState()).toBe(GameState.PLAYING);
    expect(engine.getScore()).toBe(0);
  });
});
