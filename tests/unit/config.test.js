/**
 * config.test.js — Smoke tests for game configuration constants.
 * Verifies that CONFIG exports the expected keys and values.
 */

import { describe, it, expect } from '@jest/globals';
import CONFIG from '../../src/config.js';

describe('CONFIG', () => {
  it('exports a CONFIG object', () => {
    expect(CONFIG).toBeDefined();
    expect(typeof CONFIG).toBe('object');
  });

  it('has correct physics constants', () => {
    expect(CONFIG.gravity).toBe(0.25);
    expect(CONFIG.flapVelocity).toBe(-4);
    expect(CONFIG.maxUpwardVelocity).toBe(-5);
    expect(CONFIG.maxDownwardVelocity).toBe(5);
  });

  it('has correct gameplay constants', () => {
    expect(CONFIG.pipeSpawnInterval).toBe(140);
    expect(CONFIG.pipeSpeed).toBe(2);
    expect(CONFIG.gapHeight).toBe(250);
    expect(CONFIG.minGapY).toBe(80);
    expect(CONFIG.maxGapYOffset).toBe(80);
    expect(CONFIG.cakeScoreBonus).toBe(5);
    expect(CONFIG.cakeOffsetFromPipe).toBe(30);
    expect(CONFIG.cakeScale).toBe(1.5);
    expect(CONFIG.cakeMinPipeGapCount).toBe(3);
    expect(CONFIG.cakeMaxPipeGapCount).toBe(8);
    expect(CONFIG.cakesPerLife).toBe(3);
    expect(CONFIG.reviveInvincibleSeconds).toBe(2);
  });

  it('has correct visual constants', () => {
    expect(CONFIG.baseCanvasWidth).toBe(900);
    expect(CONFIG.aspectRatio).toBeCloseTo(900 / 600, 10);
    expect(CONFIG.backgroundColor).toBe('#87CEEB');
    expect(CONFIG.pipeColor).toBe('#4CAF50');
  });

  it('has correct asset paths', () => {
    expect(CONFIG.ghostySpritePath).toBe('assets/ghosty.png');
    expect(CONFIG.cakeSpritePath).toBe('assets/cake.png');
    expect(CONFIG.jumpSoundPath).toBe('assets/jump.wav');
    expect(CONFIG.yummySoundPath).toBe('assets/yummy.wav');
    expect(CONFIG.gameOverSoundPath).toBe('assets/game_over.wav');
  });

  it('has correct timeout values', () => {
    expect(CONFIG.imageLoadTimeout).toBe(10000);
    expect(CONFIG.audioLoadTimeout).toBe(5000);
  });
});
