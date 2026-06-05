# Implementation Plan: Flappy Kiro

## Overview

This implementation plan breaks down the Flappy Kiro game into discrete coding tasks. The game will be built using vanilla JavaScript and HTML5 Canvas with a component-based architecture. The implementation follows a bottom-up approach, starting with core utilities and data structures, then building game systems, and finally integrating everything into the main game loop.

## Tasks

- [x] 1. Set up project structure and base configuration
  - Create directory structure for source files (src/), tests (tests/), and public assets
  - Create HTML file with canvas element and proper viewport configuration
  - Set up game configuration constants (physics, gameplay, visual, asset paths)
  - Create package.json with fast-check dependency for property-based testing
  - Set up testing framework (Jest or similar) with fast-check integration
  - _Requirements: 8.5, 9.2, 10.1, 10.3, 10.4_

- [x] 2. Implement core entity system
  - [x] 2.1 Create base Entity class with position, dimensions, and velocity
    - Implement getBoundingBox() method returning {x, y, width, height}
    - Implement base update() and render() method stubs
    - _Requirements: 1.6, 8.4_
  
  - [x] 2.2 Implement Ghosty entity class
    - Extend Entity with sprite property and rotation tracking
    - Implement sprite loading from assets/ghosty.png
    - Add updateRotation() method based on velocityY (counterclockwise for negative, clockwise for positive)
    - Add applyFlap() method to set velocity to -8 px/frame
    - Implement render() method with rotation transformation
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 7.1, 7.7, 7.8, 8.1_
  
  - [x] 2.3 Write property test for Ghosty flap velocity
    - **Property: Flap velocity application**
    - **Validates: Requirements 1.1, 1.2, 1.3, 8.1**
  
  - [x] 2.4 Implement Pipe entity class
    - Extend Entity with gapY, gapHeight, and scored properties
    - Implement getTopSegment() returning bounding box for top pipe
    - Implement getBottomSegment() returning bounding box for bottom pipe
    - Add isOffScreen(canvasWidth) method checking if x + width < 0
    - Implement render() method drawing top and bottom pipe segments
    - _Requirements: 2.3, 2.5, 7.2, 7.3_
  
  - [x] 2.5 Write property test for pipe segments
    - **Property 8: Gap height invariant**
    - **Validates: Requirements 2.5**

- [x] 3. Implement physics engine
  - [x] 3.1 Create PhysicsEngine class with configurable constants
    - Initialize with PhysicsConfig (gravity, flapVelocity, max velocities)
    - Implement applyGravity(entity, deltaTime) adding 0.5 * deltaTime to velocityY
    - Implement clampVelocity(entity) limiting velocity to [-10, 10] range
    - Implement updatePosition(entity, deltaTime) adding velocityY to y position
    - Implement applyFlap(entity) setting velocityY to -8
    - _Requirements: 1.4, 1.8, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 3.2 Write property test for gravity application
    - **Property 1: Gravity application**
    - **Validates: Requirements 1.4, 8.2**
  
  - [x] 3.3 Write property test for velocity clamping
    - **Property 2: Velocity clamping**
    - **Validates: Requirements 1.8, 8.3**
  
  - [x] 3.4 Write property test for position updates
    - **Property 3: Position update**
    - **Validates: Requirements 8.4**

- [x] 4. Implement collision detection system
  - [x] 4.1 Create CollisionDetector class
    - Initialize with canvas height for boundary checks
    - Implement checkAABBCollision(box1, box2) using axis-aligned bounding box algorithm
    - Implement isGhostyInGap(ghosty, pipe) checking if ghosty is within gap bounds
    - Implement checkGhostyPipeCollision(ghosty, pipe) checking collisions with top and bottom segments
    - Implement checkGhostyBoundaryCollision(ghosty) checking y < 0 or y + height > canvasHeight
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 4.2 Write property test for AABB collision detection
    - **Property 9: AABB collision detection**
    - **Validates: Requirements 3.1, 3.2**
  
  - [x] 4.3 Write property test for gap non-collision
    - **Property 10: Gap non-collision**
    - **Validates: Requirements 3.3**
  
  - [x] 4.4 Write property test for boundary collision
    - **Property 11: Boundary collision detection**
    - **Validates: Requirements 3.4, 3.5**

