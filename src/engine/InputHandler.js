/**
 * InputHandler.js — Normalizes mouse, keyboard, and touch input for flap control.
 *
 * Listens for click, spacebar (keydown with code 'Space'), and touchstart events.
 * Triggers a registered callback on any flap input.
 * Prevents default behavior for spacebar to avoid page scrolling.
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
 *   handler.attach((inputType) => { ... });
 *   // later...
 *   handler.detach();
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
    this._attached = false;

    // Bind handlers once so we can reliably add/remove them.
    this._handleClick = this._handleClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Register a callback and start listening for input events.
   * Safe to call multiple times — will not attach duplicate listeners.
   *
   * @param {(inputType: string) => void} callback - Called on any flap input.
   */
  attach(callback) {
    this._callback = callback;

    if (this._attached) return;
    this._attached = true;

    this._canvas.addEventListener('mousedown', this._handleClick);
    this._canvas.addEventListener('click', this._handleClick);
    this._canvas.addEventListener('touchstart', this._handleTouchStart, { passive: false });
    window.addEventListener('keydown', this._handleKeydown);
  }

  /**
   * Remove all event listeners and clear the registered callback.
   * Safe to call multiple times — will not throw if already detached.
   */
  detach() {
    if (!this._attached) return;
    this._attached = false;
    this._callback = null;

    this._canvas.removeEventListener('mousedown', this._handleClick);
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
   * Responds only to spacebar (code 'Space').
   * Prevents default scroll behavior.
   * @param {KeyboardEvent} event
   */
  _handleKeydown(event) {
    const isSpacebar =
      event.code === 'Space' ||
      event.key === ' ' ||
      event.keyCode === 32;

    if (isSpacebar) {
      // Prevent page scroll on spacebar press.
      event.preventDefault();
      this._emit(InputType.SPACEBAR);
    }
  }

  /** @param {TouchEvent} event */
  _handleTouchStart(event) {
    // Prevent default browser handling (e.g., double-tap zoom, scroll).
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

export default InputHandler;
