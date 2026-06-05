/**
 * state.test.js — Unit tests for StateManager state transitions.
 * Implemented in task 7.2.
 *
 * Requirements: 5.1, 5.3, 5.4, 5.9
 */

import { StateManager, GameState } from '../../src/engine/StateManager.js';

describe('StateManager', () => {
  let sm;

  beforeEach(() => {
    sm = new StateManager();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('initial state is MENU', () => {
    expect(sm.getCurrentState()).toBe(GameState.MENU);
  });

  it('isMenu() returns true on creation', () => {
    expect(sm.isMenu()).toBe(true);
  });

  it('isPlaying() returns false on creation', () => {
    expect(sm.isPlaying()).toBe(false);
  });

  it('isGameOver() returns false on creation', () => {
    expect(sm.isGameOver()).toBe(false);
  });

  // ── Valid transitions ──────────────────────────────────────────────────────

  it('MENU → PLAYING is a valid transition', () => {
    sm.transitionTo(GameState.PLAYING);
    expect(sm.getCurrentState()).toBe(GameState.PLAYING);
  });

  it('PLAYING → GAME_OVER is a valid transition', () => {
    sm.transitionTo(GameState.PLAYING);
    sm.transitionTo(GameState.GAME_OVER);
    expect(sm.getCurrentState()).toBe(GameState.GAME_OVER);
  });

  it('GAME_OVER → PLAYING is a valid transition (reset/restart)', () => {
    sm.transitionTo(GameState.PLAYING);
    sm.transitionTo(GameState.GAME_OVER);
    sm.transitionTo(GameState.PLAYING);
    expect(sm.getCurrentState()).toBe(GameState.PLAYING);
  });

  it('GAME_OVER → MENU is a valid transition', () => {
    sm.transitionTo(GameState.PLAYING);
    sm.transitionTo(GameState.GAME_OVER);
    sm.transitionTo(GameState.MENU);
    expect(sm.getCurrentState()).toBe(GameState.MENU);
  });

  // ── Convenience predicates after transitions ───────────────────────────────

  it('isPlaying() returns true after transitioning to PLAYING', () => {
    sm.transitionTo(GameState.PLAYING);
    expect(sm.isPlaying()).toBe(true);
    expect(sm.isMenu()).toBe(false);
    expect(sm.isGameOver()).toBe(false);
  });

  it('isGameOver() returns true after transitioning to GAME_OVER', () => {
    sm.transitionTo(GameState.PLAYING);
    sm.transitionTo(GameState.GAME_OVER);
    expect(sm.isGameOver()).toBe(true);
    expect(sm.isPlaying()).toBe(false);
    expect(sm.isMenu()).toBe(false);
  });

  it('isMenu() returns true after returning to MENU from GAME_OVER', () => {
    sm.transitionTo(GameState.PLAYING);
    sm.transitionTo(GameState.GAME_OVER);
    sm.transitionTo(GameState.MENU);
    expect(sm.isMenu()).toBe(true);
    expect(sm.isPlaying()).toBe(false);
    expect(sm.isGameOver()).toBe(false);
  });

  // ── Invalid transitions throw errors ──────────────────────────────────────

  it('MENU → GAME_OVER is an invalid transition', () => {
    expect(() => sm.transitionTo(GameState.GAME_OVER)).toThrow();
  });

  it('PLAYING → MENU is an invalid transition', () => {
    sm.transitionTo(GameState.PLAYING);
    expect(() => sm.transitionTo(GameState.MENU)).toThrow();
  });

  it('PLAYING → PLAYING is an invalid transition', () => {
    sm.transitionTo(GameState.PLAYING);
    expect(() => sm.transitionTo(GameState.PLAYING)).toThrow();
  });

  it('MENU → MENU is an invalid transition', () => {
    expect(() => sm.transitionTo(GameState.MENU)).toThrow();
  });

  it('GAME_OVER → GAME_OVER is an invalid transition', () => {
    sm.transitionTo(GameState.PLAYING);
    sm.transitionTo(GameState.GAME_OVER);
    expect(() => sm.transitionTo(GameState.GAME_OVER)).toThrow();
  });

  it('invalid transitions do not change state', () => {
    expect(() => sm.transitionTo(GameState.GAME_OVER)).toThrow();
    expect(sm.getCurrentState()).toBe(GameState.MENU);
  });

  // ── High score ─────────────────────────────────────────────────────────────

  it('getHighScore() returns 0 initially', () => {
    expect(sm.getHighScore()).toBe(0);
  });

  it('updateHighScore() updates when new score exceeds current high score', () => {
    sm.updateHighScore(10);
    expect(sm.getHighScore()).toBe(10);
  });

  it('updateHighScore() does not update when new score is lower than current high score', () => {
    sm.updateHighScore(10);
    sm.updateHighScore(5);
    expect(sm.getHighScore()).toBe(10);
  });

  it('updateHighScore() does not update when new score equals current high score', () => {
    sm.updateHighScore(10);
    sm.updateHighScore(10);
    expect(sm.getHighScore()).toBe(10);
  });

  it('updateHighScore() updates when successive scores keep increasing', () => {
    sm.updateHighScore(5);
    sm.updateHighScore(15);
    sm.updateHighScore(12);
    sm.updateHighScore(20);
    expect(sm.getHighScore()).toBe(20);
  });

  it('high score persists across state transitions', () => {
    sm.updateHighScore(42);
    sm.transitionTo(GameState.PLAYING);
    sm.transitionTo(GameState.GAME_OVER);
    sm.transitionTo(GameState.PLAYING);
    expect(sm.getHighScore()).toBe(42);
  });
});