- [x] 5. Checkpoint - Ensure core systems are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement entity management system
  - [x] 6.1 Create EntityManager class
    - Initialize with canvas dimensions and scale factor
    - Implement createGhosty() initializing Ghosty at x=50, y=center, velocityY=0
    - Implement spawnPipe() creating pipe at right edge with randomized gap position
    - Add randomization for gap center Y between [150, canvasHeight-150]
    - Implement updatePipes(deltaTime) moving pipes left at 2 px/frame
    - Implement removePipe(pipe) removing pipes where isOffScreen returns true
    - Implement shouldSpawnPipe() returning true every 90 frames
    - Implement getPipes() returning current pipe array
    - Implement reset() clearing all pipes
    - _Requirements: 1.7, 2.1, 2.2, 2.3, 2.4, 2.7, 5.8_
  
  - [x] 6.2 Write property test for pipe movement
    - **Property 4: Pipe movement**
    - **Validates: Requirements 2.2**
  
  - [x] 6.3 Write property test for pipe removal
    - **Property 5: Pipe removal**
    - **Validates: Requirements 2.3**
  
  - [x] 6.4 Write property test for pipe spawn timing
    - **Property 6: Pipe spawn timing**
    - **Validates: Requirements 2.1**
  
  - [x] 6.5 Write property test for gap position bounds
    - **Property 7: Gap position bounds**
    - **Validates: Requirements 2.4**
  
  - [x] 6.6 Write property test for reset removing all pipes
    - **Property 15: Reset removes all pipes**
    - **Validates: Requirements 5.8**

- [x] 7. Implement state management
  - [x] 7.1 Create StateManager class
    - Define GameState enum with MENU, PLAYING, GAME_OVER values
    - Initialize with currentState = MENU
    - Implement getCurrentState() returning current state
    - Implement transitionTo(newState) setting current state
    - Implement isPlaying(), isGameOver(), isMenu() convenience methods
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 7.2 Write unit tests for state transitions
    - Test initial state is MENU
    - Test menu → playing transition
    - Test playing → game over transition
    - Test game over → playing transition (via reset)
    - _Requirements: 5.1, 5.3, 5.4, 5.9_

- [x] 8. Implement input handling system
  - [x] 8.1 Create InputHandler class
    - Initialize with canvas element reference
    - Add event listeners for click, keydown (spacebar), and touchstart events
    - Implement onInput(callback) allowing game engine to register input callback
    - Implement enable() and disable() methods for input control
    - Normalize all input types to single callback invocation
    - _Requirements: 1.1, 1.2, 1.3, 5.3, 5.6, 5.10_
  
  - [x] 8.2 Write unit tests for input handling
    - Test click event triggers callback
    - Test spacebar (keyCode 32) triggers callback
    - Test touchstart event triggers callback
    - Test other keys do not trigger callback
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 9. Implement audio system
  - [x] 9.1 Create AudioSystem class
    - Define asset paths for jump.wav and game_over.wav
    - Implement async load() method with 5-second timeout per asset
    - Implement playJump() method restarting jump sound from beginning
    - Implement playGameOver() method restarting game over sound from beginning
    - Implement handleError(error, assetName) logging errors without interrupting game
    - Allow concurrent sound playback by cloning audio elements
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  
  - [x] 9.2 Write unit tests for audio error handling
    - Test load() timeout logs error but resolves successfully
    - Test playback errors are caught and logged
    - **Property 16: Audio error handling**
    - **Validates: Requirements 6.8**

