// import BunyanFormat from 'bunyan-format';
import RavenJs from 'raven-js';

import WhenIdle from './when-idle';

export const bundleTarget = 'browser';

// 'process.stdout' is not supported by most browsers, so we have to provide a shim, instead:
export class ProcessStdout {
  static write(...args) {
    new WhenIdle(this.asyncConsole).run(() => {
      console.log(...args);  // eslint-disable-line no-console
    });
  }
}
ProcessStdout.asyncConsole = true;

// We're using bunyan-format because it helps improve readability of log lines:
// - 'bunyan' produces structured JSON logging in the server
// - 'levelInString' converts the numeric log-level to the string-version that matches what
//   was used in code;  e.g. level: 20 --> level: "DEBUG"
// Note: bunyan-format outputMode 'json' is multiline

// export const formatOut = BunyanFormat(
//   { outputMode: 'bunyan', levelInString: true },
//   ProcessStdout);

// Note: A null `formatOut` will mean sending the default Bunyan format straight to the console
export const formatOut = null;

export const Raven = RavenJs;
// NOTE: RavenJs doesn't return the EventId, it returns the 'RavenJs' class:
export const unwrapSentryEventId = (sentryEventId, toString) => toString ? '' : null;
