/**
 * This is a filtering module: given a list of namespaces to filter,
 * @module namespace-filter
 */
import once from 'once';

import LoggerError from './errors';

import defaultRegexer from './namespace-filter/default-regexer';

// TODO: This should be provided via the defaultRegexer?
/**
 * Pattern used to split an enable-string into a list of package 'names' to enable for logging:
 * @type {Regex}
 */
const SplitPattern = /[a-z0-9]+:[^,]+/gi;

class FilterError extends LoggerError {}

/**
 * Filter helper for package 'names' to help module:stream-filter decide when a log message should be output
 */
export default class NamespaceFilter {
  constructor(regexer) {
    this._regexer = regexer || defaultRegexer;
    this.reset();
  }

  get regexer() {
    if (!this._regexer) {
      throw new FilterError('No regexer lambda provided.');
    }
    return this._regexer;
  }

  set regexer(regexer) {
    if (!regexer) {
      throw new FilterError('No regexer lambda provided.');
    }
    return this._regexer = regexer;
  }

  /**
   * Enable a package 'namespace' to enable their logging to be output.
   * @param {...string} namespaces - Package 'namespaces' to enable logging for.
   */
  enable(...namespaces) {
    for (let ns of namespaces) {
      this.namespaces.add(ns);
    }
    this.updateRegex();
  }

  // TODO: Probably cleaner to pass-in a lambda at 'this.enable...'
  enableFromString(patternString) {
    if (!patternString) {
      throw new FilterError('No pattern-string provided.');
    }

    // TODO: maybe just split by ',' ?
    const matches = patternString.match(SplitPattern);
    for (let ns of (matches || [])) {
      this.enable(ns);
    }

    return this;
  }

  /**
   * Disable a package 'namespace' to disable their logging to be output.
   * @param {...string} namespaces - Package 'namespaces' to disable logging for.
   */
  disable(...namespaces) {
    for (let ns of namespaces) {
      this.namespaces.delete(ns);
    }
    this.updateRegex();
  }

  reset() {
    this.namespaces = new Set([]);
    this.updateRegex();
  }

  updateRegex() {
    return this.regex = this._regexer(this.namespaces);
  }

  /**
   * Check the enablement of a package 'namespace'.
   *
   * @param {string} namespace - The package 'namespace' to check.
   * @returns {boolean} - Whether the package 'namespace' has been enabled.
   */
  isEnabledFor(namespace) {
    if (this.namespaces.size < 1) return true;
    if (!namespace) return true;
    return this.isEnabledByRegexFor(namespace);
  }

  isEnabledByRegexFor(namespace) {
    return this.regex.test(namespace);
  }
}

/**
 * Singleton for *all* requested package 'namespaces' for filtering.
 * @type {module:namespace-filter}
 */
export const namespaceFilter = once(function() {
  return new NamespaceFilter();
})();
