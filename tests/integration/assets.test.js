/**
 * assets.test.js — Integration tests for asset loading with failures.
 * Implemented in task 14.5.
 *
 * Requirements: 6.3, 6.4, 10.5, 10.6, 10.7
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GameEngine } from '../../src/engine/GameEngine.js';

// Image stub that loads successfully on the next tick.
class SuccessImage {
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

// Image stub that fails to load on the next tick.
class FailImage {
  set src(value) {
    this._src = value;
    setTimeout(() => {
      if (typeof this.onerror === 'function') this.onerror(new Error('load failed'));
    }, 0);
  }
  get src() {
    return this._src;
  }
}

function buildEngine() {
  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  canvas.width = 900;
  canvas.height = 600;
  document.body.appendChild(canvas);

  const errorEl = document.createElement('div');
  errorEl.id = 'errorMessage';
  errorEl.style.display = 'none';
  document.body.appendChild(errorEl);

  return new GameEngine(canvas);
}

describe('Asset Loading Integration', () => {
  let originalImage;

  beforeEach(() => {
    originalImage = global.Image;
  });

  afterEach(() => {
    global.Image = originalImage;
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('shows an error message when ghosty.png fails to load', async () => {
    global.Image = FailImage;
    const engine = buildEngine();
    engine.audioSystem.load = jest.fn(async () => {});

    await engine.init();

    expect(engine.canStart).toBe(false);
    expect(engine.getErrorMessage()).toMatch(/ghosty\.png/);

    const el = document.getElementById('errorMessage');
    expect(el.style.display).toBe('block');
    expect(el.textContent).toMatch(/ghosty\.png/);
  });

  it('continues without audio when audio fails to load', async () => {
    global.Image = SuccessImage;
    const engine = buildEngine();
    // AudioSystem swallows its own failures and always resolves; simulate that.
    engine.audioSystem.load = jest.fn(async () => {});

    await engine.init();

    expect(engine.canStart).toBe(true);
    expect(engine.getErrorMessage()).toBeNull();
    expect(engine.audioSystem.load).toHaveBeenCalled();
  });

  it('shows refresh instructions on critical asset failure', async () => {
    global.Image = FailImage;
    const engine = buildEngine();
    engine.audioSystem.load = jest.fn(async () => {});

    await engine.init();

    expect(engine.canStart).toBe(false);
    expect(engine.getErrorMessage()).toMatch(/F5|refresh/i);
  });
});
