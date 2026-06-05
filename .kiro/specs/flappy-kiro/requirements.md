# Requirements Document

## Introduction

Flappy Kiro is a retro browser-based endless scroller game inspired by Flappy Bird mechanics. The player controls a ghost character (Ghosty) that must navigate through gaps between pipes by tapping or clicking to make the ghost "flap" upward. The game features simple one-button controls, increasing difficulty, score tracking, and retro visual aesthetics with sound effects.

## Glossary

- **Game_Engine**: The core system managing game state, rendering, and game loop
- **Ghosty**: The player-controlled ghost character sprite
- **Pipe**: An obstacle consisting of top and bottom pipe segments with a gap
- **Gap**: The vertical space between top and bottom pipe segments that Ghosty must navigate through
- **Canvas**: The HTML5 canvas element where the game is rendered
- **Game_State**: The current state of the game (menu, playing, game over)
- **Score**: The number of pipes successfully passed by Ghosty
- **Collision_Detector**: The system that detects collisions between Ghosty and pipes or boundaries
- **Input_Handler**: The system that processes user input (clicks, taps, spacebar)
- **Audio_System**: The system that plays sound effects

## Requirements

### Requirement 1: Ghost Character Control

**User Story:** As a player, I want to control the ghost character with simple inputs, so that I can navigate through the pipes.

#### Acceptance Criteria

1. WHEN the player clicks the Canvas, THE Input_Handler SHALL set Ghosty's vertical velocity to -8 pixels per frame
2. WHEN the player presses the spacebar, THE Input_Handler SHALL set Ghosty's vertical velocity to -8 pixels per frame
3. WHEN the player taps the Canvas on a touch device, THE Input_Handler SHALL set Ghosty's vertical velocity to -8 pixels per frame
4. WHILE no input is received, THE Game_Engine SHALL apply downward gravitational acceleration of 0.5 pixels per frame squared to Ghosty's vertical velocity
5. WHEN the Input_Handler applies upward velocity to Ghosty, THE Audio_System SHALL play the jump sound effect
6. THE Game_Engine SHALL update Ghosty's vertical position at 60 frames per second
7. WHEN a new game starts, THE Game_Engine SHALL initialize Ghosty at horizontal position 50 pixels from the left edge of the Canvas and vertical position at the center of the Canvas with zero vertical velocity
8. THE Game_Engine SHALL limit Ghosty's upward velocity to -10 pixels per frame maximum

### Requirement 2: Pipe Generation and Movement

**User Story:** As a player, I want pipes to continuously appear and move across the screen, so that I have obstacles to navigate.

#### Acceptance Criteria

1. WHILE the Game_State is playing, THE Game_Engine SHALL spawn new Pipe pairs every 90 frames (1.5 seconds at 60 FPS)
2. WHILE the Game_State is playing, THE Game_Engine SHALL move all Pipe pairs from right to left at 2 pixels per frame
3. WHEN a Pipe moves completely off the left edge of the Canvas, THE Game_Engine SHALL remove that Pipe from the game
4. THE Game_Engine SHALL randomize the vertical position of each Gap center between 150 pixels and (Canvas height - 150 pixels) from the top of the Canvas
5. THE Game_Engine SHALL maintain a Gap height of 150 pixels between the bottom edge of the top Pipe segment and the top edge of the bottom Pipe segment
6. THE Game_Engine SHALL ensure at least one Pipe pair is visible on the Canvas at all times during gameplay
7. WHEN spawning a new Pipe pair, THE Game_Engine SHALL position its right edge at the right edge of the Canvas

### Requirement 3: Collision Detection

**User Story:** As a player, I want the game to detect when I hit a pipe or boundary, so that the game ends fairly.

#### Acceptance Criteria

1. WHEN Ghosty's bounding box has at least one pixel overlap with the top Pipe segment's bounding box, THE Collision_Detector SHALL register a collision
2. WHEN Ghosty's bounding box has at least one pixel overlap with the bottom Pipe segment's bounding box, THE Collision_Detector SHALL register a collision
3. WHEN Ghosty's bounding box is entirely within the Gap space between top and bottom Pipe segments, THE Collision_Detector SHALL NOT register a collision with that Pipe pair
4. WHEN Ghosty's top edge moves above the top boundary of the Canvas (y-coordinate < 0), THE Collision_Detector SHALL register a collision
5. WHEN Ghosty's bottom edge moves below the bottom boundary of the Canvas (y-coordinate > Canvas height), THE Collision_Detector SHALL register a collision
6. WHEN a collision is registered, THE Game_Engine SHALL transition the Game_State to game over

