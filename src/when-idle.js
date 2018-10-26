import LoggerError from './errors';

export const defaultTimeout = 0;

class WhenIdleError extends LoggerError {}

export default class WhenIdle {
  constructor(timeout) {
    this.timeout = timeout;
  }

  get timeoutToNumber() {
    if (this.timeout === true)
      return defaultTimeout;
    if (typeof this.timeout === 'number')
      return this.timeout;
    return 0;
  }

  runAsynchronously() {
    // A '0' for a timeout is a valid setting for setTimeout and requestIdleCallback:
    if (this.timeout || typeof this.timeout === 'number')
      return true;
    // But using 'false' or 'null' (et al) should count as "Run Synchronously":
    return false;
  }

  requestIdleCallback(fn) {
    if (window && window.requestIdleCallback)
      // Many browsers support requestIdleCallback (since approx. 2015)
      // NOTE: browserside, we need to ensure we bind to window to prevent 'Illegal invocation'
      return window.requestIdleCallback(fn, { timeout: this.timeoutToNumber });

    // This is a fallback method, which usually means the 'fn' is run in about 50ms
    // (depending on load).
    // On Node, with timeout == 0, this will execute immediately.
    return setTimeout(fn, this.timeoutToNumber);
  }

  // Run the given 'fn' when JS is idle, to avoid blocking the interpreter.
  // In Node, this doesn't usually matter, but this is a companion implementation to
  // the Browser version.
  run(fn) {
    if (!fn)
      throw new WhenIdleError('No function provided to run');
    if (typeof fn !== 'function')
      throw new WhenIdleError('A non-function provided instead of a function to run');
    if (this.runAsynchronously())
      return this.requestIdleCallback(fn);

    return fn();
  }
}