- [x] 10. Implement rendering system
  - [x] 10.1 Create Renderer class
    - Initialize with canvas context and scale factor
    - Implement clear() method clearing entire canvas
    - Implement renderBackground() filling canvas with #87CEEB
    - Implement renderPipe(pipe) drawing top and bottom segments in #4CAF50
    - Implement renderGhosty(ghosty) drawing sprite with rotation transformation
    - Implement renderScore(score) drawing center-aligned text at top 20% of canvas
    - Implement renderText(text, position) for state-specific instructions
    - Implement setScaleFactor(scaleFactor) for responsive scaling
    - Calculate font sizes proportionally (base 36px * scaleFactor)
    - Ensure rendering order: background → pipes → ghosty → text
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 9.4_
  
  - [x] 10.2 Write property test for rotation calculation
    - **Property 17: Rotation calculation**
    - **Validates: Requirements 7.7, 7.8**
  
  - [x] 10.3 Write property test for color contrast ratio
    - **Property 18: Color contrast ratio**
    - **Validates: Requirements 7.5**
  
  - [x] 10.4 Write unit tests for rendering configuration
    - Test background color is #87CEEB
    - Test pipe color is #4CAF50
    - Test rendering order (using spies/mocks)
    - _Requirements: 7.6, 7.3, 7.10_

- [x] 11. Checkpoint - Ensure all subsystems are complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement responsive canvas sizing
  - [x] 12.1 Create canvas sizing utilities
    - Implement calculateCanvasDimensions(viewportWidth, viewportHeight) maintaining 9:16 aspect ratio
    - Implement minimum viewport check (320x568) returning error state
    - Implement scale factor calculation (canvasWidth / 400)
    - Add window resize event listener calling resize logic
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 12.2 Write property test for canvas aspect ratio
    - **Property 19: Canvas aspect ratio**
    - **Validates: Requirements 9.1, 9.2**
  
  - [x] 12.3 Write property test for proportional scaling
    - **Property 20: Proportional element scaling**
    - **Validates: Requirements 9.4**
  
  - [x] 12.4 Write property test for resize state preservation
    - **Property 21: Resize state preservation**
    - **Validates: Requirements 9.5**

- [x] 13. Implement score tracking system
  - [x] 13.1 Add score tracking to EntityManager
    - Add score property initialized to 0
    - Implement checkScoring(ghosty) iterating through pipes
    - For each pipe where ghosty.x > pipe.x + pipe.width and pipe.scored === false, mark pipe as scored and increment score
    - Implement getScore() returning current score
    - Add score reset to reset() method
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 13.2 Write property test for score detection
    - **Property 12: Score detection**
    - **Validates: Requirements 4.1**
  
  - [x] 13.3 Write property test for score increment
    - **Property 13: Score increment**
    - **Validates: Requirements 4.2**
  
  - [x] 13.4 Write property test for score idempotence
    - **Property 14: Score idempotence**
    - **Validates: Requirements 4.3**

- [x] 14. Implement main game engine
  - [x] 14.1 Create GameEngine class integrating all subsystems
    - Initialize canvas context and all component systems
    - Store references to StateManager, PhysicsEngine, EntityManager, CollisionDetector, InputHandler, Renderer, AudioSystem
    - Implement async init() loading assets with 10-second timeout and error handling
    - Implement start() beginning the game loop with requestAnimationFrame
    - Implement stop() canceling the game loop
    - Implement reset() calling EntityManager.reset(), StateManager.transitionTo(PLAYING), and score reset
    - _Requirements: 5.6, 5.7, 5.8, 5.9, 10.1, 10.5, 10.6_
  
  - [x] 14.2 Implement game loop update logic
    - Track frame count and delta time
    - In PLAYING state: apply physics to Ghosty, update pipes, check collisions, check scoring
    - On collision: transition to GAME_OVER and play game over sound
    - Call EntityManager.shouldSpawnPipe() and spawn new pipes as needed
    - Ensure consistent 60 FPS timing
    - _Requirements: 1.4, 1.6, 2.1, 2.2, 3.6, 10.1, 10.2_
  
  - [x] 14.3 Implement game loop render logic
    - Call Renderer.clear()
    - Render background
    - Render all pipes
    - Render Ghosty
    - Render score if PLAYING or GAME_OVER
    - Render state-specific text (menu instructions, game over instructions)
    - _Requirements: 4.4, 4.5, 5.2, 5.5, 7.9_
  
  - [x] 14.4 Implement input handling logic
    - Register input callback with InputHandler
    - In MENU state: transition to PLAYING on input
    - In PLAYING state: apply flap to Ghosty and play jump sound on input
    - In GAME_OVER state: call reset() and transition to PLAYING on input
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 5.3, 5.6, 5.9, 5.10, 6.1_
  
  - [x] 14.5 Implement asset loading with error handling
    - Load ghosty.png with 10-second timeout
    - Load audio assets (delegated to AudioSystem with 5-second timeout)
    - On image load failure: display error "Failed to load ghosty.png. Please refresh to try again."
    - On audio load failure: log error but continue (handled by AudioSystem)
    - Display refresh instructions on critical asset failure
    - _Requirements: 6.3, 6.4, 10.5, 10.6, 10.7_