### Requirement 4: Score Tracking

**User Story:** As a player, I want my score to increase as I successfully pass through pipes, so that I can track my progress.

#### Acceptance Criteria

1. WHEN Ghosty's left edge x-coordinate becomes greater than a Pipe pair's right edge x-coordinate, THE Game_Engine SHALL mark that Pipe pair as scored
2. WHEN the Game_Engine marks a Pipe pair as scored, THE Game_Engine SHALL increment the Score by one
3. WHEN the Game_Engine checks if Ghosty has passed a Pipe pair, IF that Pipe pair is already marked as scored, THEN THE Game_Engine SHALL NOT increment the Score again for that Pipe pair
4. WHILE the Game_State is playing, THE Game_Engine SHALL display the current Score on the Canvas
5. WHEN the Game_State transitions to game over, THE Game_Engine SHALL display the final Score
6. WHEN a new game starts, THE Game_Engine SHALL initialize the Score to zero

### Requirement 5: Game State Management

**User Story:** As a player, I want clear game states with appropriate transitions, so that I understand what actions I can take.

#### Acceptance Criteria

1. WHEN the game first loads, THE Game_Engine SHALL initialize the Game_State to menu
2. WHILE the Game_State is menu, THE Game_Engine SHALL display text instructions "Click, Tap, or Press Space to Start"
3. WHEN the player clicks the Canvas OR presses the spacebar OR taps the Canvas while the Game_State is menu, THE Game_Engine SHALL transition the Game_State to playing
4. WHEN a collision is registered, THE Game_Engine SHALL transition the Game_State to game over
5. WHILE the Game_State is game over, THE Game_Engine SHALL display the final Score and text instructions "Click, Tap, or Press Space to Restart"
6. WHEN the player clicks the Canvas OR presses the spacebar OR taps the Canvas while the Game_State is game over, THE Game_Engine SHALL set the Score to zero
7. WHEN the player clicks the Canvas OR presses the spacebar OR taps the Canvas while the Game_State is game over, THE Game_Engine SHALL initialize Ghosty at horizontal position 50 pixels from the left edge and vertical position at the center of the Canvas with zero vertical velocity
8. WHEN the player clicks the Canvas OR presses the spacebar OR taps the Canvas while the Game_State is game over, THE Game_Engine SHALL remove all existing Pipe pairs from the game
9. WHEN the player clicks the Canvas OR presses the spacebar OR taps the Canvas while the Game_State is game over, THE Game_Engine SHALL transition the Game_State to playing
10. WHILE the Game_State is playing, WHEN the player clicks the Canvas OR presses the spacebar OR taps the Canvas, THE Game_Engine SHALL apply flap input to Ghosty as specified in Requirement 1

### Requirement 6: Audio Feedback

**User Story:** As a player, I want audio feedback for my actions and game events, so that the game feels more engaging.

#### Acceptance Criteria

1. WHEN the Input_Handler applies upward velocity to Ghosty, THE Audio_System SHALL play the jump sound effect (jump.wav) from the beginning
2. WHEN the Game_State transitions to game over, THE Audio_System SHALL play the game over sound effect (game_over.wav) from the beginning
3. WHEN the game initializes, THE Audio_System SHALL attempt to load jump.wav and game_over.wav
4. IF the Audio_System fails to load an audio file within 5 seconds, THEN THE Audio_System SHALL log the error and continue game initialization without that sound effect
5. IF the Audio_System fails to play a sound effect at runtime due to a decoding or playback error, THEN THE Audio_System SHALL log the error and continue gameplay without interruption
6. WHEN the Audio_System receives a request to play a sound effect while that same sound effect is already playing, THE Audio_System SHALL restart the sound effect from the beginning
7. WHEN the Audio_System receives a request to play a sound effect while a different sound effect is playing, THE Audio_System SHALL allow both sound effects to play concurrently
8. THE Audio_System SHALL NOT terminate gameplay or display error messages to the player when audio loading or playback fails

### Requirement 7: Visual Rendering

**User Story:** As a player, I want retro-style visuals that match the example screenshot, so that the game has appealing aesthetics.

