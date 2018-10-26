import LoggerError from './errors';

import * as Pkg from './support-packages';
import * as c from './console.js';
import Default from './default';

const Raven = Pkg.Raven;

/**
 * The generic error raised for Logger-Sentry exceptions
 */
class LoggerSentryError extends LoggerError {}

class Error_LoggerEncapsulated extends LoggerError {}

export default class StreamSentry {
  static init(options = {}) {
    let
      { dsn, stuffLogger = {} } = options,
      { warnOnNonError } = stuffLogger;

    if (!dsn) {
      throw new LoggerSentryError('No Sentry DSN option provided.');
    }

    // Clone the options to support the delete, further down:
    this.config = Object.assign({}, options);
    delete this.config.dsn;
    delete this.config.stuffLogger;

    this.dsn = dsn;
    this.warnOnNonError = Default.ifUndefinedOrNull(warnOnNonError, { default: true });

    Raven.config(this.dsn, this.config).install();
  }

  static isSetup() {
    if (typeof Raven.isSentry !== 'undefined') {
      return Raven.isSetup();
    }

    return this.dsn && true;
  }

  constructor({ name, callback, warnOnNonError }) {
    this.namespace = name;
    this.callback = callback;
    this.warnOnNonError = Default.ifUndefinedOrNull(
      warnOnNonError,
      { default: this.constructor.warnOnNonError }
    );
  }

  write(rec) {
    let extra = Object.assign({}, rec);
    let err = rec.err;
    let tags = Object.assign(
      rec.tags || {},
      { namespace: this.namespace });

    // Remove parts from 'extra' that we expose elsewhere:
    delete extra.callback;  // TODO: I don't think we need capture this in Sentry logs?
    delete extra.err;
    delete extra.tags;

    if (!err) {
      // Remove parts from 'extra' that we expose elsewhere:
      delete extra.level;
      delete extra.msg;

      let sentryEventId = Raven.captureMessage(
        rec.msg,
        { level: rec.level,
          tags: tags,
          extra: extra
        },
        // NOTE: The 'callback' arg is ignored by RavenJs (browser version):
        rec.callback || this.callback);
      // NOTE: we mention these on the console, in case of errors delivering to Sentry
      c.console.log(
        'Capturing message string --> Sentry',
        Pkg.unwrapSentryEventId(
          sentryEventId,
          (sentryEventId) => `(EventID = ${sentryEventId})`
        ));
      return;
    }

    if (!(err instanceof Error)) {
      if (this.warnOnNonError) {
        c.console.warn(
          'Wrapping the non-Error "err" field in an Error object:', err
        );
      }

      // TODO: Extract relevant bits of the rec.err object into an *actual* Error object for Sentry
      //       How do we do the right thing with stack-trace
      extra.err = {
        object: err
      };

      try {
        extra.err.json = JSON.stringify(err);

      } catch(e) {
        if (this.warnOnNonError) {
          c.console.warn(`Couldn't JSON.stringify '${err}' due to: ${e}`);
        }
        // We're checking specifically for when we get a circular object to JSONify.
        // TODO: Should we be more-specific, as per below?
        // if (!(e instanceof TypeError && err.toString().match(/converting circular structure to json/i))) throw e;
        if (!(e instanceof TypeError)) throw e;
      }

      err = new Error_LoggerEncapsulated(rec.msg);
      err.name = rec.err.name;
      err.code = rec.err.code;
      err.signal = rec.err.signal;
      err.stack = rec.err.stack;

      // Remove parts from 'extra' that we expose elsewhere:
      delete extra.msg;
    }

    let sentryEventId = Raven.captureException(
      err,
      { tags: tags,
        extra: extra
      },
      // NOTE: The 'callback' arg is ignored by RavenJs (browser version):
      rec.callback || this.callback);

    // NOTE: we mention these on the console, in case of errors delivering to Sentry
    c.console.log(
      'Capturing generated Error --> Sentry',
      Pkg.unwrapSentryEventId(
        sentryEventId,
        (sentryEventId) => `(EventID = ${sentryEventId})`
      ));
  }
}
