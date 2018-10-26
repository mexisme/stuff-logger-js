import BunyanFormat from 'bunyan-format';
import RavenNode from 'raven';

// import WhenIdle from './when-idle';

export const bundleTarget = 'node';

export const ProcessStdout = process.stdout;

// We're using bunyan-format because it helps improve readability of log lines:
// - 'short' produces colourised human-formatted logs on the terminal
// - 'bunyan' produces structured JSON logging in the server
// - 'levelInString' converts the numeric log-level to the string-version that matches what
//   was used in code;  e.g. level: 20 --> level: "DEBUG"
// Note: bunyan-format outputMode 'json' is multiline
// export const formatOut = (
//   process.stdout.isTTY
//     ? BunyanFormat({ outputMode: 'short' })
//     : BunyanFormat({ outputMode: 'bunyan', levelInString: true }));
export const formatOut = (
  process.stdout.isTTY
    ? BunyanFormat({ outputMode: 'short' })
    : null );

export const Raven = RavenNode;
export const unwrapSentryEventId = (sentryEventId, toString) => toString ? toString(sentryEventId) : sentryEventId;