- [x] 15. Implement responsive resize handling
  - [x] 15.1 Add resize logic to GameEngine
    - Listen for window resize events
    - Recalculate canvas dimensions maintaining 9:16 aspect ratio
    - Update scale factor and propagate to Renderer and EntityManager
    - Preserve all game state (score, Ghosty position, pipe positions, game mode)
    - Continue gameplay without interruption
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [x] 15.2 Add minimum viewport validation
    - Check viewport dimensions on init and resize
    - If width < 320 or height < 568, display error message
    - Prevent game start until minimum is met
    - _Requirements: 9.3_

- [x] 16. Checkpoint - Ensure game engine integration is complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Integration and final wiring
  - [x] 17.1 Create main entry point (index.js or main.js)
    - Initialize GameEngine with canvas element
    - Call async init() and handle errors
    - Call start() to begin game loop
    - Add error boundary for uncaught errors
    - _Requirements: 10.1_
  
  - [x] 17.2 Verify all requirements are implemented
    - Review Requirements 1-10 and confirm each acceptance criterion is covered
    - Check that all 21 correctness properties are validated by implementation
    - Verify error handling for asset loading, audio playback, and viewport validation
    - _Requirements: All_
  
  - [x] 17.3 Write integration tests for full game loop
    - Test menu → playing → game over → playing cycle
    - Test pipe spawning, movement, and removal during gameplay
    - Test score increment as pipes are passed
    - Test collision detection triggering game over
    - Test input handling in all game states
    - _Requirements: All_

- [x] 18. Final checkpoint and review
  - Ensure all tests pass, ask the user if questions arise.
  - Verify game runs smoothly at 60 FPS
  - Test in multiple browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
  - Confirm responsive behavior on different viewport sizes
  - Validate audio playback and error handling

## Notes

- Tasks marked with `*` are optional property-based and integration tests that can be skipped for faster MVP delivery
- Each task references specific requirements from the requirements document for traceability
- The implementation follows a bottom-up approach: entities → systems → game loop → integration
- All 21 correctness properties from the design document have corresponding property test tasks
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- Property-based tests use fast-check with minimum 100 iterations per property
- The game uses vanilla JavaScript with no external game frameworks, keeping the codebase lightweight
- Canvas sizing and scaling ensure responsive behavior across devices while maintaining 9:16 aspect ratio
- Error handling for asset loading and audio playback ensures graceful degradation without interrupting gameplay

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.4"] },
    { "id": 3, "tasks": ["2.3", "2.5", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4", "6.1", "7.1", "8.1", "9.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "7.2", "8.2", "9.2", "10.1"] },
    { "id": 7, "tasks": ["10.2", "10.3", "10.4", "12.1"] },
    { "id": 8, "tasks": ["12.2", "12.3", "12.4", "13.1"] },
    { "id": 9, "tasks": ["13.2", "13.3", "13.4", "14.1"] },
    { "id": 10, "tasks": ["14.2", "14.3", "14.4", "14.5"] },
    { "id": 11, "tasks": ["15.1", "15.2"] },
    { "id": 12, "tasks": ["17.1", "17.2"] },
    { "id": 13, "tasks": ["17.3"] }
  ]
}
```
