/**
 * AudioSystem.js — Loads and plays game sound effects.
 *
 * Audio assets (jump.wav, game_over.wav) are preloaded on init.
 * Load failures are logged and silently skipped — the game continues
 * without audio rather than blocking gameplay.
 *
 * Implemented in task 9.1.
 */

import CONFIG from '../config.js';

class AudioSystem {
  constructor() {
    /** @type {HTMLAudioElement|null} */
    this._jumpSound = null;

    /** @type {HTMLAudioElement|null} */
    this._gameOverSound = null;

    /** @type {boolean} */
    this._muted = false;
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  /**
   * Preload all audio assets. Each asset has an independent
   * audioLoadTimeout timeout; failures are caught and logged.
   *
   * @returns {Promise<void>} Resolves when loading is complete (success or failure).
   */
  async load() {
    const [jumpResult, gameOverResult] = await Promise.allSettled([
      this._loadAudio(CONFIG.jumpSoundPath, 'jump'),
      this._loadAudio(CONFIG.gameOverSoundPath, 'game_over'),
    ]);

    if (jumpResult.status === 'fulfilled') {
      this._jumpSound = jumpResult.value;
    }

    if (gameOverResult.status === 'fulfilled') {
      this._gameOverSound = gameOverResult.value;
    }
  }

  /**
   * Load a single audio asset with a timeout guard.
   *
   * @param {string} src - Asset path relative to the page.
   * @param {string} assetName - Human-readable name used in error messages.
   * @returns {Promise<HTMLAudioElement>}
   */
  _loadAudio(src, assetName) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);

      const timeoutId = setTimeout(() => {
        const err = new Error(`Audio load timed out after ${CONFIG.audioLoadTimeout}ms`);
        this.handleError(err, assetName);
        reject(err);
      }, CONFIG.audioLoadTimeout);

      audio.addEventListener('canplaythrough', () => {
        clearTimeout(timeoutId);
        resolve(audio);
      }, { once: true });

      audio.addEventListener('error', (event) => {
        clearTimeout(timeoutId);
        const err = new Error(`Failed to load audio: ${assetName}`);
        this.handleError(err, assetName);
        reject(err);
      }, { once: true });

      // Trigger loading.
      audio.load();
    });
  }

  // ─── Playback ─────────────────────────────────────────────────────────────

  /**
   * Play the jump / flap sound effect.
   * Clones the audio element to allow overlapping playback.
   */
  playJump() {
    this._play(this._jumpSound, 'jump');
  }

  /**
   * Play the game-over sound effect.
   * Clones the audio element to allow overlapping playback.
   */
  playGameOver() {
    this._play(this._gameOverSound, 'game_over');
  }

  /**
   * Internal helper — clone and play an audio element.
   *
   * @param {HTMLAudioElement|null} audioElement
   * @param {string} assetName
   */
  _play(audioElement, assetName) {
    if (this._muted || audioElement === null) return;

    try {
      // Clone so concurrent plays don't restart each other.
      const clone = audioElement.cloneNode();
      clone.currentTime = 0;
      const playPromise = clone.play();

      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          this.handleError(err, assetName);
        });
      }
    } catch (err) {
      this.handleError(err, assetName);
    }
  }

  // ─── Error Handling ───────────────────────────────────────────────────────

  /**
   * Log an audio error without interrupting the game.
   *
   * @param {Error} error
   * @param {string} assetName
   */
  handleError(error, assetName) {
    console.error(`[AudioSystem] Error with "${assetName}":`, error.message);
  }

  // ─── Mute Control ─────────────────────────────────────────────────────────

  /**
   * Mute all audio playback.
   */
  mute() {
    this._muted = true;
  }

  /**
   * Unmute audio playback.
   */
  unmute() {
    this._muted = false;
  }

  /**
   * @returns {boolean} Whether audio is currently muted.
   */
  get isMuted() {
    return this._muted;
  }
}

export default AudioSystem;
