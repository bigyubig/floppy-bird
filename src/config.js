/**
 * config.js — Single source of truth for all game constants.
 * Never hardcode physics values, colors, or asset paths outside this file.
 */

const CONFIG = {
  // ── Physics ──────────────────────────────────────────────────────────────
  // Jump and fall amplitude softened to half the original feel
  // (original: gravity 0.5, flap -8, terminal ±10).
  gravity: 0.25,              // px/frame² — downward acceleration applied each frame
  flapVelocity: -4,           // px/frame  — velocity applied on flap input
  maxUpwardVelocity: -5,      // px/frame  — terminal upward speed (most negative)
  maxDownwardVelocity: 5,     // px/frame  — terminal downward speed (most positive)

  // ── Gameplay ─────────────────────────────────────────────────────────────
  pipeSpawnInterval: 140,     // frames    — 140 * 2 px/frame = 280px horizontal spacing
  pipeSpeed: 2,               // px/frame  — leftward movement speed for all pipes
  gapHeight: 250,             // px        — vertical gap between top and bottom pipe segments
  minGapY: 80,                // px        — minimum gap center distance from top (tuned for landscape height)
  maxGapYOffset: 80,          // px        — minimum gap center distance from bottom
  cakeScoreBonus: 5,          // points    — bonus score for collecting one cake
  cakeOffsetFromPipe: 30,     // px        — cake floats 30px away from pipe surface
  cakeScale: 1.5,             // multiplier— cake size scale factor
  cakeMinPipeGapCount: 3,     // pipes     — minimum pipes between cake spawns
  cakeMaxPipeGapCount: 8,     // pipes     — maximum pipes between cake spawns
  cakesPerLife: 3,            // cakes     — collect 3 cakes to gain one extra life
  lifeGaugeMaxLives: 5,       // lives     — cap of spare lives shown in top-right gauge
  reviveInvincibleSeconds: 2, // seconds   — invulnerability after consuming an extra life
  pipeCollisionInset: 10,     // px        — shrink pipe hitboxes inward so edge grazes are safe
  topBoundaryPadding: 60,     // px        — allowed distance above top before top-boundary collision
  gameOverBottomPadding: 60,  // px        — extra distance below screen after full disappearance before game over

  // ── Visual ───────────────────────────────────────────────────────────────
  baseCanvasWidth: 900,       // px        — baseline width (900×600 design resolution)
  aspectRatio: 900 / 600,    // width / height — 3:2 landscape
  backgroundColor: '#87CEEB', // sky blue background
  pipeColor: '#4CAF50',       // green pipe color

  // ── Asset Paths ──────────────────────────────────────────────────────────
  ghostySpritePath: 'assets/ghosty.png',
  cakeSpritePath: 'assets/cake.png',
  jumpSoundPath: 'assets/jump.wav',
  yummySoundPath: 'assets/yummy.wav',
  gameOverSoundPath: 'assets/game_over.wav',

  // ── Timeouts ─────────────────────────────────────────────────────────────
  imageLoadTimeout: 10000,    // ms — max wait for image assets before showing error
  audioLoadTimeout: 5000,     // ms — max wait for audio assets before logging and continuing
};

export default CONFIG;
