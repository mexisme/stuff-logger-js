import { expect } from 'chai';
import sinon from 'sinon';

import Logger from './stuff-logger';
import StreamSentry from './sentry-capture';
import * as Pkg from './support-packages';
export const Raven = Pkg.Raven;

const sandbox = sinon.createSandbox();

const sentry = {
  dsn: {
    js: 'js-dsn',
    node: 'node-dsn'
  }
};

describe('The Sentry capture', function() {
  let debugEnv, mockRaven;
  beforeEach(function() {
    mockRaven = sandbox.mock(Raven);
  });

  afterEach(function() {
    sandbox.verifyAndRestore();
    StreamSentry.dsn = undefined;
  });

  describe('class', function() {
    it('a missing dsn arg should throw an error', function() {
      expect(function() {
        StreamSentry.init();
      }).to.throw();
    });

    describe("when reading the initialiser's destructured args", function() {
      beforeEach(function() {
        mockRaven.expects('config').once().returns({
          install: () => { return; }
        });
      });

      it('reads the dsn arg correctly', function() {
        StreamSentry.init({ dsn: 'test1' });
        expect(StreamSentry.dsn).to.equal('test1');
        expect(StreamSentry.config.dsn).to.not.be.ok;
      });

      it('deafults the stuffLogger.warnOnNonError arg to true', function() {
        StreamSentry.init({ dsn: 'test1' });

        expect(StreamSentry.warnOnNonError).to.equal(true);
      });

      it('reads the stuffLogger.warnOnNonError arg correctly', function() {
        StreamSentry.init({
          dsn: 'test1', stuffLogger: { warnOnNonError: 'test2' }
        });

        expect(StreamSentry.warnOnNonError).to.equal('test2');
      });

      it('reads a false stuffLogger.warnOnNonError arg as false', function() {
        StreamSentry.init({
          dsn: 'test1', stuffLogger: { warnOnNonError: false }
        });

        expect(StreamSentry.warnOnNonError).to.equal(false);
      });
    });
  });

  describe("when reading the constructor's destructured args", function() {
    it('reads a false warnOnNonError as false', function() {
      let s = new StreamSentry({ warnOnNonError: false });
      expect(s.warnOnNonError).to.be.false;
    });

    it('reads a Logger.init supplied false warnOnNonError as false', function() {
      mockRaven.expects('config').once().returns({
        install: () => { return; }
      });

      Logger.init.called = false;
      Logger.init({ sentry: {
        dsn: 'test1', stuffLogger: { warnOnNonError: false }
      } });

      expect(StreamSentry.warnOnNonError).to.be.false;
    });

  });


  describe('when logging an error', function() {
    before(function() {
      debugEnv  = process.env.DEBUG;
    });

    beforeEach(function() {
      mockRaven.expects('config').once().returns({
        install: () => { return; }
      });

      Logger.init.called = false;
      Logger.init({
        appName: 'sentry-test',
        sentry: {
          dsn: sentry.dsn.node,
          stuffLogger: { warnOnNonError: false }
        }
      });
    });

    after(function() {
      process.env.DEBUG = debugEnv;
      debugEnv = null;
    });


    it('should log an error to Sentry', function() {
      mockRaven.expects('captureMessage').once().returns('Fake EventID1');
      const l = Logger.createLogger({ name: 'package-test1' });
      l.error('Test generic error');
    });

    it('should call a callback', function(done) {
      mockRaven.expects('captureException').once().returns('Fake EventID2').callsArgWith(2, 'Fake SendErr', 'Fake lastId');

      const l = Logger.createLogger({ name: 'package-test1' });
      l.error({
        callback: (sendErr, lastId) => {
          // eslint-disable-next-line no-console
          console.log('Test callback inside error\n', sendErr, '\n=====\n', lastId);
          done();
        }, err: new Error('Test callback inside error')
      });
    });
  });
});
