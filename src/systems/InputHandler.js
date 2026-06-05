/**
 * InputHandler.js — Normalizes mouse, keyboard, and touch input.
 * Listens for click, spacebar, and touchstart events and invokes
 * a registered callback so the game engine can react to flap input.
 *
 * Implemented in task 8.1.
 */

/**
 * Enum of input types the handler can produce.
 * @enum {string}
 */
export const InputType = Object.freeze({
  CLICK: 'click',
  SPACEBAR: 'spacebar',
  TOUCH: 'touch',
});

/**
 * InputHandler normalizes all player input (mouse, keyboard, touch) into a
 * single callback invocation, decoupling the event system from game logic.
 *
 * Usage:
 *   const handler = new InputHandler(canvasElement);
 *   handler.onInput((inputType) => { ... });
 *   handler.enable();
 *   // later...
 *   handler.disable();
 */
export class InputHandler {
  /**
   * @param {HTMLCanvasElement} canvas - The canvas element to attach pointer/touch listeners to.
   */
  constructor(canvas) {
    /** @type {HTMLCanvasElement} */
    this._canvas = canvas;

    /** @type {((inputType: string) => void) | null} */
    this._callback = null;

    /** @type {boolean} */
    this._enabled = false;

    // Bind handlers once so we can reliably add/remove them.
    this._handleClick = this._handleClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Register the callback that will be called whenever a flap input is
   * detected. Replaces any previously registered callback.
   *
   * @param {(inputType: string) => void} callback
   */
  onInput(callback) {
    this._callback = callback;
  }

  /**
   * Attach all event listeners so the handler starts responding to input.
   * Safe to call multiple times — will not attach duplicate listeners.
   */
  enable() {
    if (this._enabled) return;
    this._enabled = true;

    this._canvas.addEventListener('click', this._handleClick);
    this._canvas.addEventListener('touchstart', this._handleTouchStart, { passive: true });
    window.addEventListener('keydown', this._handleKeydown);
  }

  /**
   * Remove all event listeners so the handler stops responding to input.
   * Safe to call multiple times — will not throw if already disabled.
   */
  disable() {
    if (!this._enabled) return;
    this._enabled = false;

    this._canvas.removeEventListener('click', this._handleClick);
    this._canvas.removeEventListener('touchstart', this._handleTouchStart);
    window.removeEventListener('keydown', this._handleKeydown);
  }

  // ── Private event handlers ────────────────────────────────────────────────

  /** @param {MouseEvent} _event */
  _handleClick(_event) {
    this._emit(InputType.CLICK);
  }

  /**
   * Responds only to spacebar (key code 32 / key ' ').
   * @param {KeyboardEvent} event
   */
  _handleKeydown(event) {
    // Support both legacy keyCode 32 and modern event.key / event.code.
    const isSpacebar =
      event.keyCode === 32 ||
      event.key === ' ' ||
      event.code === 'Space';

    if (isSpacebar) {
      // Prevent page scroll on spacebar press.
      event.preventDefault();
      this._emit(InputType.SPACEBAR);
    }
  }

  /** @param {TouchEvent} event */
  _handleTouchStart(event) {
    // Prevent any default browser handling (e.g., double-tap zoom).
    event.preventDefault();
    this._emit(InputType.TOUCH);
  }

  /**
   * Invoke the registered callback with the given input type.
   * Does nothing if no callback has been registered.
   * @param {string} inputType
   */
  _emit(inputType) {
    if (typeof this._callback === 'function') {
      this._callback(inputType);
    }
  }
}