#### Acceptance Criteria

1. THE Game_Engine SHALL render Ghosty using the ghosty.png sprite asset at its native dimensions without scaling
2. THE Game_Engine SHALL render each Pipe segment as a solid-filled rectangle that extends from its specified y-coordinate to the top edge (for top segments) or bottom edge (for bottom segments) of the Canvas
3. THE Game_Engine SHALL render all Pipe segments using the same fill color (#4CAF50)
4. THE Game_Engine SHALL render the Score as text with font size between 24 and 48 pixels, center-aligned horizontally, positioned in the top 20% of the Canvas
5. THE Game_Engine SHALL render the Score text in a color that has a contrast ratio of at least 4.5:1 against the background
6. THE Game_Engine SHALL render the background as a solid color (#87CEEB)
7. WHILE the Game_State is playing, WHEN Ghosty's vertical velocity is negative (moving upward), THE Game_Engine SHALL rotate Ghosty counterclockwise by up to 25 degrees proportional to the magnitude of the velocity
8. WHILE the Game_State is playing, WHEN Ghosty's vertical velocity is positive (moving downward), THE Game_Engine SHALL rotate Ghosty clockwise by up to 90 degrees proportional to the magnitude of the velocity
9. THE Game_Engine SHALL clear and redraw the Canvas at 60 frames per second
10. THE Game_Engine SHALL render game elements in the following order from back to front: background, Pipe segments, Ghosty, Score text and instructions

### Requirement 8: Game Physics

**User Story:** As a player, I want realistic physics for the ghost character, so that the game feels responsive and fair.

#### Acceptance Criteria

1. WHEN the player provides flap input, THE Game_Engine SHALL set Ghosty's vertical velocity to -8 pixels per frame
2. WHILE the Game_State is playing, THE Game_Engine SHALL apply gravitational acceleration of 0.5 pixels per frame squared to Ghosty's vertical velocity
3. THE Game_Engine SHALL limit Ghosty's downward velocity to a maximum of 10 pixels per frame
4. THE Game_Engine SHALL update Ghosty's vertical position by adding its current vertical velocity each frame
5. THE Game_Engine SHALL expose flap velocity, gravity, and terminal velocity as configurable constants that can be modified without code refactoring

### Requirement 9: Responsive Canvas

**User Story:** As a player, I want the game to work on different screen sizes, so that I can play on various devices.

#### Acceptance Criteria

1. WHEN the browser window loads, THE Game_Engine SHALL size the Canvas to the largest dimensions that maintain a 9:16 aspect ratio and fit entirely within the viewport
2. THE Game_Engine SHALL maintain a 9:16 aspect ratio (width:height) for the Canvas at all times
3. WHEN the viewport dimensions are less than 320 pixels wide or 568 pixels tall, THE Game_Engine SHALL display an error message "Screen too small. Minimum 320x568 required." and prevent game start
4. THE Game_Engine SHALL scale all game element sizes (Ghosty dimensions, Pipe widths, Gap heights, font sizes) proportionally based on the Canvas width, using 400 pixels as the baseline reference width
5. WHEN the browser window is resized, THE Game_Engine SHALL recalculate and update the Canvas dimensions according to criteria 1 and 2 without interrupting gameplay or resetting the Game_State

### Requirement 10: Performance and Browser Compatibility

**User Story:** As a player, I want the game to run smoothly in modern browsers, so that I have a good gameplay experience.

#### Acceptance Criteria

1. THE Game_Engine SHALL use requestAnimationFrame for the game loop to ensure smooth rendering
2. THE Game_Engine SHALL maintain a frame rate of at least 55 frames per second for at least 95% of frames measured over any continuous 10-second gameplay period on devices with a 60 Hz display
3. THE Game_Engine SHALL support Chrome version 90 or later, Firefox version 88 or later, Safari version 14 or later, and Edge version 90 or later
4. THE Game_Engine SHALL use HTML5 Canvas API for all rendering operations
5. WHEN the game initializes, THE Game_Engine SHALL attempt to load ghosty.png, jump.wav, and game_over.wav
6. IF any asset fails to load within 10 seconds, THEN THE Game_Engine SHALL display an error message "Failed to load [asset name]. Please refresh to try again." and prevent the game from starting
7. WHEN an asset fails to load, THE Game_Engine SHALL display restart instructions "Press F5 or refresh the page to try again."
