/**
 * main.js — Entry point for Flappy Kiro.
 *
 * Grabs the canvas, initializes the GameEngine, and starts the game loop.
 * Wraps initialization in an error boundary so uncaught failures surface a
 * message to the player instead of silently breaking the page.
 *
 * Implemented in task 17.1.
 *
 * Requirements: 10.1, 10.6, 10.7
 */

import GameEngine from './engine/GameEngine.js';

/**
 * Display a fatal error message in the #errorMessage overlay.
 * @param {string} message
 */
function showFatalError(message) {
  const el = document.getElementById('errorMessage');
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
  // eslint-disable-next-line no-console
  console.error('[Flappy Kiro]', message);
}

async function bootstrap() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    showFatalError('Canvas element #gameCanvas not found.');
    return;
  }

  const engine = new GameEngine(canvas);

  try {
    await engine.init();
    engine.start();
  } catch (err) {
    showFatalError(
      'Something went wrong starting the game. Press F5 or refresh the page to try again.'
    );
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

// Kick off once the DOM is ready.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
}

export { bootstrap };
