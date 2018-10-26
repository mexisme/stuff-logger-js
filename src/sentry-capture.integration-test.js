import { expect } from 'chai';

import Logger from './stuff-logger';
//import SentryCapture from './sentry-capture';

describe('The Sentry capture', function() {
  let debugEnv;
  before(function() {
    // These tests can't run without $SENTRY_DSN:
    expect(process.env.SENTRY_DSN, '$SENTRY_DSN not supplied').to.be.ok;

    debugEnv = process.env.DEBUG;

    // TODO: Add a Logger.init.called = false
    Logger.init({
      appName: 'sentry-test',
      sentry: {
        dsn: process.env.SENTRY_DSN,
        stuffLogger: { warnOnNonError: false }
      }
    });
  });

  after(function() {
    process.env.DEBUG = debugEnv;
    debugEnv = null;
  });

  it('should log an error to Sentry', function() {
    const l = Logger.createLogger({ name: 'package-test1' });
    l.error('Test generic error');
  });

  it('should call a callback', function(done) {
    const l = Logger.createLogger({ name: 'package-test1' });
    l.error({ callback: (sendErr, lastId) => {
      // eslint-disable-next-line no-console
      console.log('Test callback inside error\n', sendErr, '\n=====\n', lastId);
      done();
    }, err: new Error('Test callback inside error')});
  });
});
