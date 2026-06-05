/**
 * StateManager.js — Tracks and manages game state transitions.
 * Implemented in task 7.1.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

/**
 * Enum of valid game states.
 */
export const GameState = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
});

/**
 * Valid state transitions map.
 * Key: current state, Value: set of states that can be transitioned to.
 */
const VALID_TRANSITIONS = {
  [GameState.MENU]: new Set([GameState.PLAYING]),
  [GameState.PLAYING]: new Set([GameState.GAME_OVER]),
  [GameState.GAME_OVER]: new Set([GameState.PLAYING, GameState.MENU]),
};

/**
 * Manages the current game state and transitions between states.
 */
export class StateManager {
  constructor() {
    /** @type {string} */
    this._currentState = GameState.MENU;

    /** @type {number} */
    this._highScore = 0;
  }

  /**
   * Returns the current game state.
   * @returns {string}
   */
  getCurrentState() {
    return this._currentState;
  }

  /**
   * Transitions to a new game state.
   * Only valid transitions (as defined by VALID_TRANSITIONS) are allowed.
   *
   * @param {string} newState - The target GameState value.
   * @throws {Error} If the transition is not valid.
   */
  transitionTo(newState) {
    const allowed = VALID_TRANSITIONS[this._currentState];
    if (!allowed || !allowed.has(newState)) {
      throw new Error(
        `Invalid state transition: ${this._currentState} → ${newState}`
      );
    }
    this._currentState = newState;
  }

  /**
   * Returns true when the game is in the PLAYING state.
   * @returns {boolean}
   */
  isPlaying() {
    return this._currentState === GameState.PLAYING;
  }

  /**
   * Returns true when the game is in the GAME_OVER state.
   * @returns {boolean}
   */
  isGameOver() {
    return this._currentState === GameState.GAME_OVER;
  }

  /**
   * Returns true when the game is in the MENU state.
   * @returns {boolean}
   */
  isMenu() {
    return this._currentState === GameState.MENU;
  }

  /**
   * Updates the high score if the given score exceeds the current high score.
   * @param {number} score - The score to compare against the current high score.
   */
  updateHighScore(score) {
    if (score > this._highScore) {
      this._highScore = score;
    }
  }

  /**
   * Returns the current high score.
   * @returns {number}
   */
  getHighScore() {
    return this._highScore;
  }
}
