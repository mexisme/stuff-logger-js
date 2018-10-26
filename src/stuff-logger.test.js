import { expect } from 'chai';
import bunyan from 'bunyan';
import Logger from './stuff-logger';

describe('The logger', function() {
  describe('class', function() {
    beforeEach(function() {
      Logger.init.called = false;
    });

    it("reads the appName arg correctly in the constructors's desctructured args", function() {
      Logger.init({ appName: 'test1' });
      expect(Logger.appName).to.equal('test1');
    });

    it.skip("reads the enableFromDebugEnv arg correctly in the constructors's desctructured args", function() {
      Logger.init({ enableFromDebugEnv: true });
      expect(Logger.debugEnv).to.equal('???');
    });

    it.skip("reads the appEnvironment arg correctly in the constructors's desctructured args", function() {
      Logger.init({ appEnvironment: 'Hello' });
      expect(Logger.appEnvironment).to.equal('???');
    });

    it.skip("reads the appRelease arg correctly in the constructors's desctructured args", function() {
      Logger.init({ appRelease: '???' });
      expect(Logger.appRelease).to.equal('???');
    });

    it("reads the level arg correctly in the constructors's desctructured args", function() {
      Logger.init({ level: 'test1' });
      expect(Logger.level).to.equal('test1');
    });

    it.skip("reads the serializers arg correctly in the constructors's desctructured args", function() {
      Logger.init({ serializers: 'test1' });
      expect(Logger.serializers).to.equal('???');
    });

    it.skip("reads the sentry arg correctly in the constructors's desctructured args", function() {
      Logger.init({ sentry: '???' });
      expect(Logger.sentry).to.equal('???');
    });
  });

  describe('with initialised app name', function() {
    beforeEach(function() {
      Logger.init.called = false;
    });

    describe('should match', function() {
      it('when configured with app name "logger-test1aa"', function() {
        Logger.init({ appName: 'logger-test1aa' });

        expect(Logger.appName).to.equal('logger-test1aa');
      });

      it('when configured with app name "logger-test1ab"', function() {
        Logger.init({ appName: 'logger-test1ab' });

        expect(Logger.appName).to.equal('logger-test1ab');
      });
    });

    describe('should NOT match', function() {
      it('when configured with app name "logger-test1cc"', function() {
        Logger.init({ appName: 'logger-test1cc' });
        Logger.init({ appName: 'logger-test1cd' });

        expect(Logger.appName).to.equal('logger-test1cc');
        expect(Logger.appName).to.not.equal('logger-test1cd');
      });
    });
  });

  describe('with default initialisation', function() {
    before(function() {
      Logger.init.called = false;
      Logger.init({ appName: 'logger-test2a' });
    });

    it('should have default level "info"', function() {
      expect(Logger.level).to.not.be.ok;
    });

    it('should have default level bunyan.INFO', function() {
      const l = Logger.createLogger({ name: 'package-test1' });
      expect(l.level()).to.equal(bunyan.INFO);
    });
  });

  describe('with initialisation of level "debug"', function() {
    before(function() {
      Logger.init.called = false;
      Logger.init({ appName: 'logger-test2b', level: 'debug' });
    });

    it('should have default level bunyan.DEBUG', function() {
      const l = Logger.createLogger({ name: 'package-test1' });
      expect(l.level()).to.equal(bunyan.DEBUG);
    });
  });

  describe('with initialisation of enableFromDebugEnv', function() {
    const enableWithDebug = (debugString, fn) => {
      let prevDebugEnv = process.env.DEBUG;
      process.env.DEBUG = debugString;
      Logger.init.called = false;
      Logger.init({ appName: `logger-test2c+${debugString}`, enableFromDebugEnv: true });

      fn();

      process.env.DEBUG = prevDebugEnv;
    };

    it('should have default level bunyan.DEBUG', function() {
      enableWithDebug('root:', function() {
        const l = Logger.createLogger({ name: 'package-test1a' });
        expect(l.level()).to.equal(bunyan.DEBUG);
      });
    });

    describe('if $DEBUG is empty', function() {
      it('should return an empty string from debugEnv()', function() {
        enableWithDebug('', function() {
          Logger.createLogger({ name: 'package-test1b' });
          expect(Logger.debugEnv).to.equal('');
        });
      });

      it('should skip initialisation', function() {
        enableWithDebug('', function() {
          const l = Logger.createLogger({ name: 'package-test1c' });
          expect(l.level()).to.equal(bunyan.INFO);
        });
      });
    });
  });

  describe('', function() {
    before(function() {
      Logger.init.called = false;
      Logger.init({ appName: 'logger-test3' });
    });

    it('should log an info message', function() {
      const l = Logger.createLogger({ name: 'package-test2' });
      l.info('TEST');
    });

    it('should NOT log a debug message', function() {
      const l = Logger.createLogger({ name: 'package-test3' });
      l.debug('TEST');
    });
  });

  describe('when configured with debug logging', function() {
    it('should log a debug message', function() {
      const l = Logger.createLogger({
        name: 'package-test4',
        level: 'debug'
      });

      l.debug('TEST');
    });

    describe('and filtering enabled', function() {
      const l1 = Logger.createLogger({
        name: 'package-test5',
        level: 'debug'
      });
      const l2 = Logger.createLogger({
        name: 'package-test6',
        level: 'debug'
      });

      afterEach(function() {
        l1.streamFilter.namespaceFilter.reset();
      });

      it('should log a message', function() {
        l1.streamFilter.enable();
        l1.warn('TEST');
      });

      it('should NOT log a message', function() {
        l1.streamFilter.enable();
        l2.warn('TEST');
      });
    });
  });

  describe('with defaults', function() {
    it("should use Bunyan's default serializers", function() {
      Logger.init.called = false;
      Logger.init({ appName: 'logger-test-serializer' });

      expect(Logger.serializers).to.equal(bunyan.stdSerializers);
    });

    it("should use Bunyan's 'err' serializer for an 'err:' field", function() {
      Logger.init.called = false;
      Logger.init({ appName: 'logger-test-serializer' });

      const l = Logger.createLogger({name: 'package-test5',});

      l.error({ err: new Error('TEST'), extra: 'stuff'}, 'TEST SERIALIZER');
    });
  });
});
