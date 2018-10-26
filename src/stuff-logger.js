/**
 * The stuff-logger module
 * @module stuff-logger
 */

import bunyan from 'bunyan';
import once from 'once';

import LoggerError from './errors';

import * as Pkg from './support-packages';
import StreamFilter from './stream-filter';
import StreamSentry from './sentry-capture';

/** The Logger Class */
export default class Logger {
  /**
   * Initialises the logging system with some global options
   * This static method is wrapped with a `once()` function (from 'once' NPM) to ensure
   * it can only initialise once.
   * @param {string} appName - The application's name. Used as the Bunyan logger 'name'.
   * @param {(string|number)} level - The default log-level.
   * @param {array} serializers - Provide a list of bunyan serializers to use instead of the defaults.
   * @param {object} sentry - Configuration for SentryStream and the Raven NPM.
   * @param {boolean} enableFromDebugEnv - Uses this.debugEnv for enabling package 'namespaces'.
   *                                       Also sets default log-level to 'debug' if not otherwise provided.
   */
  static init({
    appName, appEnvironment, appRelease,
    enable: {
      fromDebugEnv: enableFromDebugEnv2 = false,  // Rename + drop-other when clients are updated
      asyncConsole: enableAsyncConsole = true
    } = {},
    enableFromDebugEnv,
    level, serializers,
    sentry
  }) {
    this.appName = appName;
    this.asyncConsole = enableAsyncConsole;

    if ((enableFromDebugEnv || enableFromDebugEnv2) && this.debugEnv) {
      this.enableFromString(this.debugEnv);
      if (!level) {
        level = 'debug';
      }
    }

    this.level = level;

    this.serializers = serializers || bunyan.stdSerializers;
    // NOTE: If not wanting to include all the standard serialisers (i.e. not 'req' and 'res') you can just do the following:
    // this.serializers = serializers || { err: bunyan.stdSerializers.err };

    if (sentry && sentry.dsn) {
      StreamSentry.init(
        Object.assign(
          { environment: appEnvironment, release: appRelease },
          sentry)
      );
    }

    return this;
  }

  static get asyncConsole() {
    return Pkg.ProcessStdout.asyncConsole;
  }

  static set asyncConsole(val) {
    // If asyncConsole isn't defined, then we won't bother to set it:
    if (typeof Pkg.ProcessStdout.asyncConsole === 'undefined')
      return undefined;
    return Pkg.ProcessStdout.asyncConsole = val;
  }

  /**
   * Extract the string for this.enableFromString() from either
   * window.localStorage.debug or process.env.DEBUG, depending on whether
   * running in a Browser or not.
   * @returns {string} - Debug string
   */
  static get debugEnv() {
    // In Safari iOS or OSX, turn on “Block All Cookies”, window.localStorage throws security error.
    // This is probably caused by the “block all cookies” setting.
    if (!process.browser) return process.env.DEBUG;
    try {
      return window.localStorage.debug;
    } catch (e) {
      return false;
    }
  }

  /**
   * Creates a new bunyan logger:
   * - Uses global defaults, provided via the Logger.init() function
   * - Adds default streams -- currently the module:stream-filter class
   * @param {string} name - The 'name' of this Logger, used by module:stream-filter to control which logs are displayed.
   * @param {(string|number)} level - Overrides the default log-level for the logger.
   * @param {array} serializers - Provide a list of bunyan serializers to use instead of the defaults.
   * @returns {module:bunyan} - A Bunyan logger object.
   */
  static createLogger({ name, level, serializers }) {
    let logConfig = {
      name: this.appName || name,
      level: level || this.level,
      serializers: serializers || this.serializers,
    };

    if (!logConfig.name) {
      throw new LoggerError('No "appName" option provided.');
    }

    let streamFilter = new StreamFilter({ name: logConfig.name, out: Pkg.formatOut});
    logConfig.streams = [{
      name: name || 'FilteredStream',
      stream: streamFilter
    }];

    if (StreamSentry.isSetup()) {
      let sentryCallback = (sendErr, eventId) => {
        // TODO: This is likely to be prone to a circular call...
        //       We're relying a little on the fact that Sentry calls should only capture error & fatal logs
        //       We might prefer something more-like the following, which would also drop debug messages:
        //       logger.streamFilter.write('...');
        if (sendErr) {
          logger.debug('Failed to send captured exception to Sentry:', sendErr);

        } else {
          // TODO: Should we capture this as 'INFO' instead?
          logger.debug('Captured exception:', eventId);
        }
      };

      // TODO: Will this set the log-level correctly for the Sentry stream, or do I need to use 'logger.addStream()' ?
      logConfig.streams.push({
        name: 'Sentry',
        stream: new StreamSentry({ name: logConfig.name, callback: sentryCallback }),
        type: 'raw',
        level: 'error'
      });
    }

    let logger = bunyan.createLogger(logConfig);
    logger.streamFilter = streamFilter;
    // NB: Using arrow functions / lambdas so that 'this' is accessed correctly
    // TODO: Look into sub-classing Bunyan, instead of these tricks:
    logger.enable = () => { this.enable(logConfig.name); };
    logger.disable = () => { this.disable(logConfig.name); };

    return logger;
  }

  /**
   * @returns {module:namespace-filter} - The underlying NamespaceFilter object
   */
  static get namespaceFilter() {
    return StreamFilter.namespaceFilter;
  }

  /**
   * Enables package 'namespace' for outputting logging
   * @param {string} namespace - Namespace of package-logger to enable.
   */
  static enable(namespace) {
    return this.namespaceFilter.enable(namespace);
  }

  /**
   * Use a string to enable the various package 'namespaces' for logging.
   * NB: The given string will be split using the module:namespace-filter~SplitPattern regex.
   * @param {string} namespaces - A string containing patterns for enablement.
   */
  static enableFromString(namespaces) {
    return this.namespaceFilter.enableFromString(namespaces);
  }

  /**
   * Disables package 'namespace' for outputting logging
   * @param {string} namespace - Namespace of package-logger to disable.
   */
  static disable(namespace) {
    return this.namespaceFilter.disable(namespace);
  }

  /**
   * Disable all package 'namespace' filtering for logging.
   */
  static disableAll() {
    return this.namespaceFilter.reset();
  }

  /**
   * @returns {boolean} - Is the given package 'namespace' enabled for logging?
   */
  static isEnabledFor(namespace) {
    return this.namespaceFilter.isEnabledFor(namespace);
  }
}

// We wrap with `once()` function to ensure it only initialises once.
Logger.init = once(Logger.init);

// This helps the consumer understand which target this bundled for:
Logger.bundleTarget = Pkg.bundleTarget;

// There are situations where it's desirable to have access to Raven, e.g:
//       Raven.context(function() { RunTheApp() });
Logger.Raven = Pkg.Raven;
